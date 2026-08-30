export type HabitScope = 'individual' | 'duo' | 'group';
export type HabitPeriod = 'morning' | 'afternoon' | 'night' | 'anytime';
export type HabitFrequency = 'daily' | 'specific_days' | 'once_a_week';
export type GoalMode = 'duration' | 'deadline' | 'both';

export interface Habit {
  id: string;
  user_id: string;
  couple_id?: string | null;
  partner_id?: string | null;
  group_id?: string | null;
  group_name?: string | null;
  title: string;
  description?: string | null;
  icon: string;
  color?: string;
  period: HabitPeriod;
  scope: HabitScope;
  frequency_type: HabitFrequency;
  days_of_week: number[];
  is_shared_with_partner?: boolean;
  
  // Datas e Prazos
  start_date: string;
  end_date?: string | null;
  goal_mode: GoalMode;
  target_duration_minutes?: number | null;
  deadline_days?: number | null;
  
  // Métricas Opcionais
  target_distance_km?: number | null;
  target_calories?: number | null;
  target_weight_kg?: number | null;
  target_height_cm?: number | null;

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
  distance_km?: number | null;
  calories_burned?: number | null;
  weight_kg?: number | null;
  notes?: string | null;
}

export interface HabitWithStatus extends Habit {
  isCompletedToday: boolean;
  logId?: string;
}