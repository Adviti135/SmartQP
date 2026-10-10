export interface Question {
  id: string;
  subject: string;
  module: number;
  topic: string;
  text: string;
  marks: number;
  bloomLevel: number;
  bloomLevelAI: number;
  courseOutcome: string;
  questionType: string;
  isDuplicate?: boolean;
  duplicateOf?: string;
}

export interface GenerateRequest {
  subject: string;
  difficultyProfile: 'easy' | 'moderate' | 'difficult';
}

export interface PaperQuestion {
  questionNumber: string;
  question: Question;
  marks: number;
  conflict?: Conflict;
}

export interface PaperSection {
  module: number;
  questions: PaperQuestion[];
  totalMarks: number;
}

export interface Conflict {
  type: 'insufficient_questions';
  module: number;
  requiredMarks: number;
  requiredBloomLevel: number;
  fallback?: Question;
  message: string;
}

export interface Paper {
  id: string;
  subject: string;
  title: string;
  totalMarks: number;
  sections: PaperSection[];
  isValid: boolean;
  conflicts: Conflict[];
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
}

export interface QuestionFilters {
  subject?: string;
  module?: number;
  marks?: number;
  bloomLevel?: number;
  search?: string;
}
