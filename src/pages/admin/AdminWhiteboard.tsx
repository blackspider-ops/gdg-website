import React, { Suspense, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { PenTool, Plus, Loader2, Trash2, X } from 'lucide-react';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdmin } from '@/contexts/AdminContext';
import { WhiteboardService, type Whiteboard } from '@/services/whiteboardService';
// Eagerly load Excalidraw's stylesheet here (this page is in the main bundle) so
// the styles are always present; the heavy Excalidraw JS stays lazy via
// WhiteboardCanvas.
import '@excalidraw/excalidraw/index.css';

// Lazy-load the heavy Excalidraw canvas so its bundle only loads on this page.
const WhiteboardCanvas = React.lazy(() => import('@/components/admin/WhiteboardCanvas'));

const AdminWhiteboard = () => {
  const { isAuthenticated, currentAdmin } = useAdmin();
  const [boards, setBoards] = useState<Whiteboard[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');

  const loadBoards = async () => {
    setIsLoading(true);
    const data = await WhiteboardService.list();
    setBoards(data);
    setActiveId(prev => prev ?? (data[0]?.id ?? null));
    setIsLoading(false);
  };

  useEffect(() => {
    loadBoards();
  }, []);

  if (!isAuthenticated) return <Navigate to="/" replace />;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin?.id) return;
    const created = await WhiteboardService.create(newName, currentAdmin.id);
    if (created) {
      setBoards(prev => [created, ...prev]);
      setActiveId(created.id);
      setNewName('');
      setShowNew(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this whiteboard? This cannot be undone.')) return;
    await WhiteboardService.remove(id);
    setBoards(prev => prev.filter(b => b.id !== id));
    setActiveId(prev => (prev === id ? null : prev));
  };

  return (
    <AdminPageWrapper pageName="Whiteboard" pageTitle="Whiteboard">
      <AdminLayout
        title="Whiteboard"
        subtitle="Collaborative infinite canvas"
        icon={PenTool}
        actions={
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            <span>New Board</span>
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Board list */}
          <div className="md:col-span-1 bg-card border border-border rounded-lg p-3 h-[75vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : boards.length === 0 ? (
              <p className="text-sm text-muted-foreground p-3">No boards yet. Create one.</p>
            ) : (
              <ul className="space-y-1">
                {boards.map(b => (
                  <li key={b.id} className="group flex items-center">
                    <button
                      onClick={() => setActiveId(b.id)}
                      className={`flex-1 text-left px-3 py-2 rounded-md truncate transition-colors ${
                        b.id === activeId ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-foreground'
                      }`}
                    >
                      {b.name}
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-400 transition-opacity"
                      title="Delete board"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Canvas */}
          <div className="md:col-span-3 bg-card border border-border rounded-lg relative h-[75vh] overflow-hidden">
            {!activeId ? (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                Select or create a board to start drawing.
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="animate-spin text-muted-foreground" />
                  </div>
                }
              >
                {/* key forces a fresh editor per board */}
                <WhiteboardCanvas key={activeId} boardId={activeId} userId={currentAdmin?.id || ''} />
              </Suspense>
            )}
          </div>
        </div>

        {/* New board modal */}
        {showNew && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">New Whiteboard</h3>
                <button onClick={() => setShowNew(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Board name"
                  maxLength={100}
                  autoFocus
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 text-muted-foreground hover:text-foreground">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminPageWrapper>
  );
};

export default AdminWhiteboard;
