export interface User {
  id: string;
  username: string;
  password: string;
  avatar?: string;
  isPremium: boolean;
  trialEndsAt?: Date;
  isBlocked: boolean;
  createdAt: Date;
}

export interface Business {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: Date;
  records: BusinessRecord[];
  transactions: Transaction[];
}

export interface BusinessRecord {
  id: string;
  businessId: string;
  title: string;
  content: string;
  fontFamily?: string;
  textColor?: string;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  businessId: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: Date;
}

export interface PromoCode {
  code: string;
  type: '30d' | 'lifetime';
  isUsed: boolean;
  usedBy?: string;
  createdAt: Date;
}

export interface Question {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  isPremium: boolean;
  title: string;
  content: string;
  answers: Answer[];
  createdAt: Date;
}

export interface Answer {
  id: string;
  questionId: string;
  userId: string;
  username: string;
  userAvatar?: string;
  isPremium: boolean;
  content: string;
  createdAt: Date;
}

export type Theme = 'business' | 'rainbow';

export interface BusinessStats {
  totalIncome: number;
  totalExpenses: number;
  profit: number;
  profitMargin: number;
  status: 'loss' | 'stable' | 'successful' | 'ideal' | 'excellent';
  dailyAverage: number;
  monthlyAverage: number;
  yearlyProjection: number;
}
