'use client';

import { Sparkles, Flame, Trophy } from 'lucide-react';

export function ProfileAchievementsTab() {
  return (
    <div className="grid grid-cols-3 gap-3 pt-2">
      <div className="flex flex-col items-center rounded-2xl bg-[#1a1e27] p-4 text-center border border-gray-800">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-400 mb-2">
          <Sparkles size={24} />
        </div>
        <h5 className="text-[11px] font-bold">1º Passo</h5>
        <p className="mt-0.5 text-[9px] text-gray-400">1º check-in</p>
      </div>

      <div className="flex flex-col items-center rounded-2xl bg-[#1a1e27] p-4 text-center border border-gray-800">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10 text-orange-400 mb-2">
          <Flame size={24} />
        </div>
        <h5 className="text-[11px] font-bold">7 Dias Foco</h5>
        <p className="mt-0.5 text-[9px] text-gray-400">Semana ouro</p>
      </div>

      <div className="flex flex-col items-center rounded-2xl bg-[#1a1e27] p-4 text-center opacity-40 border border-gray-800">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800 text-gray-500 mb-2">
          <Trophy size={24} />
        </div>
        <h5 className="text-[11px] font-bold">30 Dias Duo</h5>
        <p className="mt-0.5 text-[9px] text-gray-400">Bloqueado</p>
      </div>
    </div>
  );
}