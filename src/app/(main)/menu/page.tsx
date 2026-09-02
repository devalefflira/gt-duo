'use client';

import { useRouter } from 'next/navigation';
import { 
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
  LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  href?: string;
  isAvailable: boolean;
}

const MENU_APPS: MenuItem[] = [
  {
    id: 'reading',
    title: 'Leituras',
    description: 'Livros e metas de leitura',
    icon: BookOpen,
    href: '/reading',
    isAvailable: true,
  },
  {
    id: 'movies',
    title: 'Filmes e Séries',
    description: 'O que assistir e diário cinéfilo',
    icon: Film,
    isAvailable: false,
  },
  {
    id: 'music',
    title: 'Músicas',
    description: 'Playlists e faixas favoritas',
    icon: Music,
    isAvailable: false,
  },
  {
    id: 'podcasts',
    title: 'Podcasts',
    description: 'Episódios e canais recomendados',
    icon: Mic,
    isAvailable: false,
  },
  {
    id: 'spirituality',
    title: 'Espiritualidade',
    description: 'Devocional e reflexões',
    icon: Sparkles,
    isAvailable: false,
  },
  {
    id: 'tasks',
    title: 'Tarefas',
    description: 'Afazeres e checklist de rotina',
    icon: CheckSquare,
    href: '/tasks',
    isAvailable: true,
  },
  {
    id: 'places',
    title: 'Lugares',
    description: 'Restaurantes, viagens e rolês',
    icon: MapPin,
    isAvailable: false,
  },
  {
    id: 'shopping',
    title: 'Lista de Compras',
    description: 'Mercado e itens essenciais',
    icon: ShoppingCart,
    isAvailable: false,
  },
  {
    id: 'workouts',
    title: 'Treinos',
    description: 'Fichas, cargas e rotina física',
    icon: Dumbbell,
    isAvailable: false,
  },
  {
    id: 'diets',
    title: 'Dietas',
    description: 'Refeições, calorias e cardápios',
    icon: UtensilsCrossed,
    isAvailable: false,
  },
];

export default function MenuPage() {
  const router = useRouter();

  const handleNavigate = (item: MenuItem) => {
    if (item.isAvailable && item.href) {
      router.push(item.href);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-[#121418] px-5 pt-6 text-white pb-32">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Apps</h1>
          <p className="text-xs font-semibold text-gray-400">Você no Controle</p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#191c24] text-blue-400 border border-gray-800">
          <LayoutGrid size={20} />
        </div>
      </div>

      {/* Grid de Aplicativos */}
      <div className="mt-6 grid grid-cols-2 gap-3.5">
        {MENU_APPS.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item)}
              disabled={!item.isAvailable}
              className={cn(
                'flex flex-col items-start justify-between rounded-3xl p-4 text-left transition-all border min-h-[140px]',
                item.isAvailable
                  ? 'bg-[#191c24] border-gray-800/80 hover:border-emerald-500/40 active:scale-[0.98] shadow-md cursor-pointer'
                  : 'bg-[#161920]/60 border-gray-800/40 opacity-70 cursor-not-allowed'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-2xl border',
                  item.isAvailable
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-[#1e222b] text-blue-400 border-gray-800'
                )}
              >
                <Icon size={20} />
              </div>

              <div className="mt-3">
                <h3 className="text-xs font-bold text-white">{item.title}</h3>
                <p className="text-[10px] text-gray-400 leading-tight mt-0.5 line-clamp-1">
                  {item.description}
                </p>
              </div>

              <div className="mt-2.5">
                {item.isAvailable ? (
                  <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                    Acessar
                  </span>
                ) : (
                  <span className="rounded-md bg-[#1e222b] px-2 py-0.5 text-[9px] font-bold text-gray-500">
                    Em breve
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}