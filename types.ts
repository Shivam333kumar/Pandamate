
export type CategoryType = 'Mind' | 'Body' | 'Spirit' | 'Sleep' | 'Break' | 'Medicine';

export interface MainTask {
  name: string;
  targetDate: string; // ISO String
}

export interface Task {
  id: string;
  name: string;
  category: CategoryType;
  startTime: string; // ISO String
  durationMinutes: number;
  completed: boolean;
  isSpacedRepetition?: boolean;
  isQuick?: boolean; // Highlighted red and inserted at current time
  isMedicine?: boolean; // Cannot be replaced or displaced
  repetitionStep?: number;
}

export interface UserStats {
  streak: number;
  xp: number;
  hydrationCount: number;
  lastHydrationUpdate: number;
  dailyCompletion: Record<string, number>; // "YYYY-MM-DD": percentage
  mainTask?: MainTask;
}

export type PandaState = 'IDLE' | 'MEDITATING' | 'READING' | 'EXERCISING' | 'PLAYING' | 'SHOCKED' | 'HIDING' | 'SLEEPING';

export enum Tab {
  HOME = 'home',
  SCHEDULER = 'scheduler',
  SPACED = 'spaced',
  ANALYTICS = 'analytics',
  SETTINGS = 'settings',
  SENSEI = 'sensei'
}

export const CATEGORY_COLORS: Record<CategoryType, string> = {
  Mind: '#8B5FBF',
  Body: '#48BB78',
  Spirit: '#4299E1',
  Sleep: '#4FD1C7',
  Break: '#F6AD55',
  Medicine: '#EF4444'
};
