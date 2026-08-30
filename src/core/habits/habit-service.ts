import { createClient } from '@/lib/supabase/client';
import { Habit, HabitLog, HabitWithStatus } from './types';
import { format, getDay, isBefore, isAfter, parseISO, startOfDay } from 'date-fns';

export const HabitService = {
  async getHabitsByDate(date: Date): Promise<HabitWithStatus[]> {
    const supabase = createClient();
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = getDay(date);
    const targetDateObj = startOfDay(date);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // 1. Buscar hábitos ativos
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .is('archived_at', null)
      .order('created_at', { ascending: true });

    if (habitsError || !habits) {
      console.error('Erro ao buscar desafios:', habitsError);
      return [];
    }

    // 2. Filtrar por:
    // - Data de Início (o dia selecionado precisa ser >= start_date)
    // - Data de Término (o dia selecionado precisa ser <= end_date, se houver end_date)
    // - Dias da semana programados
    const scheduledHabits = habits.filter((habit: Habit) => {
      // Checar data de início
      if (habit.start_date) {
        const start = startOfDay(parseISO(habit.start_date));
        if (isBefore(targetDateObj, start)) return false;
      }

      // Checar data de término (se tiver prazo)
      if (habit.end_date) {
        const end = startOfDay(parseISO(habit.end_date));
        if (isAfter(targetDateObj, end)) return false;
      }

      // Checar dias da semana
      if (!habit.days_of_week || habit.days_of_week.length === 0) return true;
      return habit.days_of_week.includes(dayOfWeek);
    });

    if (scheduledHabits.length === 0) return [];

    // 3. Buscar logs de conclusão
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
};