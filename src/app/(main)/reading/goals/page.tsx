'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Target, 
  Save, 
  Loader2,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function ReadingGoalsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [dailyType, setDailyType] = useState<'duration' | 'pages'>('duration');
  const [dailyTarget, setDailyTarget] = useState(30);

  const [weeklyType, setWeeklyType] = useState<'duration' | 'pages'>('duration');
  const [weeklyTarget, setWeeklyTarget] = useState(360);

  const [monthlyType, setMonthlyType] = useState<'duration' | 'pages' | 'books'>('books');
  const [monthlyTarget, setMonthlyTarget] = useState(2);

  const [yearlyBooksTarget, setYearlyBooksTarget] = useState(12);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data } = await supabase
      .from('reading_goals')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setDailyType(data.daily_type || 'duration');
      setDailyTarget(data.daily_target || 30);
      setWeeklyType(data.weekly_type || 'duration');
      setWeeklyTarget(data.weekly_target || 360);
      setMonthlyType(data.monthly_type || 'books');
      setMonthlyTarget(data.monthly_target || 2);
      setYearlyBooksTarget(data.yearly_books_target || 12);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      daily_type: dailyType,
      daily_target: Number(dailyTarget) || 1,
      weekly_type: weeklyType,
      weekly_target: Number(weeklyTarget) || 1,
      monthly_type: monthlyType,
      monthly_target: Number(monthlyTarget) || 1,
      yearly_books_target: Number(yearlyBooksTarget) || 1,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('reading_goals')
      .upsert(payload, { onConflict: 'user_id' });

    setSaving(false);
    if (!error) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/reading');
        router.refresh();
      }, 700);
    } else {
      alert('Erro ao salvar metas. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#121418] text-xs text-gray-500">
        Carregando preferências...
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-[#121418] px-5 py-6 text-white pb-36">
      {/* Header Fixo */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Voltar</span>
        </button>
        <div className="flex items-center gap-2">
          <Target size={18} className="text-teal-400" />
          <h1 className="text-sm font-black">Metas de Leitura</h1>
        </div>
        <div className="w-10" />
      </div>

      {/* Formulário com espaçamento seguro */}
      <div className="mt-6 flex flex-col gap-4">
        {/* 1. Meta Diária */}
        <div className="rounded-2xl bg-[#191c24] p-4 border border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-200">Meta Diária</span>
            <div className="flex rounded-xl bg-[#121418] p-1 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setDailyType('duration')}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-all',
                  dailyType === 'duration' ? 'bg-teal-400 text-gray-950 font-black' : 'text-gray-400'
                )}
              >
                Minutos
              </button>
              <button
                type="button"
                onClick={() => setDailyType('pages')}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-all',
                  dailyType === 'pages' ? 'bg-teal-400 text-gray-950 font-black' : 'text-gray-400'
                )}
              >
                Páginas
              </button>
            </div>
          </div>
          <input
            type="number"
            min="1"
            value={dailyTarget}
            onChange={(e) => setDailyTarget(Number(e.target.value))}
            placeholder={dailyType === 'duration' ? 'Ex: 30 minutos' : 'Ex: 15 páginas'}
            className="mt-3 w-full rounded-xl bg-[#121418] px-4 py-3 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-teal-400 border border-gray-800"
          />
        </div>

        {/* 2. Meta Semanal */}
        <div className="rounded-2xl bg-[#191c24] p-4 border border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-200">Meta Semanal</span>
            <div className="flex rounded-xl bg-[#121418] p-1 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setWeeklyType('duration')}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-all',
                  weeklyType === 'duration' ? 'bg-teal-400 text-gray-950 font-black' : 'text-gray-400'
                )}
              >
                Minutos
              </button>
              <button
                type="button"
                onClick={() => setWeeklyType('pages')}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-all',
                  weeklyType === 'pages' ? 'bg-teal-400 text-gray-950 font-black' : 'text-gray-400'
                )}
              >
                Páginas
              </button>
            </div>
          </div>
          <input
            type="number"
            min="1"
            value={weeklyTarget}
            onChange={(e) => setWeeklyTarget(Number(e.target.value))}
            placeholder={weeklyType === 'duration' ? 'Ex: 360 minutos' : 'Ex: 100 páginas'}
            className="mt-3 w-full rounded-xl bg-[#121418] px-4 py-3 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-teal-400 border border-gray-800"
          />
        </div>

        {/* 3. Meta Mensal */}
        <div className="rounded-2xl bg-[#191c24] p-4 border border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-200">Meta Mensal</span>
            <div className="flex rounded-xl bg-[#121418] p-1 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setMonthlyType('books')}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg transition-all',
                  monthlyType === 'books' ? 'bg-teal-400 text-gray-950 font-black' : 'text-gray-400'
                )}
              >
                Livros
              </button>
              <button
                type="button"
                onClick={() => setMonthlyType('pages')}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg transition-all',
                  monthlyType === 'pages' ? 'bg-teal-400 text-gray-950 font-black' : 'text-gray-400'
                )}
              >
                Páginas
              </button>
              <button
                type="button"
                onClick={() => setMonthlyType('duration')}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg transition-all',
                  monthlyType === 'duration' ? 'bg-teal-400 text-gray-950 font-black' : 'text-gray-400'
                )}
              >
                Minutos
              </button>
            </div>
          </div>
          <input
            type="number"
            min="1"
            value={monthlyTarget}
            onChange={(e) => setMonthlyTarget(Number(e.target.value))}
            placeholder="Valor da meta mensal"
            className="mt-3 w-full rounded-xl bg-[#121418] px-4 py-3 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-teal-400 border border-gray-800"
          />
        </div>

        {/* 4. Meta Anual */}
        <div className="rounded-2xl bg-[#191c24] p-4 border border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-200">Meta Anual</span>
            <span className="text-[10px] font-semibold text-teal-400">Total de Livros</span>
          </div>
          <input
            type="number"
            min="1"
            value={yearlyBooksTarget}
            onChange={(e) => setYearlyBooksTarget(Number(e.target.value))}
            placeholder="Ex: 12 livros ao ano"
            className="mt-3 w-full rounded-xl bg-[#121418] px-4 py-3 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-teal-400 border border-gray-800"
          />
        </div>

        {/* Botão Salvar */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 py-4 text-xs font-black text-gray-950 shadow-xl shadow-teal-500/20 active:scale-98 transition-all disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin text-gray-950" />
              <span>SALVANDO METAS...</span>
            </>
          ) : success ? (
            <>
              <CheckCircle2 size={16} className="text-gray-950" />
              <span>METAS ATUALIZADAS!</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>SALVAR METAS</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}