export interface Candidate {
  id: string;
  name: string;
  course: string;
  // currentPeriod can be missing for malformed data; treat as optional
  currentPeriod?: number; // e.g., 4th semester
  skills: string[]; // Hard skills
  softSkills: string[];
  experienceLevel: 'Junior' | 'Pleno' | 'Senior' | 'Trainee';
  summary: string;
  areasOfInterest: string[];
  email?: string;
  phone?: string;
  originalFileName: string;
  fileUrl?: string;
  // Optional flags added by the app when sanitizing/normalizing imported or DB data
  sanitizedFlags?: string[];
  // Optional single-sentence explanation why the experienceLevel/classification was chosen
  reasoning?: string;
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