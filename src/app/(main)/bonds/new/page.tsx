'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Search, 
  Check, 
  Heart, 
  Users, 
  Home, 
  Send, 
  Sparkles,
  Loader2 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const BOND_CATEGORIES = [
  {
    id: 'amizade',
    label: 'Amizade',
    icon: Users,
    subtypes: ['Amigo(a)', 'Melhor Amigo(a)', 'Colega de Trabalho', 'Conhecido'],
  },
  {
    id: 'afetivo',
    label: 'Afetivo',
    icon: Heart,
    subtypes: ['Esposo(a)', 'Namorado(a)', 'Ficante', 'Contatinho'],
  },
  {
    id: 'parentesco',
    label: 'Parentesco',
    icon: Home,
    subtypes: [
      'Mãe',
      'Pai',
      'Filho(a)',
      'Irmão(ã)',
      'Tio(a)',
      'Avô(ó)',
      'Primo(a)',
      'Madrasta',
      'Padrasto',
      'Padrinho',
      'Madrinha',
      'Afilhado(a)',
      'Outro',
    ],
  },
];

interface SearchedUser {
  id: string;
  full_name: string;
  username: string;
}

export default function NewBondPage() {
  const router = useRouter();
  const supabase = createClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<'amizade' | 'afetivo' | 'parentesco'>('amizade');
  const [selectedSubtype, setSelectedSubtype] = useState<string>('Amigo(a)');
  const [submitting, setSubmitting] = useState(false);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    const clean = term.replace(/[@\s]/g, '').toLowerCase();

    if (clean.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .neq('id', user?.id || '')
      .ilike('username', `%${clean}%`)
      .limit(10);

    setSearchResults(data || []);
    setSearching(false);
  };

  const handleCategoryChange = (catId: 'amizade' | 'afetivo' | 'parentesco') => {
    setSelectedCategory(catId);
    const categoryData = BOND_CATEGORIES.find((c) => c.id === catId);
    if (categoryData && categoryData.subtypes.length > 0) {
      setSelectedSubtype(categoryData.subtypes[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      alert('Selecione um usuário para vincular.');
      return;
    }

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // 1. Inserir ou atualizar na tabela bonds como pendente
      const { data: bond, error: bondError } = await supabase
        .from('bonds')
        .upsert(
          {
            requester_id: user.id,
            recipient_id: selectedUser.id,
            category: selectedCategory,
            subtype: selectedSubtype,
            status: 'pending',
          },
          { onConflict: 'requester_id,recipient_id' }
        )
        .select()
        .single();

      if (bondError) throw bondError;

      // 2. Enviar Notificação ao destinatário
      await supabase.from('notifications').insert({
        recipient_id: selectedUser.id,
        sender_id: user.id,
        type: 'bond_request',
        status: 'pending',
        metadata: {
          bond_id: bond.id,
          category: selectedCategory,
          subtype: selectedSubtype,
        },
      });

      router.push('/bonds');
      router.refresh();
    } catch (err: any) {
      console.error('Erro ao enviar solicitação de vínculo:', err);
      alert('Não foi possível enviar a solicitação. Verifique se o vínculo já existe.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeCategoryData = BOND_CATEGORIES.find((c) => c.id === selectedCategory) || BOND_CATEGORIES[0];

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-[#121418] px-5 py-6 text-white pb-32">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Voltar</span>
        </button>
        <h1 className="text-base font-bold">Novo Vínculo</h1>
        <div className="w-8" />
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
        {/* Bloco 1: Selecionar Usuário */}
        <div className="flex flex-col gap-3 rounded-3xl bg-[#191c24] p-5 border border-gray-800/60">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-blue-400">1. Escolha a Pessoa</h2>

          {!selectedUser ? (
            <div>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-sm font-bold text-gray-400">@</span>
                <input
                  type="text"
                  placeholder="Digite o @usuario..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full rounded-2xl bg-[#232834] py-3 pl-8 pr-4 text-xs text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Lista de Resultados */}
              {searching ? (
                <div className="pt-3 text-center text-xs text-gray-500">Buscando...</div>
              ) : searchResults.length > 0 ? (
                <div className="mt-3 flex flex-col gap-2 max-h-44 overflow-y-auto">
                  {searchResults.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setSelectedUser(u);
                        setSearchResults([]);
                      }}
                      className="flex items-center justify-between rounded-xl bg-[#232834] p-3 text-left hover:bg-[#2c3242] transition-colors"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-white">{u.full_name}</h4>
                        <p className="text-[11px] text-blue-400 font-medium">@{u.username}</p>
                      </div>
                      <span className="rounded-lg bg-blue-600/20 px-2 py-1 text-[10px] font-bold text-blue-400">
                        Selecionar
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-2xl bg-[#232834] p-4 border border-blue-500/30">
              <div>
                <h4 className="text-xs font-bold text-white">{selectedUser.full_name}</h4>
                <p className="text-[11px] text-blue-400 font-medium">@{selectedUser.username}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-xs font-bold text-gray-400 hover:text-white"
              >
                Trocar
              </button>
            </div>
          )}
        </div>

        {/* Bloco 2: Tipo de Vínculo */}
        <div className="flex flex-col gap-3 rounded-3xl bg-[#191c24] p-5 border border-gray-800/60">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-blue-400">2. Categoria do Vínculo</h2>

          <div className="grid grid-cols-3 gap-2">
            {BOND_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id as any)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3 text-xs font-bold transition-all',
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-[#232834] text-gray-400 hover:text-white'
                  )}
                >
                  <Icon size={18} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bloco 3: Subtipo do Vínculo */}
        <div className="flex flex-col gap-3 rounded-3xl bg-[#191c24] p-5 border border-gray-800/60">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-blue-400">
            3. Grau de {activeCategoryData.label}
          </h2>

          <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto no-scrollbar pt-1">
            {activeCategoryData.subtypes.map((sub) => {
              const isSelected = selectedSubtype === sub;
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubtype(sub)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all',
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-[#232834] text-gray-300 hover:bg-[#2c3242]'
                  )}
                >
                  <span>{sub}</span>
                  {isSelected && <Check size={13} strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Botão de Envio */}
        <button
          type="submit"
          disabled={!selectedUser || submitting}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>ENVIANDO SOLICITAÇÃO...</span>
            </>
          ) : (
            <>
              <Send size={16} />
              <span>ENVIAR SOLICITAÇÃO DE VÍNCULO</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}