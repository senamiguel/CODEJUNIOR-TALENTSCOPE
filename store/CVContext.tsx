import { createContext, useContext, useState, useCallback, useEffect, FC, ReactNode } from 'react';
import { Candidate, ProcessingStatus } from '../types';
import { parseCV } from '../services/geminiService';
import { db, isConfigValid } from '../services/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

interface CVContextType {
  candidates: Candidate[];
  status: ProcessingStatus;
  processFiles: (files: File[]) => Promise<void>;
  resetData: () => void;
  deleteCandidate: (id: string) => Promise<void>;
  deleteAllCandidates: () => Promise<void>;
  updateCandidate: (id: string, patch: Partial<Candidate>) => Promise<void>;
}

const CVContext = createContext<CVContextType | undefined>(undefined);

export const CVProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>({
    total: 0,
    processed: 0,
    currentFile: '',
    isProcessing: false,
    errors: []
  });
  const { currentUser } = useAuth();
  useEffect(() => {
    if (!currentUser) {
      setCandidates([]);
      return;
    }
    if (isConfigValid && db) {
      const q = query(collection(db, "candidates"), orderBy("name"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const candidatesData: Candidate[] = [];
        querySnapshot.forEach((doc) => {
          const raw = { id: doc.id, ...(doc.data() as any) };
          candidatesData.push(sanitizeCandidate(raw));
        });
        setCandidates(candidatesData);
      }, (error) => {
         console.error("Firestore error:", error);
      });

      return () => unsubscribe();
    }
  }, [currentUser]);

  // --- Data sanitation / normalization ---
  function sanitizeCandidate(raw: any): Candidate {
    const normalize = (s?: string) =>
      (s || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[\s\-_,]+/g, ' ');

    const normalizeCourse = (s?: string) => {
      if (!s) return '';
      // Split common separators to support CVs with multiple courses/faculties
      const parts = s.split(/[,;\n\/]|\b e \b|\band\b/i).map(p => p.trim()).filter(Boolean);
      const preferred: Record<string, string> = {
        'ciencia da computacao': 'Ciência da Computação',
        'computer science': 'Ciência da Computação',
        'bacharel em ciencia da computacao': 'Ciência da Computação',
        'bacharelado em ciencia da computacao': 'Ciência da Computação'
      };

      const normalizePart = (part: string) => {
        const norm = normalize(part);
        if (preferred[norm]) return preferred[norm];
        if (norm.includes('ciencia da computacao') || norm.includes('computacao') || norm.includes('computer science')) {
          return preferred['ciencia da computacao'];
        }
        return part.split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ');
      };

      return parts.map(normalizePart).join(' / ');
    };

  const id = raw.id || crypto?.randomUUID?.() || String(Date.now());
  const name = raw.name || 'Sem nome';
  const skills = Array.isArray(raw.skills) ? raw.skills : [];
  const softSkills = Array.isArray(raw.softSkills) ? raw.softSkills : [];
  const areasOfInterest = Array.isArray(raw.areasOfInterest) ? raw.areasOfInterest : [];
  const sanitizedFlags: string[] = [];
  const reasoning = raw.reasoning || raw.reason || undefined;

    // Validate experienceLevel
    const levelRaw = (raw.experienceLevel || '').toString().toLowerCase();
    const experienceLevel = levelRaw.includes('senior') || levelRaw.includes('sênior') ? 'Senior'
      : levelRaw.includes('pleno') ? 'Pleno'
      : levelRaw.includes('junior') ? 'Junior'
      : 'Trainee';

    // currentPeriod: allow missing; if numeric string, parse; if out of range, cap and warn
    let currentPeriod: number | undefined = undefined;
    if (typeof raw.currentPeriod === 'number' && !Number.isNaN(raw.currentPeriod)) {
      if (raw.currentPeriod < 1) currentPeriod = undefined;
      else if (raw.currentPeriod > 8) { currentPeriod = 8; sanitizedFlags.push('period_capped'); console.warn(`Sanitized currentPeriod for ${name}: capped ${raw.currentPeriod} -> 8`); }
      else currentPeriod = Math.round(raw.currentPeriod);
    } else if (typeof raw.currentPeriod === 'string' && raw.currentPeriod.trim() !== '') {
      const parsed = parseInt(raw.currentPeriod.replace(/[^0-9]/g, ''), 10);
      if (!Number.isNaN(parsed)) {
        if (parsed < 1) currentPeriod = undefined;
        else if (parsed > 8) { currentPeriod = 8; sanitizedFlags.push('period_capped'); console.warn(`Sanitized currentPeriod for ${name}: capped ${parsed} -> 8`); }
        else currentPeriod = parsed;
      }
    }

    const originalCourse = raw.course || raw.curso || '';
    const course = normalizeCourse(originalCourse);

    return {
      id,
      name,
      course,
      currentPeriod,
      skills,
      softSkills,
      experienceLevel: experienceLevel as Candidate['experienceLevel'],
      summary: raw.summary || '',
      reasoning,
      areasOfInterest,
      email: raw.email,
      phone: raw.phone,
      originalFileName: raw.originalFileName || raw.fileName || 'unknown',
      fileUrl: raw.fileUrl || raw.fileURL || undefined,
      sanitizedFlags: sanitizedFlags.length ? sanitizedFlags : undefined,
    } as Candidate;
  }

  const processFiles = useCallback(async (files: File[]) => {
    if (!currentUser) return;

    setStatus(prev => ({ ...prev, isProcessing: true, total: files.length, processed: 0, errors: [] }));
    const BATCH_SIZE = 2;

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);

      await Promise.all(batch.map(async (file) => {
        setStatus(prev => ({ ...prev, currentFile: file.name }));
        try {
          const candidateData = await parseCV(file);
          const sanitized = sanitizeCandidate(candidateData as any);

          if (isConfigValid && db) {
            const { id, fileUrl, ...cleanData } = sanitized as any;
              // Add translated labels for any sanitized flags so the UI shows Portuguese-friendly text
              const FLAG_LABELS: Record<string, string> = {
                period_capped: 'Período ajustado',
              };

              if (cleanData.sanitizedFlags && Array.isArray(cleanData.sanitizedFlags)) {
                (cleanData as any).sanitizedFlagsLabels = (cleanData.sanitizedFlags as string[]).map(f => FLAG_LABELS[f] || f);
              }

              // Remove any fields with undefined values — Firestore rejects undefined field values
              const firestoreSafe: Record<string, any> = Object.entries(cleanData).reduce((acc, [k, v]) => {
                if (v !== undefined) acc[k] = v;
                return acc;
              }, {} as Record<string, any>);

              // Prevent duplicates and perform upsert: check by fileUrl (if present), then by originalFileName + uploadedBy, then by name+email
              let isDuplicate = false;
              let existingDocId: string | null = null;
              try {
                const candidatesRef = collection(db, 'candidates');
                if (firestoreSafe.fileUrl) {
                  const qDup = query(candidatesRef, where('fileUrl', '==', firestoreSafe.fileUrl));
                  const snap = await getDocs(qDup);
                  if (!snap.empty) { isDuplicate = true; existingDocId = snap.docs[0].id; }
                } else if (firestoreSafe.originalFileName) {
                  const qDup = query(candidatesRef, where('originalFileName', '==', firestoreSafe.originalFileName), where('uploadedBy', '==', currentUser.email));
                  const snap = await getDocs(qDup);
                  if (!snap.empty) { isDuplicate = true; existingDocId = snap.docs[0].id; }
                } else if (firestoreSafe.email) {
                  const qDup = query(candidatesRef, where('name', '==', firestoreSafe.name), where('email', '==', firestoreSafe.email));
                  const snap = await getDocs(qDup);
                  if (!snap.empty) { isDuplicate = true; existingDocId = snap.docs[0].id; }
                }
              } catch (dupErr) {
                console.warn('Duplicate check failed, proceeding to add document:', dupErr);
              }

              if (isDuplicate && existingDocId) {
                try {
                  // Upsert: merge new fields into existing document
                  await setDoc(doc(db, 'candidates', existingDocId), {
                    ...firestoreSafe,
                    uploadedBy: currentUser.email,
                    uploadedAt: Date.now()
                  }, { merge: true });

                  console.info(`Upserted existing candidate (id=${existingDocId}) for file ${file.name}`);
                  setStatus(prev => ({ ...prev, errors: [...prev.errors, `Upserted duplicate: ${file.name}`] }));
                } catch (upsertErr) {
                  console.warn('Upsert failed, attempting to add a new document instead:', upsertErr);
                  await addDoc(collection(db, "candidates"), {
                    ...firestoreSafe,
                    uploadedBy: currentUser.email,
                    uploadedAt: Date.now()
                  });
                }
              } else {
                await addDoc(collection(db, "candidates"), {
                  ...firestoreSafe,
                  uploadedBy: currentUser.email,
                  uploadedAt: Date.now()
                });
              }
          } else {
            setCandidates(prev => [...prev, sanitized]);
          }

        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          setStatus(prev => ({ ...prev, errors: [...prev.errors, `Failed ${file.name}: ${(error as Error).message}`] }));
        } finally {
          setStatus(prev => ({ ...prev, processed: prev.processed + 1 }));
        }
      }));
    }

    setStatus(prev => ({ ...prev, isProcessing: false, currentFile: '' }));
  }, [currentUser]);

  const resetData = () => {
    if (!isConfigValid) {
       setCandidates([]);
    }
    setStatus({ total: 0, processed: 0, currentFile: '', isProcessing: false, errors: [] });
  };

  const deleteCandidate = useCallback(async (id: string) => {
    if (isConfigValid && db) {
      try {
        await deleteDoc(doc(db, 'candidates', id));
      } catch (e) {
        console.error('Failed to delete candidate in Firestore', e);
        throw e;
      }
    } else {
      setCandidates(prev => prev.filter(c => c.id !== id));
    }
  }, []);

  const deleteAllCandidates = useCallback(async () => {
    if (isConfigValid && db) {
      try {
        const snap = await getDocs(collection(db, 'candidates'));
        await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'candidates', d.id))));
      } catch (e) {
        console.error('Failed to delete all candidates in Firestore', e);
        throw e;
      }
    } else {
      setCandidates([]);
    }
  }, []);

  const updateCandidate = useCallback(async (id: string, patch: Partial<Candidate>) => {
    // Basic normalization similar to sanitizeCandidate for fields we accept from the UI
    const safePatch: Record<string, any> = {};
    if (patch.name !== undefined) safePatch.name = patch.name;
    if (patch.course !== undefined) safePatch.course = patch.course;
    if (patch.currentPeriod !== undefined) safePatch.currentPeriod = typeof patch.currentPeriod === 'number' ? Math.round(patch.currentPeriod) : patch.currentPeriod;
    if (patch.summary !== undefined) safePatch.summary = patch.summary;
    if (patch.email !== undefined) safePatch.email = patch.email;
    if (patch.phone !== undefined) safePatch.phone = patch.phone;
    if (patch.experienceLevel !== undefined) safePatch.experienceLevel = patch.experienceLevel;
  const rawSkills = (patch as any).skills;
  const rawSoft = (patch as any).softSkills;
  const rawAreas = (patch as any).areasOfInterest;
  if (rawSkills !== undefined) safePatch.skills = Array.isArray(rawSkills) ? rawSkills : (typeof rawSkills === 'string' ? rawSkills.split(',').map((s: string) => s.trim()).filter(Boolean) : rawSkills);
  if (rawSoft !== undefined) safePatch.softSkills = Array.isArray(rawSoft) ? rawSoft : (typeof rawSoft === 'string' ? rawSoft.split(',').map((s: string) => s.trim()).filter(Boolean) : rawSoft);
  if (rawAreas !== undefined) safePatch.areasOfInterest = Array.isArray(rawAreas) ? rawAreas : (typeof rawAreas === 'string' ? rawAreas.split(',').map((s: string) => s.trim()).filter(Boolean) : rawAreas);

    if (isConfigValid && db) {
      try {
        await setDoc(doc(db, 'candidates', id), {
          ...safePatch,
          updatedAt: Date.now()
        }, { merge: true });
        return;
      } catch (e) {
        console.error('Failed to update candidate in Firestore', e);
        throw e;
      }
    } else {
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, ...safePatch } : c));
    }
  }, []);

  return (
    <CVContext.Provider value={{ candidates, status, processFiles, resetData, deleteCandidate, deleteAllCandidates, updateCandidate }}>
      {children}
    </CVContext.Provider>
  );
};

export const useCV = () => {
  const context = useContext(CVContext);
  if (!context) throw new Error("useCV must be used within a CVProvider");
  return context;
};