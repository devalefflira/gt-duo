'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Plus, 
  BookOpen, 
  Sparkles, 
  Compass, 
  ChevronRight,
  Home,
  Library
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Book } from '@/core/reading/types';
import { cn } from '@/lib/utils';

type LibraryTab = 'insights' | 'my_books' | 'catalog';

export default function LibraryPage() {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<LibraryTab>('my_books');
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBooks(data as Book[]);
    }
    setLoading(false);
  };

  const filteredBooks = books.filter((book) => {
    const q = searchQuery.toLowerCase();
    return (
      book.title.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q) ||
      book.genre.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-[#121418] px-5 py-6 text-white pb-32">
      {/* 1. Header & Alternador Superior */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight">Biblioteca</h1>
      </div>

      <div className="mt-4 flex rounded-2xl bg-[#191c24] p-1 border border-gray-800/80">
        <button
          onClick={() => router.push('/reading')}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-gray-400 hover:text-white transition-all"
        >
          <Home size={14} />
          <span>Início</span>
        </button>

        <button
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 py-2.5 text-xs font-black text-gray-950 shadow-md transition-all"
        >
          <Library size={14} />
          <span>Biblioteca</span>
        </button>
      </div>

      {/* 2. Abas de Navegação */}
      <div className="mt-5 flex items-center justify-around border-b border-gray-800/80">
        {[
          { id: 'insights', label: 'Insights' },
          { id: 'my_books', label: 'Meus Livros' },
          { id: 'catalog', label: 'Catálogo' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as LibraryTab)}
              className={cn(
                'relative pb-3 text-xs font-bold transition-all',
                isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              )}
            >
              <span>{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-sky-400 to-emerald-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Conteúdo da Aba MEUS LIVROS */}
      {activeTab === 'my_books' && (
        <div className="mt-5 flex flex-col gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar na minha biblioteca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl bg-[#1e222b] py-3 pl-10 pr-4 text-xs text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {loading ? (
            <div className="py-20 text-center text-xs text-gray-500">Carregando sua biblioteca...</div>
          ) : filteredBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-sm font-semibold text-gray-400">Nenhum livro encontrado</p>

              <button
                onClick={() => router.push('/reading/books/new')}
                className="mt-6 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 px-6 py-3.5 text-xs font-black text-gray-950 shadow-lg shadow-teal-500/20 active:scale-95 transition-all"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Adicionar livro</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredBooks.map((book) => {
                const progress = Math.min(100, Math.round((book.current_page / book.total_pages) * 100));

                return (
                  <div
                    key={book.id}
                    onClick={() => router.push(`/reading/session?bookId=${book.id}`)}
                    className="flex items-center gap-3.5 rounded-2xl bg-[#191c24] p-3.5 border border-gray-800/60 hover:bg-[#1e222b] transition-all cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-xl bg-[#232834] overflow-hidden border border-gray-800">
                      {book.cover_url ? (
                        <img src={book.cover_url} alt={book.title} className="h-full w-full object-cover" />
                      ) : (
                        <BookOpen size={20} className="text-gray-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-white truncate">{book.title}</h4>
                        <span className="text-[10px] font-extrabold text-emerald-400 shrink-0">
                          {progress}%
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-400 truncate">{book.author}</p>

                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1 flex-1 rounded-full bg-gray-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-gray-500 font-medium">
                          {book.current_page}/{book.total_pages} pág
                        </span>
                      </div>
                    </div>

                    <ChevronRight size={16} className="text-gray-600 shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Aba INSIGHTS */}
      {activeTab === 'insights' && (
        <div className="mt-8 flex flex-col items-center justify-center text-center py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#191c24] text-emerald-400 border border-gray-800 mb-3">
            <Sparkles size={24} />
          </div>
          <h3 className="text-sm font-bold text-gray-200">Seus Melhores Insights</h3>
          <p className="mt-1 text-xs text-gray-500 max-w-[240px]">
            Conforme você conclui sessões de leitura e registra notas, seus aprendizados aparecerão reunidos aqui.
          </p>
        </div>
      )}

      {/* 5. Aba CATÁLOGO */}
      {activeTab === 'catalog' && (
        <div className="mt-8 flex flex-col items-center justify-center text-center py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#191c24] text-sky-400 border border-gray-800 mb-3">
            <Compass size={24} />
          </div>
          <h3 className="text-sm font-bold text-gray-200">Catálogo de Livros</h3>
          <p className="mt-1 text-xs text-gray-500 max-w-[240px]">
            Explore recomendações de clássicos e livros populares por gênero literário.
          </p>
        </div>
      )}

      {/* 6. Botão Flutuante (+) */}
      <button
        onClick={() => router.push('/reading/books/new')}
        className="fixed bottom-24 right-5 flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-tr from-sky-400 to-emerald-400 text-gray-950 shadow-xl shadow-teal-500/25 active:scale-95 transition-transform z-40"
        title="Adicionar Livro"
      >
        <Plus size={24} strokeWidth={2.8} />
      </button>
    </div>
  );
}