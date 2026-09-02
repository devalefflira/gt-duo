'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, Target, Users, Flame, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Oculta a barra global do GT Duo em rotas de tela cheia ou que possuem navegação própria
  const isTasksRoute = pathname.startsWith('/tasks');
  const isReadingSession = pathname.startsWith('/reading/session');
  const isReadingGoals = pathname.startsWith('/reading/goals');
  const hideGlobalNav = isTasksRoute || isReadingSession || isReadingGoals;

  const mainTabs = [
    { id: 'menu', label: 'MENU', icon: LayoutGrid, href: '/menu' },
    { id: 'challenges', label: 'DESAFIOS', icon: Target, href: '/challenges' },
    { id: 'duo', label: 'DUO', icon: Users, href: '/duo' },
    { id: 'group', label: 'GRUPO', icon: Flame, href: '/group' },
    { id: 'profile', label: 'EU', icon: User, href: '/profile' },
  ];

  return (
    <div className="min-h-dvh bg-[#121418] text-white">
      <main className="min-h-dvh">{children}</main>

      {!hideGlobalNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md bg-[#121418]/95 backdrop-blur-md border-t border-gray-900 px-3 py-2">
          <div className="flex items-center justify-around">
            {mainTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href || (tab.href !== '/menu' && pathname.startsWith(tab.href));

              return (
                <button
                  key={tab.id}
                  onClick={() => router.push(tab.href)}
                  className={cn(
                    'flex flex-col items-center justify-center py-1 px-2 text-[10px] font-bold tracking-wider transition-colors',
                    isActive ? 'text-teal-400' : 'text-gray-500 hover:text-gray-300'
                  )}
                >
                  <Icon size={20} className="mb-0.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}