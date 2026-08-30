'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Bell, 
  UserPlus, 
  Link2, 
  Check, 
  X, 
  HeartHandshake,
  Trash2,
  Users
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface NotificationItem {
  id: string;
  sender_id: string;
  recipient_id: string;
  type: 'partner_invite' | 'follow_request' | 'follow_accepted' | 'partner_accepted' | 'bond_request' | 'bond_accepted';
  status: 'pending' | 'accepted' | 'rejected' | 'read';
  metadata?: any;
  created_at: string;
  sender: {
    id: string;
    full_name: string;
    username: string;
    avatar_url?: string | null;
  };
}

export default function NotificationsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*, sender:profiles!notifications_sender_id_fkey(id, full_name, username, avatar_url)')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setNotifications(data as NotificationItem[]);
    }
    setLoading(false);
  };

  const handleClearAll = async () => {
    if (notifications.length === 0) return;
    setClearing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('notifications').delete().eq('recipient_id', user.id);
    setNotifications([]);
    setClearing(false);
  };

  const handleAccept = async (notification: NotificationItem) => {
    setProcessingId(notification.id);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (notification.type === 'bond_request') {
      const bondId = notification.metadata?.bond_id;
      if (bondId) {
        await supabase.rpc('accept_bond', { bond_id_param: bondId });
      }
    } else if (notification.type === 'partner_invite') {
      await supabase.rpc('accept_partner_invite', {
        sender_user_id: notification.sender_id,
      });

      await supabase.from('notifications').insert({
        recipient_id: notification.sender_id,
        sender_id: user.id,
        type: 'partner_accepted',
        status: 'read',
      });
    } else if (notification.type === 'follow_request') {
      await supabase
        .from('follows')
        .update({ status: 'accepted' })
        .eq('follower_id', notification.sender_id)
        .eq('following_id', user.id);

      await supabase.from('notifications').insert({
        recipient_id: notification.sender_id,
        sender_id: user.id,
        type: 'follow_accepted',
        status: 'read',
      });
    }

    await supabase
      .from('notifications')
      .update({ status: 'accepted' })
      .eq('id', notification.id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, status: 'accepted' } : n))
    );
    setProcessingId(null);
  };

  const handleReject = async (notification: NotificationItem) => {
    setProcessingId(notification.id);

    if (notification.type === 'bond_request') {
      const bondId = notification.metadata?.bond_id;
      if (bondId) {
        await supabase.from('bonds').delete().eq('id', bondId);
      }
    } else if (notification.type === 'follow_request') {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', notification.sender_id)
        .eq('following_id', notification.recipient_id);
    }

    await supabase
      .from('notifications')
      .update({ status: 'rejected' })
      .eq('id', notification.id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, status: 'rejected' } : n))
    );
    setProcessingId(null);
  };

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-[#121418] px-5 py-6 text-white pb-28">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Voltar</span>
        </button>

        <h1 className="text-base font-bold">Notificações</h1>

        {notifications.length > 0 ? (
          <button
            onClick={handleClearAll}
            disabled={clearing}
            className="flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
          >
            <Trash2 size={14} />
            <span>{clearing ? 'Limpando...' : 'Limpar'}</span>
          </button>
        ) : (
          <div className="w-12" />
        )}
      </div>

      {/* Lista de Notificações */}
      <div className="mt-6 flex flex-col gap-3">
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-500">Carregando notificações...</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#191c24] text-gray-500 mb-3 border border-gray-800">
              <Bell size={26} />
            </div>
            <h3 className="text-sm font-bold text-gray-300">Tudo limpo por aqui</h3>
            <p className="mt-1 text-xs text-gray-500 max-w-[240px]">Nenhuma notificação recente pendente.</p>
          </div>
        ) : (
          notifications.map((item) => {
            const isPending = item.status === 'pending';
            const isProcessing = processingId === item.id;
            const timeAgo = formatDistanceToNow(new Date(item.created_at), {
              addSuffix: true,
              locale: ptBR,
            });

            return (
              <div
                key={item.id}
                className={cn(
                  'flex flex-col gap-3 rounded-2xl p-4 transition-all border',
                  isPending
                    ? 'bg-[#191c24] border-gray-800/80 shadow-md'
                    : 'bg-[#161920]/60 border-gray-800/40 opacity-75'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shrink-0">
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-[#161920] font-bold text-sm text-blue-400">
                        {item.sender?.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold leading-snug">
                        <span className="font-bold text-white">{item.sender?.full_name || 'Usuário'}</span>{' '}
                        <span className="text-gray-400">(@{item.sender?.username})</span>
                      </p>

                      <div className="text-[11px] text-gray-300 mt-0.5">
                        {item.type === 'bond_request' && (
                          <span className="flex items-center gap-1 text-blue-400 font-medium">
                            <Link2 size={13} /> Solicitou vínculo de{' '}
                            <strong className="text-white font-bold">{item.metadata?.subtype || 'Conexão'}</strong>
                          </span>
                        )}
                        {item.type === 'bond_accepted' && (
                          <span className="flex items-center gap-1 text-green-400 font-medium">
                            <Users size={13} /> Aceitou seu vínculo de{' '}
                            <strong>{item.metadata?.subtype || 'Conexão'}</strong> e começou a te seguir!
                          </span>
                        )}
                        {item.type === 'follow_request' && (
                          <span className="flex items-center gap-1 text-gray-300 font-medium">
                            <UserPlus size={12} className="text-blue-400" /> Solicitou para te seguir
                          </span>
                        )}
                        {item.type === 'follow_accepted' && (
                          <span className="flex items-center gap-1 text-green-400 font-medium">
                            <Check size={12} /> Aceitou sua solicitação para seguir
                          </span>
                        )}
                      </div>

                      <span className="mt-1 block text-[10px] text-gray-500">{timeAgo}</span>
                    </div>
                  </div>
                </div>

                {isPending && (
                  <div className="mt-1 flex items-center gap-2 pt-2 border-t border-gray-800/60">
                    <button
                      onClick={() => handleAccept(item)}
                      disabled={isProcessing}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Check size={14} strokeWidth={2.5} />
                      <span>{isProcessing ? 'Processando...' : 'Aceitar Vínculo'}</span>
                    </button>

                    <button
                      onClick={() => handleReject(item)}
                      disabled={isProcessing}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#232834] py-2 text-xs font-bold text-gray-300 hover:bg-gray-800 hover:text-white active:scale-95 transition-all disabled:opacity-50"
                    >
                      <X size={14} />
                      <span>Recusar</span>
                    </button>
                  </div>
                )}

                {!isPending && item.status === 'accepted' && (
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                      <Check size={11} strokeWidth={3} /> Vínculo Ativo
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}