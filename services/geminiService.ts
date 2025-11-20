import { GoogleGenAI, Type } from "@google/genai";
import { Candidate } from "../types";
import mammoth from "mammoth";

const _GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_KEY = typeof _GEMINI_API_KEY === 'string' ? _GEMINI_API_KEY : undefined;
if (!GEMINI_API_KEY) {
  console.error("VITE_GEMINI_API_KEY is not set. Set it in your .env.local and restart the dev server.");
}
const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const parseRetryDelayMs = (err: any): number | null => {
  try {
    // Check common locations for RetryInfo / retryDelay
    const details = err?.details || err?.error?.details;
    if (Array.isArray(details)) {
      for (const d of details) {
        if (d?.retryDelay) {
          // retryDelay may be a string like '13s' or '13.295687367s'
          const m = /([0-9]+(?:\.[0-9]+)?)s/.exec(d.retryDelay);
          if (m) return Math.ceil(parseFloat(m[1]) * 1000);
        }
        // Some clients embed the RetryInfo inside @type objects
        if (d && typeof d === 'object') {
          for (const v of Object.values(d)) {
            if (typeof v === 'string' && /\d+s/.test(v)) {
              const m = /([0-9]+(?:\.[0-9]+)?)s/.exec(v);
              if (m) return Math.ceil(parseFloat(m[1]) * 1000);
            }
          }
        }
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
};

async function callGenerateContentWithRetries(args: any, maxAttempts = 5) {
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      return await genAI.models.generateContent(args);
    } catch (err: any) {
      attempt++;
      const retryDelayMs = parseRetryDelayMs(err);
      const isQuota = err?.status === 'RESOURCE_EXHAUSTED' || err?.error?.code === 429 || (err?.message && /quota|rate limit|RESOURCE_EXHAUSTED|429/i.test(err.message));
      if (!isQuota) throw err;

      // If RetryInfo provided by API, respect it; otherwise exponential backoff with jitter
      const backoffMs = retryDelayMs ?? Math.min(60000, 1000 * Math.pow(2, attempt)) ;
      const jitter = Math.floor(Math.random() * 300) + 100;
      const waitMs = backoffMs + jitter;
      console.warn(`Gemini quota hit (attempt ${attempt}/${maxAttempts}). Waiting ${waitMs}ms before retrying.`);
      if (attempt >= maxAttempts) {
        // Re-throw original error with additional context
        const e = new Error(`Gemini quota exceeded after ${attempt} attempts. Last error: ${err?.message || String(err)}`);
        (e as any).original = err;
        throw e;
      }
      await sleep(waitMs);
      // continue loop to retry
    }
  }
}

export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const extractTextFromDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

export const parseCV = async (file: File): Promise<Candidate> => {
  const model = "gemini-2.5-flash-lite";
  let contentParts: any[] = [];
  let fullTextForHeuristics = '';

  if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    try {
      const text = await extractTextFromDocx(file);
      contentParts.push({ text: `Resume Content (extracted from DOCX):\n${text}` });
      fullTextForHeuristics += '\n' + text;
    } catch (e) {
      console.error("DOCX extraction failed", e);
      throw new Error("Failed to extract text from DOCX file. Please try converting to PDF.");
    }
  } else if (file.type === "text/plain") {
    const text = await file.text();
    contentParts.push({ text: `Resume Content (extracted from TXT):\n${text}` });
    fullTextForHeuristics += '\n' + text;
  } else {
    const filePart = await fileToGenerativePart(file);
    contentParts.push(filePart);
  }

const systemInstruction = `
ROLE:
You are an expert HR Tech Recruiter for a Junior Enterprise in Brazil.

CONTEXT:
Analyze resumes to extract structured data. You must be extremely strict with Seniority levels.

CRITICAL SAFETY OVERRIDES (READ CAREFULLY):
1. "SEEKING INTERNSHIP" RULE: If the candidate's summary or objective mentions "busca estágio", "primeira oportunidade", or "estudante", they are AUTOMATICALLY 'Trainee'. Ignore all skills listed.
2. SKILL LIST != EXPERIENCE: A candidate listing 10+ programming languages (Java, Python, PHP, etc.) without years of paid employment using them is a 'Trainee', NOT a Senior. Do not be fooled by keyword stuffing.
3. JUNIOR ENTERPRISE RULE: Experience in "Empresa Júnior" (EJ), "Code", or student organizations counts as Academic/Trainee experience, unless the specific role was a high-level leader (President/Director).

CLASSIFICATION LOGIC:
- 'Trainee': Students, Interns, Standard EJ Members, or anyone seeking an internship. 0-1 years exp.
- 'Junior': Paid market professionals with < 3 years exp. EJ Leaders (Tech Leads) with autonomy.
- 'Pleno': 3+ years of PROVEN market experience (not just listed skills).
- 'Senior': 5+ years of leadership and high-complexity architecture.

OUTPUT RULES:
- Return all text fields in Portuguese (pt-BR).
- If a factual field is missing, return null.
`;

contentParts.push({ text: systemInstruction });
contentParts.push({ text: "Analyze the attached resume content." });

const response = await callGenerateContentWithRetries({
  model: model,
  contents: { parts: contentParts },
  config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      propertyOrdering: [
        "name", 
        "reasoning", 
        "experienceLevel", 
        "course", 
        "currentPeriod", 
        "skills", 
        "softSkills", 
        "summary", 
        "areasOfInterest", 
        "email", 
        "phone"
      ],
      properties: {
        name: { 
            type: Type.STRING 
        },
    reasoning: { 
      type: Type.STRING, 
      description: "Uma frase curta explicando a razão da classificação (em pt-BR). Não inclua instruções numeradas como 'Step 1'." 
    },
        experienceLevel: { 
            type: Type.STRING, 
            enum: ['Trainee', 'Junior', 'Pleno', 'Senior'],
            description: "STRICTLY based on reasoning. If 'reasoning' identified the candidate as a student seeking internship, this MUST be 'Trainee', regardless of how many skills they list."
        },
        course: { 
            type: Type.STRING 
        },
        currentPeriod: { 
            type: Type.INTEGER, 
            nullable: true,
            description: "Current semester (1-12). If ambiguous, calculate: (Current Year - Start Year) * 2." 
        },
        skills: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Hard skills extracted. Max 15 items."
        },
        softSkills: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Inferred soft skills in pt-BR."
        },
        summary: { 
            type: Type.STRING, 
            description: "A professional summary (2-3 sentences) in pt-BR." 
        },
        areasOfInterest: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Inferred areas of interest in pt-BR."
        },
        email: { 
            type: Type.STRING, 
            nullable: true 
        },
        phone: { 
            type: Type.STRING, 
            nullable: true 
        }
      },
      required: ["name", "reasoning", "experienceLevel", "skills", "summary"]
    }
  }
});
  const text = response.text;
  if (!text) throw new Error("No response from Gemini - The model might have been blocked or failed to generate text.");

  try {
  const data = JSON.parse(text);
  // sanitize reasoning: remove any 'Step 1:', 'Step 2:' prefixes that the model may include
  const rawReasoning = (data.reasoning || '').toString();
  const sanitizedReasoning = rawReasoning.replace(/Step\s*\d+:?\s*/gi, '').trim();
  data.reasoning = sanitizedReasoning || null;
    const searchText = [fullTextForHeuristics, data.summary, text].filter(Boolean).join('\n');
    const normalized = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

    const containsKeyword = (patterns: string[]) => {
      const s = normalized(searchText);
      return patterns.some(p => s.includes(p));
    };

    const yearsMatch = (() => {
      const s = searchText;
      const re = /(\d+)\s*(?:\+)?\s*(years?|anos?)/i;
      const m = s.match(re);
      if (m) return parseInt(m[1], 10);
      return null;
    })();

    const internshipIndicators = ['estagio', 'estagiario', 'estágio', 'intern', 'internship', 'freelance', 'freelancer', 'estagiária', 'estagiário'];
    const professionalIndicators = ['trabalhou', 'contrat', 'emprego', 'empresa', 'profissional', 'contrata', 'contratado', 'cargo', 'experiencia', 'experiência', 'anos', 'year', 'years'];
  const autonomyIndicators = ['gestão de projetos', 'gestao de projetos', 'arquitetura', 'erp', 'mentoria', 'mentor', 'lider', 'líder', 'lead', 'tech lead', 'techlead', 'responsável', 'responsavel', 'coordenação', 'coordenador', 'autônomo', 'autonomo', 'autonomia', 'tomada de decisão', 'manager', 'gerente'];

    const hasInternship = containsKeyword(internshipIndicators);
    const hasProfessional = containsKeyword(professionalIndicators) || yearsMatch !== null;
  const hasAutonomy = containsKeyword(autonomyIndicators);

    const modelLevelRaw = (data.experienceLevel || '').toString().toLowerCase();
    const modelLevel = modelLevelRaw.includes('senior') || modelLevelRaw.includes('sênior') ? 'Senior'
      : modelLevelRaw.includes('pleno') ? 'Pleno'
      : modelLevelRaw.includes('junior') ? 'Junior'
      : 'Trainee';

    // If the model's reasoning explicitly names a level, prefer it to avoid contradictory outputs
    const normalizedReasoning = (data.reasoning || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    const levelFromReasoning = (() => {
      if (!normalizedReasoning) return null;
      if (/trainee|estagi|primeira oportunidade|busca estagio|busca estágio|busca oportunidade/.test(normalizedReasoning)) return 'Trainee';
      if (/senior|seniou?r|sênior/.test(normalizedReasoning)) return 'Senior';
      if (/pleno/.test(normalizedReasoning)) return 'Pleno';
      if (/junior|junior enterprise|tech lead|lead|lider|líder/.test(normalizedReasoning)) return 'Junior';
      return null;
    })();

    let finalLevel = modelLevel; // start from model suggestion, but override with stronger signals below
    let reason = 'model_inferred';

    if (levelFromReasoning) {
      finalLevel = levelFromReasoning;
      reason = `reasoning_declared:${finalLevel}`;
    } else {
      if (yearsMatch !== null) {
        if (yearsMatch >= 5) {
          finalLevel = 'Senior';
          reason = `years:${yearsMatch}`;
        } else if (yearsMatch >= 2) {
          finalLevel = 'Pleno';
          reason = `years:${yearsMatch}`;
        } else if (hasInternship) {
          finalLevel = 'Junior';
          reason = `internship+years:${yearsMatch}`;
        } else {
          finalLevel = 'Trainee';
          reason = `years:${yearsMatch}`;
        }
      } else if (hasAutonomy) {
        // Even with less than 2 years, demonstrated autonomy / leadership justifies Junior
        finalLevel = 'Junior';
        reason = 'autonomy_indicated';
      } else if (hasInternship) {
        finalLevel = 'Junior';
        reason = 'internship_indicated';
      } else {
        finalLevel = 'Trainee';
        reason = 'no_professional_evidence';
      }
    }

    data.experienceLevel = finalLevel;
    (data as any).classificationReason = reason;
    return {
      id: crypto.randomUUID(),
      originalFileName: file.name,
      fileUrl: URL.createObjectURL(file),
      ...data
    };
  } catch (e) {
    throw new Error("Failed to parse JSON response from Gemini");
  }
};

