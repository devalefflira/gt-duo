'use client';

import { useState } from 'react';
import { X, Sun, Sunset, Moon, Clock, Users, User, Flame } from 'lucide-react';
import { HabitPeriod, HabitScope, HabitFrequency } from '@/core/habits/types';
import { HabitService } from '@/core/habits/habit-service';

interface CreateHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHabitCreated: () => void;
}

const DAYS_NAMES = [
  { day: 0, label: 'DOM' },
  { day: 1, label: 'SEG' },
  { day: 2, label: 'TER' },
  { day: 3, label: 'QUA' },
  { day: 4, label: 'QUI' },
  { day: 5, label: 'SEX' },
  { day: 6, label: 'SÁB' },
];

export function CreateHabitModal({ isOpen, onClose, onHabitCreated }: CreateHabitModalProps) {
  const [title, setTitle] = useState('');
  const [period, setPeriod] = useState<HabitPeriod>('morning');
  const [scope, setScope] = useState<HabitScope>('individual');
  const [frequencyType, setFrequencyType] = useState<HabitFrequency>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [duration, setDuration] = useState('30');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const toggleDay = (day: number) => {
    setSelectedDays((prev) => {
      const exists = prev.includes(day);
      if (exists) {
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== day);
      } else {
        return [...prev, day].sort();
      }
    });
  };

  const handleFrequencySelect = (type: HabitFrequency) => {
    setFrequencyType(type);
    if (type === 'daily') setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    else if (type === 'once_a_week') setSelectedDays([1]);
    else setSelectedDays([1, 2, 3, 4, 5]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    await HabitService.createHabit({
      title: title.trim(),
      period,
      scope,
      frequency_type: frequencyType,
      days_of_week: selectedDays,
      target_duration_minutes: duration ? parseInt(duration, 10) : undefined,
    });

    setLoading(false);
    setTitle('');
    onHabitCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4 backdrop-blur-sm">
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-[#1a1e27] p-6 text-white shadow-2xl sm:rounded-3xl border border-gray-800">
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <h3 className="text-lg font-bold">Novo Hábito</h3>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-400">Nome do Hábito</label>
            <input
              type="text"
              required
              placeholder="Ex: Treino de Força, Leitura..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-2xl bg-[#232834] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tipo de Hábito: 3 Opções */}
          <div>
            <label className="text-xs font-semibold text-gray-400">Tipo de Hábito</label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScope('individual')}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl p-3 text-xs font-bold transition-all ${
                  scope === 'individual'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-[#232834] text-gray-400'
                }`}
              >
                <User size={16} />
                <span>Individual</span>
              </button>

              <button
                type="button"
                onClick={() => setScope('duo')}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl p-3 text-xs font-bold transition-all ${
                  scope === 'duo'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-[#232834] text-gray-400'
                }`}
              >
                <Users size={16} />
                <span>Duo</span>
              </button>

              <button
                type="button"
                onClick={() => setScope('group')}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl p-3 text-xs font-bold transition-all ${
                  scope === 'group'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-[#232834] text-gray-400'
                }`}
              >
                <Flame size={16} />
                <span>Grupo</span>
              </button>
            </div>
            {scope === 'group' && (
              <p className="mt-1.5 text-[11px] text-blue-400 font-medium">
                * Desafio coletivo com amigos mútuos (até 20 membros).
              </p>
            )}
          </div>

          {/* Frequência */}
          <div>
            <label className="text-xs font-semibold text-gray-400">Frequência</label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {[
                { id: 'daily', label: 'Todos os dias' },
                { id: 'specific_days', label: 'Alguns dias' },
                { id: 'once_a_week', label: '1x na semana' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleFrequencySelect(f.id as HabitFrequency)}
                  className={`rounded-xl p-2.5 text-center text-xs font-semibold transition-all ${
                    frequencyType === f.id ? 'bg-blue-600 text-white' : 'bg-[#232834] text-gray-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-1 rounded-xl bg-[#232834] p-1.5">
              {DAYS_NAMES.map((d) => {
                const isSelected = selectedDays.includes(d.day);
                return (
                  <button
                    key={d.day}
                    type="button"
                    onClick={() => toggleDay(d.day)}
                    className={`flex h-8 flex-1 items-center justify-center rounded-lg text-[11px] font-bold transition-all ${
                      isSelected ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Período */}
          <div>
            <label className="text-xs font-semibold text-gray-400">Período do Dia</label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {[
                { id: 'morning', label: 'Manhã', icon: Sun },
                { id: 'afternoon', label: 'Tarde', icon: Sunset },
                { id: 'night', label: 'Noite', icon: Moon },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = period === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPeriod(item.id as HabitPeriod)}
                    className={`flex flex-col items-center gap-1 rounded-xl p-2.5 text-xs font-semibold transition-all ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-[#232834] text-gray-400'
                    }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duração */}
          <div>
            <label className="text-xs font-semibold text-gray-400">Duração (Minutos)</label>
            <div className="relative mt-1">
              <input
                type="number"
                min="0"
                step="5"
                placeholder="Ex: 30"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-2xl bg-[#232834] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 pl-10"
              />
              <Clock size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-full bg-blue-600 py-3.5 text-center font-bold text-white shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'CRIANDO...' : 'CRIAR HÁBITO'}
          </button>
        </form>
      </div>
    </div>
  );
}