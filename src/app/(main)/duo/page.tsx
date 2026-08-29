'use client';

import { Users, HeartHandshake } from 'lucide-react';

export default function DuoPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col px-5 pt-8 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">DUO</h1>
          <p className="text-xs font-semibold text-gray-400">Espaço compartilhado do casal</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e222b] text-blue-500">
          <HeartHandshake size={22} />
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center justify-center rounded-3xl bg-[#191c24] p-8 text-center border border-gray-800/60">
        <Users size={40} className="text-blue-500 mb-3" />
        <h2 className="text-base font-bold">Módulo Duo em Construção</h2>
        <p className="mt-1 text-xs text-gray-400">
          Aqui ficarão os hábitos em dobro, conexão de parceiro(a) e atividades conjuntas.
        </p>
      </div>
    </div>
  );
}