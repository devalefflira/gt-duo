export type TaskPriorityLevel = 'urgent' | 'high' | 'medium' | 'low';
export type TaskRecurrence = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';
export type TaskStatus = 'inbox' | 'pending' | 'in_progress' | 'completed' | 'wont_do' | 'archived';
export type FocusMode = 'pomodoro' | 'stopwatch' | 'timer';

export interface TaskList {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  is_inbox: boolean;
  sort_order: number;
}

export interface TaskChecklistItem {
  id?: string;
  task_id?: string;
  title: string;
  is_completed: boolean;
}

export interface Task {
  id: string;
  user_id: string;
  list_id: string | null;
  title: string;
  description: string | null;
  start_date: string | null;
  due_date: string | null;
  recurrence: TaskRecurrence;
  priority_name: TaskPriorityLevel;
  status: TaskStatus;
  checklist_items_count: number;
  checklist_completed_count: number;
  coins_rewarded: number;
  completed_at: string | null;
  created_at: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  reward_coins: number;
  unlocked: boolean;
}