export const queryAgent = async (candidates: Candidate[], query: string): Promise<{ text: string; suggestedIds: string[]; explanations: { id: string; reason: string }[] }> => {
  const contextData = candidates.map(c => ({
    id: c.id,
    name: c.name,
    skills: c.skills,
    softSkills: c.softSkills,
    experienceLevel: c.experienceLevel,
    summary: c.summary,
    areas: c.areasOfInterest
  }));

  const prompt = `You are an expert HR Consultant for a Junior Enterprise in Brazil. You have access to a database of ${candidates.length} members.

User Query: "${query}"

Task:
- Analyze the user's project or question.
- Select the best candidates from the provided database (choose up to 6).
- For each suggested candidate, provide a one-sentence reason WHY they are a good fit (be concrete: cite skills, experience level, or summary points).
- If the query is general (e.g. "what are our strong points?"), answer generally and optionally suggest candidates.

Candidate Database:
${JSON.stringify(contextData)}

Return JSON with these keys:
- 'answer': A formatted markdown string summarizing the selection (you may use bold for names).
- 'suggestedIds': An array of candidate ids you recommend.
- 'explanations': An array of objects {"id": "<candidate id>", "reason": "<one-sentence reason in pt-BR>"} giving a concise reason for each suggested id.

The response MUST be valid JSON matching the schema exactly. Do not include extra text outside the JSON.`;

  const response = await callGenerateContentWithRetries({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          answer: { type: Type.STRING },
          suggestedIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          explanations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                reason: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Agent");

  const parsed = JSON.parse(text);

  // Normalize: ensure explanations exist for each suggested id (if model returned only an answer, try to synthesize minimal explanations)
  const suggestedIds: string[] = Array.isArray(parsed.suggestedIds) ? parsed.suggestedIds : [];
  const explanations: { id: string; reason: string }[] = Array.isArray(parsed.explanations)
    ? parsed.explanations.map((e: any) => ({ id: e.id, reason: (e.reason || '').toString().trim() }))
    : [];

  // If explanations are missing, try to build them from the 'answer' by mapping names to ids using candidate names
  if (explanations.length === 0 && parsed.answer) {
    const nameToId = new Map(candidates.map(c => [c.name?.toLowerCase(), c.id]));
    const lines = parsed.answer.split(/\n+/).map((l: string) => l.trim()).filter(Boolean);
    for (const line of lines) {
      // look for a bolded name or plain name
      const m = /\*\*(.*?)\*\*/.exec(line) || /(^[A-ZÀ-Ú][\p{L} '\-]+[A-ZÀ-Ú]?)/u.exec(line);
      if (m) {
        const name = m[1].toString().trim().toLowerCase();
        const id = nameToId.get(name);
        if (id && !explanations.find(e => e.id === id)) {
          explanations.push({ id, reason: line.replace(/\*\*/g, '').trim() });
        }
      }
    }
  }

  return {
    text: parsed.answer || '',
    suggestedIds,
    explanations
  };
};