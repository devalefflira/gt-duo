'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Plus, 
  Layers,
  Clock3,
  Sun, 
  Sunset, 
  Moon, 
  Check, 
  MoreHorizontal, 
  Dumbbell, 
  Users, 
  Flame, 
  User,
  Target,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  format, 
  addDays, 
  addWeeks, 
  addMonths, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { HabitService } from '@/core/habits/habit-service';
import { HabitWithStatus, HabitPeriod, HabitScope } from '@/core/habits/types';
import { cn } from '@/lib/utils';

type PeriodFilter = 'all' | 'anytime' | 'morning' | 'afternoon' | 'night';

function ChallengesDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as HabitScope) || 'individual';

  const [activeScope, setActiveScope] = useState<HabitScope>(initialTab);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('all');
  const [habits, setHabits] = useState<HabitWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // Controle de Visualização do Calendário (Semanal vs Mensal)
  const [isMonthView, setIsMonthView] = useState(false);

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

  // Navegação do Calendário
  const handlePrevPeriod = () => {
    if (isMonthView) {
      setSelectedDate((prev) => addMonths(prev, -1));
    } else {
      setSelectedDate((prev) => addWeeks(prev, -1));
    }
  };

  const handleNextPeriod = () => {
    if (isMonthView) {
      setSelectedDate((prev) => addMonths(prev, 1));
    } else {
      setSelectedDate((prev) => addWeeks(prev, 1));
    }
  };

  const handleGoToToday = () => {
    setSelectedDate(new Date());
  };

  // Geração dos dias para a semana
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Geração dos dias para o mês completo
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarGridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarGridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const fullMonthDays = eachDayOfInterval({ start: calendarGridStart, end: calendarGridEnd });

  // Filtragem por Escopo e Período
  const filteredHabits = habits.filter((h) => {
    const matchesScope = h.scope === activeScope;
    if (!matchesScope) return false;

    if (selectedPeriod === 'all') return true;
    if (selectedPeriod === 'anytime') return h.period === 'anytime';
    return h.period === selectedPeriod || h.period === 'anytime';
  });

  return (
    <div className="mx-auto flex max-w-md flex-col px-5 pt-6 text-white">
      {/* 1. Top Header */}
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

      {/* 2. Três Abas Principais de Escopo */}
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

      {/* 3. Calendário Expansível e Navegável */}
      <div className="mt-4 flex flex-col rounded-3xl bg-[#191c24] p-3.5 border border-gray-800/60 shadow-lg">
        {/* Barra de Controle do Calendário */}
        <div className="flex items-center justify-between pb-2.5 px-1 border-b border-gray-800/60">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMonthView(!isMonthView)}
              className="flex items-center gap-1.5 text-xs font-extrabold capitalize text-white hover:text-blue-400 transition-colors"
            >
              <span>{format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}</span>
              {isMonthView ? <ChevronUp size={15} className="text-blue-400" /> : <ChevronDown size={15} />}
            </button>

            <button
              onClick={handleGoToToday}
              className="rounded-lg bg-blue-600/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/20 hover:bg-blue-600/20 active:scale-95 transition-all"
            >
              Hoje
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevPeriod}
              className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
              title={isMonthView ? 'Mês anterior' : 'Semana anterior'}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNextPeriod}
              className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
              title={isMonthView ? 'Próximo mês' : 'Próxima semana'}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Visão Semanal */}
        {!isMonthView ? (
          <div className="mt-2 flex items-center justify-between gap-1">
            {weekDays.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentDay = isSameDay(day, new Date());

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'flex flex-1 flex-col items-center py-2.5 rounded-2xl transition-all',
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
        ) : (
          /* Visão Mensal Completa */
          <div className="mt-3 flex flex-col gap-1 animate-in fade-in">
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 uppercase py-1">
              <span>Dom</span>
              <span>Seg</span>
              <span>Ter</span>
              <span>Qua</span>
              <span>Qui</span>
              <span>Sex</span>
              <span>Sáb</span>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {fullMonthDays.map((day) => {
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentDay = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, selectedDate);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => {
                      setSelectedDate(day);
                      setIsMonthView(false);
                    }}
                    className={cn(
                      'flex h-9 flex-col items-center justify-center rounded-xl text-xs font-bold transition-all',
                      !isCurrentMonth && 'opacity-25',
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : isCurrentDay
                        ? 'bg-[#232834] text-blue-400 border border-blue-500/30'
                        : 'text-gray-300 hover:bg-[#232834]'
                    )}
                  >
                    <span>{format(day, 'd')}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. Seletor de Turno: TODOS, DIA INTEIRO, MANHÃ, TARDE, NOITE */}
      <div className="mt-4 flex justify-center">
        <div className="flex rounded-full bg-[#191c24] p-1 border border-gray-800/80 max-w-full overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'TODOS', icon: Layers },
            { id: 'anytime', label: 'DIA INTEIRO', icon: Clock3 },
            { id: 'morning', label: 'MANHÃ', icon: Sun },
            { id: 'afternoon', label: 'TARDE', icon: Sunset },
            { id: 'night', label: 'NOITE', icon: Moon },
          ].map((period) => {
            const Icon = period.icon;
            const isSelected = selectedPeriod === period.id;
            return (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id as PeriodFilter)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] sm:text-[11px] font-bold transition-all whitespace-nowrap',
                  isSelected 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                    : 'text-gray-400 hover:text-white'
                )}
              >
                <Icon size={13} />
                <span>{period.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Lista de Desafios */}
      <div className="mt-5 flex flex-col gap-3 pb-8">
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-500">Carregando desafios...</div>
        ) : filteredHabits.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl bg-[#191c24]/50 p-8 text-center border border-gray-800/40">
            <Target size={36} className="text-gray-600 mb-2" />
            <p className="text-xs text-gray-400">
              Nenhum desafio {activeScope} encontrado para este período.
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
                {/* Botão de Check-in */}
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

                {/* Ícone */}
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                  {habit.scope === 'duo' ? (
                    <Users size={20} />
                  ) : habit.scope === 'group' ? (
                    <Flame size={20} />
                  ) : (
                    <Dumbbell size={20} />
                  )}
                </div>

                {/* Título & Metas */}
                <div>
                  <h3 className={cn('text-sm font-bold', habit.isCompletedToday && 'line-through opacity-60')}>
                    {habit.title}
                  </h3>
                  <p className="text-[11px] font-medium opacity-80">
                    {habit.target_duration_minutes ? `0/${habit.target_duration_minutes} min` : 'Meta diária'}
                    {habit.period === 'anytime' && ' • Dia Inteiro'}
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