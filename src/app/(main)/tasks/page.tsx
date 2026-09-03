'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Menu, 
  Plus, 
  Inbox, 
  Folder, 
  Check, 
  Send, 
  ChevronLeft, 
  Award, 
  Lock, 
  Coins, 
  Calendar as CalendarIcon, 
  Clock,
  Repeat,
  CheckSquare,
  ChevronRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Task, TaskList, AchievementItem } from '@/core/tasks/types';
import { TaskBottomNav, TaskTab } from '@/components/tasks/TaskBottomNav';
import { TaskMatrixView } from '@/components/tasks/TaskMatrixView';
import { TaskFocusView } from '@/components/tasks/TaskFocusView';
import { cn } from '@/lib/utils';
import { format, isToday, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type SmartFilter = 'inbox' | 'today' | 'week';

export default function TasksPage() {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<TaskTab>('tasks');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Perfil do Usuário
  const [userName, setUserName] = useState('Usuário');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [gtCoins, setGtCoins] = useState(0);

  // Navegação Lateral
  const [smartFilter, setSmartFilter] = useState<SmartFilter>('inbox');
  const [activeList, setActiveList] = useState<TaskList | null>(null);

  // Dados
  const [lists, setLists] = useState<TaskList[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);

  // Criação de Lista
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

    // 1. Carrega Perfil do Usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, first_name, nickname, avatar_url, gt_coins')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      setUserName(profile.nickname || profile.first_name || profile.full_name?.split(' ')[0] || 'Usuário');
      setUserAvatar(profile.avatar_url);
      setGtCoins(profile.gt_coins || 0);
    }

    // 2. Listas
    const { data: userLists } = await supabase
      .from('task_lists')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_inbox', false)
      .order('name', { ascending: true });

    if (userLists) setLists(userLists as TaskList[]);

    // 3. Tarefas
    const { data: allTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'trash')
      .order('status', { ascending: true })
      .order('created_at', { ascending: false });

    if (allTasks) setTasks(allTasks as Task[]);

    // 4. Medalhas
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

  const handleToggleTask = async (task: Task, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const isNowCompleted = task.status !== 'completed';
    const newStatus = isNowCompleted ? 'completed' : 'pending';

    setTasks(tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));

    await supabase
      .from('tasks')
      .update({
        status: newStatus,
        completed_at: isNowCompleted ? new Date().toISOString() : null,
      })
      .eq('id', task.id);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: p } = await supabase.from('profiles').select('gt_coins').eq('id', user.id).maybeSingle();
      if (p) setGtCoins(p.gt_coins || 0);
    }
  };

  const handleCreateList = async () => {
    const cleanName = newListName.trim();
    if (!cleanName) return;

    const nameExists = lists.some((l) => l.name.toLowerCase() === cleanName.toLowerCase());
    if (nameExists) {
      alert('Já existe uma lista com este nome.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('task_lists')
      .insert({
        user_id: user.id,
        name: cleanName,
        icon: 'folder',
        is_inbox: false,
      })
      .select()
      .single();

    if (!error && data) {
      setLists([...lists, data as TaskList]);
      setNewListName('');
      setIsAddingList(false);
    }
  };

  const priorityMeta: Record<string, { label: string; style: string }> = {
    urgent: { label: 'Alta', style: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
    high: { label: 'Média', style: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    medium: { label: 'Baixa', style: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
    low: { label: 'Muito Baixa', style: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  };

  // Filtragem
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  let displayedTasks: Task[] = [];
  let headerTitle = 'Caixa de Entrada';

  if (activeList) {
    headerTitle = activeList.name;
    displayedTasks = tasks.filter((t) => t.list_id === activeList.id);
  } else {
    if (smartFilter === 'inbox') {
      headerTitle = 'Caixa de Entrada';
      displayedTasks = tasks.filter((t) => !t.list_id);
    } else if (smartFilter === 'today') {
      headerTitle = 'Hoje';
      displayedTasks = tasks.filter((t) => {
        if (!t.due_date) return false;
        return isToday(parseISO(t.due_date));
      });
    } else if (smartFilter === 'week') {
      headerTitle = 'Essa Semana';
      displayedTasks = tasks.filter((t) => {
        if (!t.due_date) return false;
        const d = parseISO(t.due_date);
        return isWithinInterval(d, { start: weekStart, end: weekEnd });
      });
    }
  }

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-md flex-col bg-black text-white px-4 pt-3 pb-24">
      {/* 1. ABA TAREFAS */}
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
              <h1 className="text-base font-bold text-white tracking-tight truncate max-w-[200px]">
                {headerTitle}
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
              <div className="flex flex-col gap-2.5">
                {displayedTasks.map((task) => {
                  const isCompleted = task.status === 'completed';
                  const taskListName = lists.find((l) => l.id === task.list_id)?.name;
                  const priority = priorityMeta[task.priority_name || 'medium'] || priorityMeta.medium;

                  return (
                    <div
                      key={task.id}
                      onClick={() => router.push(`/tasks/detail?id=${task.id}`)}
                      className={cn(
                        'flex flex-col gap-2 rounded-2xl p-3.5 transition-all border cursor-pointer active:scale-[0.99]',
                        isCompleted
                          ? 'bg-[#121418]/60 border-gray-900 opacity-50'
                          : 'bg-[#15171e] border-gray-800/80 hover:border-gray-700 shadow-sm'
                      )}
                    >
                      {/* Linha Superior: Checkbox, Título e Seta */}
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={(e) => handleToggleTask(task, e)}
                          className={cn(
                            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all',
                            isCompleted
                              ? 'border-blue-500 bg-blue-600 text-white'
                              : 'border-gray-600 hover:border-blue-400 bg-transparent'
                          )}
                        >
                          {isCompleted && <Check size={14} strokeWidth={3} />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <h4 className={cn(
                            'text-xs font-bold leading-snug truncate',
                            isCompleted ? 'line-through text-gray-500' : 'text-gray-100'
                          )}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                              {task.description}
                            </p>
                          )}
                        </div>

                        <ChevronRight size={14} className="text-gray-600 shrink-0 mt-1" />
                      </div>

                      {/* Linha Inferior: Badges de Metadados */}
                      <div className="flex flex-wrap items-center gap-1.5 pl-8 text-[10px]">
                        {/* Prazo */}
                        {task.due_date && (
                          <span className="flex items-center gap-1 rounded-md bg-[#1b1e26] px-2 py-0.5 font-semibold text-gray-300 border border-gray-800">
                            <CalendarIcon size={11} className="text-blue-400" />
                            <span>{format(parseISO(task.due_date), "dd 'de' MMM", { locale: ptBR })}</span>
                          </span>
                        )}

                        {/* Prioridade */}
                        <span className={cn('rounded-md px-2 py-0.5 font-black border', priority.style)}>
                          {priority.label}
                        </span>

                        {/* Recorrência */}
                        {task.recurrence && task.recurrence !== 'none' && (
                          <span className="flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 font-bold text-blue-400 border border-blue-500/20">
                            <Repeat size={11} />
                            <span>
                              {task.recurrence === 'daily' && 'Diária'}
                              {task.recurrence === 'weekdays' && 'Dias Úteis'}
                              {task.recurrence === 'weekly' && 'Semanal'}
                              {task.recurrence === 'monthly' && 'Mensal'}
                            </span>
                          </span>
                        )}

                        {/* Lista/Pasta */}
                        <span className="flex items-center gap-1 rounded-md bg-[#1b1e26] px-2 py-0.5 font-semibold text-gray-400 border border-gray-800">
                          {taskListName ? <Folder size={11} /> : <Inbox size={11} className="text-blue-400" />}
                          <span>{taskListName || 'Caixa de Entrada'}</span>
                        </span>

                        {/* Checklist */}
                        {task.checklist_items_count > 0 && (
                          <span className="flex items-center gap-1 rounded-md bg-teal-500/10 px-2 py-0.5 font-bold text-teal-400 border border-teal-500/20">
                            <CheckSquare size={11} />
                            <span>{task.checklist_completed_count}/{task.checklist_items_count}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </>
      )}

      {/* 2. ABA MATRIZ */}
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

      {/* Botão Flutuante (+) */}
      {activeTab === 'tasks' && (
        <button
          onClick={() => router.push('/tasks/new')}
          className="fixed bottom-16 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/30 active:scale-95 transition-transform"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      )}

      {/* Drawer Lateral com Foto e Nome do Usuário */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative z-10 flex h-full w-[82%] max-w-xs flex-col bg-[#14161d] p-5 shadow-2xl border-r border-gray-800">
            {/* Header: Foto e Nome do Usuário Logado */}
            <div className="flex items-center gap-3 pb-5 border-b border-gray-800/80">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white overflow-hidden border border-blue-500/30">
                {userAvatar ? (
                  <img src={userAvatar} alt={userName} className="h-full w-full object-cover" />
                ) : (
                  userName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-white truncate">{userName}</h3>
                <p className="text-[10px] text-gray-400 truncate">Produtividade Pessoal</p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-1 overflow-y-auto flex-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2 mb-1">
                Filtros
              </span>

              {/* Caixa de Entrada */}
              <button
                onClick={() => {
                  setActiveList(null);
                  setSmartFilter('inbox');
                  setIsDrawerOpen(false);
                }}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-all',
                  !activeList && smartFilter === 'inbox'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-300 hover:bg-gray-800/40'
                )}
              >
                <Inbox size={16} className="text-blue-400" />
                <span>Caixa de Entrada</span>
              </button>

              {/* Hoje */}
              <button
                onClick={() => {
                  setActiveList(null);
                  setSmartFilter('today');
                  setIsDrawerOpen(false);
                }}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-all',
                  !activeList && smartFilter === 'today'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-300 hover:bg-gray-800/40'
                )}
              >
                <Clock size={16} className="text-amber-400" />
                <span>Hoje</span>
              </button>

              {/* Essa Semana */}
              <button
                onClick={() => {
                  setActiveList(null);
                  setSmartFilter('week');
                  setIsDrawerOpen(false);
                }}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-all',
                  !activeList && smartFilter === 'week'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-300 hover:bg-gray-800/40'
                )}
              >
                <CalendarIcon size={16} className="text-teal-400" />
                <span>Essa Semana</span>
              </button>

              {/* Listas e Pastas */}
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2 mt-4 mb-1">
                Listas & Pastas
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
                      'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-all',
                      isCurrent
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'text-gray-300 hover:bg-gray-800/40'
                    )}
                  >
                    <Folder size={16} className="text-gray-400" />
                    <span className="truncate">{list.name}</span>
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

      {/* Navegação Inferior */}
      <TaskBottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
}