import React, { useEffect, useState } from 'react';
import { ListTodo, Plus, Loader2, Check, Circle, AlertCircle } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { CommunicationsService, CommunicationTask } from '@/services/communicationsService';

/**
 * A focused personal to-do list over the existing communication_tasks system.
 * Shows tasks assigned to the current admin, allows a quick-add (assigned to
 * self), and lets you toggle a task complete inline.
 */
const MyTodoWidget: React.FC = () => {
  const { currentAdmin } = useAdmin();
  const [tasks, setTasks] = useState<CommunicationTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const loadTasks = async () => {
    if (!currentAdmin?.id) return;
    setIsLoading(true);
    setLoadError(false);
    try {
      const data = await CommunicationsService.getTasks({ assigned_to: currentAdmin.id });
      setTasks(data);
    } catch (error) {
      console.error('Error loading to-do tasks:', error);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAdmin?.id]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || !currentAdmin?.id || isAdding) return;
    setIsAdding(true);
    try {
      const created = await CommunicationsService.createTask(
        { title, priority: 'medium', assigned_to_id: currentAdmin.id },
        currentAdmin.id
      );
      if (created) {
        setNewTitle('');
        await loadTasks();
      }
    } catch (error) {
      console.error('Error adding to-do task:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const toggleComplete = async (task: CommunicationTask) => {
    if (!currentAdmin?.id) return;
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    // Optimistic update
    setTasks(prev => prev.map(t => (t.id === task.id ? { ...t, status: nextStatus } : t)));
    try {
      await CommunicationsService.updateTask(task.id, { status: nextStatus }, currentAdmin.id);
    } catch (error) {
      console.error('Error updating task status:', error);
      await loadTasks(); // revert to server truth on failure
    }
  };

  const openTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const visible = showCompleted ? tasks : openTasks;

  return (
    <div className="bg-card border border-border rounded-lg p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-foreground flex items-center">
          <ListTodo size={18} className="mr-2 text-primary" />
          My To-Do
          {openTasks.length > 0 && (
            <span className="ml-2 text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {openTasks.length}
            </span>
          )}
        </h2>
        {completedTasks.length > 0 && (
          <button
            onClick={() => setShowCompleted(v => !v)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showCompleted ? 'Hide done' : `Show done (${completedTasks.length})`}
          </button>
        )}
      </div>

      {/* Quick add */}
      <form onSubmit={handleAdd} className="flex items-center gap-2 mb-4">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a task…"
          maxLength={255}
          className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={!newTitle.trim() || isAdding}
          className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add task"
        >
          {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
        </button>
      </form>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : loadError ? (
        <div className="text-center py-6">
          <AlertCircle size={24} className="mx-auto text-red-400 mb-2" />
          <p className="text-sm text-muted-foreground mb-3">Couldn't load your tasks.</p>
          <button onClick={loadTasks} className="text-sm text-primary hover:underline">Retry</button>
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          You're all caught up. 🎉
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map(task => {
            const done = task.status === 'completed';
            const overdue = task.status === 'overdue' || (!done && task.due_date && new Date(task.due_date) < new Date());
            return (
              <li key={task.id} className="flex items-start gap-3 group">
                <button
                  onClick={() => toggleComplete(task)}
                  className={`mt-0.5 flex-shrink-0 transition-colors ${done ? 'text-green-500' : 'text-muted-foreground hover:text-primary'}`}
                  title={done ? 'Mark as not done' : 'Mark as done'}
                >
                  {done ? <Check size={18} /> : <Circle size={18} />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.title}
                  </p>
                  {task.due_date && (
                    <p className={`text-xs ${overdue ? 'text-red-400' : 'text-muted-foreground'}`}>
                      Due {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {overdue && ' • overdue'}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default MyTodoWidget;
