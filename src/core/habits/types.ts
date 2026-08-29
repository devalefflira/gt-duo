export type HabitScope = 'individual' | 'duo' | 'group';
export type HabitPeriod = 'morning' | 'afternoon' | 'night' | 'anytime';
export type HabitFrequency = 'daily' | 'specific_days' | 'once_a_week';

export interface Habit {
  id: string;
  user_id: string;
  couple_id?: string | null;
  group_id?: string | null;
  title: string;
  description?: string | null;
  icon: string;
  color: string;
  period: HabitPeriod;
  scope: HabitScope;
  frequency_type: HabitFrequency;
  days_of_week: number[];
  is_shared_with_partner: boolean;
  target_duration_minutes?: number | null;
  target_days_per_week: number;
  created_at: string;
  archived_at?: string | null;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: string;
  completed_at: string;
  minutes_spent?: number | null;
  notes?: string | null;
}

export interface HabitWithStatus extends Habit {
  isCompletedToday: boolean;
  logId?: string;
}