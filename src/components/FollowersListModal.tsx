'use client';

import { useState, useEffect } from 'react';
import { X, Search, UserMinus, UserCheck, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface FollowersListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialTab: 'followers' | 'following';
}

interface FollowUser {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string | null;
  bio?: string | null;
}

export function FollowersListModal({
  isOpen,
  onClose,
  userId,
  initialTab,
}: FollowersListModalProps) {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [list, setList] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const supabase = createClient();

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (isOpen) {
      loadList();
    }
  }, [isOpen, activeTab]);

  const loadList = async () => {
    setLoading(true);
    setSearchTerm('');

    if (activeTab === 'followers') {
      // Pessoas que seguem este usuário
      const { data } = await supabase
        .from('follows')
        .select('follower:profiles!follows_follower_id_fkey(id, full_name, username, avatar_url, bio)')
        .eq('following_id', userId)
        .eq('status', 'accepted');

      if (data) {
        const users = data.map((item: any) => item.follower).filter(Boolean);
        setList(users);
      }
    } else {
      // Pessoas que este usuário está seguindo
      const { data } = await supabase
        .from('follows')
        .select('following:profiles!follows_following_id_fkey(id, full_name, username, avatar_url, bio)')
        .eq('follower_id', userId)
        .eq('status', 'accepted');

      if (data) {
        const users = data.map((item: any) => item.following).filter(Boolean);
        setList(users);
      }
    }

    setLoading(false);
  };

  const handleUnfollow = async (targetId: string) => {
    await supabase
      .from('follows')
      .delete()
      .eq('follower_id', userId)
      .eq('following_id', targetId);

    setList((prev) => prev.filter((u) => u.id !== targetId));
  };

  const handleRemoveFollower = async (targetId: string) => {
    await supabase
      .from('follows')
      .delete()
      .eq('follower_id', targetId)
      .eq('following_id', userId);

    setList((prev) => prev.filter((u) => u.id !== targetId));
  };

  if (!isOpen) return null;

  const filteredList = list.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4 backdrop-blur-sm">
      <div className="flex h-[80dvh] w-full max-w-md flex-col rounded-t-3xl bg-[#1a1e27] text-white shadow-2xl sm:rounded-3xl border border-gray-800">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('followers')}
              className={cn(
                'text-sm font-bold transition-all border-b-2 pb-1',
                activeTab === 'followers'
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              )}
            >
              Seguidores
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={cn(
                'text-sm font-bold transition-all border-b-2 pb-1',
                activeTab === 'following'
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              )}
            >
              Seguindo
            </button>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>

        {/* Busca interna */}
        <div className="px-6 pt-4 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl bg-[#232834] py-2.5 pl-9 pr-4 text-xs text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-gray-500">Carregando lista...</div>
          ) : filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users size={32} className="text-gray-600 mb-2" />
              <p className="text-xs text-gray-400">
                {activeTab === 'followers'
                  ? 'Nenhum seguidor encontrado.'
                  : 'Você ainda não segue ninguém.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredList.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-2xl bg-[#232834] p-3 border border-gray-800/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shrink-0">
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-[#161920] font-bold text-xs text-blue-400">
                        {user.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">{user.full_name}</h4>
                      <p className="text-[11px] font-medium text-blue-400">@{user.username}</p>
                    </div>
                  </div>

                  {activeTab === 'following' ? (
                    <button
                      onClick={() => handleUnfollow(user.id)}
                      className="flex items-center gap-1 rounded-xl bg-red-500/10 px-3 py-1.5 text-[11px] font-bold text-red-400 border border-red-500/20 hover:bg-red-500/20 active:scale-95 transition-all"
                    >
                      <UserMinus size={13} />
                      <span>Deixar de seguir</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRemoveFollower(user.id)}
                      className="flex items-center gap-1 rounded-xl bg-gray-700/50 px-3 py-1.5 text-[11px] font-bold text-gray-300 hover:bg-gray-700 active:scale-95 transition-all"
                    >
                      <span>Remover</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}