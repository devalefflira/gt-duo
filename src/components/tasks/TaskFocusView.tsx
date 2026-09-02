'use client';

import { useState, useEffect, useRef } from 'react';
import { FocusMode, Task } from '@/core/tasks/types';
import { createClient } from '@/lib/supabase/client';
import { Play, Pause, RotateCcw, ChevronRight, Clock, Plus, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskFocusViewProps {
  tasks: Task[];
  onSessionComplete: (durationMinutes: number, tokensEarned: number) => void;
}

export function TaskFocusView({ tasks, onSessionComplete }: TaskFocusViewProps) {
  const supabase = createClient();

  const [mode, setMode] = useState<FocusMode>('stopwatch');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Estados dos Timers
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [timerDurationMinutes, setTimerDurationMinutes] = useState(30);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsActive(false);
    if (mode === 'stopwatch') {
      setSeconds(0);
    } else if (mode === 'pomodoro') {
      setSeconds(25 * 60);
    } else if (mode === 'timer') {
      setSeconds(timerDurationMinutes * 60);
    }
  }, [mode, timerDurationMinutes]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (mode === 'stopwatch') {
            return prev + 1;
          } else {
            if (prev <= 1) {
              clearInterval(timerRef.current!);
              setIsActive(false);
              handleCompleteFocusSession();
              return 0;
            }
            return prev - 1;
          }
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, mode]);

  const handleCompleteFocusSession = async () => {
    let elapsedMinutes = 0;
    if (mode === 'stopwatch') {
      elapsedMinutes = Math.max(1, Math.round(seconds / 60));
    } else if (mode === 'pomodoro') {
      const elapsed = 25 * 60 - seconds;
      elapsedMinutes = Math.max(1, Math.round(elapsed / 60));
    } else {
      const elapsed = timerDurationMinutes * 60 - seconds;
      elapsedMinutes = Math.max(1, Math.round(elapsed / 60));
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user && elapsedMinutes > 0) {
      const earned = Math.max(2, Math.floor(elapsedMinutes / 10));

      await supabase.from('task_focus_sessions').insert({
        user_id: user.id,
        task_id: selectedTask?.id || null,
        mode: mode,
        duration_minutes: elapsedMinutes,
      });

      onSessionComplete(elapsedMinutes, earned);
      alert(`Sessão de foco concluída! Você acumulou ${elapsedMinutes} minutos.`);
    }

    setIsActive(false);
    if (mode === 'stopwatch') setSeconds(0);
    if (mode === 'pomodoro') setSeconds(25 * 60);
    if (mode === 'timer') setSeconds(timerDurationMinutes * 60);
  };

  const formatDisplayTime = (sec: number) => {
    const minutes = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Cria os 60 ticks ao redor do círculo simulando o visual do TickTick
  const renderDialTicks = () => {
    return Array.from({ length: 60 }).map((_, i) => {
      const isMajor = i % 5 === 0;
      return (
        <span
          key={i}
          className={cn(
            'absolute top-0 left-1/2 -ml-[1px] origin-bottom',
            isMajor ? 'h-3.5 w-[2px] bg-gray-600' : 'h-2 w-[1px] bg-gray-800'
          )}
          style={{
            transform: `rotate(${i * 6}deg)`,
            transformOrigin: '50% 120px',
          }}
        />
      );
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header com os 3 Seletores de Modo */}
      <div className="flex items-center justify-between border-b border-gray-900 pb-3">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setMode('pomodoro')}
            className={cn(
              'text-xs font-bold transition-all relative pb-1',
              mode === 'pomodoro' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
            )}
          >
            Pomo
            {mode === 'pomodoro' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />}
          </button>

          <button
            onClick={() => setMode('stopwatch')}
            className={cn(
              'text-xs font-bold transition-all relative pb-1',
              mode === 'stopwatch' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
            )}
          >
            Cronômetro
            {mode === 'stopwatch' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />}
          </button>

          <button
            onClick={() => setMode('timer')}
            className={cn(
              'text-xs font-bold transition-all relative pb-1',
              mode === 'timer' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
            )}
          >
            Temporizador
            {mode === 'timer' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />}
          </button>
        </div>

        <div className="flex items-center gap-3 text-gray-400">
          <Clock size={18} />
          <Plus size={18} />
          <MoreVertical size={18} />
        </div>
      </div>

      {/* Ajuste rápido para o Temporizador */}
      {mode === 'timer' && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {[15, 25, 45, 60].map((m) => (
            <button
              key={m}
              onClick={() => setTimerDurationMinutes(m)}
              className={cn(
                'rounded-lg px-2.5 py-1 text-[11px] font-bold border transition-all',
                timerDurationMinutes === m
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                  : 'bg-[#15171e] text-gray-500 border-gray-800'
              )}
            >
              {m} min
            </button>
          ))}
        </div>
      )}

      {/* Seletor de Tarefa Vinculada */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={() => {
            const pendingTasks = tasks.filter((t) => t.status !== 'completed');
            if (pendingTasks.length > 0) {
              const nextIndex = selectedTask ? (pendingTasks.findIndex(t => t.id === selectedTask.id) + 1) % pendingTasks.length : 0;
              setSelectedTask(pendingTasks[nextIndex]);
            }
          }}
          className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-white"
        >
          <span>{selectedTask ? selectedTask.title : 'Foco'}</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Mostrador Circular Tipo TickTick */}
      <div className="relative my-auto flex items-center justify-center py-10">
        <div className="relative flex h-[240px] w-[240px] items-center justify-center">
          {renderDialTicks()}
          <span className="font-mono text-5xl font-extrabold text-white tracking-tight z-10">
            {formatDisplayTime(seconds)}
          </span>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex items-center justify-center gap-4 pb-20">
        {isActive && (
          <button
            onClick={() => handleCompleteFocusSession()}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1b1e26] text-gray-300 hover:text-white border border-gray-800"
            title="Concluir Foco"
          >
            <RotateCcw size={18} />
          </button>
        )}

        <button
          onClick={() => setIsActive(!isActive)}
          className={cn(
            'flex items-center justify-center rounded-full px-12 py-3.5 text-sm font-bold text-white shadow-xl transition-transform active:scale-95',
            isActive ? 'bg-amber-600 shadow-amber-600/20' : 'bg-blue-600 shadow-blue-600/30'
          )}
        >
          {isActive ? 'Pausar' : 'Começar'}
        </button>
      </div>
    </div>
  );
}