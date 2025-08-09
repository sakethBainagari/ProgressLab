export interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  tags: string[];
  description: string;
  solution?: string;
  code?: string;
  language?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  completed: boolean;
  notes?: string;
  url?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface DifficultyGroup {
  Easy: Problem[];
  Medium: Problem[];
  Hard: Problem[];
}

export interface Category {
  id: string;
  name: string;
  description: string;
  problems: DifficultyGroup;
}

export interface Stats {
  totalProblems: number;
  completedProblems: number;
  easyCompleted: number;
  mediumCompleted: number;
  hardCompleted: number;
  streakDays: number;
  lastSolvedDate?: Date;
}

export interface NewProblemForm {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  url: string;
  description: string;
  code: string;
  language: string;
  notes: string;
  tags: string[];
}
