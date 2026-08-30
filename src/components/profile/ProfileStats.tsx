'use client';

interface ProfileStatsProps {
  habitsCount: number;
  followersCount: number;
  followingCount: number;
  onOpenFollowers: () => void;
  onOpenFollowing: () => void;
}

export function ProfileStats({
  habitsCount,
  followersCount,
  followingCount,
  onOpenFollowers,
  onOpenFollowing,
}: ProfileStatsProps) {
  return (
    <div className="flex flex-1 justify-around pl-4 text-center">
      <div>
        <span className="block text-base font-extrabold text-white">{habitsCount}</span>
        <span className="text-[11px] font-medium text-gray-400">desafios</span>
      </div>

      <button
        onClick={onOpenFollowers}
        className="group transition-transform active:scale-95 text-center"
      >
        <span className="block text-base font-extrabold text-white group-hover:text-blue-400 transition-colors">
          {followersCount}
        </span>
        <span className="text-[11px] font-medium text-gray-400">seguidores</span>
      </button>

      <button
        onClick={onOpenFollowing}
        className="group transition-transform active:scale-95 text-center"
      >
        <span className="block text-base font-extrabold text-white group-hover:text-blue-400 transition-colors">
          {followingCount}
        </span>
        <span className="text-[11px] font-medium text-gray-400">seguindo</span>
      </button>
    </div>
  );
}