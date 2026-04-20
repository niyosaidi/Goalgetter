import { Timestamp } from 'firebase/firestore';

export type GoalCategory = 'short-term' | 'medium-term' | 'long-term';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string;
  monthlyBudget?: number;
  currency?: string;
}

export interface Goal {
  id: string;
  userId: string;
  dream: string;
  concreteGoal: string;
  category: GoalCategory;
  cost: number;
  priority: number;
  deadline: Timestamp;
  createdAt: Timestamp;
}

export interface Saving {
  id: string;
  userId: string;
  goalId?: string;
  amount: number;
  date: Timestamp;
}

export interface Spending {
  id: string;
  userId: string;
  amount: number;
  category: string;
  isNeed: boolean;
  date: Timestamp;
  description?: string;
}

export interface QuizResult {
  id: string;
  userId: string;
  score: number;
  date: Timestamp;
  answers: Record<string, any>;
}
