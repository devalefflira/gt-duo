'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Check, Calendar, Flag, Inbox, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { TaskList, TaskPriority } from '@/core/tasks/types';
import { cn } from '@/lib/utils';

export default function NewTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuadrant = (searchParams.get('quadrant') as TaskPriority) || 'q4';

  const supabase = createClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(initialQuadrant);
  const [lists, setLists] = useState<TaskList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data } = await supabase
      .from('task_lists')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true });

    if (data && data.length > 0) {
      setLists(data as TaskList[]);
      const inbox = data.find((l) => l.is_inbox) || data[0];
      setSelectedListId(inbox.id);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedListId) return;

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isUrgent = priority === 'q1' || priority === 'q3';
    const isImportant = priority === 'q1' || priority === 'q2';

    const { error } = await supabase.from('tasks').insert({
      user_id: user.id,
      list_id: selectedListId,
      title: title.trim(),
      description: description.trim() || null,
      due_date: dueDate || null,
      priority: priority,
      is_urgent: isUrgent,
      is_important: isImportant,
      status: 'pending',
    });

    setSubmitting(false);
    if (!error) {
      router.push('/tasks');
      router.refresh();
    } else {
      alert('Erro ao criar tarefa. Tente novamente.');
    }
  };

  const quadrantOptions = [
    { id: 'q1' as TaskPriority, label: 'Q1', desc: 'Urgente & Importante', color: 'border-rose-500 text-rose-400' },
    { id: 'q2' as TaskPriority, label: 'Q2', desc: 'Não Urgente & Importante', color: 'border-amber-500 text-amber-400' },
    { id: 'q3' as TaskPriority, label: 'Q3', desc: 'Urgente & Não Importante', color: 'border-blue-500 text-blue-400' },
    { id: 'q4' as TaskPriority, label: 'Q4', desc: 'Não Urgente & Não Importante', color: 'border-emerald-500 text-emerald-400' },
  ];

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-black px-5 py-6 text-white pb-16">
      {/* Header Fixo */}
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
          className="rounded-full bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md active:scale-95 disabled:opacity-40"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : 'Criar'}
        </button>
      </div>

      {/* Formulário em Tela Cheia */}
      <form onSubmit={handleSave} className="mt-6 flex flex-1 flex-col gap-5">
        {/* Título e Descrição */}
        <div className="rounded-2xl bg-[#14161d] p-4 border border-gray-800/80 flex flex-col gap-3">
          <input
            type="text"
            autoFocus
            placeholder="O que você precisa fazer?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-base font-bold text-white outline-none placeholder-gray-500"
          />
          <textarea
            rows={3}
            placeholder="Notas ou detalhes adicionais..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-transparent text-xs text-gray-300 outline-none placeholder-gray-600 resize-none border-t border-gray-800/60 pt-3"
          />
        </div>

        {/* Seleção de Lista */}
        <div className="rounded-2xl bg-[#14161d] p-4 border border-gray-800/80">
          <span className="text-xs font-bold text-gray-300 mb-2.5 flex items-center gap-1.5">
            <Inbox size={15} className="text-blue-400" />
            <span>Lista de Destino</span>
          </span>
          <div className="flex flex-wrap gap-2 mt-2">
            {lists.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setSelectedListId(l.id)}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all',
                  selectedListId === l.id
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'bg-[#1b1e26] text-gray-400 border-gray-800 hover:text-white'
                )}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>

        {/* Data de Vencimento */}
        <div className="rounded-2xl bg-[#14161d] p-4 border border-gray-800/80">
          <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
            <Calendar size={15} className="text-blue-400" />
            <span>Prazo de Conclusão</span>
          </span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-2.5 w-full rounded-xl bg-[#1b1e26] px-3.5 py-2.5 text-xs font-bold text-white outline-none border border-gray-800"
          />
        </div>

        {/* Quadrante de Eisenhower */}
        <div className="rounded-2xl bg-[#14161d] p-4 border border-gray-800/80">
          <span className="text-xs font-bold text-gray-300 mb-3 flex items-center gap-1.5">
            <Flag size={15} className="text-blue-400" />
            <span>Prioridade (Matriz de Eisenhower)</span>
          </span>
          <div className="grid grid-cols-2 gap-2 mt-2.5">
            {quadrantOptions.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => setPriority(q.id)}
                className={cn(
                  'flex flex-col items-start rounded-xl p-2.5 border transition-all text-left',
                  priority === q.id
                    ? 'bg-[#1e222d] border-white shadow-md'
                    : 'bg-[#1b1e26] border-gray-800/80 text-gray-400'
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={cn('text-xs font-black', q.color)}>{q.id.toUpperCase()}</span>
                  {priority === q.id && <Check size={14} className="text-white" />}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 leading-tight">{q.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}