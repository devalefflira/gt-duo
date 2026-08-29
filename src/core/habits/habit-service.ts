import { createClient } from '@/lib/supabase/client';
import { Habit, HabitLog, HabitWithStatus, HabitPeriod, HabitFrequency, HabitScope } from './types';
import { format, getDay } from 'date-fns';

export const HabitService = {
  async getHabitsByDate(date: Date): Promise<HabitWithStatus[]> {
    const supabase = createClient();
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = getDay(date);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .is('archived_at', null)
      .order('created_at', { ascending: true });

    if (habitsError || !habits) {
      console.error('Erro ao buscar hábitos:', habitsError);
      return [];
    }

    const scheduledHabits = habits.filter((habit: Habit) => {
      if (!habit.days_of_week || habit.days_of_week.length === 0) return true;
      return habit.days_of_week.includes(dayOfWeek);
    });

    if (scheduledHabits.length === 0) return [];

    const habitIds = scheduledHabits.map((h) => h.id);
    const { data: logs } = await supabase
      .from('habit_logs')
      .select('*')
      .in('habit_id', habitIds)
      .eq('completed_date', dateStr);

    const completedHabitMap = new Map<string, string>();
    logs?.forEach((log: HabitLog) => {
      completedHabitMap.set(log.habit_id, log.id);
    });

    return scheduledHabits.map((habit) => ({
      ...habit,
      isCompletedToday: completedHabitMap.has(habit.id),
      logId: completedHabitMap.get(habit.id),
    }));
  },

  async toggleHabitCompletion(
    habitId: string,
    isCompleted: boolean,
    date: Date,
    logId?: string
  ): Promise<boolean> {
    const supabase = createClient();
    const dateStr = format(date, 'yyyy-MM-dd');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    if (isCompleted && logId) {
      const { error } = await supabase.from('habit_logs').delete().eq('id', logId);
      return !error;
    } else {
      const { error } = await supabase.from('habit_logs').insert({
        habit_id: habitId,
        user_id: user.id,
        completed_date: dateStr,
      });
      return !error;
    }
  },

  async createHabit(habitData: {
    title: string;
    period: HabitPeriod;
    scope: HabitScope;
    frequency_type: HabitFrequency;
    days_of_week: number[];
    target_duration_minutes?: number;
    icon?: string;
    groupId?: string;
  }): Promise<Habit | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    let coupleId = null;
    if (habitData.scope === 'duo') {
      const { data: couple } = await supabase
        .from('couples')
        .select('id')
        .or(`partner_one_id.eq.${user.id},partner_two_id.eq.${user.id}`)
        .single();
      coupleId = couple?.id || null;
    }

    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: user.id,
        couple_id: coupleId,
        group_id: habitData.scope === 'group' ? habitData.groupId || null : null,
        title: habitData.title,
        period: habitData.period,
        scope: habitData.scope,
        frequency_type: habitData.frequency_type,
        days_of_week: habitData.days_of_week,
        target_duration_minutes: habitData.target_duration_minutes || null,
        icon: habitData.icon || 'target',
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar hábito:', error);
      return null;
    }

    return data;
  },
};