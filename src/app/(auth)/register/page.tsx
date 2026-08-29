'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Sanitização do username: remove @, espaços e força minúsculas
    const cleanUsername = username.replace(/[@\s]/g, '').toLowerCase();

    if (cleanUsername.length < 3) {
      setError('O nome de usuário deve ter pelo menos 3 caracteres.');
      setLoading(false);
      return;
    }

    // E-mail interno sintético baseado no username único
    const internalEmail = `${cleanUsername}.gtduo@gmail.com`;

    const { error: signUpError } = await supabase.auth.signUp({
      email: internalEmail,
      password,
      options: {
        data: {
          full_name: fullName,
          username: cleanUsername,
        },
      },
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('Este nome de usuário já está em uso.');
      } else {
        setError(signUpError.message);
      }
      setLoading(false);
    } else {
      router.push('/onboarding');
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-dvh flex-col justify-between bg-[#13151b] px-6 py-10 text-white">
      <div className="flex flex-col items-center pt-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Criar Conta</h1>
        <p className="mt-2 text-sm text-gray-400">Comece sua jornada com seu parceiro(a)</p>
      </div>

      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-xl bg-red-500/10 p-3 text-center text-xs font-medium text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-400">Nome Completo</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Como podemos te chamar?"
            className="w-full rounded-2xl bg-[#1e222b] px-4 py-3.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-400">Nome de Usuário</label>
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-sm font-bold text-gray-500">@</span>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[@\s]/g, ''))}
              placeholder="usuario"
              className="w-full rounded-2xl bg-[#1e222b] pl-8 pr-4 py-3.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-400">Senha</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="w-full rounded-2xl bg-[#1e222b] px-4 py-3.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-full bg-blue-600 py-4 text-center font-bold text-white shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? 'Cadastrando...' : 'CONTINUAR'}
        </button>
      </form>

      <div className="text-center text-xs text-gray-400">
        Já possui conta?{' '}
        <Link href="/login" className="font-semibold text-blue-400 hover:underline">
          Faça Login
        </Link>
      </div>
    </div>
  );
}