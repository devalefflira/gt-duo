'use client';

import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';

interface ProfileActionsProps {
  onShare: () => void;
  onAddFriend: () => void;
}

export function ProfileActions({ onShare, onAddFriend }: ProfileActionsProps) {
  const router = useRouter();

  return (
    <div className="mt-5 flex items-center gap-2">
      <button 
        onClick={() => router.push('/profile/edit')}
        className="flex-1 rounded-xl bg-[#1e222b] py-2.5 text-center text-xs font-bold text-white hover:bg-[#252a36] active:scale-[0.98] transition-all"
      >
        Editar perfil
      </button>

      <button 
        onClick={onShare}
        className="flex-1 rounded-xl bg-[#1e222b] py-2.5 text-center text-xs font-bold text-white hover:bg-[#252a36] active:scale-[0.98] transition-all"
      >
        Compartilhar perfil
      </button>

      <button 
        onClick={onAddFriend}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1e222b] text-gray-300 hover:bg-[#252a36] active:scale-[0.98] transition-all"
      >
        <UserPlus size={16} />
      </button>
    </div>
  );
}