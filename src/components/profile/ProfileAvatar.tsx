'use client';

import { useState, useRef } from 'react';
import { Camera, Trash2, Upload, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ProfileAvatarProps {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  onAvatarUpdated: (newUrl: string | null) => void;
}

export function ProfileAvatar({
  userId,
  displayName,
  avatarUrl,
  onAvatarUpdated,
}: ProfileAvatarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const initial = displayName?.charAt(0).toUpperCase() || 'U';

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação básica de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Selecione um arquivo de imagem válido.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      // 1. Upload para o bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // 3. Atualizar perfil do usuário
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      onAvatarUpdated(publicUrl);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao atualizar foto:', error);
      alert('Erro ao enviar imagem. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setUploading(true);

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);

      if (error) throw error;

      onAvatarUpdated(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao remover foto:', error);
      alert('Erro ao remover foto de perfil.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="group relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-lg active:scale-95 transition-transform"
        >
          <div className="flex h-full w-full items-center justify-center rounded-full bg-[#161920] overflow-hidden font-bold text-xl text-blue-400">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              initial
            )}
          </div>

          {/* Overlay de Câmera no Hover / Mobile */}
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera size={20} className="text-white" />
          </div>
        </button>
      </div>

      {/* Modal de Gerenciamento da Foto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-t-3xl bg-[#1a1e27] p-6 text-white shadow-2xl sm:rounded-3xl border border-gray-800">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <h3 className="text-base font-bold">Foto de Perfil</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              {/* Input escondido */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleUpload}
                accept="image/*"
                className="hidden"
              />

              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                <span>{avatarUrl ? 'Alterar Foto' : 'Adicionar Nova Foto'}</span>
              </button>

              {avatarUrl && (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={handleRemove}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-red-500/10 py-3.5 text-xs font-bold text-red-400 border border-red-500/20 hover:bg-red-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  <span>Remover Foto Atual</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="mt-1 rounded-2xl bg-[#232834] py-3 text-xs font-bold text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}