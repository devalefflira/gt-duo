'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Plus, 
  Sun, 
  Sunset, 
  Moon, 
  Check, 
  MoreHorizontal, 
  Dumbbell, 
  Users, 
  Flame, 
  User,
  Target
} from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { HabitService } from '@/core/habits/habit-service';
import { HabitWithStatus, HabitPeriod, HabitScope } from '@/core/habits/types';
import { cn } from '@/lib/utils';

function ChallengesDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as HabitScope) || 'individual';

  const [activeScope, setActiveScope] = useState<HabitScope>(initialTab);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState<HabitPeriod>('afternoon');
  const [habits, setHabits] = useState<HabitWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    loadHabits();
  }, [selectedDate]);

  const loadHabits = async () => {
    setLoading(true);
    const data = await HabitService.getHabitsByDate(selectedDate);
    setHabits(data);
    setLoading(false);
  };

  const handleToggle = async (habit: HabitWithStatus) => {
    const nextCompleted = !habit.isCompletedToday;
    setHabits((prev) =>
      prev.map((h) => (h.id === habit.id ? { ...h, isCompletedToday: nextCompleted } : h))
    );
    await HabitService.toggleHabitCompletion(habit.id, habit.isCompletedToday, selectedDate, habit.logId);
    loadHabits();
  };

  const filteredHabits = habits.filter((h) => {
    const matchesScope = h.scope === activeScope;
    const matchesPeriod = h.period === selectedPeriod || h.period === 'anytime';
    return matchesScope && matchesPeriod;
  });

  return (
    <div className="mx-auto flex max-w-md flex-col px-5 pt-6 text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">DESAFIOS</h1>
          <p className="text-xs font-semibold text-gray-400 capitalize">
            {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>

        <button
          onClick={() => router.push('/challenges/new')}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      </div>

      {/* 3 Abas Principais de Escopo */}
      <div className="mt-5 flex rounded-2xl bg-[#191c24] p-1 border border-gray-800/80">
        {[
          { id: 'individual', label: 'Individual', icon: User },
          { id: 'duo', label: 'Duo', icon: Users },
          { id: 'group', label: 'Grupo', icon: Flame },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeScope === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveScope(tab.id as HabitScope)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all',
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Carrossel de Dias da Semana */}
      <div className="mt-4 flex items-center justify-between rounded-3xl bg-[#191c24] p-2.5 border border-gray-800/60">
        {weekDays.map((day) => {
          const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          const isCurrentDay = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={cn(
                'flex flex-1 flex-col items-center py-2 rounded-2xl transition-all',
                isSelected ? 'bg-[#232834] text-white shadow-sm' : 'text-gray-400 hover:text-white'
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                {format(day, 'EEE', { locale: ptBR })}
              </span>
              <span className={cn('mt-0.5 text-sm font-extrabold', isSelected && 'text-blue-400')}>
                {format(day, 'd')}
              </span>
              {isSelected && <div className="mt-1 h-1 w-3 rounded-full bg-blue-500" />}
              {!isSelected && isCurrentDay && <div className="mt-1 h-1 w-1 rounded-full bg-gray-500" />}
            </button>
          );
        })}
      </div>

      {/* Seletor de Turno */}
      <div className="mt-4 flex justify-center">
        <div className="flex rounded-full bg-[#191c24] p-1 border border-gray-800/80">
          {[
            { id: 'morning', label: 'MANHÃ', icon: Sun },
            { id: 'afternoon', label: 'TARDE', icon: Sunset },
            { id: 'night', label: 'NOITE', icon: Moon },
          ].map((period) => {
            const Icon = period.icon;
            const isSelected = selectedPeriod === period.id;
            return (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id as HabitPeriod)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all',
                  isSelected ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-gray-400 hover:text-white'
                )}
              >
                <Icon size={14} />
                <span>{period.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Desafios */}
      <div className="mt-5 flex flex-col gap-3 pb-8">
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-500">Carregando desafios...</div>
        ) : filteredHabits.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl bg-[#191c24]/50 p-8 text-center border border-gray-800/40">
            <Target size={36} className="text-gray-600 mb-2" />
            <p className="text-xs text-gray-400">
              Nenhum desafio {activeScope} para o turno da {selectedPeriod === 'morning' ? 'manhã' : selectedPeriod === 'afternoon' ? 'tarde' : 'noite'}.
            </p>
            <button
              onClick={() => router.push('/challenges/new')}
              className="mt-3 text-xs font-bold text-blue-400 hover:underline"
            >
              + Criar desafio agora
            </button>
          </div>
        ) : (
          filteredHabits.map((habit) => (
            <div
              key={habit.id}
              className={cn(
                'flex items-center justify-between rounded-3xl p-4 transition-all border',
                habit.isCompletedToday
                  ? 'bg-[#191c24] border-green-500/30'
                  : 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-600/20'
              )}
            >
              <div className="flex items-center gap-3.5">
                <button
                  onClick={() => handleToggle(habit)}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all',
                    habit.isCompletedToday
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-white/60 bg-transparent hover:border-white'
                  )}
                >
                  {habit.isCompletedToday && <Check size={16} strokeWidth={3} />}
                </button>

                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                  {habit.scope === 'duo' ? (
                    <Users size={20} />
                  ) : habit.scope === 'group' ? (
                    <Flame size={20} />
                  ) : (
                    <Dumbbell size={20} />
                  )}
                </div>

                <div>
                  <h3 className={cn('text-sm font-bold', habit.isCompletedToday && 'line-through opacity-60')}>
                    {habit.title}
                  </h3>
                  <p className="text-[11px] font-medium opacity-80">
                    {habit.target_duration_minutes ? `0/${habit.target_duration_minutes} min` : 'Meta do dia'}
                    {habit.scope === 'group' && habit.group_name && ` • ${habit.group_name}`}
                  </p>
                </div>
              </div>

              <button className="rounded-full p-1 opacity-70 hover:opacity-100">
                <MoreHorizontal size={18} />
              </button>
            </div>
          ))
        )}

        <button
          onClick={() => router.push('/challenges/new')}
          className="mt-2 w-full rounded-2xl bg-[#191c24] py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-300 hover:bg-[#232834] active:scale-[0.99] border border-gray-800 transition-all"
        >
          CRIE UM NOVO DESAFIO
        </button>
      </div>
    </div>
  );
}

export default function ChallengesDashboardPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-xs text-gray-500">Carregando painel...</div>}>
      <ChallengesDashboardContent />
    </Suspense>
  );
}