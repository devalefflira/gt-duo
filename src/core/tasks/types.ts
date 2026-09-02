export type TaskPriority = 'q1' | 'q2' | 'q3' | 'q4';
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
  created_at: string;
  updated_at: string;
}

export interface TaskChecklistItem {
  id: string;
  task_id: string;
  user_id: string;
  title: string;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  list_id: string | null;
  title: string;
  description: string | null;
  start_date: string | null;
  due_date: string | null;
  due_time: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  is_urgent: boolean;
  is_important: boolean;
  eisenhower_quadrant: 'q1' | 'q2' | 'q3' | 'q4';
  checklist_items_count: number;
  checklist_completed_count: number;
  coins_rewarded: number;
  tags: string[];
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskFocusSession {
  id: string;
  user_id: string;
  task_id: string | null;
  mode: FocusMode;
  duration_minutes: number;
  tokens_earned: number;
  created_at: string;
}