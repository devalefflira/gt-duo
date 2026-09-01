'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  Coins, 
  Flame, 
  BookOpen, 
  Clock, 
  ChevronRight, 
  Sparkles,
  Compass,
  Play
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Book, ReadingSession } from '@/core/reading/types';
import { cn } from '@/lib/utils';

export default function ReadingDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  // Dados do Usuário & Estatísticas
  const [userName, setUserName] = useState('Leitor');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [gtCoins, setGtCoins] = useState(0);

  // Livros e Sessões
  const [books, setBooks] = useState<Book[]>([]);
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [weekMinutes, setWeekMinutes] = useState(0);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [streakDays, setStreakDays] = useState(0);

  // Metas (em minutos)
  const dailyGoalMinutes = 30;
  const weeklyGoalMinutes = 360; // 6 horas

  const [loading, setLoading] = useState(true);

  // Geração dos dias da semana atual
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Segunda-feira
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Simulação/Leitura dos dias com sessão realizada
  const [activeDays, setActiveDays] = useState<number[]>([]);

  useEffect(() => {
    loadReadingData();
  }, []);

  const loadReadingData = async () => {
    setLoading(true);
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

    // 2. Livros
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

    // 3. Sessões de leitura dos últimos 7 dias
    const { data: sessions } = await supabase
      .from('reading_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (sessions) {
      const todayStr = format(today, 'yyyy-MM-dd');
      let totalWeek = 0;
      let totalToday = 0;
      const readDaysIndices: number[] = [];

      sessions.forEach((s: ReadingSession) => {
        const sessionDate = new Date(s.created_at);
        const sDateStr = format(sessionDate, 'yyyy-MM-dd');

        // Minutos de hoje
        if (sDateStr === todayStr) {
          totalToday += s.duration_minutes;
        }

        // Minutos da semana
        totalWeek += s.duration_minutes;

        // Identificar índice do dia da semana (0 = Seg, 6 = Dom)
        weekDays.forEach((wDay, idx) => {
          if (isSameDay(wDay, sessionDate) && !readDaysIndices.includes(idx)) {
            readDaysIndices.push(idx);
          }
        });
      });

      setTodayMinutes(totalToday);
      setWeekMinutes(totalWeek);
      setActiveDays(readDaysIndices);
      setStreakDays(readDaysIndices.length > 0 ? readDaysIndices.length : 0);
    }

    setLoading(false);
  };

  const dailyProgress = Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100));
  const weeklyProgress = Math.min(100, Math.round((weekMinutes / weeklyGoalMinutes) * 100));

  const formatHoursMinutes = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}min`;
    return `${h}h${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-[#121418] px-5 pt-6 text-white pb-32">
      {/* 1. Header do Módulo */}
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
          <button
            onClick={() => router.push('/settings')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1e222b] text-gray-400 hover:text-white transition-colors border border-gray-800"
          >
            <Settings size={17} />
          </button>

          {/* Saldo de Tokens/GTCoins */}
          <div className="flex items-center gap-1.5 rounded-full bg-[#1e222b] px-3 py-1.5 border border-amber-500/20 text-amber-400 shadow-sm">
            <Coins size={14} className="text-amber-400" />
            <span className="text-xs font-black">{gtCoins}</span>
          </div>
        </div>
      </div>

      {/* 2. Rastreador Semanal Circular */}
      <div className="mt-5 flex items-center justify-between rounded-3xl bg-[#191c24] px-4 py-3.5 border border-gray-800/60">
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

      {/* 3. Card Hero Dinâmico */}
      <div className="mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-400 to-sky-500 p-6 text-gray-950 shadow-xl shadow-teal-500/10">
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
              Explorar catálogo
            </button>
          </div>
        )}
      </div>

      {/* 4. Grade de 3 Cards de Métricas */}
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {/* Streak */}
        <div className="flex flex-col items-center justify-center rounded-2xl bg-[#191c24] p-3 text-center border border-gray-800/60 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <Flame size={16} className="text-teal-400" />
            <span className="text-base font-black text-white">{streakDays}</span>
          </div>
          <span className="text-[10px] font-bold text-gray-400">Dia</span>
        </div>

        {/* Livros */}
        <div className="flex flex-col items-center justify-center rounded-2xl bg-[#191c24] p-3 text-center border border-gray-800/60 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <BookOpen size={16} className="text-teal-400" />
            <span className="text-base font-black text-white">{books.length}</span>
          </div>
          <span className="text-[10px] font-bold text-gray-400">Livros</span>
        </div>

        {/* Minutos 7 dias */}
        <div className="flex flex-col items-center justify-center rounded-2xl bg-[#191c24] p-3 text-center border border-gray-800/60 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock size={16} className="text-teal-400" />
            <span className="text-base font-black text-white">{weekMinutes}</span>
          </div>
          <span className="text-[10px] font-bold text-gray-400 leading-tight">Minutos 7 dias</span>
        </div>
      </div>

      {/* 5. Barras de Metas */}
      <div className="mt-4 flex flex-col gap-3">
        {/* Meta Diária */}
        <div className="flex flex-col gap-2 rounded-2xl bg-[#191c24] p-4 border border-gray-800/60">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-gray-300">
              Meta diária: <strong className="text-white">{todayMinutes}min</strong> / {dailyGoalMinutes}min
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
              Meta semanal: <strong className="text-white">{formatHoursMinutes(weekMinutes)}</strong> / 6h00
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
  );
}