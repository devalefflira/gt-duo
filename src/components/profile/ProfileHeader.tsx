'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  Lock, 
  Menu, 
  X, 
  MessageSquare, 
  CalendarPlus, 
  BarChart2, 
  FileText, 
  LogOut 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ProfileHeaderProps {
  username: string;
  isPrivate: boolean;
  unreadNotifications: number;
}

export function ProfileHeader({ username, isPrivate, unreadNotifications }: ProfileHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between py-2">
        <button 
          onClick={() => router.push('/notifications')}
          className="relative rounded-full p-2 text-gray-300 hover:bg-gray-800 transition-colors"
        >
          <Bell size={21} />
          {unreadNotifications > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
              {unreadNotifications}
            </span>
          )}
        </button>

        <div className="flex items-center gap-1.5 text-base font-bold tracking-tight">
          {isPrivate && <Lock size={15} className="text-gray-400" />}
          <span>@{username || 'usuario'}</span>
        </div>

        <button 
          onClick={() => setShowMenu(!showMenu)}
          className="rounded-full p-2 text-gray-300 hover:bg-gray-800 transition-colors"
        >
          {showMenu ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {showMenu && (
        <div className="mt-2 flex flex-col gap-1 rounded-3xl bg-[#1d222d] p-3 shadow-2xl border border-gray-800 animate-in fade-in slide-in-from-top-2">
          {[
            { label: 'Enviar Mensagem', icon: MessageSquare, route: '/messages' },
            { label: 'Criar Evento', icon: CalendarPlus, route: '/events/create' },
            { label: 'Criar Enquete', icon: BarChart2, route: '/polls/create' },
            { label: 'Publicações', icon: FileText, route: '/posts' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => {
                  setShowMenu(false);
                  router.push(item.route);
                }}
                className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-semibold text-gray-300 hover:bg-[#252a36] hover:text-white transition-all text-left"
              >
                <Icon size={16} className="text-blue-400" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="my-1 border-t border-gray-800" />

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors text-left"
          >
            <LogOut size={16} />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      )}
    </div>
  );
}