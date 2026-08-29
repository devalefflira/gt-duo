'use client';

import { useState } from 'react';
import { X, Search, Link2, UserPlus, Check, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'partner' | 'follow'; // Modo Casal ou Modo Amizade/Seguir
}

interface SearchedUser {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string | null;
  bio?: string | null;
}

export function UserSearchModal({ isOpen, onClose, mode }: UserSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionDoneMap, setActionDoneMap] = useState<Record<string, boolean>>({});
  const supabase = createClient();

  if (!isOpen) return null;

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    const clean = term.replace(/[@\s]/g, '').toLowerCase();

    if (clean.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, bio')
      .neq('id', user?.id || '')
      .ilike('username', `%${clean}%`)
      .limit(10);

    setResults(data || []);
    setLoading(false);
  };

  const handleSendAction = async (targetUser: SearchedUser) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (mode === 'partner') {
      // 1. Enviar notificação de convite de casal
      await supabase.from('notifications').insert({
        recipient_id: targetUser.id,
        sender_id: user.id,
        type: 'partner_invite',
        status: 'pending',
      });
    } else {
      // 2. Criar solicitação de seguir na tabela follows
      await supabase.from('follows').insert({
        follower_id: user.id,
        following_id: targetUser.id,
        status: 'pending',
      });

      // 3. Enviar notificação de solicitação para o outro usuário
      await supabase.from('notifications').insert({
        recipient_id: targetUser.id,
        sender_id: user.id,
        type: 'follow_request',
        status: 'pending',
      });
    }

    setActionDoneMap((prev) => ({ ...prev, [targetUser.id]: true }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4 backdrop-blur-sm">
      <div className="flex h-[80dvh] w-full max-w-md flex-col rounded-t-3xl bg-[#1a1e27] text-white shadow-2xl sm:rounded-3xl border border-gray-800">
        
        {/* Header do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h3 className="text-base font-bold">
              {mode === 'partner' ? 'Conectar Parceiro(a)' : 'Encontrar Pessoas'}
            </h3>
            <p className="text-[11px] text-gray-400">
              {mode === 'partner' 
                ? 'Busque pelo @ e envie o convite de vínculo Duo' 
                : 'Encontre amigos e comece a seguir'}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>

        {/* Barra de Busca com @ */}
        <div className="px-6 pt-4">
          <div className="relative">
            <span className="absolute left-3.5 top-3 text-sm font-bold text-gray-400">@</span>
            <input
              type="text"
              autoFocus
              placeholder="Digite o nome de usuário..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-2xl bg-[#232834] py-3 pl-8 pr-4 text-xs text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Resultados */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="py-8 text-center text-xs text-gray-500">Buscando na rede...</div>
          ) : results.length === 0 && searchTerm.trim().length >= 2 ? (
            <div className="py-8 text-center text-xs text-gray-500">Nenhum usuário encontrado com esse @.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {results.map((target) => {
                const isSent = actionDoneMap[target.id];

                return (
                  <div
                    key={target.id}
                    className="flex items-center justify-between rounded-2xl bg-[#232834] p-3.5 border border-gray-800/60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/20 font-bold text-sm text-blue-400 border border-blue-500/30">
                        {target.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{target.full_name}</h4>
                        <p className="text-[11px] font-medium text-blue-400">@{target.username}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSendAction(target)}
                      disabled={isSent}
                      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                        isSent
                          ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                          : 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95 shadow-md shadow-blue-600/20'
                      }`}
                    >
                      {isSent ? (
                        <>
                          <Check size={14} strokeWidth={3} />
                          <span>Enviado</span>
                        </>
                      ) : mode === 'partner' ? (
                        <>
                          <Link2 size={14} />
                          <span>Conectar</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} />
                          <span>Seguir</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}