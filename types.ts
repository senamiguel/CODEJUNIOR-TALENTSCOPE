export interface Candidate {
  id: string;
  name: string;
  course: string;
  currentPeriod: number; // e.g., 4th semester
  skills: string[]; // Hard skills
  softSkills: string[];
  experienceLevel: 'Junior' | 'Pleno' | 'Senior' | 'Trainee';
  summary: string;
  areasOfInterest: string[];
  email?: string;
  phone?: string;
  originalFileName: string;
  fileUrl?: string;
}

export interface ProcessingStatus {
  total: number;
  processed: number;
  currentFile: string;
  isProcessing: boolean;
  errors: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  suggestedCandidates?: string[]; // IDs of candidates recommended
}