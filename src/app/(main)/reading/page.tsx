'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Coins,
  Flame,
  BookOpen,
  Clock,
  Play,
  Library,
  Home,
  Award,
  Lock,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Book, ReadingSession } from '@/core/reading/types';
import { ReadingGoalsModal } from '@/components/reading/ReadingGoalsModal';
import { cn } from '@/lib/utils';

type NavTab = 'home' | 'library' | 'medals';

interface ReadingGoal {
  daily_type: 'duration' | 'pages';
  daily_target: number;
  weekly_type: 'duration' | 'pages';
  weekly_target: number;
  monthly_type: 'duration' | 'pages' | 'books';
  monthly_target: number;
  yearly_books_target: number;
}

interface AchievementItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  reward_coins: number;
  unlocked: boolean;
}

export default function ReadingDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [activeNav, setActiveNav] = useState<NavTab>('home');
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);

  // Perfil e Tokens
  const [userName, setUserName] = useState('Leitor');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [gtCoins, setGtCoins] = useState(0);

  // Livros e Estatísticas
  const [books, setBooks] = useState<Book[]>([]);
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [todayPages, setTodayPages] = useState(0);
  const [weekMinutes, setWeekMinutes] = useState(0);
  const [weekPages, setWeekPages] = useState(0);
  const [streakDays, setStreakDays] = useState(0);

  // Metas do Usuário
  const [goals, setGoals] = useState<ReadingGoal>({
    daily_type: 'duration',
    daily_target: 30,
    weekly_type: 'duration',
    weekly_target: 360,
    monthly_type: 'books',
    monthly_target: 2,
    yearly_books_target: 12,
  });

  // Conquistas/Medalhas
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);

  // Dias da semana atual
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const [activeDays, setActiveDays] = useState<number[]>([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // 1. Perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, first_name, avatar_url, gt_coins')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      setUserName(profile.first_name || profile.full_name?.split(' ')[0] || 'Leitor');
      setUserAvatar(profile.avatar_url);
      setGtCoins(profile.gt_coins || 0);
    }

    // 2. Metas de Leitura
    const { data: userGoals } = await supabase
      .from('reading_goals')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (userGoals) {
      setGoals(userGoals as ReadingGoal);
    }

    // 3. Livros
    const { data: userBooks } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (userBooks && userBooks.length > 0) {
      setBooks(userBooks as Book[]);
      const current = userBooks.find((b) => b.status === 'reading') || userBooks[0];
      setActiveBook(current as Book);
    }

    // 4. Sessões de Leitura
    const { data: sessions } = await supabase
      .from('reading_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (sessions) {
      const todayStr = format(today, 'yyyy-MM-dd');
      let tMin = 0;
      let tPag = 0;
      let wMin = 0;
      let wPag = 0;
      const readDaysIndices: number[] = [];

      sessions.forEach((s: ReadingSession) => {
        const sessionDate = new Date(s.created_at);
        const sDateStr = format(sessionDate, 'yyyy-MM-dd');

        if (sDateStr === todayStr) {
          tMin += s.duration_minutes;
          tPag += s.pages_read;
        }

        wMin += s.duration_minutes;
        wPag += s.pages_read;

        weekDays.forEach((wDay, idx) => {
          if (isSameDay(wDay, sessionDate) && !readDaysIndices.includes(idx)) {
            readDaysIndices.push(idx);
          }
        });
      });

      setTodayMinutes(tMin);
      setTodayPages(tPag);
      setWeekMinutes(wMin);
      setWeekPages(wPag);
      setActiveDays(readDaysIndices);
      setStreakDays(readDaysIndices.length);
    }

    // 5. Medalhas de Leitura
    const { data: catalogAch } = await supabase
      .from('achievements')
      .select('*')
      .eq('category', 'reading')
      .order('reward_coins', { ascending: true });

    const { data: userAch } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', user.id);

    const unlockedIds = new Set(userAch?.map((ua) => ua.achievement_id) || []);

    if (catalogAch) {
      setAchievements(
        catalogAch.map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          icon: a.icon || 'award',
          reward_coins: a.reward_coins,
          unlocked: unlockedIds.has(a.id),
        }))
      );
    }
  };

  // Cálculo das Metas
  const dailyCurrent = goals.daily_type === 'duration' ? todayMinutes : todayPages;
  const dailyUnit = goals.daily_type === 'duration' ? 'min' : 'pág';
  const dailyProgress = Math.min(100, Math.round((dailyCurrent / (goals.daily_target || 1)) * 100));

  const weeklyCurrent = goals.weekly_type === 'duration' ? weekMinutes : weekPages;
  const weeklyUnit = goals.weekly_type === 'duration' ? 'min' : 'pág';
  const weeklyProgress = Math.min(100, Math.round((weeklyCurrent / (goals.weekly_target || 1)) * 100));

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-[#121418] px-5 pt-6 text-white pb-32">
      {/* 1. Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#1e222b] border border-gray-800">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="h-full w-full rounded-full object-cover" />
            ) : (
              <span className="text-sm font-extrabold text-white">
                {userName.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
              0
            </span>
          </div>

          <div>
            <h2 className="text-sm font-bold text-white">{userName}</h2>
            <button
              onClick={() => router.push('/')}
              className="mt-0.5 flex items-center gap-1 rounded-md bg-[#1e222b] px-2 py-0.5 text-[10px] font-bold text-gray-400 hover:text-white transition-colors"
            >
              <span>📊 Dashboard</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Botão de Engrenagem (Abre Página de Metas em Tela Cheia) */}
          <button
            type="button"
            onClick={() => router.push('/reading/goals')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1e222b] text-gray-400 hover:text-white transition-colors border border-gray-800 active:scale-95"
            title="Configurar Metas de Leitura"
          >
            <Settings size={17} />
          </button>

          {/* Saldo de Tokens */}
          <div className="flex items-center gap-1.5 rounded-full bg-[#1e222b] px-3 py-1.5 border border-amber-500/20 text-amber-400 shadow-sm">
            <Coins size={14} className="text-amber-400" />
            <span className="text-xs font-black">{gtCoins}</span>
          </div>
        </div>
      </div>

      {/* 2. Seletor de Abas Superior (Início / Biblioteca / Medalhas) */}
      <div className="mt-4 flex rounded-2xl bg-[#191c24] p-1 border border-gray-800/80">
        <button
          type="button"
          onClick={() => setActiveNav('home')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all',
            activeNav === 'home'
              ? 'bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 text-gray-950 font-black shadow-md'
              : 'text-gray-400 hover:text-white'
          )}
        >
          <Home size={14} />
          <span>Início</span>
        </button>

        <button
          type="button"
          onClick={() => router.push('/reading/library')}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-gray-400 hover:text-white transition-all"
        >
          <Library size={14} />
          <span>Biblioteca</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveNav('medals')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all',
            activeNav === 'medals'
              ? 'bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 text-gray-950 font-black shadow-md'
              : 'text-gray-400 hover:text-white'
          )}
        >
          <Award size={14} />
          <span>Medalhas</span>
        </button>
      </div>

      {/* CONTEÚDO DA ABA INÍCIO */}
      {activeNav === 'home' && (
        <div className="flex flex-col gap-4 mt-4">
          {/* Rastreador Semanal Circular */}
          <div className="flex items-center justify-between rounded-3xl bg-[#191c24] px-4 py-3.5 border border-gray-800/60">
            {weekDays.map((day, idx) => {
              const isCurrentDay = isSameDay(day, today);
              const hasRead = activeDays.includes(idx);
              const dayInitial = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][idx];

              return (
                <div key={day.toISOString()} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-bold text-gray-400">{dayInitial}</span>
                  <div
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full transition-all border',
                      isCurrentDay
                        ? 'border-2 border-white bg-transparent shadow-md'
                        : hasRead
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-400'
                          : 'border-gray-800 bg-[#14171d]'
                    )}
                  >
                    {hasRead && <div className="h-2 w-2 rounded-full bg-emerald-400" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Card Hero Dinâmico */}
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-400 to-sky-500 p-6 text-gray-950 shadow-xl shadow-teal-500/10">
            {activeBook ? (
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-black/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-gray-950">
                    Leitura em Andamento
                  </span>
                  <span className="text-xs font-extrabold">
                    {Math.round((activeBook.current_page / activeBook.total_pages) * 100)}%
                  </span>
                </div>

                <h3 className="mt-3 text-lg font-black leading-tight">{activeBook.title}</h3>
                <p className="text-xs font-bold opacity-80">{activeBook.author}</p>

                <button
                  onClick={() => router.push(`/reading/session?bookId=${activeBook.id}`)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-xs font-extrabold text-gray-950 shadow-md active:scale-98 transition-transform"
                >
                  <Play size={14} fill="currentColor" />
                  <span>Continuar Leitura</span>
                </button>
              </div>
            ) : (
              <div className="text-center">
                <h3 className="text-xl font-black">Bem-vindo ao GT Leituras!</h3>
                <p className="mt-1 text-xs font-bold opacity-80 max-w-[220px] mx-auto">
                  Comece adicionando seu primeiro livro à sua biblioteca.
                </p>
                <button
                  onClick={() => router.push('/reading/library')}
                  className="mt-5 w-full rounded-full bg-white py-3.5 text-xs font-extrabold text-teal-900 shadow-md active:scale-98 transition-transform"
                >
                  Explorar biblioteca
                </button>
              </div>
            )}
          </div>

          {/* Grade de 3 Cards de Métricas */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="flex flex-col items-center justify-center rounded-2xl bg-[#191c24] p-3 text-center border border-gray-800/60 shadow-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <Flame size={16} className="text-teal-400" />
                <span className="text-base font-black text-white">{streakDays}</span>
              </div>
              <span className="text-[10px] font-bold text-gray-400">Dia</span>
            </div>

            <button
              onClick={() => router.push('/reading/library')}
              className="flex flex-col items-center justify-center rounded-2xl bg-[#191c24] p-3 text-center border border-teal-500/30 hover:border-teal-400 shadow-sm active:scale-95 transition-all"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <BookOpen size={16} className="text-teal-400" />
                <span className="text-base font-black text-white">{books.length}</span>
              </div>
              <span className="text-[10px] font-bold text-teal-400">Livros &gt;</span>
            </button>

            <div className="flex flex-col items-center justify-center rounded-2xl bg-[#191c24] p-3 text-center border border-gray-800/60 shadow-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock size={16} className="text-teal-400" />
                <span className="text-base font-black text-white">{weekMinutes}</span>
              </div>
              <span className="text-[10px] font-bold text-gray-400 leading-tight">Minutos 7 dias</span>
            </div>
          </div>

          {/* Barras de Metas Configuradas */}
          <div className="flex flex-col gap-3">
            {/* Meta Diária */}
            <div className="flex flex-col gap-2 rounded-2xl bg-[#191c24] p-4 border border-gray-800/60">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-300">
                  Meta diária: <strong className="text-white">{dailyCurrent}{dailyUnit}</strong> / {goals.daily_target}{dailyUnit}
                </span>
                <span className="font-bold text-teal-400">{dailyProgress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${dailyProgress}%` }}
                />
              </div>
            </div>

            {/* Meta Semanal */}
            <div className="flex flex-col gap-2 rounded-2xl bg-[#191c24] p-4 border border-gray-800/60">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-300">
                  Meta semanal: <strong className="text-white">{weeklyCurrent}{weeklyUnit}</strong> / {goals.weekly_target}{weeklyUnit}
                </span>
                <span className="font-bold text-teal-400">{weeklyProgress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${weeklyProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA MEDALHAS */}
      {activeNav === 'medals' && (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Conquistas & Distinções
            </h3>
            <span className="text-xs font-bold text-teal-400">
              {achievements.filter((a) => a.unlocked).length} / {achievements.length} Desbloqueadas
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={cn(
                  'flex items-center gap-3.5 rounded-2xl p-3.5 border transition-all',
                  ach.unlocked
                    ? 'bg-[#191c24] border-teal-500/40 shadow-lg shadow-teal-500/5'
                    : 'bg-[#15171d]/60 border-gray-800/60 opacity-60'
                )}
              >
                <div
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border',
                    ach.unlocked
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-[#1e222b] text-gray-600 border-gray-800'
                  )}
                >
                  {ach.unlocked ? <Award size={24} /> : <Lock size={20} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white truncate">{ach.title}</h4>
                    <span className="text-[10px] font-black text-amber-400 flex items-center gap-1">
                      +{ach.reward_coins} GTCoins
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-snug mt-0.5">
                    {ach.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Configuração de Metas */}
      <ReadingGoalsModal
        isOpen={isGoalsModalOpen}
        onClose={() => setIsGoalsModalOpen(false)}
        onSaved={loadAllData}
      />
    </div>
  );
}