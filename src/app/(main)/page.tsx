'use client';

import { useState, useEffect } from 'react';
import {
  format,
  addDays,
  subDays,
  isSameDay,
  startOfWeek
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  Sun,
  Sunset,
  Moon,
  Check,
  MoreHorizontal,
  Dumbbell,
  Users,
  Flame
} from 'lucide-react';
import { HabitWithStatus, HabitPeriod } from '@/core/habits/types';
import { HabitService } from '@/core/habits/habit-service';
import { CreateHabitModal } from '@/components/CreateHabitModal';
import { cn } from '@/lib/utils';

export default function TodayPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState<HabitPeriod | 'all'>('afternoon');
  const [habits, setHabits] = useState<HabitWithStatus[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Gerar os 7 dias da semana atual
  const startDay = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDay, i));

  const loadHabits = async () => {
    setLoading(true);
    const data = await HabitService.getHabitsByDate(selectedDate);
    setHabits(data);
    setLoading(false);
  };

  useEffect(() => {
    loadHabits();
  }, [selectedDate]);

  const handleToggle = async (habit: HabitWithStatus) => {
    // Atualização otimista na UI
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habit.id ? { ...h, isCompletedToday: !h.isCompletedToday } : h
      )
    );

    await HabitService.toggleHabitCompletion(
      habit.id,
      habit.isCompletedToday,
      selectedDate,
      habit.logId
    );

    // Revalidação silenciosa
    const updated = await HabitService.getHabitsByDate(selectedDate);
    setHabits(updated);
  };

  const filteredHabits = habits.filter((h) => {
    if (selectedPeriod === 'all') return true;
    return h.period === selectedPeriod || h.period === 'anytime';
  });

  return (
    <div className="mx-auto flex max-w-md flex-col px-5 pt-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">HOJE</h1>
          <p className="text-xs font-semibold capitalize text-gray-400">
            {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      </div>

      {/* Week Day Carousel */}
      <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#191c24] p-2 border border-gray-800/40">
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl px-2.5 py-2 transition-all',
                isSelected
                  ? 'bg-[#29303d] text-white shadow-inner font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              <span className="text-[10px] font-bold uppercase">
                {format(day, 'EEE', { locale: ptBR }).slice(0, 3)}
              </span>
              <span className="text-xs font-semibold">{format(day, 'dd')}</span>
              {isSelected && <div className="h-1 w-3.5 rounded-full bg-blue-500" />}
            </button>
          );
        })}
      </div>

      {/* Turnos / Filtros de Período */}
      <div className="mt-5 flex items-center justify-center gap-2">
        {[
          { id: 'morning', label: 'MANHÃ', icon: Sun },
          { id: 'afternoon', label: 'TARDE', icon: Sunset },
          { id: 'night', label: 'NOITE', icon: Moon },
        ].map((period) => {
          const Icon = period.icon;
          const isActive = selectedPeriod === period.id;
          return (
            <button
              key={period.id}
              onClick={() => setSelectedPeriod(period.id as HabitPeriod)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all',
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-[#191c24] text-gray-400 hover:text-gray-300'
              )}
            >
              <Icon size={14} />
              <span>{period.label}</span>
            </button>
          );
        })}
      </div>

      {/* Habits List */}
      <div className="mt-6 flex flex-col gap-3.5">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">Carregando hábitos...</div>
        ) : filteredHabits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm font-semibold text-gray-400">Nenhum hábito para este turno</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-3 text-xs font-bold text-blue-400 hover:underline"
            >
              + Adicionar hábito agora
            </button>
          </div>
        ) : (
          filteredHabits.map((habit) => (
            <div
              key={habit.id}
              className={cn(
                'relative flex items-center justify-between rounded-3xl p-4.5 transition-all',
                habit.isCompletedToday
                  ? 'bg-[#1d222d] opacity-60 border border-gray-800'
                  : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              )}
            >
              <div className="flex items-center gap-4">
                {/* Botão de Check-in em 1-Toque */}
                <button
                  onClick={() => handleToggle(habit)}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all',
                    habit.isCompletedToday
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-white/70 hover:border-white'
                  )}
                >
                  {habit.isCompletedToday && <Check size={14} strokeWidth={3} />}
                </button>

                {/* Ícone e Título */}
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                    {habit.scope === 'duo' ? (
                      <Users size={18} className="text-white" />
                    ) : habit.scope === 'group' ? (
                      <Flame size={18} className="text-white" />
                    ) : (
                      <Dumbbell size={18} className="text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className={cn('text-sm font-bold', habit.isCompletedToday && 'line-through text-gray-300')}>
                      {habit.title}
                    </h3>
                    <p className="text-[11px] font-medium opacity-80">
                      {habit.target_duration_minutes ? `0/${habit.target_duration_minutes} min` : 'Meta diária'}
                      {habit.scope === 'duo' && ' • Duo'}
                      {habit.scope === 'group' && ' • Grupo (Desafio)'}
                    </p>
                  </div>
                </div>
              </div>

              <button className="text-white/70 hover:text-white">
                <MoreHorizontal size={20} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Botão CRIE UM NOVO HÁBITO */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="mt-6 w-full rounded-2xl bg-[#191c24] py-4 text-center text-xs font-extrabold tracking-wider text-gray-300 hover:bg-[#232834] transition-all border border-gray-800/60"
      >
        CRIE UM NOVO HÁBITO
      </button>

      {/* Modal de Criação */}
      <CreateHabitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onHabitCreated={loadHabits}
      />
    </div>
  );
}