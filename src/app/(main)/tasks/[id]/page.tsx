'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ChevronLeft, 
  Check, 
  Calendar, 
  Flag, 
  Repeat, 
  Folder, 
  Plus, 
  Trash2, 
  CheckSquare, 
  Loader2,
  Inbox
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Task, TaskChecklistItem, TaskList, TaskPriorityLevel, TaskRecurrence } from '@/core/tasks/types';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;
  const supabase = createClient();

  const [task, setTask] = useState<Task | null>(null);
  const [lists, setLists] = useState<TaskList[]>([]);
  const [checklists, setChecklists] = useState<TaskChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (taskId) {
      loadTaskData();
    }
  }, [taskId]);

  const loadTaskData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Listas
    const { data: userLists } = await supabase
      .from('task_lists')
      .select('*')
      .eq('user_id', user.id);
    if (userLists) setLists(userLists as TaskList[]);

    // Tarefa
    const { data: taskData } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single();

    if (taskData) {
      setTask(taskData as Task);

      // Checklists vinculados
      const { data: checklistData } = await supabase
        .from('task_checklists')
        .select('*')
        .eq('task_id', taskId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (checklistData) setChecklists(checklistData as TaskChecklistItem[]);
    }
    setLoading(false);
  };

  const handleToggleChecklist = async (item: TaskChecklistItem) => {
    const updatedStatus = !item.is_completed;
    setChecklists(checklists.map((c) => (c.id === item.id ? { ...c, is_completed: updatedStatus } : c)));

    await supabase
      .from('task_checklists')
      .update({ is_completed: updatedStatus })
      .eq('id', item.id);
  };

  const handleAddChecklistItem = async () => {
    if (!newChecklistText.trim() || !task) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      task_id: task.id,
      user_id: user.id,
      title: newChecklistText.trim(),
      is_completed: false,
      sort_order: checklists.length,
    };

    const { data, error } = await supabase
      .from('task_checklists')
      .insert(payload)
      .select()
      .single();

    if (!error && data) {
      setChecklists([...checklists, data as TaskChecklistItem]);
      setNewChecklistText('');
    }
  };

  const handleDeleteChecklistItem = async (id: string) => {
    setChecklists(checklists.filter((c) => c.id !== id));
    await supabase.from('task_checklists').delete().eq('id', id);
  };

  const handleToggleStatus = async () => {
    if (!task) return;
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    setTask({ ...task, status: newStatus });

    await supabase
      .from('tasks')
      .update({
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', task.id);
  };

  const handleDeleteTask = async () => {
    if (!confirm('Deseja excluir esta tarefa?')) return;
    await supabase.from('tasks').delete().eq('id', taskId);
    router.push('/tasks');
    router.refresh();
  };

  if (loading || !task) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-black text-xs text-gray-500">
        Carregando detalhes...
      </div>
    );
  }

  const taskList = lists.find((l) => l.id === task.list_id);
  const isCompleted = task.status === 'completed';

  const priorityLabels: Record<string, { label: string; color: string }> = {
    urgent: { label: 'Alta', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
    high: { label: 'Média', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    medium: { label: 'Baixa', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
    low: { label: 'Muito Baixa', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  };

  const currentPriority = priorityLabels[task.priority_name || 'medium'] || priorityLabels.medium;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-black px-5 py-6 text-white pb-24">
      {/* Header Fixo */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white"
        >
          <ChevronLeft size={20} />
          <span>Voltar</span>
        </button>

        <span className="text-xs font-bold text-gray-400">Detalhes da Tarefa</span>

        <button
          onClick={handleDeleteTask}
          className="p-1.5 text-gray-500 hover:text-rose-400"
          title="Excluir Tarefa"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Título & Toggle Concluído */}
      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#14161d] p-4 border border-gray-800/80">
        <button
          onClick={handleToggleStatus}
          className={cn(
            'mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all',
            isCompleted
              ? 'border-blue-500 bg-blue-600 text-white'
              : 'border-gray-600 hover:border-blue-400 bg-transparent'
          )}
        >
          {isCompleted && <Check size={16} strokeWidth={3} />}
        </button>

        <div className="flex-1">
          <h2 className={cn('text-base font-bold leading-snug', isCompleted && 'line-through text-gray-500')}>
            {task.title}
          </h2>
          {task.description && (
            <p className="mt-2 text-xs text-gray-400 whitespace-pre-wrap leading-relaxed">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Metadados / Informações em Pílulas */}
      <div className="mt-4 flex flex-col gap-2.5 rounded-2xl bg-[#14161d] p-4 border border-gray-800/80 text-xs">
        {/* Lista */}
        <div className="flex items-center justify-between py-1 border-b border-gray-800/50">
          <span className="text-gray-400 flex items-center gap-1.5">
            {taskList ? <Folder size={14} className="text-gray-400" /> : <Inbox size={14} className="text-blue-400" />}
            <span>Lista</span>
          </span>
          <span className="font-bold text-white">
            {taskList ? taskList.name : 'Caixa de Entrada'}
          </span>
        </div>

        {/* Prazo */}
        {task.due_date && (
          <div className="flex items-center justify-between py-1 border-b border-gray-800/50">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Calendar size={14} className="text-blue-400" />
              <span>Prazo de Entrega</span>
            </span>
            <span className="font-bold text-white">
              {format(parseISO(task.due_date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
            </span>
          </div>
        )}

        {/* Prioridade */}
        <div className="flex items-center justify-between py-1 border-b border-gray-800/50">
          <span className="text-gray-400 flex items-center gap-1.5">
            <Flag size={14} className="text-blue-400" />
            <span>Prioridade</span>
          </span>
          <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-black border', currentPriority.color)}>
            {currentPriority.label}
          </span>
        </div>

        {/* Recorrência */}
        {task.recurrence && task.recurrence !== 'none' && (
          <div className="flex items-center justify-between py-1">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Repeat size={14} className="text-blue-400" />
              <span>Repetição</span>
            </span>
            <span className="font-bold text-blue-400 capitalize">
              {task.recurrence === 'daily' && 'Diariamente'}
              {task.recurrence === 'weekdays' && 'Dias Úteis'}
              {task.recurrence === 'weekly' && 'Semanalmente'}
              {task.recurrence === 'monthly' && 'Mensalmente'}
            </span>
          </div>
        )}
      </div>

      {/* Seção Checklists / Subitens */}
      <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-[#14161d] p-4 border border-gray-800/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
            <CheckSquare size={14} className="text-blue-400" />
            <span>Checklist</span>
          </span>
          {checklists.length > 0 && (
            <span className="text-[11px] font-bold text-teal-400">
              {checklists.filter((c) => c.is_completed).length}/{checklists.length}
            </span>
          )}
        </div>

        {/* Inserir novo item */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Adicionar etapa..."
            value={newChecklistText}
            onChange={(e) => setNewChecklistText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddChecklistItem();
              }
            }}
            className="flex-1 rounded-xl bg-[#1b1e26] px-3 py-2 text-xs text-white outline-none border border-gray-800"
          />
          <button
            onClick={handleAddChecklistItem}
            className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Lista de Itens do Checklist */}
        <div className="flex flex-col gap-2 mt-1">
          {checklists.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center justify-between rounded-xl p-2.5 bg-[#1b1e26] border border-gray-800/60 transition-all',
                item.is_completed && 'opacity-50'
              )}
            >
              <button
                onClick={() => handleToggleChecklist(item)}
                className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
              >
                <div
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all',
                    item.is_completed
                      ? 'border-blue-500 bg-blue-600 text-white'
                      : 'border-gray-600 bg-transparent'
                  )}
                >
                  {item.is_completed && <Check size={12} strokeWidth={3} />}
                </div>
                <span className={cn('text-xs truncate', item.is_completed ? 'line-through text-gray-500' : 'text-gray-200')}>
                  {item.title}
                </span>
              </button>

              <button
                onClick={() => item.id && handleDeleteChecklistItem(item.id)}
                className="p-1 text-gray-500 hover:text-rose-400"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}