'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Clock, 
  BookOpen, 
  Mic, 
  ArrowRight,
  Coins,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

function SessionCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const timeStr = searchParams.get('timeStr') || '30min';
  const pages = searchParams.get('pages') || '10';
  const insightsCount = searchParams.get('insightsCount') || '1';
  const mainInsight = searchParams.get('mainInsight') || 'A constância diária transforma pequenos passos em grandes conquistas intelectuais.';
  const tokens = searchParams.get('tokens') || '25';

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-between bg-[#121418] px-5 py-8 text-white pb-16">
      {/* 1. Header & Título */}
      <div className="flex flex-col items-center text-center mt-2">
        <h1 className="text-2xl font-black tracking-tight text-sky-400">GT Leituras</h1>
        <h2 className="mt-1 text-xl font-black text-white">Sessão Completa!</h2>
        <p className="mt-0.5 text-xs text-gray-400">Confira seu desempenho</p>
      </div>

      {/* 2. Conteúdo Central */}
      <div className="my-6 flex flex-col gap-4">
        {/* 3 Cards de Métricas Superiores */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Tempo */}
          <div className="flex flex-col items-center justify-center rounded-3xl bg-[#191c24] p-4 text-center border border-gray-800/80 shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#232834] text-sky-400 mb-2">
              <Clock size={18} />
            </div>
            <span className="text-base font-black text-white">{timeStr}</span>
            <span className="text-[10px] font-semibold text-gray-400">Tempo</span>
          </div>

          {/* Páginas */}
          <div className="flex flex-col items-center justify-center rounded-3xl bg-[#191c24] p-4 text-center border border-gray-800/80 shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#232834] text-emerald-400 mb-2">
              <BookOpen size={18} />
            </div>
            <span className="text-base font-black text-white">{pages}</span>
            <span className="text-[10px] font-semibold text-gray-400">Páginas</span>
          </div>

          {/* Insights */}
          <div className="flex flex-col items-center justify-center rounded-3xl bg-[#191c24] p-4 text-center border border-gray-800/80 shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#232834] text-teal-400 mb-2">
              <Mic size={18} />
            </div>
            <span className="text-base font-black text-white">{insightsCount}</span>
            <span className="text-[10px] font-semibold text-gray-400">Insights</span>
          </div>
        </div>

        {/* Card Destaque: Insight Principal */}
        <div className="relative rounded-3xl bg-[#191c24] p-5 border border-teal-500/40 shadow-xl shadow-teal-500/5">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-teal-400">
            <Sparkles size={14} />
            <span>Insight principal:</span>
          </div>

          <p className="mt-2.5 text-xs font-medium leading-relaxed text-gray-200">
            {mainInsight}
          </p>
        </div>

        {/* Card: Tokens / GTCoins Ganhos */}
        <div className="flex flex-col items-center justify-center rounded-3xl bg-[#191c24] p-6 text-center border border-gray-800/80 shadow-lg">
          <span className="text-xs font-semibold text-gray-400">Tokens Ganhos</span>

          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-3xl font-black text-white">+{tokens}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Coins size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Botão Concluir */}
      <button
        onClick={() => router.push('/reading')}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 py-4 text-xs font-extrabold text-gray-950 shadow-xl shadow-teal-500/20 active:scale-95 transition-all"
      >
        <span>Concluir</span>
        <ArrowRight size={16} strokeWidth={2.5} />
      </button>
    </div>
  );
}

export default function SessionCompletePage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-gray-500">Carregando resumo...</div>}>
      <SessionCompleteContent />
    </Suspense>
  );
}