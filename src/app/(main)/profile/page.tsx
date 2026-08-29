'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  Menu, 
  Plus, 
  Grid, 
  History, 
  Award, 
  UserPlus, 
  LogOut, 
  Link2, 
  Flame, 
  CheckCircle2, 
  Dumbbell,
  Sparkles,
  Trophy
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Habit, HabitLog } from '@/core/habits/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string | null;
  bio?: string | null;
  is_private: boolean;
}

interface PartnerProfile {
  id: string;
  full_name: string;
  username: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'habits' | 'timeline' | 'achievements'>('habits');
  
  const [habits, setHabits] = useState<Habit[]>([]);
  const [recentLogs, setRecentLogs] = useState<(HabitLog & { habit_title?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (userProfile) {
      setProfile(userProfile);
    } else {
      setProfile({
        id: user.id,
        full_name: user.user_metadata?.full_name || 'Usuário',
        username: user.user_metadata?.username || 'usuario',
        bio: 'Construindo hábitos sólidos todos os dias.',
        is_private: true,
      });
    }

    const { data: coupleData } = await supabase
      .from('couples')
      .select('partner_one_id, partner_two_id')
      .or(`partner_one_id.eq.${user.id},partner_two_id.eq.${user.id}`)
      .maybeSingle();

    if (coupleData) {
      const partnerId = coupleData.partner_one_id === user.id ? coupleData.partner_two_id : coupleData.partner_one_id;
      if (partnerId) {
        const { data: partnerData } = await supabase
          .from('profiles')
          .select('id, full_name, username')
          .eq('id', partnerId)
          .maybeSingle();
        if (partnerData) setPartner(partnerData);
      }
    }

    const { count: followers } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id)
      .eq('status', 'accepted');

    const { count: following } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id)
      .eq('status', 'accepted');

    setFollowersCount(followers || 0);
    setFollowingCount(following || 0);

    const { data: userHabits } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .is('archived_at', null);

    if (userHabits) setHabits(userHabits);

    const { data: logs } = await supabase
      .from('habit_logs')
      .select('*, habits(title)')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(10);

