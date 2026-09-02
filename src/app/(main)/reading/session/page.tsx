'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ChevronLeft, 
  Play, 
  Pause, 
  RotateCcw,
  CheckCircle2, 
  BookOpen, 
  Sparkles, 
  Clock, 
  Timer, 
  Hourglass, 
  PenTool,
  FileText,
  Loader2 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Book } from '@/core/reading/types';
import { cn } from '@/lib/utils';

type SessionMethod = 'timer' | 'manual';
type TimerType = 'stopwatch' | 'pomodoro' | 'countdown';

function ReadingSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookId = searchParams.get('bookId');
  const supabase = createClient();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  // Modo Principal: Relógio vs Manual
  const [method, setMethod] = useState<SessionMethod>('timer');

  // Tipo de Timer
  const [timerType, setTimerType] = useState<TimerType>('stopwatch');

  // Estados dos Timers
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [countdownInitialMinutes, setCountdownInitialMinutes] = useState(30);

  // Estados de Registro
  const [pagesRead, setPagesRead] = useState('10');
  const [manualMinutes, setManualMinutes] = useState('30');
  const [insight, setInsight] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadBook();
  }, [bookId]);

  // Gerenciamento dos tipos de contagem ao alternar timerType
  useEffect(() => {
    setIsActive(false);
    if (timerType === 'stopwatch') {
      setSeconds(0);
    } else if (timerType === 'pomodoro') {
      setSeconds(25 * 60); // 25 min regressivo
    } else if (timerType === 'countdown') {
      setSeconds(countdownInitialMinutes * 60);
    }
  }, [timerType, countdownInitialMinutes]);

  // Tick do Timer
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (timerType === 'stopwatch') {
            return prev + 1;
          } else {
            if (prev <= 1) {
              clearInterval(timerRef.current!);
              setIsActive(false);
              return 0;
            }
            return prev - 1;
          }
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timerType]);

  const loadBook = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    if (bookId) {
      const { data } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setBook(data as Book);
    } else {
      const { data } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'reading')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setBook(data as Book);
    }
    setLoading(false);
  };

  const formatDisplayTime = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const remainingSeconds = sec % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleResetTimer = () => {
    setIsActive(false);
    if (timerType === 'stopwatch') setSeconds(0);
    if (timerType === 'pomodoro') setSeconds(25 * 60);
    if (timerType === 'countdown') setSeconds(countdownInitialMinutes * 60);
  };

  const handleFinishSession = async () => {
    if (!book) {
      alert('Selecione ou adicione um livro antes de registrar uma sessão.');
      return;
    }

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let finalMinutes = 0;
    if (method === 'manual') {
      finalMinutes = parseInt(manualMinutes, 10) || 0;
    } else {
      if (timerType === 'stopwatch') {
        finalMinutes = Math.max(1, Math.round(seconds / 60));
      } else if (timerType === 'pomodoro') {
        const elapsed = 25 * 60 - seconds;
        finalMinutes = Math.max(1, Math.round(elapsed / 60));
      } else {
        const elapsed = countdownInitialMinutes * 60 - seconds;
        finalMinutes = Math.max(1, Math.round(elapsed / 60));
      }
    }

    const parsedPages = parseInt(pagesRead, 10) || 0;
    const tokensEarned = Math.max(5, finalMinutes + Math.floor(parsedPages / 2));

    try {
      const { error } = await supabase
        .from('reading_sessions')
        .insert({
          user_id: user.id,
          book_id: book.id,
          duration_minutes: finalMinutes,
          pages_read: parsedPages,
          main_insight: insight.trim() || null,
          tokens_earned: tokensEarned,
        });

      if (error) throw error;

      const queryParams = new URLSearchParams({
        timeStr: finalMinutes >= 60 ? `${Math.floor(finalMinutes / 60)}h${finalMinutes % 60}m` : `${finalMinutes}min`,
        pages: parsedPages.toString(),
        insightsCount: insight.trim() ? '1' : '0',
        mainInsight: insight.trim() || 'Constância e aprendizado contínuo.',
        tokens: tokensEarned.toString(),
      });

      router.push(`/reading/session/complete?${queryParams.toString()}`);
    } catch (err) {
      console.error('Erro ao salvar sessão de leitura:', err);
      alert('Erro ao salvar leitura. Tente novamente.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#121418] text-xs text-gray-500">
        Carregando sessão...
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-[#121418] px-5 py-6 text-white pb-32">
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Voltar</span>
        </button>
        <h1 className="text-sm font-bold">Registrar Leitura</h1>
        <div className="w-8" />
      </div>

      {/* 2. Livro Ativo */}
      {book && (
        <div className="mt-4 flex items-center gap-3.5 rounded-3xl bg-[#191c24] p-3.5 border border-gray-800/80">
          <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded-xl bg-[#232834] overflow-hidden border border-gray-800">
            {book.cover_url ? (
              <img src={book.cover_url} alt={book.title} className="h-full w-full object-cover" />
            ) : (
              <BookOpen size={18} className="text-gray-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-bold text-white truncate">{book.title}</h3>
            <p className="text-[11px] text-gray-400 truncate">{book.author}</p>
            <span className="mt-1 inline-block text-[10px] font-semibold text-emerald-400">
              Página atual: {book.current_page} de {book.total_pages}
            </span>
          </div>
        </div>
      )}

      {/* 3. Seletor: Cronometrado vs Manual */}
      <div className="mt-5 flex rounded-2xl bg-[#191c24] p-1 border border-gray-800">
        <button
          type="button"
          onClick={() => setMethod('timer')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all',
            method === 'timer'
              ? 'bg-gradient-to-r from-sky-400 to-emerald-400 text-gray-950 font-black shadow-md'
              : 'text-gray-400 hover:text-white'
          )}
        >
          <Clock size={14} />
          <span>Com Relógio</span>
        </button>

        <button
          type="button"
          onClick={() => setMethod('manual')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all',
            method === 'manual'
              ? 'bg-gradient-to-r from-sky-400 to-emerald-400 text-gray-950 font-black shadow-md'
              : 'text-gray-400 hover:text-white'
          )}
        >
          <PenTool size={14} />
          <span>Informar Manual</span>
        </button>
      </div>

      {/* 4A. Bloco Relógio (Cronômetro, Pomodoro, Temporizador) */}
      {method === 'timer' && (
        <div className="mt-5 flex flex-col gap-4">
          {/* Sub-Abas do Relógio */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'stopwatch', label: 'Cronômetro', icon: Timer },
              { id: 'pomodoro', label: 'Pomodoro (25m)', icon: Hourglass },
              { id: 'countdown', label: 'Temporizador', icon: Clock },
            ].map((t) => {
              const Icon = t.icon;
              const isCurrent = timerType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimerType(t.id as TimerType)}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-2xl p-2.5 text-center transition-all border',
                    isCurrent
                      ? 'bg-[#232834] border-teal-400/50 text-teal-400 font-bold'
                      : 'bg-[#191c24] border-gray-800 text-gray-500 hover:text-gray-300'
                  )}
                >
                  <Icon size={16} className="mb-1" />
                  <span className="text-[10px] leading-tight">{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Ajuste de minutos do Temporizador */}
          {timerType === 'countdown' && (
            <div className="flex items-center justify-center gap-2 pt-1">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setCountdownInitialMinutes(mins)}
                  className={cn(
                    'rounded-xl px-3 py-1.5 text-[11px] font-bold border transition-all',
                    countdownInitialMinutes === mins
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                      : 'bg-[#191c24] text-gray-400 border-gray-800'
                  )}
                >
                  {mins} min
                </button>
              ))}
            </div>
          )}

          {/* Visor Circular Central */}
          <div className="flex flex-col items-center justify-center rounded-3xl bg-[#191c24] p-7 border border-gray-800 shadow-xl">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-400">
              {timerType === 'stopwatch' && 'Contagem Progressiva'}
              {timerType === 'pomodoro' && 'Pomodoro em Foco'}
              {timerType === 'countdown' && `Temporizador: ${countdownInitialMinutes}m`}
            </span>

            <div className="mt-3 font-mono text-5xl font-black tracking-tight text-white">
              {formatDisplayTime(seconds)}
            </div>

            {/* Controles */}
            <div className="mt-6 flex items-center gap-4">
              <button
                type="button"
                onClick={handleResetTimer}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#232834] text-gray-400 hover:text-white transition-colors"
                title="Reiniciar tempo"
              >
                <RotateCcw size={18} />
              </button>

              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-full text-gray-950 shadow-lg transition-transform active:scale-95',
                  isActive
                    ? 'bg-amber-400 shadow-amber-400/20'
                    : 'bg-gradient-to-r from-sky-400 to-emerald-400 shadow-teal-500/20'
                )}
              >
                {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4B. Bloco Registro Manual */}
      {method === 'manual' && (
        <div className="mt-5 flex flex-col gap-3 rounded-3xl bg-[#191c24] p-5 border border-gray-800">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <PenTool size={14} className="text-teal-400" />
            <span>Registro Posterior da Leitura</span>
          </h3>
          <p className="text-[11px] text-gray-400 leading-snug">
            Leu seu livro físico e esqueceu de abrir o cronômetro? Preencha os dados abaixo:
          </p>

          <div className="mt-2">
            <label className="text-xs font-semibold text-gray-300">Tempo estimado de leitura (minutos)</label>
            <div className="relative mt-1.5">
              <input
                type="number"
                min="1"
                placeholder="Ex: 35"
                value={manualMinutes}
                onChange={(e) => setManualMinutes(e.target.value)}
                className="w-full rounded-2xl bg-[#232834] px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-teal-400 pl-10"
              />
              <Clock size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* 5. Páginas Lidas & Insight Principal (Comum a ambos) */}
      <div className="mt-4 flex flex-col gap-4 rounded-3xl bg-[#191c24] p-5 border border-gray-800">
        <div>
          <label className="text-xs font-semibold text-gray-300">Quantas páginas você leu?</label>
          <div className="relative mt-1.5">
            <input
              type="number"
              min="0"
              placeholder="Ex: 15"
              value={pagesRead}
              onChange={(e) => setPagesRead(e.target.value)}
              className="w-full rounded-2xl bg-[#232834] px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-teal-400 pl-10"
            />
            <FileText size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-300">Insight ou reflexão (opcional)</label>
            <Sparkles size={14} className="text-teal-400" />
          </div>
          <textarea
            rows={3}
            placeholder="Qual pensamento ou passagem te marcou nesta sessão?"
            value={insight}
            onChange={(e) => setInsight(e.target.value)}
            className="mt-1.5 w-full rounded-2xl bg-[#232834] p-3.5 text-xs text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-teal-400 border border-transparent resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* 6. Botão Finalizar */}
      <button
        type="button"
        onClick={handleFinishSession}
        disabled={submitting}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 py-4 text-xs font-black text-gray-950 shadow-xl shadow-teal-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Loader2 size={16} className="animate-spin text-gray-950" />
            <span>SALVANDO REGISTRO...</span>
          </>
        ) : (
          <>
            <CheckCircle2 size={16} />
            <span>CONCLUIR SESSÃO & RECEBER TOKENS</span>
          </>
        )}
      </button>
    </div>
  );
}

export default function ReadingSessionPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-gray-500">Carregando...</div>}>
      <ReadingSessionContent />
    </Suspense>
  );
}