import { createClient } from '@/lib/supabase/client';
import { Habit, HabitLog, HabitWithStatus, HabitScope, HabitPeriod, HabitFrequency, GoalMode } from './types';
import { format, getDay, isBefore, isAfter, parseISO, startOfDay } from 'date-fns';

export interface CreateHabitDTO {
  title: string;
  description?: string;
  period?: HabitPeriod;
  scope?: HabitScope;
  frequency_type?: HabitFrequency;
  days_of_week?: number[];
  partner_id?: string | null;
  group_id?: string | null;
  group_name?: string | null;
  start_date?: string;
  end_date?: string | null;
  goal_mode?: GoalMode;
  target_duration_minutes?: number | null;
  deadline_days?: number | null;
  target_distance_km?: number | null;
  target_calories?: number | null;
  target_weight_kg?: number | null;
  target_height_cm?: number | null;
  icon?: string;
}

export const HabitService = {
  async createHabit(dto: CreateHabitDTO): Promise<Habit | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: user.id,
        title: dto.title,
        description: dto.description || null,
        period: dto.period || 'morning',
        scope: dto.scope || 'individual',
        frequency_type: dto.frequency_type || 'daily',
        days_of_week: dto.days_of_week || [0, 1, 2, 3, 4, 5, 6],
        partner_id: dto.partner_id || null,
        group_id: dto.group_id || null,
        group_name: dto.group_name || null,
        start_date: dto.start_date || format(new Date(), 'yyyy-MM-dd'),
        end_date: dto.end_date || null,
        goal_mode: dto.goal_mode || 'duration',
        target_duration_minutes: dto.target_duration_minutes || null,
        deadline_days: dto.deadline_days || null,
        target_distance_km: dto.target_distance_km || null,
        target_calories: dto.target_calories || null,
        target_weight_kg: dto.target_weight_kg || null,
        target_height_cm: dto.target_height_cm || null,
        icon: dto.icon || 'target',
        invite_status: dto.scope === 'duo' ? 'pending' : 'accepted',
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar desafio:', error);
      return null;
    }

    return data as Habit;
  },

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

    // 2. Filtrar por convite, start_date, end_date e dias da semana
    const scheduledHabits = habits.filter((habit: any) => {
      const isPartner = habit.partner_id === user.id;

      if (habit.scope === 'duo' && isPartner && habit.invite_status !== 'accepted') {
        return false;
      }

      if (habit.start_date) {
        const start = startOfDay(parseISO(habit.start_date));
        if (isBefore(targetDateObj, start)) return false;
      }

      if (habit.end_date) {
        const end = startOfDay(parseISO(habit.end_date));
        if (isAfter(targetDateObj, end)) return false;
      }

      if (!habit.days_of_week || habit.days_of_week.length === 0) return true;
      return habit.days_of_week.includes(dayOfWeek);
    });

    if (scheduledHabits.length === 0) return [];

    // 3. Buscar logs de conclusão
    const habitIds = scheduledHabits.map((h: any) => h.id);
    const { data: logs } = await supabase
      .from('habit_logs')
      .select('*')
      .in('habit_id', habitIds)
      .eq('completed_date', dateStr);

    const completedHabitMap = new Map<string, string>();
    logs?.forEach((log: HabitLog) => {
      completedHabitMap.set(log.habit_id, log.id);
    });

    return scheduledHabits.map((habit: any) => ({
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