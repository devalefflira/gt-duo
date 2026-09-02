'use client';

import { CheckSquare, Grid2X2, Target, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TaskTab = 'tasks' | 'matrix' | 'focus' | 'medals';

interface TaskBottomNavProps {
  activeTab: TaskTab;
  onChangeTab: (tab: TaskTab) => void;
}

export function TaskBottomNav({ activeTab, onChangeTab }: TaskBottomNavProps) {
  const tabs = [
    { id: 'tasks' as TaskTab, label: 'Tarefas', icon: CheckSquare },
    { id: 'matrix' as TaskTab, label: 'Matriz', icon: Grid2X2 },
    { id: 'focus' as TaskTab, label: 'Foco', icon: Target },
    { id: 'medals' as TaskTab, label: 'Medalhas', icon: Award },
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
                'flex flex-col items-center justify-center py-1 px-4 transition-colors',
                isActive ? 'text-blue-500' : 'text-gray-500 hover:text-gray-300'
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-bold mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}