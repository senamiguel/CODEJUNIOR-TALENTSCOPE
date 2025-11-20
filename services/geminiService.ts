import { GoogleGenAI, Type } from "@google/genai";
import { Candidate } from "../types";
import mammoth from "mammoth";

const _GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_KEY = typeof _GEMINI_API_KEY === 'string' ? _GEMINI_API_KEY : undefined;
if (!GEMINI_API_KEY) {
  console.error("VITE_GEMINI_API_KEY is not set. Set it in your .env.local and restart the dev server.");
}
const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

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
  const model = "gemini-2.5-flash";
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

  contentParts.push({
    text: `Analyze this resume (CV) for a Junior Enterprise member. Extract the following information into a JSON object.
          If specific fields are missing, infer them reasonably or leave as "N/A" or empty arrays.
          
          CRITICAL INSTRUCTION FOR 'experienceLevel':
          - 'Trainee': Assign this to candidates with NO professional experience (no previous internships, no formal jobs). They may have academic/classroom projects, but if they haven't worked professionally, they are Trainees.
          - 'Junior': Assign this ONLY if they have at least one previous internship, freelance experience, or significant practical work history.
          - 'Pleno': Mid-level experience (2+ years).
          - 'Senior': High-level experience (5+ years).
          
          Do not classify students with only classroom projects as 'Junior'. Classify them as 'Trainee'.`
  });

  const response = await genAI.models.generateContent({
    model: model,
    contents: {
      parts: contentParts
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          course: { type: Type.STRING },
          currentPeriod: { type: Type.INTEGER, description: "Current semester/period (1-12)" },
          skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          softSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
          experienceLevel: { type: Type.STRING, enum: ['Junior', 'Pleno', 'Senior', 'Trainee'] },
          summary: { type: Type.STRING, description: "A brief professional summary of 2-3 sentences." },
          areasOfInterest: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Areas they want to work in (e.g., Web Dev, Marketing, Finance)" },
          email: { type: Type.STRING },
          phone: { type: Type.STRING }
        },
        required: ["name", "skills", "experienceLevel", "summary"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini - The model might have been blocked or failed to generate text.");

  try {
    const data = JSON.parse(text);
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

    const hasInternship = containsKeyword(internshipIndicators);
    const hasProfessional = containsKeyword(professionalIndicators) || yearsMatch !== null;

    const modelLevelRaw = (data.experienceLevel || '').toString().toLowerCase();
    const modelLevel = modelLevelRaw.includes('senior') || modelLevelRaw.includes('sênior') ? 'Senior'
      : modelLevelRaw.includes('pleno') ? 'Pleno'
      : modelLevelRaw.includes('junior') ? 'Junior'
      : 'Trainee';

    let finalLevel = 'Trainee';
    let reason = '';

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
    } else if (hasInternship) {
      finalLevel = 'Junior';
      reason = 'internship_indicated';
    } else {
      finalLevel = 'Trainee';
      reason = 'no_professional_evidence';
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

export const queryAgent = async (candidates: Candidate[], query: string): Promise<{ text: string; suggestedIds: string[] }> => {
  const contextData = candidates.map(c => ({
    id: c.id,
    name: c.name,
    skills: c.skills,
    softSkills: c.softSkills,
    experienceLevel: c.experienceLevel,
    summary: c.summary,
    areas: c.areasOfInterest
  }));

  const prompt = `
    You are an expert HR Consultant for a Junior Enterprise.
    You have access to a database of ${candidates.length} members.
    
    User Query: "${query}"
    
    Task:
    1. Analyze the user's project or question.
    2. Select the best candidates from the provided database.
    3. Explain WHY they are good fits.
    4. If the query is general analysis (e.g. "what are our strong points?"), answer generally based on the data.
    
    Candidate Database:
    ${JSON.stringify(contextData)}
    
    Return your answer in JSON format with:
    - 'answer': A formatted markdown string explaining your reasoning. Use bolding for names.
    - 'suggestedIds': An array of strings containing the 'id' of the members you recommended.
  `;

  const response = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          answer: { type: Type.STRING },
          suggestedIds: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Agent");
  
  return JSON.parse(text);
};