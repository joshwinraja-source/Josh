export type AppLanguage = 'en' | 'ta';

export type SummaryMode = 'concise' | 'detailed' | 'bullets';

export interface ConceptItem {
  term: string;
  explanation: string;
  example?: string;
}

export interface SummaryResult {
  title: string;
  tldr?: string;
  executiveSummary: string;
  keyPoints: string[];
  concepts: ConceptItem[];
  formulasAndFacts?: string[];
  studyTakeaways: string[];
  suggestedQuestions: string[];
}

export interface QaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface SavedDocument {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  language: AppLanguage;
  mode: SummaryMode;
  summary: SummaryResult;
  qaHistory: QaMessage[];
  quizQuestions: QuizQuestion[];
  lastQuizScore?: { score: number; total: number };
  updatedAt: string;
}
