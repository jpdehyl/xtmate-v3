'use client';

import { useState } from 'react';
import { Plus, Check, Circle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface QuickTasksProps {
  className?: string;
}

export function QuickTasks({ className }: QuickTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', text: 'Review pending estimates', completed: false },
    { id: '2', text: 'Follow up with Smith residence', completed: false },
    { id: '3', text: 'Upload photos for Johnson claim', completed: true },
  ]);
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([
      ...tasks,
      { id: Date.now().toString(), text: newTask.trim(), completed: false },
    ]);
    setNewTask('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const activeCount = tasks.filter(t => !t.completed).length;

  return (
    <div className={cn('rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm', className)}>
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Quick Tasks</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage your daily work</p>
          </div>
          <div className="flex gap-1">
            {(['all', 'active', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-full transition-colors',
                  filter === f
                    ? 'bg-pd-gold text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="Add a quick task..."
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pd-gold/50 focus:border-pd-gold"
          />
          <button
            onClick={addTask}
            className="p-2 rounded-lg bg-pd-gold text-white hover:bg-pd-gold-dark transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 max-h-[180px] overflow-y-auto">
          {filteredTasks.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
              No {filter === 'all' ? '' : filter} tasks
            </p>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  'group flex items-center gap-3 p-2.5 rounded-lg transition-colors',
                  task.completed 
                    ? 'bg-gray-50 dark:bg-gray-800/50' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                )}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className={cn(
                    'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                    task.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 dark:border-gray-600 hover:border-pd-gold'
                  )}
                >
                  {task.completed && <Check className="w-3 h-3" />}
                </button>
                <span
                  className={cn(
                    'flex-1 text-sm',
                    task.completed
                      ? 'text-gray-400 dark:text-gray-500 line-through'
                      : 'text-gray-700 dark:text-gray-300'
                  )}
                >
                  {task.text}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {tasks.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {activeCount} task{activeCount !== 1 ? 's' : ''} remaining
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
