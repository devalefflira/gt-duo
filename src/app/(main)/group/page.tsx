'use client';

import { Flame, Users2 } from 'lucide-react';

export default function GroupPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col px-5 pt-8 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">GRUPO</h1>
          <p className="text-xs font-semibold text-gray-400">Desafios coletivos com amigos mútuos</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e222b] text-blue-500">
          <Flame size={22} />
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center justify-center rounded-3xl bg-[#191c24] p-8 text-center border border-gray-800/60">
        <Users2 size={40} className="text-blue-500 mb-3" />
        <h2 className="text-base font-bold">Desafios em Grupo</h2>
        <p className="mt-1 text-xs text-gray-400">
          Crie ou participe de desafios coletivos para até 20 pessoas e acompanhe o progresso mútuo.
        </p>
      </div>
    </div>
  );
}