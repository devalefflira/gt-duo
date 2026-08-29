'use client';

import { useState } from 'react';
import { X, Copy, Check, Share2, Lock } from 'lucide-react';

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export function ShareProfileModal({ isOpen, onClose, username }: ShareProfileModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const profileUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/u/${username}` 
    : `https://gt-duo.vercel.app/u/${username}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-t-3xl bg-[#1a1e27] p-6 text-white shadow-2xl sm:rounded-3xl border border-gray-800">
        
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-blue-400" />
            <h3 className="text-base font-bold">Compartilhar Perfil</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>

        <div className="mt-5 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 mb-3 border border-blue-500/20">
            <Lock size={24} />
          </div>
          <h4 className="text-sm font-bold">Seu link único do GT Duo</h4>
          <p className="mt-1 text-xs text-gray-400 max-w-[280px]">
            Qualquer pessoa que acessar seu link poderá ver seu perfil privado e solicitar para te seguir.
          </p>

          <div className="mt-4 flex w-full items-center justify-between rounded-2xl bg-[#232834] p-3 border border-gray-800">
            <span className="truncate text-xs font-medium text-gray-300 pr-2">{profileUrl}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500 active:scale-95 transition-all shrink-0"
            >
              {copied ? <Check size={14} strokeWidth={3} /> : <Copy size={14} />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}