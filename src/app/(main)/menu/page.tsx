'use client';

import { 
  LayoutGrid, 
  BookOpen, 
  Film, 
  Music, 
  Mic, 
  Sparkles, 
  CheckSquare, 
  MapPin, 
  ShoppingCart, 
  Dumbbell, 
  UtensilsCrossed, 
  ThumbsUp, 
  FolderKanban, 
  Wallet 
} from 'lucide-react';

const APP_MODULES = [
  { name: 'Leituras', icon: BookOpen, desc: 'Livros e metas de leitura' },
  { name: 'Filmes e Séries', icon: Film, desc: 'O que assistir e diário cinéfilo' },
  { name: 'Músicas', icon: Music, desc: 'Playlists e faixas favoritas' },
  { name: 'Podcasts', icon: Mic, desc: 'Episódios e canais recomendados' },
  { name: 'Espiritualidade', icon: Sparkles, desc: 'Devocional e reflexões' },
  { name: 'Tarefas', icon: CheckSquare, desc: 'Afazeres e checklist de rotina' },
  { name: 'Lugares', icon: MapPin, desc: 'Restaurantes, viagens e rolês' },
  { name: 'Lista de Compras', icon: ShoppingCart, desc: 'Mercado e itens essenciais' },
  { name: 'Treinos', icon: Dumbbell, desc: 'Fichas, cargas e rotina física' },
  { name: 'Dietas', icon: UtensilsCrossed, desc: 'Refeições, calorias e cardápios' },
  { name: 'Indicações', icon: ThumbsUp, desc: 'Dicas compartilhadas de tudo' },
  { name: 'Projetos', icon: FolderKanban, desc: 'Objetivos e metas de longo prazo' },
  { name: 'Finanças', icon: Wallet, desc: 'Controle de gastos e orçamentos' },
];

export default function MenuHubPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col px-5 pt-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">MENU</h1>
          <p className="text-xs font-semibold text-gray-400">Super App do Casal & Amigos</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e222b] text-blue-500">
          <LayoutGrid size={20} />
        </div>
      </div>

      {/* Grid de Apps */}
      <div className="mt-6 grid grid-cols-2 gap-3 pb-8">
        {APP_MODULES.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.name}
              className="relative flex flex-col justify-between rounded-2xl bg-[#191c24] p-4 border border-gray-800/60 opacity-85 hover:opacity-100 transition-all active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 mb-3">
                <Icon size={20} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">{item.name}</h3>
                <p className="mt-0.5 text-[10px] text-gray-400 leading-tight">{item.desc}</p>
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