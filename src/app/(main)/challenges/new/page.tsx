'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  User, 
  Users, 
  Flame, 
  Sun, 
  Sunset, 
  Moon, 
  Clock, 
  CalendarRange, 
  Calendar,
  Check, 
  Loader2,
  Gauge,
  FlameKindling,
  Scale,
  Ruler
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { HabitPeriod, HabitScope, HabitFrequency, GoalMode } from '@/core/habits/types';
import { format, addDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const DAYS_NAMES = [
  { day: 0, label: 'DOM' },
  { day: 1, label: 'SEG' },
  { day: 2, label: 'TER' },
  { day: 3, label: 'QUA' },
  { day: 4, label: 'QUI' },
  { day: 5, label: 'SEX' },
  { day: 6, label: 'SÁB' },
];

interface ConnectedUser {
  id: string;
  full_name: string;
  username: string;
}

export default function NewChallengePage() {
  const router = useRouter();
  const supabase = createClient();

  // Dados Básicos
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [scope, setScope] = useState<HabitScope>('individual');
  const [frequencyType, setFrequencyType] = useState<HabitFrequency>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [period, setPeriod] = useState<HabitPeriod>('morning');

  // Tipo de Meta (Duração, Prazo ou Ambos)
  const [goalMode, setGoalMode] = useState<GoalMode>('both');
  const [duration, setDuration] = useState('30');
  const [deadlineDays, setDeadlineDays] = useState('7');

  // Métricas Opcionais com Toggles "Não se aplica"
  const [hasDistance, setHasDistance] = useState(false);
  const [distanceKm, setDistanceKm] = useState('5');

  const [hasCalories, setHasCalories] = useState(false);
  const [calories, setCalories] = useState('300');

  const [hasWeight, setHasWeight] = useState(false);
  const [weightKg, setWeightKg] = useState('70');

  const [hasHeight, setHasHeight] = useState(false);
  const [heightCm, setHeightCm] = useState('175');

  // Vínculos Duo / Grupo
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [groupName, setGroupName] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const [connections, setConnections] = useState<ConnectedUser[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: bondsData } = await supabase
      .from('bonds')
      .select('requester_id, recipient_id, requester:profiles!bonds_requester_id_fkey(id, full_name, username), recipient:profiles!bonds_recipient_id_fkey(id, full_name, username)')
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .eq('status', 'accepted');

    const list: ConnectedUser[] = [];
    bondsData?.forEach((b: any) => {
      const p = b.requester_id === user.id ? b.recipient : b.requester;
      if (p && !list.some((u) => u.id === p.id)) list.push(p);
    });

    setConnections(list);
    if (list.length > 0) setSelectedPartnerId(list[0].id);
  };

  // Cálculo Dinâmico da Data Final
  const calculatedEndDate = useMemo(() => {
    if ((goalMode === 'deadline' || goalMode === 'both') && deadlineDays) {
      const days = parseInt(deadlineDays, 10);
      if (!isNaN(days) && days > 0) {
        try {
          const start = parseISO(startDate);
          // O término é data_inicio + dias - 1 dia (ex: 7 dias começando hoje termina daqui a 6 dias)
          const end = addDays(start, days - 1);
          return format(end, 'yyyy-MM-dd');
        } catch {
          return null;
        }
      }
    }
    return null;
  }, [startDate, goalMode, deadlineDays]);

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

  const toggleGroupMember = (userId: string) => {
    setSelectedGroupMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      let createdGroupId = null;

      if (scope === 'group') {
        const finalGroupName = groupName.trim() || `Grupo de ${title.trim()}`;
        const { data: group } = await supabase
          .from('habit_groups')
          .insert({
            creator_id: user.id,
            name: finalGroupName,
            max_members: 20,
          })
          .select()
          .single();

        if (group) {
          createdGroupId = group.id;
          const membersToInsert = [user.id, ...selectedGroupMembers].map((memberId) => ({
            group_id: group.id,
            user_id: memberId,
          }));
          await supabase.from('habit_group_members').insert(membersToInsert);
        }
      }

      await supabase.from('habits').insert({
        user_id: user.id,
        partner_id: scope === 'duo' ? selectedPartnerId || null : null,
        group_id: createdGroupId,
        group_name: scope === 'group' ? groupName.trim() || 'Grupo Desafio' : null,
        title: title.trim(),
        scope,
        period,
        frequency_type: frequencyType,
        days_of_week: selectedDays,

        // Datas e Prazos
        start_date: startDate,
        end_date: calculatedEndDate,
        goal_mode: goalMode,
        target_duration_minutes: (goalMode === 'duration' || goalMode === 'both') && duration ? parseInt(duration, 10) : null,
        deadline_days: (goalMode === 'deadline' || goalMode === 'both') && deadlineDays ? parseInt(deadlineDays, 10) : null,

        // Métricas Opcionais
        target_distance_km: hasDistance && distanceKm ? parseFloat(distanceKm) : null,
        target_calories: hasCalories && calories ? parseInt(calories, 10) : null,
        target_weight_kg: hasWeight && weightKg ? parseFloat(weightKg) : null,
        target_height_cm: hasHeight && heightCm ? parseFloat(heightCm) : null,

        icon: 'target',
      });

      router.push(`/?tab=${scope}`);
      router.refresh();
    } catch (error) {
      console.error('Erro ao criar desafio:', error);
      alert('Erro ao criar desafio. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-[#121418] px-5 py-6 text-white pb-32">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Voltar</span>
        </button>
        <h1 className="text-base font-bold">Novo Desafio</h1>
        <div className="w-8" />
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
        {/* Bloco 1: Nome do Desafio & Data de Início */}
        <div className="flex flex-col gap-4 rounded-3xl bg-[#191c24] p-5 border border-gray-800/60">
          <div>
            <label className="text-xs font-semibold text-gray-400">Nome do Desafio</label>
            <input
              type="text"
              required
              placeholder="Ex: Sem Açúcar 7 dias, Correr 5km, Leitura..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-2xl bg-[#232834] px-4 py-3.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Data de Início */}
          <div>
            <label className="text-xs font-semibold text-gray-400">Data de Início</label>
            <div className="relative mt-1">
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-2xl bg-[#232834] px-4 py-3 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500 pl-10"
              />
              <Calendar size={16} className="absolute left-3.5 top-3 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Bloco 2: Tipo de Desafio (Individual / Duo / Grupo) */}
        <div className="flex flex-col gap-3 rounded-3xl bg-[#191c24] p-5 border border-gray-800/60">
          <label className="text-xs font-semibold text-gray-400">Tipo de Desafio</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'individual', label: 'Individual', icon: User },
              { id: 'duo', label: 'Duo', icon: Users },
              { id: 'group', label: 'Grupo', icon: Flame },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = scope === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setScope(item.id as HabitScope)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3 text-xs font-bold transition-all',
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-[#232834] text-gray-400 hover:text-white'
                  )}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {scope === 'duo' && (
            <div className="mt-2 pt-3 border-t border-gray-800/60">
              <label className="text-xs font-semibold text-blue-400">Com quem você fará este Duo?</label>
              {connections.length === 0 ? (
                <p className="mt-1 text-[11px] text-gray-400">Nenhum vínculo ativo. Adicione em Vínculos.</p>
              ) : (
                <select
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  className="mt-2 w-full rounded-2xl bg-[#232834] px-4 py-3 text-xs font-medium text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {connections.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#191c24]">
                      {c.full_name} (@{c.username})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {scope === 'group' && (
            <div className="mt-2 flex flex-col gap-3 pt-3 border-t border-gray-800/60">
              <div>
                <label className="text-xs font-semibold text-blue-400">Nome / Classificação do Grupo</label>
                <input
                  type="text"
                  placeholder="Ex: Grupo da Corrida, Grupo do Trabalho, Igreja..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl bg-[#232834] px-4 py-3 text-xs text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {connections.length > 0 && (
                <div>
                  <label className="text-[11px] font-semibold text-gray-400">
                    Convidar Vínculos ({selectedGroupMembers.length}/20)
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                    {connections.map((c) => {
                      const isSelected = selectedGroupMembers.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleGroupMember(c.id)}
                          className={cn(
                            'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
                            isSelected ? 'bg-blue-600 text-white shadow-md' : 'bg-[#232834] text-gray-400'
                          )}
                        >
                          <span>{c.full_name}</span>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bloco 3: Frequência & Dias */}
        <div className="flex flex-col gap-3 rounded-3xl bg-[#191c24] p-5 border border-gray-800/60">
          <label className="text-xs font-semibold text-gray-400">Frequência</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'daily', label: 'Todos os dias' },
              { id: 'specific_days', label: 'Alguns dias' },
              { id: 'once_a_week', label: '1x na semana' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => handleFrequencySelect(f.id as HabitFrequency)}
                className={cn(
                  'rounded-xl p-2.5 text-center text-xs font-semibold transition-all',
                  frequencyType === f.id ? 'bg-blue-600 text-white' : 'bg-[#232834] text-gray-400'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-between gap-1 rounded-2xl bg-[#232834] p-2">
            {DAYS_NAMES.map((d) => {
              const isSelected = selectedDays.includes(d.day);
              return (
                <button
                  key={d.day}
                  type="button"
                  onClick={() => toggleDay(d.day)}
                  className={cn(
                    'flex h-8 flex-1 items-center justify-center rounded-xl text-xs font-bold transition-all',
                    isSelected ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'
                  )}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bloco 4: Duração, Prazo & Data Final Calculada */}
        <div className="flex flex-col gap-4 rounded-3xl bg-[#191c24] p-5 border border-gray-800/60">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-400">Definição da Meta</label>
            <span className="text-[10px] font-bold text-blue-400 uppercase">Tempo & Prazo</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'duration', label: 'Apenas Duração' },
              { id: 'deadline', label: 'Apenas Prazo' },
              { id: 'both', label: 'Duração + Prazo' },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setGoalMode(mode.id as GoalMode)}
                className={cn(
                  'rounded-xl p-2.5 text-center text-[11px] font-bold transition-all',
                  goalMode === mode.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-[#232834] text-gray-400 hover:text-white'
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Campo Duração */}
            {(goalMode === 'duration' || goalMode === 'both') && (
              <div>
                <label className="text-xs font-semibold text-gray-300">Duração Diária (minutos)</label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    min="1"
                    step="5"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full rounded-2xl bg-[#232834] px-4 py-3 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500 pl-9"
                  />
                  <Clock size={15} className="absolute left-3 top-3.5 text-gray-400" />
                </div>
              </div>
            )}

            {/* Campo Prazo em Dias */}
            {(goalMode === 'deadline' || goalMode === 'both') && (
              <div>
                <label className="text-xs font-semibold text-gray-300">Prazo Total (dias)</label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    min="1"
                    value={deadlineDays}
                    onChange={(e) => setDeadlineDays(e.target.value)}
                    className="w-full rounded-2xl bg-[#232834] px-4 py-3 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500 pl-9"
                  />
                  <CalendarRange size={15} className="absolute left-3 top-3.5 text-gray-400" />
                </div>
              </div>
            )}
          </div>

          {/* Exibição da Data de Término Estimada */}
          {calculatedEndDate && (
            <div className="rounded-2xl bg-[#232834]/80 p-3.5 border border-blue-500/20 text-xs">
              <span className="text-gray-400">Término previsto para: </span>
              <strong className="text-blue-400">
                {format(parseISO(calculatedEndDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </strong>
            </div>
          )}
        </div>

        {/* Bloco 5: Período do Dia */}
        <div className="flex flex-col gap-3 rounded-3xl bg-[#191c24] p-5 border border-gray-800/60">
          <label className="text-xs font-semibold text-gray-400">Período do Dia</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'morning', label: 'Manhã', icon: Sun },
              { id: 'afternoon', label: 'Tarde', icon: Sunset },
              { id: 'night', label: 'Noite', icon: Moon },
            ].map((p) => {
              const Icon = p.icon;
              const isSelected = period === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id as HabitPeriod)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-2xl p-2.5 text-xs font-semibold transition-all',
                    isSelected ? 'bg-blue-600 text-white' : 'bg-[#232834] text-gray-400'
                  )}
                >
                  <Icon size={16} />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bloco 6: Métricas Opcionais */}
        <div className="flex flex-col gap-4 rounded-3xl bg-[#191c24] p-5 border border-gray-800/60">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-400">Métricas Adicionais</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Ative apenas o que deseja metrificar neste desafio.</p>
          </div>

          {/* Distância */}
          <div className="rounded-2xl bg-[#232834] p-3.5 border border-gray-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge size={16} className="text-blue-400" />
                <span className="text-xs font-bold text-white">Distância</span>
              </div>
              <button
                type="button"
                onClick={() => setHasDistance(!hasDistance)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all',
                  hasDistance ? 'bg-blue-600 text-white' : 'bg-[#191c24] text-gray-400'
                )}
              >
                {hasDistance ? 'Ativado' : 'Não se aplica'}
              </button>
            </div>
            {hasDistance && (
              <div className="mt-3">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Quilômetros (ex: 5)"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  className="w-full rounded-xl bg-[#191c24] px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Calorias */}
          <div className="rounded-2xl bg-[#232834] p-3.5 border border-gray-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlameKindling size={16} className="text-orange-400" />
                <span className="text-xs font-bold text-white">Calorias</span>
              </div>
              <button
                type="button"
                onClick={() => setHasCalories(!hasCalories)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all',
                  hasCalories ? 'bg-blue-600 text-white' : 'bg-[#191c24] text-gray-400'
                )}
              >
                {hasCalories ? 'Ativado' : 'Não se aplica'}
              </button>
            </div>
            {hasCalories && (
              <div className="mt-3">
                <input
                  type="number"
                  step="10"
                  placeholder="Calorias (ex: 300)"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full rounded-xl bg-[#191c24] px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Peso */}
          <div className="rounded-2xl bg-[#232834] p-3.5 border border-gray-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale size={16} className="text-emerald-400" />
                <span className="text-xs font-bold text-white">Peso Meta</span>
              </div>
              <button
                type="button"
                onClick={() => setHasWeight(!hasWeight)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all',
                  hasWeight ? 'bg-blue-600 text-white' : 'bg-[#191c24] text-gray-400'
                )}
              >
                {hasWeight ? 'Ativado' : 'Não se aplica'}
              </button>
            </div>
            {hasWeight && (
              <div className="mt-3">
                <input
                  type="number"
                  step="0.5"
                  placeholder="Quilos (ex: 70)"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full rounded-xl bg-[#191c24] px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Altura */}
          <div className="rounded-2xl bg-[#232834] p-3.5 border border-gray-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ruler size={16} className="text-purple-400" />
                <span className="text-xs font-bold text-white">Altura</span>
              </div>
              <button
                type="button"
                onClick={() => setHasHeight(!hasHeight)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all',
                  hasHeight ? 'bg-blue-600 text-white' : 'bg-[#191c24] text-gray-400'
                )}
              >
                {hasHeight ? 'Ativado' : 'Não se aplica'}
              </button>
            </div>
            {hasHeight && (
              <div className="mt-3">
                <input
                  type="number"
                  step="1"
                  placeholder="Centímetros (ex: 175)"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full rounded-xl bg-[#191c24] px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-full bg-[#191c24] py-4 text-center font-bold text-gray-400 hover:text-white border border-gray-800 active:scale-[0.98] transition-all"
          >
            CANCELAR
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-full bg-blue-600 py-4 text-center font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {submitting ? 'SALVANDO...' : 'SALVAR'}
          </button>
        </div>
      </form>
    </div>
  );
}