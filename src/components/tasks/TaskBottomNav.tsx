'use client';

import { CheckSquare, Calendar, Grid2X2, Target, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TaskTab = 'tasks' | 'calendar' | 'matrix' | 'focus' | 'more';

interface TaskBottomNavProps {
  activeTab: TaskTab;
  onChangeTab: (tab: TaskTab) => void;
}

export function TaskBottomNav({ activeTab, onChangeTab }: TaskBottomNavProps) {
  const tabs = [
    { id: 'tasks' as TaskTab, label: 'Tarefas', icon: CheckSquare },
    { id: 'calendar' as TaskTab, label: 'Calendário', icon: Calendar },
    { id: 'matrix' as TaskTab, label: 'Matriz', icon: Grid2X2 },
    { id: 'focus' as TaskTab, label: 'Foco', icon: Target },
    { id: 'more' as TaskTab, label: 'Mais', icon: MoreHorizontal },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md bg-[#121418]/95 backdrop-blur-md border-t border-gray-900 px-3 py-2">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-3 transition-colors',
                isActive ? 'text-blue-500' : 'text-gray-500 hover:text-gray-300'
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}