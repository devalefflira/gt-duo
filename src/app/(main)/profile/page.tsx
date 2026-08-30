'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Grid, History, Award, Link2, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Habit, HabitLog } from '@/core/habits/types';
import { cn } from '@/lib/utils';

// Componentes modulares
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { ProfileActions } from '@/components/profile/ProfileActions';
import { ProfileHabitsTab } from '@/components/profile/ProfileHabitsTab';
import { ProfileTimelineTab } from '@/components/profile/ProfileTimelineTab';
import { ProfileAchievementsTab } from '@/components/profile/ProfileAchievementsTab';

// Modais
import { ShareProfileModal } from '@/components/ShareProfileModal';
import { FollowersListModal } from '@/components/FollowersListModal';

interface UserProfile {
  id: string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  username: string;
  avatar_url?: string | null;
  bio?: string | null;
  is_private: boolean;
  pronouns?: string[];
  show_pronouns_on_profile?: boolean;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bondsCount, setBondsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [activeTab, setActiveTab] = useState<'habits' | 'timeline' | 'achievements'>('habits');

  const [habits, setHabits] = useState<Habit[]>([]);
  const [recentLogs, setRecentLogs] = useState<(HabitLog & { habit_title?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  // Modais
  const [showShareModal, setShowShareModal] = useState(false);
  const [followModalTab, setFollowModalTab] = useState<'followers' | 'following' | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // 1. Perfil
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (userProfile) {
      setProfile(userProfile);
    } else {
      setProfile({
        id: user.id,
        full_name: user.user_metadata?.full_name || 'Usuário',
        username: user.user_metadata?.username || 'usuario',
        bio: 'Construindo hábitos sólidos todos os dias.',
        is_private: true,
      });
    }

    // 2. Contagem de Vínculos Aceitos
    const { count: bonds } = await supabase
      .from('bonds')
      .select('*', { count: 'exact', head: true })
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .eq('status', 'accepted');

    setBondsCount(bonds || 0);

    // 3. Contadores Sociais
    const { count: followers } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id)
      .eq('status', 'accepted');

    const { count: following } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id)
      .eq('status', 'accepted');

    const { count: notifications } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('status', 'pending');

    setFollowersCount(followers || 0);
    setFollowingCount(following || 0);
    setUnreadNotifications(notifications || 0);

    // 4. Hábitos
    const { data: userHabits } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .is('archived_at', null);

    if (userHabits) setHabits(userHabits);

    // 5. Linha do Tempo
    const { data: logs } = await supabase
      .from('habit_logs')
      .select('*, habits(title)')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(10);

    if (logs) {
      setRecentLogs(
        logs.map((log: any) => ({
          ...log,
          habit_title: log.habits?.title || 'Hábito concluído',
        }))
      );
    }

    setLoading(false);
  };

  if (loading || !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-xs text-gray-500">
        Carregando perfil...
      </div>
    );
  }

  const displayName = profile.first_name 
    ? `${profile.first_name} ${profile.last_name || ''}`.trim() 
    : profile.full_name;

  return (
    <div className="mx-auto flex max-w-md flex-col px-5 pt-4 text-white">
      {/* 1. Header */}
      <ProfileHeader
        username={profile.username}
        isPrivate={profile.is_private}
        unreadNotifications={unreadNotifications}
      />

      {/* 2. Avatar e Contadores */}
      <div className="mt-5 flex items-center justify-between">
        <ProfileAvatar
          userId={profile.id}
          displayName={displayName}
          avatarUrl={profile.avatar_url}
          onAvatarUpdated={(newUrl) =>
            setProfile((prev) => (prev ? { ...prev, avatar_url: newUrl } : null))
          }
        />

        <ProfileStats
          habitsCount={habits.length}
          followersCount={followersCount}
          followingCount={followingCount}
          onOpenFollowers={() => setFollowModalTab('followers')}
          onOpenFollowing={() => setFollowModalTab('following')}
        />
      </div>

      {/* 3. Bio & Acesso aos Vínculos */}
      <div className="mt-4 flex flex-col">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-white">{displayName}</h2>
          {profile.show_pronouns_on_profile && profile.pronouns && profile.pronouns.length > 0 && (
            <span className="text-xs text-gray-400">({profile.pronouns.join('/')})</span>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-300 leading-relaxed">{profile.bio}</p>

        {/* Linha de Vínculos Clicável */}
        <button
          onClick={() => router.push('/bonds')}
          className="mt-3 flex items-center justify-between rounded-xl bg-[#1e222b] px-3.5 py-2.5 text-xs font-semibold text-blue-400 border border-gray-800/80 hover:bg-[#252a36] active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-2">
            <Link2 size={16} className="text-blue-400" />
            <span>Vínculos Conectados</span>
            <span className="rounded-full bg-blue-600/20 px-2 py-0.2 text-[10px] font-bold text-blue-400">
              {bondsCount}
            </span>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </button>
      </div>

      {/* 4. Botões de Ação */}
      <ProfileActions
        onShare={() => setShowShareModal(true)}
        onAddFriend={() => router.push('/bonds/new')}
      />

      {/* 5. Abas */}
      <div className="mt-6 flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('habits')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-bold transition-all border-b-2',
            activeTab === 'habits'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          )}
        >
          <Grid size={16} />
          <span>Hábitos</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-bold transition-all border-b-2',
            activeTab === 'timeline'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          )}
        >
          <History size={16} />
          <span>Histórico</span>
        </button>

        <button
          onClick={() => setActiveTab('achievements')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-bold transition-all border-b-2',
            activeTab === 'achievements'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          )}
        >
          <Award size={16} />
          <span>Medalhas</span>
        </button>
      </div>

      {/* 6. Conteúdo */}
      <div className="mt-4 flex flex-col gap-3 pb-8">
        {activeTab === 'habits' && <ProfileHabitsTab habits={habits} />}
        {activeTab === 'timeline' && <ProfileTimelineTab logs={recentLogs} />}
        {activeTab === 'achievements' && <ProfileAchievementsTab />}
      </div>

      {/* 7. Modais */}
      {showShareModal && (
        <ShareProfileModal
          isOpen={true}
          username={profile.username}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {followModalTab && (
        <FollowersListModal
          isOpen={true}
          userId={profile.id}
          initialTab={followModalTab}
          onClose={() => {
            setFollowModalTab(null);
            loadProfileData();
          }}
        />
      )}
    </div>
  );
}