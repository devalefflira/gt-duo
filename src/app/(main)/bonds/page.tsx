'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Plus, 
  Link2, 
  Heart, 
  Users, 
  Home, 
  Trash2, 
  Sparkles,
  UserCheck
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface BondItem {
  id: string;
  category: 'amizade' | 'afetivo' | 'parentesco';
  subtype: string;
  status: 'pending' | 'accepted';
  partner: {
    id: string;
    full_name: string;
    username: string;
    avatar_url?: string | null;
  };
}

export default function BondsListPage() {
  const router = useRouter();
  const supabase = createClient();

  const [bonds, setBonds] = useState<BondItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'amizade' | 'afetivo' | 'parentesco'>('all');

  useEffect(() => {
    loadBonds();
  }, []);

  const loadBonds = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('bonds')
      .select(`
        id,
        category,
        subtype,
        status,
        requester_id,
        recipient_id,
        requester:profiles!bonds_requester_id_fkey(id, full_name, username, avatar_url),
        recipient:profiles!bonds_recipient_id_fkey(id, full_name, username, avatar_url)
      `)
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const formatted: BondItem[] = data.map((item: any) => {
        const isRequester = item.requester_id === user.id;
        const partner = isRequester ? item.recipient : item.requester;
        return {
          id: item.id,
          category: item.category,
          subtype: item.subtype,
          status: item.status,
          partner,
        };
      });
      setBonds(formatted);
    }

    setLoading(false);
  };

  const handleRemoveBond = async (bondId: string) => {
    if (!confirm('Deseja realmente desfazer este vínculo?')) return;
    await supabase.from('bonds').delete().eq('id', bondId);
    setBonds((prev) => prev.filter((b) => b.id !== bondId));
  };

  const filteredBonds = bonds.filter((b) => {
    if (activeFilter === 'all') return true;
    return b.category === activeFilter;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'afetivo':
        return <Heart size={14} className="text-pink-400" />;
      case 'parentesco':
        return <Home size={14} className="text-emerald-400" />;
      default:
        return <Users size={14} className="text-blue-400" />;
    }
  };

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-[#121418] px-5 py-6 text-white pb-32">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <button
          onClick={() => router.push('/profile')}
          className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Perfil</span>
        </button>

        <h1 className="text-base font-bold">Meus Vínculos</h1>

        <button
          onClick={() => router.push('/bonds/new')}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-md shadow-blue-600/30 active:scale-95 transition-all"
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Botão de Destaque para Solicitar */}
      <div className="mt-5">
        <button
          onClick={() => router.push('/bonds/new')}
          className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 p-4 border border-blue-500/30 hover:border-blue-500/50 transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
              <Link2 size={20} />
            </div>
            <div className="text-left">
              <h3 className="text-xs font-bold text-white">Solicitar Novo Vínculo</h3>
              <p className="text-[11px] text-gray-400">Conecte amigos, afetos ou parentes</p>
            </div>
          </div>
          <Plus size={18} className="text-blue-400" />
        </button>
      </div>

      {/* Filtros por Categoria */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'all', label: 'Todos' },
          { id: 'amizade', label: 'Amizades' },
          { id: 'afetivo', label: 'Afetivos' },
          { id: 'parentesco', label: 'Parentesco' },
        ].map((f) => {
          const isSelected = activeFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              className={cn(
                'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap',
                isSelected
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-[#1e222b] text-gray-400 hover:text-white'
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Lista de Vínculos */}
      <div className="mt-4 flex flex-col gap-3">
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-500">Carregando vínculos...</div>
        ) : filteredBonds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#191c24] text-gray-600 mb-3 border border-gray-800">
              <Link2 size={26} />
            </div>
            <h3 className="text-sm font-bold text-gray-300">Nenhum vínculo ativo</h3>
            <p className="mt-1 text-xs text-gray-500 max-w-[240px]">
              Envie solicitações para conectar pessoas e compartilhar desafios Duo ou em Grupo.
            </p>
          </div>
        ) : (
          filteredBonds.map((bond) => (
            <div
              key={bond.id}
              className="flex items-center justify-between rounded-2xl bg-[#191c24] p-3.5 border border-gray-800/60 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shrink-0">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-[#161920] font-bold text-sm text-blue-400">
                    {bond.partner?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white">{bond.partner?.full_name}</h4>
                  <p className="text-[11px] font-medium text-blue-400">@{bond.partner?.username}</p>
                  
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="flex items-center gap-1 rounded-md bg-[#232834] px-2 py-0.5 text-[10px] font-semibold text-gray-300">
                      {getCategoryIcon(bond.category)}
                      <span>{bond.subtype}</span>
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleRemoveBond(bond.id)}
                className="rounded-xl p-2.5 text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                title="Desfazer vínculo"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}