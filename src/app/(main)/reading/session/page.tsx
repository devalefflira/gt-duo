'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ChevronLeft, 
  Play, 
  Pause, 
  Square, 
  BookOpen, 
  Sparkles, 
  Clock, 
  FileText,
  Loader2 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Book } from '@/core/reading/types';
import { cn } from '@/lib/utils';

function ReadingSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookId = searchParams.get('bookId');
  const supabase = createClient();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  // Timer States
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Form Inputs pós/durante sessão
  const [pagesRead, setPagesRead] = useState('10');
  const [insight, setInsight] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadBook();
  }, [bookId]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

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
      // Buscar primeiro livro em andamento
      const { data } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'reading')
        .limit(1)
        .maybeSingle();
      if (data) setBook(data as Book);
    }
    setLoading(false);
  };

  const formatTime = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const remainingSeconds = sec % 60;

    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m ${remainingSeconds.toString().padStart(2, '0')}s`;
    }
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleFinishSession = async () => {
    if (!book) return;
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const durationMinutes = Math.max(1, Math.round(seconds / 60));
    const parsedPages = parseInt(pagesRead, 10) || 1;
    
    // Cálculo de Tokens / GTCoins (1 por minuto + bônus de páginas)
    const tokensEarned = Math.max(5, durationMinutes + Math.floor(parsedPages / 2));

    try {
      const { data: session, error } = await supabase
        .from('reading_sessions')
        .insert({
          user_id: user.id,
          book_id: book.id,
          duration_minutes: durationMinutes,
          pages_read: parsedPages,
          main_insight: insight.trim() || null,
          tokens_earned: tokensEarned,
        })
        .select()
        .single();

      if (error) throw error;

      // Redirecionar para a tela de Sessão Completa com os parâmetros
      const queryParams = new URLSearchParams({
        timeStr: durationMinutes >= 60 ? `${Math.floor(durationMinutes / 60)}h${durationMinutes % 60}` : `${durationMinutes}min`,
        pages: parsedPages.toString(),
        insightsCount: insight.trim() ? '1' : '0',
        mainInsight: insight.trim(),
        tokens: tokensEarned.toString(),
      });

      router.push(`/reading/session/complete?${queryParams.toString()}`);
    } catch (err) {
      console.error('Erro ao salvar sessão de leitura:', err);
      alert('Não foi possível salvar a sessão. Tente novamente.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#121418] text-xs text-gray-500">
        Preparando sessão de leitura...
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-[#121418] px-5 py-6 text-white pb-32">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Voltar</span>
        </button>
        <h1 className="text-base font-bold">Sessão de Leitura</h1>
        <div className="w-8" />
      </div>

      {/* Livro Atual */}
      {book && (
        <div className="mt-5 flex items-center gap-3.5 rounded-3xl bg-[#191c24] p-4 border border-gray-800/80">
          <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded-xl bg-[#232834] overflow-hidden border border-gray-800">
            {book.cover_url ? (
              <img src={book.cover_url} alt={book.title} className="h-full w-full object-cover" />
            ) : (
              <BookOpen size={18} className="text-gray-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-white truncate">{book.title}</h3>
            <p className="text-xs text-gray-400 truncate">{book.author}</p>
            <span className="mt-1 inline-block text-[10px] font-semibold text-emerald-400">
              Página atual: {book.current_page} de {book.total_pages}
            </span>
          </div>
        </div>
      )}

      {/* Cronômetro Central */}
      <div className="mt-8 flex flex-col items-center justify-center rounded-3xl bg-[#191c24] p-8 border border-gray-800/60 shadow-xl">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-teal-400">
          Tempo de Foco
        </span>

        <div className="mt-3 font-mono text-4xl font-black tracking-tight text-white">
          {formatTime(seconds)}
        </div>

        {/* Controles do Timer */}
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={() => setIsActive(!isActive)}
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-full text-gray-950 shadow-lg transition-transform active:scale-95',
              isActive
                ? 'bg-amber-400 shadow-amber-400/20'
                : 'bg-emerald-400 shadow-emerald-400/20'
            )}
          >
            {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
          </button>
        </div>
      </div>

      {/* Registro de Páginas e Insight */}
      <div className="mt-6 flex flex-col gap-4 rounded-3xl bg-[#191c24] p-5 border border-gray-800/60">
        <div>
          <label className="text-xs font-semibold text-gray-300">Quantas páginas você leu?</label>
          <div className="relative mt-1.5">
            <input
              type="number"
              min="1"
              value={pagesRead}
              onChange={(e) => setPagesRead(e.target.value)}
              className="w-full rounded-2xl bg-[#232834] px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-teal-400 pl-10"
            />
            <FileText size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-300">Insight Principal da Sessão</label>
            <Sparkles size={14} className="text-teal-400" />
          </div>
          <textarea
            rows={3}
            placeholder="Qual foi a ideia ou ensinamento mais marcante dessa leitura?"
            value={insight}
            onChange={(e) => setInsight(e.target.value)}
            className="mt-1.5 w-full rounded-2xl bg-[#232834] p-3.5 text-xs text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-teal-400 border border-transparent resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* Botão Concluir Sessão */}
      <button
        onClick={handleFinishSession}
        disabled={submitting}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 py-4 text-xs font-black text-gray-950 shadow-xl shadow-teal-500/20 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Loader2 size={16} className="animate-spin text-gray-950" />
            <span>FINALIZANDO SESSÃO...</span>
          </>
        ) : (
          <>
            <Square size={14} fill="currentColor" />
            <span>FINALIZAR LEITURA & COLETAR TOKENS</span>
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