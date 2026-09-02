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
  X, 
  Send, 
  Loader2,
  ChevronLeft
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Task, TaskList, TaskPriority } from '@/core/tasks/types';
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

  // Criação de Tarefa
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('q4');
  const [submittingTask, setSubmittingTask] = useState(false);

  // Criação de Lista no Drawer
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

    const { data: allTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'trash')
      .order('status', { ascending: true })
      .order('created_at', { ascending: false });

    if (allTasks) {
      setTasks(allTasks as Task[]);
    }

    setLoading(false);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !activeList) return;

    setSubmittingTask(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isUrgent = newTaskPriority === 'q1' || newTaskPriority === 'q3';
    const isImportant = newTaskPriority === 'q1' || newTaskPriority === 'q2';

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        list_id: activeList.id,
        title: newTaskTitle.trim(),
        priority: newTaskPriority,
        is_urgent: isUrgent,
        is_important: isImportant,
        status: 'pending',
      })
      .select()
      .single();

    if (!error && data) {
      setTasks([data as Task, ...tasks]);
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
    setSubmittingTask(false);
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
      {/* Visualização da Aba 1: Tarefas (Checklist padrão) */}
      {activeTab === 'tasks' && (
        <>
          <header className="sticky top-0 z-20 flex items-center justify-between bg-black/90 py-2 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="p-1 text-gray-300 hover:text-white transition-colors"
              >
                <Menu size={24} />
              </button>
              <h1 className="text-base font-bold text-white tracking-tight">
                {activeList ? activeList.name : 'Caixa de Entrada'}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/menu')}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Voltar ao Menu"
              >
                <ChevronLeft size={22} />
              </button>
              <button className="p-1 text-gray-400 hover:text-white">
                <MoreVertical size={20} />
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
                  Capture aqui as tarefas e ideias
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
                            {format(new Date(task.due_date), "dd 'de' MMM", { locale: ptBR })}
                          </span>
                        )}
                      </div>

                      <span className="rounded-md px-1.5 py-0.5 text-[9px] font-bold border border-gray-700 text-gray-400 uppercase">
                        {task.priority?.toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </>
      )}

      {/* Visualização da Aba 3: Matriz de Eisenhower */}
      {activeTab === 'matrix' && (
        <TaskMatrixView
          tasks={tasks}
          onToggleTask={handleToggleTask}
          onAddTaskToQuadrant={(quadrant) => {
            setNewTaskPriority(quadrant);
            setIsAddingTask(true);
          }}
        />
      )}

      {/* Visualização da Aba 4: Modo Foco */}
      {activeTab === 'focus' && (
        <TaskFocusView
          tasks={tasks}
          onSessionComplete={() => {
            loadData();
          }}
        />
      )}

      {/* Visualização da Aba 2 & 5 (Calendário e Mais) */}
      {(activeTab === 'calendar' || activeTab === 'more') && (
        <div className="flex flex-1 flex-col items-center justify-center text-center py-24 text-gray-500">
          <p className="text-xs">Visualização em sincronização contínua.</p>
        </div>
      )}

      {/* Botão Flutuante (+) para Adicionar Tarefa */}
      {activeTab !== 'focus' && (
        <button
          onClick={() => setIsAddingTask(true)}
          className="fixed bottom-16 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/30 active:scale-95 transition-transform"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      )}

      {/* Modal Inferior de Adicionar Tarefa */}
      {isAddingTask && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm p-0">
          <form
            onSubmit={handleCreateTask}
            className="w-full max-w-md rounded-t-3xl bg-[#1a1d24] border-t border-gray-800 p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-2.5 mb-3">
              <span className="text-xs font-bold text-gray-400">Nova Tarefa</span>
              <button
                type="button"
                onClick={() => setIsAddingTask(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <input
              type="text"
              autoFocus
              placeholder="O que você precisa fazer?"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder-gray-500 py-1"
            />

            <div className="mt-4 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-gray-400">Quadrante da Matriz:</span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'q1' as TaskPriority, label: 'Q1' },
                  { id: 'q2' as TaskPriority, label: 'Q2' },
                  { id: 'q3' as TaskPriority, label: 'Q3' },
                  { id: 'q4' as TaskPriority, label: 'Q4' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setNewTaskPriority(p.id)}
                    className={cn(
                      'rounded-xl py-2 px-1 text-[10px] font-extrabold transition-all border text-center',
                      newTaskPriority === p.id
                        ? 'bg-white text-gray-950 border-white'
                        : 'bg-[#121418] border-gray-800 text-gray-400'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingTask || !newTaskTitle.trim()}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/30 active:scale-98 transition-all disabled:opacity-50"
            >
              {submittingTask ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              <span>Adicionar Tarefa</span>
            </button>
          </form>
        </div>
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

      {/* Barra de Navegação Inferior */}
      <TaskBottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
}