'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Search, Check, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { differenceInYears } from 'date-fns';

const GENDER_OPTIONS = [
  'Feminino',
  'Masculino',
  'Não-binário',
  'Outro',
  'Prefiro não dizer',
];

const PRONOUN_OPTIONS = [
  'Ela/Dela',
  'Ele/Dele',
  'Elu/Delu',
  'Outro',
  'Prefiro não dizer',
];

const COMMUNITY_OPTIONS = [
  'Pessoa Trans',
  'LGBTQIA+',
  'Prefiro não dizer',
];

const ALL_INTERESTS = [
  'Desenvolvimento Pessoal',
  'Biografia / Memórias',
  'Clássicos da Literatura',
  'Contos e Poesia',
  'Distopia',
  'Fantasia',
  'Ficção Científica',
  'História / Política',
  'Mangás / HQs / Graphic Novels',
  'Negócios / Finanças',
  'Não-Ficção Geral',
  'Romance',
  'Suspense / Thriller / Policial',
  'Terror / Horror',
  'Young Adult (Jovem Adulto)',
];

const MAX_INTERESTS = 5;

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Campos Básicos
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [birthDate, setBirthDate] = useState('');

  // Identidade, Pronomes e Comunidade
  const [genderIdentity, setGenderIdentity] = useState('Prefiro não dizer');
  const [genderCustom, setGenderCustom] = useState('');
  const [showGender, setShowGender] = useState(false);

  const [selectedPronouns, setSelectedPronouns] = useState<string[]>([]);
  const [showPronouns, setShowPronouns] = useState(true);

  const [selectedCommunity, setSelectedCommunity] = useState<string[]>([]);
  const [showCommunity, setShowCommunity] = useState(false);

  // Afinidades e Interesses
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [searchInterest, setSearchInterest] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      setFirstName(profile.first_name || profile.full_name?.split(' ')[0] || '');
      setLastName(profile.last_name || profile.full_name?.split(' ').slice(1).join(' ') || '');
      setBio(profile.bio || '');
      setBirthDate(profile.birth_date || '');

      setGenderIdentity(profile.gender_identity || 'Prefiro não dizer');
      setGenderCustom(profile.gender_identity_custom || '');
      setShowGender(profile.show_gender_on_profile ?? false);

      setSelectedPronouns(profile.pronouns || []);
      setShowPronouns(profile.show_pronouns_on_profile ?? true);

      setSelectedCommunity(profile.community_tags || []);
      setShowCommunity(profile.show_community_on_profile ?? false);

      setSelectedInterests(profile.interests || []);
    }

    setLoading(false);
  };

  // Cálculo de Idade
  const calculatedAge = useMemo(() => {
    if (!birthDate) return null;
    const date = new Date(birthDate);
    if (isNaN(date.getTime())) return null;
    return differenceInYears(new Date(), date);
  }, [birthDate]);

  // Filtro de afinidades com barra de busca
  const filteredInterests = useMemo(() => {
    if (!searchInterest.trim()) return ALL_INTERESTS;
    return ALL_INTERESTS.filter((item) =>
      item.toLowerCase().includes(searchInterest.toLowerCase())
    );
  }, [searchInterest]);

  const togglePronoun = (item: string) => {
    if (item === 'Prefiro não dizer') {
      setSelectedPronouns(['Prefiro não dizer']);
      return;
    }
    setSelectedPronouns((prev) => {
      const clean = prev.filter((p) => p !== 'Prefiro não dizer');
      return clean.includes(item) ? clean.filter((p) => p !== item) : [...clean, item];
    });
  };

  const toggleCommunity = (item: string) => {
    if (item === 'Prefiro não dizer') {
      setSelectedCommunity(['Prefiro não dizer']);
      return;
    }
    setSelectedCommunity((prev) => {
      const clean = prev.filter((p) => p !== 'Prefiro não dizer');
      return clean.includes(item) ? clean.filter((p) => p !== item) : [...clean, item];
    });
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((i) => i !== interest);
      }
      if (prev.length >= MAX_INTERESTS) return prev;
      return [...prev, interest];
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    await supabase
      .from('profiles')
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: fullName,
        bio: bio.trim(),
        birth_date: birthDate || null,
        gender_identity: genderIdentity,
        gender_identity_custom: genderIdentity === 'Outro' ? genderCustom.trim() : null,
        show_gender_on_profile: showGender,
        pronouns: selectedPronouns,
        show_pronouns_on_profile: showPronouns,
        community_tags: selectedCommunity,
        show_community_on_profile: showCommunity,
        interests: selectedInterests,
      })
      .eq('id', user.id);

    setSaving(false);
    router.push('/profile');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-xs text-gray-500">
        Carregando dados...
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-[#121418] px-5 py-6 text-white pb-32">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white"
        >
          <ChevronLeft size={20} />
          <span>Voltar</span>
        </button>
        <h1 className="text-base font-bold">Editar Perfil</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs font-bold text-blue-500 hover:text-blue-400 disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <form onSubmit={handleSave} className="mt-6 flex flex-col gap-6">
        {/* Bloco 1: Dados Básicos */}
        <div className="flex flex-col gap-4 rounded-3xl bg-[#191c24] p-5 border border-gray-800/60">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-blue-400">Informações Básicas</h2>

          <div>
            <label className="text-xs font-semibold text-gray-400">Primeiro Nome</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ex: Jaciane"
              className="mt-1 w-full rounded-2xl bg-[#232834] px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400">Último Nome</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Ex: Lins"
              className="mt-1 w-full rounded-2xl bg-[#232834] px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400">Bio</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Conte um pouco sobre sua jornada..."
              className="mt-1 w-full rounded-2xl bg-[#232834] px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Data de Nascimento e Idade Privada */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-gray-400">
                <span>Data de Nascimento</span>
                <span className="text-[10px] text-gray-500">[Privado]</span>
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="mt-1 w-full rounded-2xl bg-[#232834] px-3 py-3 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-gray-400">
                <span>Idade</span>
                <span className="text-[10px] text-gray-500">[Privado]</span>
              </label>
              <div className="mt-1 flex h-[42px] items-center rounded-2xl bg-[#232834] px-4 text-xs font-bold text-gray-300">
                {calculatedAge !== null ? `${calculatedAge} anos` : 'Defina a data'}
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 2: Identidade, Pronomes e Comunidade */}
        <div className="flex flex-col gap-5 rounded-3xl bg-[#191c24] p-5 border border-gray-800/60">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-blue-400">Identidade & Visibilidade</h2>

          {/* Identidade de Gênero */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-400">Identidade de Gênero</label>
              <button
                type="button"
                onClick={() => setShowGender(!showGender)}
                className="flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-white"
              >
                {showGender ? <Eye size={13} className="text-blue-400" /> : <EyeOff size={13} />}
                <span>{showGender ? 'Público no perfil' : 'Privado'}</span>
              </button>
            </div>
            <select
              value={genderIdentity}
              onChange={(e) => setGenderIdentity(e.target.value)}
              className="mt-1.5 w-full rounded-2xl bg-[#232834] px-4 py-3 text-xs font-medium text-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="bg-[#191c24]">
                  {opt}
                </option>
              ))}
            </select>
            {genderIdentity === 'Outro' && (
              <input
                type="text"
                placeholder="Especifique sua identidade..."
                value={genderCustom}
                onChange={(e) => setGenderCustom(e.target.value)}
                className="mt-2 w-full rounded-2xl bg-[#232834] px-4 py-2.5 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Pronomes */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-400">Pronomes</label>
              <button
                type="button"
                onClick={() => setShowPronouns(!showPronouns)}
                className="flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-white"
              >
                {showPronouns ? <Eye size={13} className="text-blue-400" /> : <EyeOff size={13} />}
                <span>{showPronouns ? 'Público no perfil' : 'Privado'}</span>
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {PRONOUN_OPTIONS.map((pronoun) => {
                const isSelected = selectedPronouns.includes(pronoun);
                return (
                  <button
                    key={pronoun}
                    type="button"
                    onClick={() => togglePronoun(pronoun)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-[#232834] text-gray-400 hover:text-white'
                    }`}
                  >
                    {pronoun}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comunidade / Autodeclaração */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-400">Comunidade / Autodeclaração</label>
              <button
                type="button"
                onClick={() => setShowCommunity(!showCommunity)}
                className="flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-white"
              >
                {showCommunity ? <Eye size={13} className="text-blue-400" /> : <EyeOff size={13} />}
                <span>{showCommunity ? 'Exibir no perfil' : 'Oculto'}</span>
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {COMMUNITY_OPTIONS.map((tag) => {
                const isSelected = selectedCommunity.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleCommunity(tag)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-[#232834] text-gray-400 hover:text-white'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bloco 3: Afinidades e Interesses */}
        <div className="flex flex-col gap-3 rounded-3xl bg-[#191c24] p-5 border border-gray-800/60">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-blue-400">Afinidades & Gostos</h2>
            <span className="text-[11px] font-bold text-gray-400">
              {selectedInterests.length}/{MAX_INTERESTS} selecionados
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            Usado para sugerir conexões com interesses mútuos. Escolha até 5 itens.
          </p>

          {/* Barra de Busca Interna */}
          <div className="relative mt-1">
            <input
              type="text"
              placeholder="Buscar gênero ou interesse..."
              value={searchInterest}
              onChange={(e) => setSearchInterest(e.target.value)}
              className="w-full rounded-2xl bg-[#232834] py-2.5 pl-9 pr-4 text-xs text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search size={14} className="absolute left-3.5 top-3 text-gray-400" />
          </div>

          {/* Chips de Seleção */}
          <div className="mt-2 flex flex-wrap gap-2 max-h-48 overflow-y-auto pt-1">
            {filteredInterests.map((interest) => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-[#232834] text-gray-300 hover:bg-[#2b3140]'
                  }`}
                >
                  <span>{interest}</span>
                  {isSelected && <Check size={13} strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-2 w-full rounded-full bg-blue-600 py-4 text-center font-bold text-white shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {saving ? 'SALVANDO ALTERAÇÕES...' : 'SALVAR ALTERAÇÕES'}
        </button>
      </form>
    </div>
  );
}