'use client';

import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Flame, 
  Award, 
  Zap, 
  ShieldCheck, 
  Crown, 
  Trophy, 
  Users, 
  HeartHandshake, 
  Link2, 
  Medal, 
  CheckCheck, 
  Swords, 
  UserPlus, 
  Network, 
  Heart, 
  Gauge, 
  Footprints, 
  FlameKindling, 
  Scale, 
  Lock, 
  Coins, 
  X 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

// Mapeamento de ícones do lucide
const ICON_MAP: Record<string, any> = {
  sparkles: Sparkles,
  flame: Flame,
  award: Award,
  zap: Zap,
  'shield-check': ShieldCheck,
  crown: Crown,
  trophy: Trophy,
  users: Users,
  'heart-handshake': HeartHandshake,
  'link-2': Link2,
  medal: Medal,
  'check-check': CheckCheck,
  swords: Swords,
  'user-plus': UserPlus,
  network: Network,
  heart: Heart,
  gauge: Gauge,
  footprints: Footprints,
  'flame-kindling': FlameKindling,
  scale: Scale,
};

interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  category: 'streak' | 'duo' | 'group' | 'bonds' | 'metrics';
  icon: string;
  reward_coins: number;
  required_streak: number;
}

export function ProfileAchievementsTab() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedCodes, setUnlockedCodes] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Buscar catálogo completo de medalhas
    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*')
      .order('reward_coins', { ascending: true });

    if (allAchievements) {
      setAchievements(allAchievements);
    }

    // 2. Buscar medalhas já desbloqueadas pelo usuário
    if (user) {
      const { data: userUnlocked } = await supabase
        .from('user_achievements')
        .select('achievement_id, achievements(code)')
        .eq('user_id', user.id);

      if (userUnlocked) {
        const codes = new Set<string>(
          userUnlocked.map((item: any) => item.achievements?.code).filter(Boolean)
        );
        setUnlockedCodes(codes);
      }
    }

    setLoading(false);
  };

  const filteredAchievements = achievements.filter((ach) => {
    if (selectedCategory === 'all') return true;
    return ach.category === selectedCategory;
  });

  const categories = [
    { id: 'all', label: 'Todas' },
    { id: 'streak', label: 'Sequência' },
    { id: 'duo', label: 'Duo' },
    { id: 'group', label: 'Grupo' },
    { id: 'bonds', label: 'Vínculos' },
    { id: 'metrics', label: 'Métricas' },
  ];

  if (loading) {
    return <div className="py-12 text-center text-xs text-gray-500">Carregando medalhas...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros por Categoria */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all whitespace-nowrap',
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-[#191c24] text-gray-400 hover:text-white border border-gray-800/60'
              )}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Grid de Medalhas */}
      <div className="grid grid-cols-3 gap-3">
        {filteredAchievements.map((item) => {
          const isUnlocked = unlockedCodes.has(item.code);
          const IconComponent = ICON_MAP[item.icon] || Award;

          return (
            <button
              key={item.id}
              onClick={() => setSelectedAchievement(item)}
              className={cn(
                'group relative flex flex-col items-center rounded-2xl p-3 text-center transition-all border active:scale-95',
                isUnlocked
                  ? 'bg-[#191c24] border-amber-500/30 shadow-lg shadow-amber-500/5'
                  : 'bg-[#161920]/60 border-gray-800/60 opacity-60'
              )}
            >
              {/* Badge de Recompensa em Moedas */}
              <div className="absolute top-2 right-2 flex items-center gap-0.5 rounded-md bg-amber-500/10 px-1 py-0.5 text-[8px] font-extrabold text-amber-400">
                <Coins size={8} />
                <span>+{item.reward_coins}</span>
              </div>

              {/* Ícone */}
              <div
                className={cn(
                  'mt-2 flex h-12 w-12 items-center justify-center rounded-2xl mb-2 transition-transform group-hover:scale-105',
                  isUnlocked
                    ? 'bg-gradient-to-tr from-amber-500/20 to-yellow-500/20 text-amber-400 border border-amber-500/30 shadow-inner'
                    : 'bg-[#232834] text-gray-500'
                )}
              >
                {isUnlocked ? <IconComponent size={22} /> : <Lock size={18} />}
              </div>

              <h5 className="text-[11px] font-bold text-white leading-tight line-clamp-1">
                {item.title}
              </h5>

              <p className="mt-0.5 text-[9px] font-medium text-gray-400">
                {isUnlocked ? 'Conquistada' : 'Bloqueada'}
              </p>
            </button>
          );
        })}
      </div>

      {/* Modal de Detalhes da Medalha */}
      {selectedAchievement && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-t-3xl bg-[#1a1e27] p-6 text-white shadow-2xl sm:rounded-3xl border border-gray-800">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                Detalhes da Medalha
              </span>
              <button
                onClick={() => setSelectedAchievement(null)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 flex flex-col items-center text-center">
              <div
                className={cn(
                  'flex h-16 w-16 items-center justify-center rounded-3xl mb-3 shadow-lg',
                  unlockedCodes.has(selectedAchievement.code)
                    ? 'bg-gradient-to-tr from-amber-500/20 to-yellow-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-[#232834] text-gray-500 border border-gray-700'
                )}
              >
                {unlockedCodes.has(selectedAchievement.code) ? (
                  (() => {
                    const IconComp = ICON_MAP[selectedAchievement.icon] || Award;
                    return <IconComp size={30} />;
                  })()
                ) : (
                  <Lock size={26} />
                )}
              </div>

              <h3 className="text-base font-extrabold">{selectedAchievement.title}</h3>
              <p className="mt-1.5 text-xs text-gray-300 leading-relaxed max-w-[260px]">
                {selectedAchievement.description}
              </p>

              {/* Informações adicionais */}
              <div className="mt-5 flex w-full items-center justify-around rounded-2xl bg-[#232834] p-3 border border-gray-800">
                <div>
                  <span className="block text-[10px] font-semibold text-gray-400">Status</span>
                  <span
                    className={cn(
                      'text-xs font-bold',
                      unlockedCodes.has(selectedAchievement.code)
                        ? 'text-green-400'
                        : 'text-gray-400'
                    )}
                  >
                    {unlockedCodes.has(selectedAchievement.code) ? 'Desbloqueada' : 'Bloqueada'}
                  </span>
                </div>

                <div className="h-6 w-px bg-gray-700" />

                <div>
                  <span className="block text-[10px] font-semibold text-gray-400">Recompensa</span>
                  <span className="flex items-center justify-center gap-1 text-xs font-black text-amber-400">
                    <Coins size={12} />
                    +{selectedAchievement.reward_coins} GTC
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedAchievement(null)}
                className="mt-5 w-full rounded-2xl bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-500 active:scale-95 transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}