    if (logs) {
      setRecentLogs(
        logs.map((log: any) => ({
          ...log,
          habit_title: log.habits?.title || 'Hábito concluído',
        }))
      );
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (loading || !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-xs text-gray-500">
        Carregando perfil...
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-5 pt-4 text-white">
      {/* 1. Header do Topo */}
      <div className="flex items-center justify-between py-2">
        <button className="rounded-full p-2 text-gray-300 hover:bg-gray-800">
          <Plus size={22} />
        </button>

        <div className="flex items-center gap-1.5 text-base font-bold tracking-tight">
          {profile.is_private && <Lock size={15} className="text-gray-400" />}
          <span>@{profile.username || 'usuario'}</span>
        </div>

        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="rounded-full p-2 text-gray-300 hover:bg-gray-800"
        >
          <Menu size={22} />
        </button>
      </div>

      {showSettings && (
        <div className="mt-2 rounded-2xl bg-[#1d222d] p-3 shadow-xl border border-gray-800 animate-in fade-in slide-in-from-top-2">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={16} />
            Encerrar Sessão
          </button>
        </div>
      )}

      {/* 2. Avatar Limpo e Contadores */}
      <div className="mt-5 flex items-center justify-between">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-lg">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-[#161920] font-bold text-xl text-blue-400">
            {profile.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>

        <div className="flex flex-1 justify-around pl-4 text-center">
          <div>
            <span className="block text-base font-extrabold text-white">{habits.length}</span>
            <span className="text-[11px] font-medium text-gray-400">hábitos</span>
          </div>
          <div>
            <span className="block text-base font-extrabold text-white">{followersCount}</span>
            <span className="text-[11px] font-medium text-gray-400">seguidores</span>
          </div>
          <div>
            <span className="block text-base font-extrabold text-white">{followingCount}</span>
            <span className="text-[11px] font-medium text-gray-400">seguindo</span>
          </div>
        </div>
      </div>

      {/* 3. Bio & Vínculo com Ícone de Elo/Corrente */}
      <div className="mt-4 flex flex-col">
        <h2 className="text-sm font-bold text-white">{profile.full_name}</h2>
        <p className="mt-1 text-xs text-gray-300 leading-relaxed">{profile.bio}</p>

        <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-blue-400">
          <Link2 size={16} className="text-blue-400" />
          {partner ? (
            <span className="hover:underline cursor-pointer">@{partner.username}</span>
          ) : (
            <button
              onClick={() => router.push('/duo')}
              className="font-medium text-gray-400 hover:text-blue-400 transition-colors"
            >
              Conectar com seu parceiro(a)...
            </button>
          )}
        </div>
      </div>

      {/* 4. Botões de Ação */}
      <div className="mt-5 flex items-center gap-2">
        <button className="flex-1 rounded-xl bg-[#1e222b] py-2.5 text-center text-xs font-bold text-white hover:bg-[#252a36] transition-all">
          Editar perfil
        </button>
        <button className="flex-1 rounded-xl bg-[#1e222b] py-2.5 text-center text-xs font-bold text-white hover:bg-[#252a36] transition-all">
          Compartilhar perfil
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1e222b] text-gray-300 hover:bg-[#252a36] transition-all">
          <UserPlus size={16} />
        </button>
      </div>

      {/* 5. Abas de Conteúdo */}
      <div className="mt-6 flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('habits')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-bold transition-all border-b-2',
            activeTab === 'habits'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          )}
        >
          <Grid size={16} />
          <span>Hábitos</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-bold transition-all border-b-2',
            activeTab === 'timeline'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          )}
        >
          <History size={16} />
          <span>Histórico</span>
        </button>

        <button
          onClick={() => setActiveTab('achievements')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-bold transition-all border-b-2',
            activeTab === 'achievements'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          )}
        >
          <Award size={16} />
          <span>Medalhas</span>
        </button>
      </div>

      {/* 6. Listagens */}
      <div className="mt-4 flex flex-col gap-3 pb-8">
        {activeTab === 'habits' && (
          habits.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500">Nenhum hábito cadastrado ainda.</div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {habits.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between rounded-2xl bg-[#1a1e27] p-3.5 border border-gray-800/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                      <Dumbbell size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{h.title}</h4>
                      <p className="text-[10px] text-gray-400 capitalize">
                        {h.period === 'morning' ? 'Manhã' : h.period === 'afternoon' ? 'Tarde' : 'Noite'} • {h.scope}
                      </p>
                    </div>
                  </div>
                  {h.target_duration_minutes && (
                    <span className="text-[11px] font-semibold text-gray-400">
                      {h.target_duration_minutes} min
                    </span>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'timeline' && (
          recentLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500">Nenhum check-in recente registrado.</div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-2xl bg-[#1a1e27] p-3.5 border border-gray-800/60"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-green-500" />
                    <div>
                      <h4 className="text-xs font-bold text-white">{log.habit_title}</h4>
                      <p className="text-[10px] text-gray-400">
                        {format(new Date(log.completed_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-[10px] font-bold text-green-400">
                    Concluído
                  </span>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'achievements' && (
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="flex flex-col items-center rounded-2xl bg-[#1a1e27] p-4 text-center border border-gray-800">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-400 mb-2">
                <Sparkles size={24} />
              </div>
              <h5 className="text-[11px] font-bold">1º Passo</h5>
              <p className="mt-0.5 text-[9px] text-gray-400">1º check-in</p>
            </div>

            <div className="flex flex-col items-center rounded-2xl bg-[#1a1e27] p-4 text-center border border-gray-800">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10 text-orange-400 mb-2">
                <Flame size={24} />
              </div>
              <h5 className="text-[11px] font-bold">7 Dias Foco</h5>
              <p className="mt-0.5 text-[9px] text-gray-400">Semana ouro</p>
            </div>

            <div className="flex flex-col items-center rounded-2xl bg-[#1a1e27] p-4 text-center opacity-40 border border-gray-800">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800 text-gray-500 mb-2">
                <Trophy size={24} />
              </div>
              <h5 className="text-[11px] font-bold">30 Dias Duo</h5>
              <p className="mt-0.5 text-[9px] text-gray-400">Bloqueado</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}