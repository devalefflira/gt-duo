'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Menu, 
  MoreVertical, 
  Plus, 
  Inbox, 
  Folder, 
  Check, 
  Send, 
  ChevronLeft,
  Award,
  Lock,
  Coins
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Task, TaskList, AchievementItem } from '@/core/tasks/types';
import { TaskBottomNav, TaskTab } from '@/components/tasks/TaskBottomNav';
import { TaskMatrixView } from '@/components/tasks/TaskMatrixView';
import { TaskFocusView } from '@/components/tasks/TaskFocusView';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function TasksPage() {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<TaskTab>('tasks');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [lists, setLists] = useState<TaskList[]>([]);
  const [activeList, setActiveList] = useState<TaskList | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [gtCoins, setGtCoins] = useState(0);

  // Nova lista no drawer
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Saldo
    const { data: profile } = await supabase
      .from('profiles')
      .select('gt_coins')
      .eq('id', user.id)
      .maybeSingle();
    if (profile) setGtCoins(profile.gt_coins || 0);

    // Listas
    const { data: userLists } = await supabase
      .from('task_lists')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    let currentInbox: TaskList | null = null;
    if (userLists && userLists.length > 0) {
      setLists(userLists as TaskList[]);
      currentInbox = userLists.find((l) => l.is_inbox) || userLists[0];
      setActiveList(currentInbox);
    }

    // Tarefas
    const { data: allTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'trash')
      .order('status', { ascending: true })
      .order('created_at', { ascending: false });

    if (allTasks) setTasks(allTasks as Task[]);

    // Medalhas do Módulo Tarefas
    const { data: catalogAch } = await supabase
      .from('achievements')
      .select('*')
      .eq('category', 'tasks')
      .order('reward_coins', { ascending: true });

    const { data: userAch } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', user.id);

    const unlockedIds = new Set(userAch?.map((ua) => ua.achievement_id) || []);

    if (catalogAch) {
      setAchievements(
        catalogAch.map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          icon: a.icon || 'award',
          reward_coins: a.reward_coins,
          unlocked: unlockedIds.has(a.id),
        }))
      );
    }

    setLoading(false);
  };

  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';

    setTasks(tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));

    await supabase
      .from('tasks')
      .update({
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', task.id);

    // Atualiza o saldo caso tenha ganhado GTCoins
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('gt_coins').eq('id', user.id).maybeSingle();
      if (profile) setGtCoins(profile.gt_coins || 0);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('task_lists')
      .insert({
        user_id: user.id,
        name: newListName.trim(),
        icon: 'folder',
        color: '#3b82f6',
      })
      .select()
      .single();

    if (!error && data) {
      setLists([...lists, data as TaskList]);
      setNewListName('');
      setIsAddingList(false);
    }
  };

  const displayedTasks = activeList
    ? tasks.filter((t) => t.list_id === activeList.id)
    : tasks;

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-md flex-col bg-black text-white px-4 pt-3 pb-24">
      {/* 1. ABA TAREFAS (LISTA PADRÃO) */}
      {activeTab === 'tasks' && (
        <>
          <header className="sticky top-0 z-20 flex items-center justify-between bg-black/90 py-2 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="p-1 text-gray-300 hover:text-white"
              >
                <Menu size={24} />
              </button>
              <h1 className="text-base font-bold text-white tracking-tight">
                {activeList ? activeList.name : 'Caixa de Entrada'}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-[#1b1e26] px-2.5 py-1 border border-amber-500/20 text-amber-400">
                <Coins size={13} />
                <span className="text-[11px] font-black">{gtCoins}</span>
              </div>
              <button
                onClick={() => router.push('/menu')}
                className="p-1 text-gray-400 hover:text-white"
                title="Voltar ao Menu"
              >
                <ChevronLeft size={22} />
              </button>
            </div>
          </header>

          <main className="flex-1 py-3">
            {loading ? (
              <div className="flex min-h-[50vh] items-center justify-center text-xs text-gray-600">
                Carregando tarefas...
              </div>
            ) : displayedTasks.length === 0 ? (
              <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                <div className="relative mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-[#15171e] border border-gray-800/80 shadow-2xl">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                    <Send size={24} className="-mr-0.5 -mt-0.5" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-gray-200">Sem tarefas</h3>
                <p className="mt-1 text-xs text-gray-500 max-w-[200px]">
                  Clique no + para adicionar sua primeira tarefa
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {displayedTasks.map((task) => {
                  const isCompleted = task.status === 'completed';

                  return (
                    <div
                      key={task.id}
                      className={cn(
                        'flex items-center gap-3 rounded-2xl p-3.5 transition-all border',
                        isCompleted
                          ? 'bg-[#121418]/60 border-gray-900 opacity-50'
                          : 'bg-[#15171e] border-gray-800/80 hover:border-gray-700'
                      )}
                    >
                      <button
                        onClick={() => handleToggleTask(task)}
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all',
                          isCompleted
                            ? 'border-blue-500 bg-blue-600 text-white'
                            : 'border-gray-600 hover:border-blue-400 bg-transparent'
                        )}
                      >
                        {isCompleted && <Check size={14} strokeWidth={3} />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-xs font-semibold truncate',
                          isCompleted ? 'line-through text-gray-500' : 'text-gray-200'
                        )}>
                          {task.title}
                        </p>
                        {task.due_date && (
                          <span className="text-[10px] text-gray-500">
                            Prazo: {format(new Date(task.due_date), "dd 'de' MMM", { locale: ptBR })}
                          </span>
                        )}
                      </div>

                      {task.recurrence && task.recurrence !== 'none' && (
                        <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                          Recorrente
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </>
      )}

      {/* 2. ABA MATRIZ DE EISENHOWER */}
      {activeTab === 'matrix' && (
        <TaskMatrixView
          tasks={tasks}
          onToggleTask={handleToggleTask}
        />
      )}

      {/* 3. ABA MODO FOCO */}
      {activeTab === 'focus' && (
        <TaskFocusView
          tasks={tasks}
          onSessionComplete={() => {
            loadData();
          }}
        />
      )}

      {/* 4. ABA MEDALHAS */}
      {activeTab === 'medals' && (
        <div className="flex flex-col flex-1 pb-16">
          <div className="flex items-center justify-between pb-4 border-b border-gray-900">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Conquistas de Produtividade</h2>
              <p className="text-[10px] text-gray-400">Medalhas desbloqueadas com foco e execução</p>
            </div>
            <span className="text-xs font-bold text-blue-400">
              {achievements.filter((a) => a.unlocked).length} / {achievements.length}
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-2.5">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={cn(
                  'flex items-center gap-3.5 rounded-2xl p-3.5 border transition-all',
                  ach.unlocked
                    ? 'bg-[#15171e] border-blue-500/40 shadow-sm'
                    : 'bg-[#121418]/60 border-gray-900 opacity-50'
                )}
              >
                <div
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
                    ach.unlocked
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      : 'bg-[#1b1e26] text-gray-600 border-gray-800'
                  )}
                >
                  {ach.unlocked ? <Award size={22} /> : <Lock size={18} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white truncate">{ach.title}</h4>
                    <span className="text-[10px] font-black text-amber-400 flex items-center gap-0.5">
                      +{ach.reward_coins} GTCoins
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                    {ach.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botão Flutuante (+) para Criar Tarefa em Tela Cheia */}
      {activeTab === 'tasks' && (
        <button
          onClick={() => router.push('/tasks/new')}
          className="fixed bottom-16 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/30 active:scale-95 transition-transform"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      )}

      {/* Drawer Lateral de Listas */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative z-10 flex h-full w-[82%] max-w-xs flex-col bg-[#14161d] p-5 shadow-2xl border-r border-gray-800">
            <div className="flex items-center gap-3 pb-5 border-b border-gray-800/80">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                GT
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">GT Tarefas</h3>
                <p className="text-[10px] text-gray-400">Produtividade Pessoal</p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-1 overflow-y-auto flex-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2 mb-1">
                Listas
              </span>

              {lists.map((list) => {
                const isCurrent = activeList?.id === list.id;
                return (
                  <button
                    key={list.id}
                    onClick={() => {
                      setActiveList(list);
                      setIsDrawerOpen(false);
                    }}
                    className={cn(
                      'flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-all',
                      isCurrent
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'text-gray-300 hover:bg-gray-800/40'
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {list.is_inbox ? <Inbox size={16} className="text-blue-400" /> : <Folder size={16} className="text-gray-400" />}
                      <span className="truncate">{list.name}</span>
                    </div>
                  </button>
                );
              })}

              {isAddingList ? (
                <div className="mt-2 flex items-center gap-1.5 px-2">
                  <input
                    type="text"
                    placeholder="Nome da lista..."
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    className="w-full rounded-lg bg-[#1a1d24] px-2.5 py-1.5 text-xs text-white outline-none border border-gray-700"
                  />
                  <button
                    onClick={handleCreateList}
                    className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-bold text-white"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingList(true)}
                  className="mt-2 flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-300"
                >
                  <Plus size={14} />
                  <span>Adicionar Lista</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Barra Inferior do Módulo */}
      <TaskBottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
}