'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Target, Users, Flame, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { label: 'MENU', href: '/menu', icon: LayoutGrid },
    { label: 'DESAFIOS', href: '/', icon: Target },
    { label: 'DUO', href: '/duo', icon: Users },
    { label: 'GRUPO', href: '/group', icon: Flame },
    { label: 'EU', href: '/profile', icon: User },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-[#121418] text-white">
      <main className="flex-1 pb-24">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-800/80 bg-[#161920]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 transition-colors',
                  isActive ? 'text-blue-500' : 'text-gray-400 hover:text-gray-200'
                )}
              >
                <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
                <span className="text-[9px] font-bold tracking-wider">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}