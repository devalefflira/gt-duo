'use client';

import { HabitLog } from '@/core/habits/types';
import { CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProfileTimelineTabProps {
  logs: (HabitLog & { habit_title?: string })[];
}

export function ProfileTimelineTab({ logs }: ProfileTimelineTabProps) {
  if (logs.length === 0) {
    return <div className="py-12 text-center text-xs text-gray-500">Nenhum check-in recente registrado.</div>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-center justify-between rounded-2xl bg-[#1a1e27] p-3.5 border border-gray-800/60"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 size={18} className="text-green-500" />
            <div>
              <h4 className="text-xs font-bold text-white">{log.habit_title}</h4>
              <p className="text-[10px] text-gray-400">
                {format(new Date(log.completed_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-[10px] font-bold text-green-400">
            Concluído
          </span>
        </div>
      ))}
    </div>
  );
}