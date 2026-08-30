'use client';

import { useState, useEffect } from 'react';
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
  Check, 
  Send,
  Loader2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { HabitPeriod, HabitScope, HabitFrequency } from '@/core/habits/types';
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

  // Formulário
  const [title, setTitle] = useState('');
  const [scope, setScope] = useState<HabitScope>('individual');
  const [frequencyType, setFrequencyType] = useState<HabitFrequency>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [period, setPeriod] = useState<HabitPeriod>('morning');
  const [duration, setDuration] = useState('30');

  // Campos específicos
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [groupName, setGroupName] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);

  // Dados auxiliares
  const [connections, setConnections] = useState<ConnectedUser[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Buscar pessoas dos Vínculos + Seguidores Mútuos
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
          // Inserir criador + membros
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
        target_duration_minutes: duration ? parseInt(duration, 10) : 30,
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
      {/* Top Header */}
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
        {/* Bloco 1: Nome do Desafio */}
        <div className="flex flex-col gap-3 rounded-3xl bg-[#191c24] p-5 border border-gray-800/60">
          <label className="text-xs font-semibold text-gray-400">Nome do Desafio</label>
          <input
            type="text"
            required
            placeholder="Ex: Treino de Força, Leitura Diária, Corrida..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-2xl bg-[#232834] px-4 py-3.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Bloco 2: Tipo de Desafio */}
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

          {/* Seletor Duo: Escolher parceiro */}
          {scope === 'duo' && (
            <div className="mt-2 pt-3 border-t border-gray-800/60">
              <label className="text-xs font-semibold text-blue-400">Com quem você fará este Duo?</label>
              {connections.length === 0 ? (
                <p className="mt-1 text-[11px] text-gray-400">
                  Nenhum vínculo ativo encontrado. Conecte alguém em <strong>Vínculos</strong>.
                </p>
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

          {/* Seletor Grupo: Nome do Grupo e Membros */}
          {scope === 'group' && (
            <div className="mt-2 flex flex-col gap-3 pt-3 border-t border-gray-800/60">
              <div>
                <label className="text-xs font-semibold text-blue-400">Classificação / Nome do Grupo</label>
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

        {/* Bloco 3: Frequência & Dias da Semana */}
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

        {/* Bloco 4: Período & Duração */}
        <div className="flex flex-col gap-4 rounded-3xl bg-[#191c24] p-5 border border-gray-800/60">
          <div>
            <label className="text-xs font-semibold text-gray-400">Período do Dia</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
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

          <div>
            <label className="text-xs font-semibold text-gray-400">Duração Estimada (minutos)</label>
            <div className="relative mt-1.5">
              <input
                type="number"
                min="5"
                step="5"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-2xl bg-[#232834] px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500 pl-10"
              />
              <Clock size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
            </div>
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