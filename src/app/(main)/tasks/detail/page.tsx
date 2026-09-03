'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
    Inbox,
    Save,
    Loader2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Task, TaskChecklistItem, TaskList, TaskPriorityLevel, TaskRecurrence } from '@/core/tasks/types';
import { cn } from '@/lib/utils';

function TaskDetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const taskId = searchParams.get('id');
    const supabase = createClient();

    // Estados de Carregamento
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Estados do Formulário de Edição
    const [task, setTask] = useState<Task | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState<TaskPriorityLevel>('medium');
    const [recurrence, setRecurrence] = useState<TaskRecurrence>('none');
    const [selectedListId, setSelectedListId] = useState<string | null>(null);

    // Listas e Checklists
    const [lists, setLists] = useState<TaskList[]>([]);
    const [checklists, setChecklists] = useState<TaskChecklistItem[]>([]);
    const [newChecklistText, setNewChecklistText] = useState('');

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

        // 1. Carrega todas as listas para seleção
        const { data: userLists } = await supabase
            .from('task_lists')
            .select('*')
            .eq('user_id', user.id)
            .order('is_inbox', { ascending: false })
            .order('name', { ascending: true });
        if (userLists) setLists(userLists as TaskList[]);

        // 2. Carrega a tarefa
        const { data: taskData } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .eq('user_id', user.id)
            .single();

        if (taskData) {
            const currentTask = taskData as Task;
            setTask(currentTask);
            setTitle(currentTask.title || '');
            setDescription(currentTask.description || '');
            setStartDate(currentTask.start_date || '');
            setDueDate(currentTask.due_date || '');
            setPriority(currentTask.priority_name || 'medium');
            setRecurrence(currentTask.recurrence || 'none');
            setSelectedListId(currentTask.list_id);

            // 3. Carrega os itens do checklist
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

    const handleToggleStatus = async () => {
        if (!task) return;
        const isNowCompleted = task.status !== 'completed';
        const newStatus = isNowCompleted ? 'completed' : 'pending';

        setTask({ ...task, status: newStatus });

        await supabase
            .from('tasks')
            .update({
                status: newStatus,
                completed_at: isNowCompleted ? new Date().toISOString() : null,
            })
            .eq('id', task.id);
    };

    const handleSaveChanges = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!title.trim() || !task) return;

        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const targetList = lists.find((l) => l.id === selectedListId);
        const finalListId = targetList && !targetList.is_inbox ? targetList.id : null;

        const isUrgent = priority === 'urgent' || priority === 'high';
        const isImportant = priority === 'urgent' || priority === 'high';

        const { error } = await supabase
            .from('tasks')
            .update({
                title: title.trim(),
                description: description.trim() || null,
                start_date: startDate || null,
                due_date: dueDate || null,
                priority_name: priority,
                recurrence: recurrence,
                list_id: finalListId,
                is_urgent: isUrgent,
                is_important: isImportant,
                updated_at: new Date().toISOString(),
            })
            .eq('id', task.id);

        setSaving(false);
        if (!error) {
            router.push('/tasks');
            router.refresh();
        } else {
            alert('Erro ao salvar alterações.');
        }
    };

    const handleDeleteTask = async () => {
        if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

        setDeleting(true);
        const { data: { user } } = await supabase.auth.getUser();

        // Estorno de moedas caso tenha sido concluída
        if (task && task.status === 'completed' && task.coins_rewarded > 0 && user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('gt_coins')
                .eq('id', user.id)
                .single();

            if (profile) {
                await supabase
                    .from('profiles')
                    .update({
                        gt_coins: Math.max(0, (profile.gt_coins || 0) - task.coins_rewarded)
                    })
                    .eq('id', user.id);
            }
        }

        const { error } = await supabase.from('tasks').delete().eq('id', taskId);
        setDeleting(false);

        if (!error) {
            router.push('/tasks');
            router.refresh();
        } else {
            alert('Erro ao excluir tarefa.');
        }
    };

    // Checklist Handlers
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

    if (loading || !task) {
        return (
            <div className="flex min-h-dvh items-center justify-center bg-black text-xs text-gray-500">
                Carregando detalhes...
            </div>
        );
    }

    const isCompleted = task.status === 'completed';

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
        <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-black px-5 py-6 text-white pb-32">
            {/* Header com Ações: Cancelar, Salvar e Excluir */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white"
                >
                    <ChevronLeft size={20} />
                    <span>Voltar</span>
                </button>

                <span className="text-xs font-bold text-white">Editar Tarefa</span>

                <button
                    onClick={handleDeleteTask}
                    disabled={deleting}
                    className="p-1.5 text-gray-500 hover:text-rose-400 active:scale-95 transition-colors"
                    title="Excluir Tarefa"
                >
                    {deleting ? <Loader2 size={16} className="animate-spin text-rose-400" /> : <Trash2 size={17} />}
                </button>
            </div>

            {/* Formulário de Edição */}
            <div className="mt-5 flex flex-col gap-4">
                {/* Toggle Status Concluído & Título */}
                <div className="flex items-start gap-3 rounded-2xl bg-[#14161d] p-4 border border-gray-800/80">
                    <button
                        type="button"
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

                    <div className="flex-1 flex flex-col gap-2">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Título da tarefa..."
                            className={cn(
                                'w-full bg-transparent text-base font-bold text-white outline-none placeholder-gray-500',
                                isCompleted && 'line-through text-gray-500'
                            )}
                        />
                        <textarea
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Adicione anotações ou detalhes..."
                            className="w-full bg-transparent text-xs text-gray-300 outline-none placeholder-gray-600 resize-none border-t border-gray-800/60 pt-2"
                        />
                    </div>
                </div>

                {/* Lista/Pasta de Destino */}
                <div className="rounded-2xl bg-[#14161d] p-3.5 border border-gray-800/80">
                    <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5 mb-2.5">
                        <Inbox size={14} className="text-blue-400" />
                        <span>Lista / Pasta</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {lists.map((l) => {
                            const isSelected = (!selectedListId && l.is_inbox) || selectedListId === l.id;
                            return (
                                <button
                                    key={l.id}
                                    type="button"
                                    onClick={() => setSelectedListId(l.is_inbox ? null : l.id)}
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

                {/* Repetição */}
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

                {/* Checklists */}
                <div className="rounded-2xl bg-[#14161d] p-3.5 border border-gray-800/80 flex flex-col gap-2.5">
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
                            type="button"
                            onClick={handleAddChecklistItem}
                            className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500"
                        >
                            <Plus size={16} />
                        </button>
                    </div>

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
                                    type="button"
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
                                    type="button"
                                    onClick={() => item.id && handleDeleteChecklistItem(item.id)}
                                    className="p-1 text-gray-500 hover:text-rose-400"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Botão Fixo Salvar Alterações */}
                <button
                    type="button"
                    onClick={handleSaveChanges}
                    disabled={saving || !title.trim()}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 py-3.5 text-xs font-bold text-white shadow-xl shadow-blue-600/30 active:scale-98 transition-all disabled:opacity-50"
                >
                    {saving ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Salvando...</span>
                        </>
                    ) : (
                        <>
                            <Save size={16} />
                            <span>Salvar Alterações</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

export default function TaskDetailPage() {
    return (
        <Suspense fallback={<div className="flex min-h-dvh items-center justify-center bg-black text-xs text-gray-500">Carregando...</div>}>
            <TaskDetailContent />
        </Suspense>
    );
}