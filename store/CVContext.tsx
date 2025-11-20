import { createContext, useContext, useState, useCallback, useEffect, FC, ReactNode } from 'react';
import { Candidate, ProcessingStatus } from '../types';
import { parseCV } from '../services/geminiService';
import { db, isConfigValid } from '../services/firebase';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

interface CVContextType {
  candidates: Candidate[];
  status: ProcessingStatus;
  processFiles: (files: File[]) => Promise<void>;
  resetData: () => void;
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
          candidatesData.push({ id: doc.id, ...doc.data() } as Candidate);
        });
        setCandidates(candidatesData);
      }, (error) => {
         console.error("Firestore error:", error);
      });

      return () => unsubscribe();
    } 
  }, [currentUser]);

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
          
          if (isConfigValid && db) {
            const { id, fileUrl, ...cleanData } = candidateData;
            
            await addDoc(collection(db, "candidates"), {
              ...cleanData,
              uploadedBy: currentUser.email,
              uploadedAt: Date.now()
            });
          } else {
            setCandidates(prev => [...prev, candidateData]);
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

  return (
    <CVContext.Provider value={{ candidates, status, processFiles, resetData }}>
      {children}
    </CVContext.Provider>
  );
};

export const useCV = () => {
  const context = useContext(CVContext);
  if (!context) throw new Error("useCV must be used within a CVProvider");
  return context;
};