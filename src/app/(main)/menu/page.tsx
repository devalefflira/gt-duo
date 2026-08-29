'use client';

import { LayoutGrid, BookOpen, Film, Music, Mic, HeartHandshake, CheckSquare, MapPin, ShoppingCart, Dumbbell } from 'lucide-react';

const UPCOMING_MODULES = [
  { name: 'Nossa Leitura', icon: BookOpen, desc: 'Livros compartilhados' },
  { name: 'Filmes e Séries', icon: Film, desc: 'O que assistir juntos' },
  { name: 'Músicas que Amamos', icon: Music, desc: 'Playlists conectadas' },
  { name: 'Podcasts Duo', icon: Mic, desc: 'Episódios recomendados' },
  { name: 'Dupla Devocional', icon: HeartHandshake, desc: 'Momento espiritual' },
  { name: 'Tarefas Dueto', icon: CheckSquare, desc: 'Afazeres em conjunto' },
  { name: 'Lugares que Amamos', icon: MapPin, desc: 'Nosso mapa de rolês' },
  { name: 'Lista de Compras', icon: ShoppingCart, desc: 'Compras em tempo real' },
  { name: 'Treino A2', icon: Dumbbell, desc: 'Atividades físicas a dois' },
];

export default function MenuHubPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col px-5 pt-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">MENU</h1>
          <p className="text-xs font-semibold text-gray-400">Super App do Casal</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e222b] text-blue-500">
          <LayoutGrid size={20} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 pb-8">
        {UPCOMING_MODULES.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.name}
              className="relative flex flex-col justify-between rounded-2xl bg-[#191c24] p-4 border border-gray-800/60 opacity-85 hover:opacity-100 transition-all"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 mb-3">
                <Icon size={20} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">{item.name}</h3>
                <p className="mt-0.5 text-[10px] text-gray-400">{item.desc}</p>
              </div>
              <span className="mt-3 inline-block w-fit rounded-md bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold text-blue-400">
                Em breve
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}