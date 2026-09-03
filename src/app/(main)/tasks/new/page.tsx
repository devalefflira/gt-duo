'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Trash2, Calendar, Repeat, Flag, CheckSquare, Loader2, Folder, Inbox } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { TaskList, TaskPriorityLevel, TaskRecurrence } from '@/core/tasks/types';
import { cn } from '@/lib/utils';

export default function NewTaskPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [recurrence, setRecurrence] = useState<TaskRecurrence>('none');
  const [priority, setPriority] = useState<TaskPriorityLevel>('medium');
  
  // Listas
  const [lists, setLists] = useState<TaskList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  // Checklist
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [currentChecklistInput, setCurrentChecklistInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('task_lists')
      .select('*')
      .eq('user_id', user.id)
      .order('is_inbox', { ascending: false })
      .order('name', { ascending: true });

    if (data && data.length > 0) {
      setLists(data as TaskList[]);
      const inbox = data.find((l) => l.is_inbox) || data[0];
      setSelectedListId(inbox.id);
    }
  };

  const handleAddChecklistItem = () => {
    if (!currentChecklistInput.trim()) return;
    setChecklistItems([...checklistItems, currentChecklistInput.trim()]);
    setCurrentChecklistInput('');
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Identifica se a lista escolhida é a Caixa de Entrada
    const targetList = lists.find((l) => l.id === selectedListId);
    const finalTargetListId = (targetList && !targetList.is_inbox) ? targetList.id : null;

    const { data: createdTask, error: taskError } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        list_id: finalTargetListId,
        title: title.trim(),
        description: description.trim() || null,
        start_date: startDate || null,
        due_date: dueDate || null,
        recurrence: recurrence,
        priority_name: priority,
        status: 'pending',
      })
      .select()
      .single();

    if (taskError || !createdTask) {
      alert('Erro ao criar tarefa. Tente novamente.');
      setSubmitting(false);
      return;
    }

    if (checklistItems.length > 0) {
      const checklistPayload = checklistItems.map((item, idx) => ({
        task_id: createdTask.id,
        user_id: user.id,
        title: item,
        is_completed: false,
        sort_order: idx,
      }));
      await supabase.from('task_checklists').insert(checklistPayload);
    }

    setSubmitting(false);
    router.push('/tasks');
    router.refresh();
  };

  const priorities: { id: TaskPriorityLevel; label: string; color: string }[] = [
    { id: 'urgent', label: 'Alta', color: 'bg-rose-500/20 text-rose-400 border-rose-500/40' },
    { id: 'high', label: 'Média', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
    { id: 'medium', label: 'Baixa', color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
    { id: 'low', label: 'Muito Baixa', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
  ];

  const recurrences: { id: TaskRecurrence; label: string }[] = [
    { id: 'none', label: 'Única' },
    { id: 'daily', label: 'Diariamente' },
    { id: 'weekdays', label: 'Dias Úteis' },
    { id: 'weekly', label: 'Semanalmente' },
    { id: 'monthly', label: 'Mensalmente' },
  ];

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-black px-5 py-6 text-white pb-28">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white"
        >
          <ChevronLeft size={20} />
          <span>Cancelar</span>
        </button>
        <h1 className="text-sm font-bold text-white">Nova Tarefa</h1>
        <button
          onClick={handleSave}
          disabled={submitting || !title.trim()}
          className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-md active:scale-95 disabled:opacity-40"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : 'Salvar'}
        </button>
      </div>

      <form onSubmit={handleSave} className="mt-5 flex flex-1 flex-col gap-4">
        {/* Título & Descrição */}
        <div className="rounded-2xl bg-[#14161d] p-4 border border-gray-800/80 flex flex-col gap-3">
          <input
            type="text"
            autoFocus
            placeholder="Qual é a tarefa?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-base font-bold text-white outline-none placeholder-gray-500"
          />
          <textarea
            rows={2}
            placeholder="Adicione detalhes ou notas adicionais..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-transparent text-xs text-gray-300 outline-none placeholder-gray-600 resize-none border-t border-gray-800/60 pt-3"
          />
        </div>

        {/* Seleção de Lista de Destino (Caixa de Entrada Padrão) */}
        <div className="rounded-2xl bg-[#14161d] p-3.5 border border-gray-800/80">
          <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5 mb-2.5">
            <Inbox size={14} className="text-blue-400" />
            <span>Salvar em:</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {lists.map((l) => {
              const isSelected = selectedListId === l.id;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setSelectedListId(l.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all',
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                      : 'bg-[#1b1e26] text-gray-400 border-gray-800 hover:text-white'
                  )}
                >
                  {l.is_inbox ? <Inbox size={13} /> : <Folder size={13} />}
                  <span>{l.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Datas: Início & Previsão */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#14161d] p-3.5 border border-gray-800/80">
            <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1 mb-1.5">
              <Calendar size={13} className="text-blue-400" />
              <span>Data de Execução</span>
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl bg-[#1b1e26] p-2 text-xs font-bold text-white outline-none border border-gray-800"
            />
          </div>

          <div className="rounded-2xl bg-[#14161d] p-3.5 border border-gray-800/80">
            <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1 mb-1.5">
              <Calendar size={13} className="text-rose-400" />
              <span>Prazo Fatal</span>
            </span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl bg-[#1b1e26] p-2 text-xs font-bold text-white outline-none border border-gray-800"
            />
          </div>
        </div>

        {/* Recorrência */}
        <div className="rounded-2xl bg-[#14161d] p-3.5 border border-gray-800/80">
          <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5 mb-2.5">
            <Repeat size={14} className="text-blue-400" />
            <span>Repetição</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {recurrences.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRecurrence(r.id)}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-[11px] font-bold border transition-all',
                  recurrence === r.id
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-[#1b1e26] text-gray-400 border-gray-800 hover:text-white'
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prioridade */}
        <div className="rounded-2xl bg-[#14161d] p-3.5 border border-gray-800/80">
          <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5 mb-2.5">
            <Flag size={14} className="text-blue-400" />
            <span>Prioridade</span>
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {priorities.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPriority(p.id)}
                className={cn(
                  'rounded-xl py-2 px-1 text-[11px] font-black border transition-all text-center',
                  priority === p.id
                    ? p.color + ' shadow-sm'
                    : 'bg-[#1b1e26] border-gray-800 text-gray-500'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Checklist */}
        <div className="rounded-2xl bg-[#14161d] p-3.5 border border-gray-800/80 flex flex-col gap-2.5">
          <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
            <CheckSquare size={14} className="text-blue-400" />
            <span>Checklist</span>
          </span>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Adicionar etapa..."
              value={currentChecklistInput}
              onChange={(e) => setCurrentChecklistInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddChecklistItem();
                }
              }}
              className="flex-1 rounded-xl bg-[#1b1e26] px-3 py-2 text-xs font-medium text-white outline-none border border-gray-800"
            />
            <button
              type="button"
              onClick={handleAddChecklistItem}
              className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500"
            >
              <Plus size={16} />
            </button>
          </div>

          {checklistItems.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-1">
              {checklistItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl bg-[#1b1e26] px-3 py-2 text-xs text-gray-300 border border-gray-800/60"
                >
                  <span className="truncate">{item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklistItem(idx)}
                    className="text-gray-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}