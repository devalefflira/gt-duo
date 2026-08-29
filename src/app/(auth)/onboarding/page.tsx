'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Check, 
  Heart, 
  ShieldAlert, 
  Sparkles, 
  Target, 
  Users, 
  Moon, 
  Footprints, 
  Utensils, 
  GlassWater, 
  Dumbbell,
  CalendarDays,
  CalendarCheck
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { WheelPicker } from '@/components/ui/WheelPicker';
import { HabitFrequency } from '@/core/habits/types';

const GOALS_LIST = [
  { id: 'healthy', label: 'Ter uma vida mais saudável', icon: Heart },
  { id: 'pressure', label: 'Aliviar a pressão', icon: ShieldAlert },
  { id: 'new_things', label: 'Experimentar coisas novas', icon: Sparkles },
  { id: 'focus', label: 'Ter mais foco', icon: Target },
  { id: 'relationship', label: 'Melhorar o relacionamento', icon: Users },
  { id: 'sleep', label: 'Durma melhor', icon: Moon },
];

const HABITS_LIST = [
  { id: 'sleep_8h', title: 'Durma mais de 8h', period: 'night', icon: Moon },
  { id: 'healthy_meals', title: 'Faça refeições saudáveis', period: 'afternoon', icon: Utensils },
  { id: 'water_8_glasses', title: 'Beba 8 copos de água', period: 'anytime', icon: GlassWater },
  { id: 'exercise', title: 'Faça exercícios', period: 'afternoon', icon: Dumbbell },
  { id: 'walk', title: 'Caminhe', period: 'morning', icon: Footprints },
];

