'use client';

import { Task } from '@/core/tasks/types';
import { Check, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskMatrixViewProps {
  tasks: Task[];
  onToggleTask: (task: Task) => void;
}

export function TaskMatrixView({ tasks, onToggleTask }: TaskMatrixViewProps) {
  // Lógica de Separação Automática
  const classifyTask = (t: Task): 'q1' | 'q2' | 'q3' | 'q4' => {
    const isUrgentDate = t.due_date ? (isToday(new Date(t.due_date)) || isPast(new Date(t.due_date))) : false;
    const isHighPriority = t.priority_name === 'urgent' || t.priority_name === 'high';

    if (isHighPriority && isUrgentDate) return 'q1';
    if (isHighPriority && !isUrgentDate) return 'q2';
    if (!isHighPriority && isUrgentDate) return 'q3';
    return 'q4';
  };

  const quadrants = [
    {
      id: 'q1' as const,
      num: 'I',
      title: 'Urgente e Importante',
      subtitle: 'Fazer Agora',
      textColor: 'text-rose-400',
      numBadge: 'bg-rose-500 text-white',
    },
    {
      id: 'q2' as const,
      num: 'II',
      title: 'Não Urgente e Importante',
      subtitle: 'Planejar',
      textColor: 'text-amber-400',
      numBadge: 'bg-amber-500 text-gray-950 font-black',
    },
    {
      id: 'q3' as const,
      num: 'III',
      title: 'Urgente e Não Importante',
      subtitle: 'Delegar / Rápido',
      textColor: 'text-blue-400',
      numBadge: 'bg-blue-500 text-white',
    },
    {
      id: 'q4' as const,
      num: 'IV',
      title: 'Não Urgente e Não Importante',
      subtitle: 'Eliminar / Relaxar',
      textColor: 'text-emerald-400',
      numBadge: 'bg-emerald-500 text-gray-950 font-black',
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 px-1">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Matriz de Eisenhower</h2>
          <p className="text-[10px] text-gray-400">Classificação inteligente baseada em prazo e prioridade</p>
        </div>
        <button className="text-gray-400 hover:text-white p-1">
          <MoreVertical size={18} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 flex-1 pb-16">
        {quadrants.map((q) => {
          const qTasks = tasks.filter((t) => classifyTask(t) === q.id);

          return (
            <div
              key={q.id}
              className="flex flex-col rounded-3xl bg-[#14161d] p-3 border border-gray-800/80 min-h-[220px]"
            >
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-800/60">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-black', q.numBadge)}>
                    {q.num}
                  </span>
                  <span className={cn('text-[11px] font-bold truncate', q.textColor)}>
                    {q.title}
                  </span>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
                {qTasks.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center text-center">
                    <span className="text-[10px] text-gray-600 font-medium">Nenhuma tarefa</span>
                  </div>
                ) : (
                  qTasks.map((t) => {
                    const isCompleted = t.status === 'completed';

                    return (
                      <div
                        key={t.id}
                        className={cn(
                          'flex items-start gap-2 rounded-xl p-2 bg-[#1b1e26] border border-gray-800/60 transition-all',
                          isCompleted && 'opacity-40'
                        )}
                      >
                        <button
                          onClick={() => onToggleTask(t)}
                          className={cn(
                            'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all',
                            isCompleted
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'border-gray-600 bg-transparent hover:border-blue-400'
                          )}
                        >
                          {isCompleted && <Check size={11} strokeWidth={3} />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className={cn(
                            'text-[11px] font-medium leading-tight truncate',
                            isCompleted ? 'line-through text-gray-500' : 'text-gray-200'
                          )}>
                            {t.title}
                          </p>
                          {t.due_date && (
                            <span className="text-[9px] text-gray-500 block mt-0.5">
                              {format(new Date(t.due_date), "dd 'de' MMM", { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}