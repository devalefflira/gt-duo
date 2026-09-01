'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, 
  UploadCloud, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Loader2, 
  Check, 
  Image as ImageIcon 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { BookGenre } from '@/core/reading/types';
import { cn } from '@/lib/utils';

const GENRES: BookGenre[] = [
  'Ficção',
  'Não-ficção',
  'Filosofia',
  'Religião',
  'Negócios',
  'Desenvolvimento Pessoal',
  'Biografia',
  'Ciência',
  'Tecnologia',
  'Romance',
  'Terror',
  'Fantasia',
  'Poesia',
  'História',
  'Outro',
];

export default function NewBookPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados do Formulário
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState<BookGenre>('Ficção');
  const [isGenreOpen, setIsGenreOpen] = useState(false);

  // Estado da Capa
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Estados de Controle
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WEBP).');
      return;
    }

    setCoverFile(file);
    const previewUrl = URL.createObjectURL(file);
    setCoverPreview(previewUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || !totalPages) {
      setErrorMsg('Preencha os campos obrigatórios (Título, Autor e Total de Páginas).');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      let coverUrl: string | null = null;

      // Upload da capa caso selecionada
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop() || 'jpg';
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('book-covers')
          .upload(filePath, coverFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('book-covers')
            .getPublicUrl(filePath);
          coverUrl = publicUrl;
        } else {
          console.warn('Erro no upload da capa:', uploadError);
        }
      }

      // Inserir registro na tabela books
      const { data: book, error: insertError } = await supabase
        .from('books')
        .insert({
          user_id: user.id,
          title: title.trim(),
          author: author.trim(),
          total_pages: parseInt(totalPages, 10) || 1,
          current_page: 0,
          cover_url: coverUrl,
          description: description.trim() || null,
          genre,
          status: 'reading',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      router.push('/reading/library');
      router.refresh();
    } catch (err: any) {
      console.error('Erro ao adicionar livro:', err);
      setErrorMsg('Não foi possível adicionar o livro. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-[#121418] px-5 py-6 text-white pb-32">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <h1 className="text-lg font-bold">Adicionar Livro</h1>
        <button
          onClick={() => router.back()}
          type="button"
          className="rounded-full bg-[#1e222b] p-2 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        {/* Upload da Capa */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-300">Capa do Livro</label>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleImageSelect}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'group relative flex aspect-[3/4] w-full max-w-[200px] mx-auto cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-gray-700 bg-[#191c24] p-4 text-center transition-all hover:border-gray-500 hover:bg-[#1f232d]',
              coverPreview && 'border-solid border-emerald-500/50 p-0 overflow-hidden'
            )}
          >
            {coverPreview ? (
              <img
                src={coverPreview}
                alt="Prévia da Capa"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#232834] text-gray-300 group-hover:scale-105 transition-transform">
                  <UploadCloud size={24} />
                </div>
                <span className="text-xs font-bold text-gray-200">Toque para adicionar capa</span>
                <span className="text-[10px] text-gray-500 font-medium">JPG, PNG ou WEBP</span>
              </div>
            )}
          </div>
        </div>

        {/* Título */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-300">Título</label>
          <input
            type="text"
            required
            placeholder="Ex: Código Limpo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-2xl bg-[#1e222b] px-4 py-3.5 text-xs text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-emerald-500/50 border border-transparent focus:border-emerald-500/50"
          />
        </div>

        {/* Autor */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-300">Autor</label>
          <input
            type="text"
            required
            placeholder="Ex: Robert C. Martin"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full rounded-2xl bg-[#1e222b] px-4 py-3.5 text-xs text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-emerald-500/50 border border-transparent focus:border-emerald-500/50"
          />
        </div>

        {/* Total de Páginas */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-300">Total de Páginas</label>
          <input
            type="number"
            min="1"
            required
            placeholder="Ex: 464"
            value={totalPages}
            onChange={(e) => setTotalPages(e.target.value)}
            className="w-full rounded-2xl bg-[#1e222b] px-4 py-3.5 text-xs text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-emerald-500/50 border border-transparent focus:border-emerald-500/50"
          />
        </div>

        {/* Descrição */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-300">Descrição</label>
          <textarea
            rows={4}
            placeholder="Resumo, sinopse ou comentários sobre o livro"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-2xl bg-[#1e222b] p-4 text-xs text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-emerald-500/50 border border-transparent focus:border-emerald-500/50 resize-none leading-relaxed"
          />
        </div>

        {/* Gênero (Dropdown Elegante) */}
        <div className="flex flex-col gap-1.5 relative">
          <label className="text-xs font-semibold text-gray-300">Gênero</label>
          
          <button
            type="button"
            onClick={() => setIsGenreOpen(!isGenreOpen)}
            className="flex w-full items-center justify-between rounded-2xl bg-[#1e222b] px-4 py-3.5 text-xs font-medium text-white outline-none border border-transparent hover:bg-[#252a36] transition-colors"
          >
            <span>{genre || 'Selecione um gênero'}</span>
            {isGenreOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
          </button>

          {isGenreOpen && (
            <div className="mt-1 flex flex-col rounded-2xl bg-[#191c24] p-2 border border-gray-800 shadow-2xl max-h-60 overflow-y-auto no-scrollbar z-30">
              {GENRES.map((g) => {
                const isSelected = genre === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setGenre(g);
                      setIsGenreOpen(false);
                    }}
                    className={cn(
                      'flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-left transition-colors',
                      isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-300 hover:bg-[#232834]'
                    )}
                  >
                    <span>{g}</span>
                    {isSelected && <Check size={14} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Card Informativo */}
        <div className="flex items-center gap-3.5 rounded-2xl bg-[#191c24] p-4 border border-gray-800/80">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
            <BookOpen size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Personalize sua biblioteca</h4>
            <p className="text-[11px] text-gray-400 leading-snug mt-0.5">
              Adicione livros personalizados e acompanhe seu progresso de leitura em tempo real!
            </p>
          </div>
        </div>

        {errorMsg && (
          <p className="text-center text-xs font-semibold text-red-400">{errorMsg}</p>
        )}

        {/* Botões de Ação */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-full bg-[#1e222b] py-4 text-center text-xs font-bold text-gray-300 hover:text-white border border-gray-800 active:scale-[0.98] transition-all"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-full bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 py-4 text-center text-xs font-black text-gray-950 shadow-lg shadow-teal-500/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin text-gray-950" />
                <span>Adicionando...</span>
              </span>
            ) : (
              'Adicionar Livro'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}