const DAYS_NAMES = [
  { day: 0, label: 'DOM' },
  { day: 1, label: 'SEG' },
  { day: 2, label: 'TER' },
  { day: 3, label: 'QUA' },
  { day: 4, label: 'QUI' },
  { day: 5, label: 'SEX' },
  { day: 6, label: 'SÁB' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => (i < 10 ? `0${i}` : `${i}`));
const MINUTES = Array.from({ length: 60 }, (_, i) => (i < 10 ? `0${i}` : `${i}`));
const TARGET_MINUTES = [5, 10, 15, 20, 30, 45, 60, 90, 120];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [wakeHour, setWakeHour] = useState('05');
  const [wakeMin, setWakeMin] = useState('30');
  const [sleepHour, setSleepHour] = useState('23');
  const [sleepMin, setSleepMin] = useState('30');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedHabit, setSelectedHabit] = useState<string | null>('exercise');
  const [customHabit, setCustomHabit] = useState('');
  const [targetMinutes, setTargetMinutes] = useState<string | number>(60);
  
  // Frequência
  const [frequencyType, setFrequencyType] = useState<HabitFrequency>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) => {
      const exists = prev.includes(day);
      if (exists) {
        if (prev.length === 1) return prev; // Mantém ao menos 1 dia selecionado
        return prev.filter((d) => d !== day);
      } else {
        return [...prev, day].sort();
      }
    });
  };

  const handleFrequencyChange = (type: HabitFrequency) => {
    setFrequencyType(type);
    if (type === 'daily') {
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    } else if (type === 'once_a_week') {
      setSelectedDays([1]); // Segunda como padrão
    } else {
      setSelectedDays([1, 2, 3, 4, 5]); // Dias de semana como padrão
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    // 1. Atualizar Perfil
    await supabase
      .from('profiles')
      .update({
        wake_time: `${wakeHour}:${wakeMin}:00`,
        sleep_time: `${sleepHour}:${sleepMin}:00`,
        goals: selectedGoals,
      })
      .eq('id', user.id);

    // 2. Criar Primeiro Hábito com Dias Configurados
    const chosenHabitData = HABITS_LIST.find((h) => h.id === selectedHabit);
    const habitTitle = customHabit.trim() || chosenHabitData?.title || 'Meu Primeiro Hábito';
    const habitPeriod = chosenHabitData?.period || 'afternoon';

    await supabase.from('habits').insert({
      user_id: user.id,
      title: habitTitle,
      period: habitPeriod,
      scope: 'individual',
      frequency_type: frequencyType,
      days_of_week: selectedDays,
      target_duration_minutes: Number(targetMinutes),
      icon: chosenHabitData?.id || 'target',
    });

    router.push('/');
    router.refresh();
  };

  return (
    <div className="flex min-h-dvh flex-col justify-between bg-[#13151b] px-6 py-8 text-white">
      {/* Header & Progresso */}
      <div>
        <div className="flex items-center justify-between pb-6">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-800"
            >
              <ChevronLeft size={24} />
            </button>
          ) : (
            <div className="w-8" />
          )}

          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i <= step ? 'w-8 bg-blue-500' : 'w-8 bg-gray-700'
                }`}
              />
            ))}
          </div>
          <div className="w-8" />
        </div>

        {/* Step 1: Horário de Acordar */}
        {step === 1 && (
          <div className="flex flex-col items-center pt-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight">Que horas você costuma acordar?</h2>
            <p className="mt-2 text-xs text-gray-400">Escolha o horário em que seu dia geralmente começa</p>

            <div className="my-16 flex items-center justify-center gap-4">
              <WheelPicker items={HOURS} value={wakeHour} onChange={(val) => setWakeHour(String(val))} />
              <span className="text-2xl font-bold text-blue-500">:</span>
              <WheelPicker items={MINUTES} value={wakeMin} onChange={(val) => setWakeMin(String(val))} />
            </div>
          </div>
        )}

        {/* Step 2: Horário de Dormir */}
        {step === 2 && (
          <div className="flex flex-col items-center pt-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight">Que horas seu dia geralmente termina?</h2>
            <p className="mt-2 text-xs text-gray-400">Vamos lembrá-lo de concluir seus hábitos antes desse horário</p>

            <div className="my-16 flex items-center justify-center gap-4">
              <WheelPicker items={HOURS} value={sleepHour} onChange={(val) => setSleepHour(String(val))} />
              <span className="text-2xl font-bold text-blue-500">:</span>
              <WheelPicker items={MINUTES} value={sleepMin} onChange={(val) => setSleepMin(String(val))} />
            </div>
          </div>
        )}

        {/* Step 3: Objetivos */}
        {step === 3 && (
          <div className="flex flex-col items-center pt-4 text-center">
            <h2 className="text-2xl font-bold tracking-tight">Qual é o seu objetivo?</h2>
            <p className="mt-2 text-xs text-gray-400">Ajude-nos a compreender melhor suas prioridades</p>

            <div className="mt-8 grid grid-cols-2 gap-3.5 w-full">
              {GOALS_LIST.map((goal) => {
                const Icon = goal.icon;
                const isSelected = selectedGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl p-4 text-center text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                        : 'bg-[#1e222b] text-gray-300'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute right-2 top-2 rounded-full bg-white p-0.5 text-blue-600">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                    <Icon size={26} className={isSelected ? 'text-white' : 'text-blue-400'} />
                    <span>{goal.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Escolha o Hábito */}
        {step === 4 && (
          <div className="flex flex-col items-center pt-4 text-center">
            <h2 className="text-2xl font-bold tracking-tight">Escolha o primeiro hábito</h2>
            <p className="mt-2 text-xs text-gray-400">Selecione uma sugestão ou personalize</p>

            <div className="mt-6 flex flex-col gap-3 w-full">
              {HABITS_LIST.map((habit) => {
                const Icon = habit.icon;
                const isSelected = selectedHabit === habit.id;
                return (
                  <button
                    key={habit.id}
                    onClick={() => {
                      setSelectedHabit(habit.id);
                      setCustomHabit('');
                    }}
                    className={`flex items-center gap-4 rounded-2xl px-5 py-4 font-semibold text-sm transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                        : 'bg-[#1e222b] text-gray-300'
                    }`}
                  >
                    <Icon size={20} className={isSelected ? 'text-white' : 'text-blue-400'} />
                    <span>{habit.title}</span>
                  </button>
                );
              })}

              <div className="pt-2">
                <input
                  type="text"
                  placeholder="Ou digite outro hábito..."
                  value={customHabit}
                  onChange={(e) => {
                    setCustomHabit(e.target.value);
                    setSelectedHabit(null);
                  }}
                  className="w-full rounded-2xl bg-[#1e222b] px-5 py-4 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Meta de Tempo */}
        {step === 5 && (
          <div className="flex flex-col items-center pt-6 text-center">
            <span className="text-xs font-semibold text-blue-400">
              {customHabit || HABITS_LIST.find((h) => h.id === selectedHabit)?.title}
            </span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">Precisa de um objetivo?</h2>
            <p className="mt-2 text-xs text-gray-400">Selecione a duração diária estimada</p>

            <div className="my-16 flex items-center justify-center">
              <WheelPicker
                items={TARGET_MINUTES}
                value={targetMinutes}
                onChange={(val) => setTargetMinutes(val)}
                unit="min"
              />
            </div>
          </div>
        )}

        {/* Step 6: Frequência e Dias da Semana */}
        {step === 6 && (
          <div className="flex flex-col items-center pt-4 text-center">
            <h2 className="text-2xl font-bold tracking-tight">Com que frequência?</h2>
            <p className="mt-2 text-xs text-gray-400">Defina os dias em que deseja cumprir este hábito</p>

            <div className="mt-6 flex w-full flex-col gap-3">
              {[
                { id: 'daily', label: 'Todos os dias', icon: CalendarDays },
                { id: 'specific_days', label: 'Alguns dias da semana', icon: CalendarCheck },
                { id: 'once_a_week', label: '1 dia na semana', icon: CalendarCheck },
              ].map((freq) => {
                const isSelected = frequencyType === freq.id;
                return (
                  <button
                    key={freq.id}
                    onClick={() => handleFrequencyChange(freq.id as HabitFrequency)}
                    className={`flex items-center justify-between rounded-2xl p-4 font-semibold text-sm transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                        : 'bg-[#1e222b] text-gray-300'
                    }`}
                  >
                    <span>{freq.label}</span>
                    {isSelected && <Check size={18} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>

            {/* Seletor visual dos dias da semana */}
            <div className="mt-6 flex w-full items-center justify-between gap-1 rounded-2xl bg-[#1e222b] p-3 border border-gray-800">
              {DAYS_NAMES.map((d) => {
                const isSelected = selectedDays.includes(d.day);
                return (
                  <button
                    key={d.day}
                    onClick={() => toggleDay(d.day)}
                    className={`flex h-11 flex-1 flex-col items-center justify-center rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Botão de Avanço */}
      <div className="pt-6">
        {step < 6 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="w-full rounded-full bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all"
          >
            PRÓXIMO
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={loading}
            className="w-full rounded-full bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'GERANDO SEU PLANO...' : 'CONCLUIR E COMEÇAR'}
          </button>
        )}
      </div>
    </div>
  );
}