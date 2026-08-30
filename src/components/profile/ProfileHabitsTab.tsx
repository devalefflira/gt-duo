'use client';

import { Habit } from '@/core/habits/types';
import { Dumbbell } from 'lucide-react';

interface ProfileHabitsTabProps {
  habits: Habit[];
}

export function ProfileHabitsTab({ habits }: ProfileHabitsTabProps) {
  if (habits.length === 0) {
    return <div className="py-12 text-center text-xs text-gray-500">Nenhum hábito cadastrado ainda.</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-2.5">
      {habits.map((h) => (
        <div
          key={h.id}
          className="flex items-center justify-between rounded-2xl bg-[#1a1e27] p-3.5 border border-gray-800/60"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Dumbbell size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">{h.title}</h4>
              <p className="text-[10px] text-gray-400 capitalize">
                {h.period === 'morning' ? 'Manhã' : h.period === 'afternoon' ? 'Tarde' : 'Noite'} • {h.scope}
              </p>
            </div>
          </div>
          {h.target_duration_minutes && (
            <span className="text-[11px] font-semibold text-gray-400">
              {h.target_duration_minutes} min
            </span>
          )}
        </div>
      ))}
    </div>
  );
}