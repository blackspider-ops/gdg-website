import React, { useEffect, useRef } from 'react';
import { Tldraw, type Editor } from 'tldraw';
import 'tldraw/tldraw.css';
import { supabase } from '@/lib/supabase';
import { WhiteboardService } from '@/services/whiteboardService';

interface WhiteboardCanvasProps {
  boardId: string;
  userId: string;
}

/**
 * tldraw infinite canvas for a single board. Persists the store snapshot to
 * whiteboards.document (debounced) and syncs collaborators via Supabase Realtime
 * on the whiteboards row (last-write-wins snapshot merge).
 *
 * Lazy-loaded so the tldraw bundle only ships on /admin/whiteboard.
 */
const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({ boardId, userId }) => {
  const editorRef = useRef<Editor | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isApplyingRemote = useRef(false);
  const lastSavedAt = useRef(0);

  // IMPORTANT: onMount must be SYNCHRONOUS. tldraw treats the return value as a
  // cleanup function (it calls it on unmount). An async handler returns a Promise,
  // which tldraw then tries to call as a function -> "TypeError: x is not a
  // function" crash. So we kick off async work internally and return a real
  // cleanup that disposes the store listener.
  const handleMount = (editor: Editor) => {
    editorRef.current = editor;
    let unlisten: (() => void) | undefined;

    (async () => {
      // Load the existing document for this board
      const board = await WhiteboardService.get(boardId);
      if (board?.document) {
        try {
          isApplyingRemote.current = true;
          editor.store.loadStoreSnapshot(board.document);
        } catch (e) {
          console.error('Failed to load whiteboard snapshot:', e);
        } finally {
          isApplyingRemote.current = false;
        }
      }

      // Autosave on user edits (debounced)
      unlisten = editor.store.listen(
        () => {
          if (isApplyingRemote.current) return;
          if (saveTimer.current) clearTimeout(saveTimer.current);
          saveTimer.current = setTimeout(async () => {
            const snapshot = editor.store.getStoreSnapshot();
            lastSavedAt.current = Date.now();
            await WhiteboardService.saveDocument(boardId, snapshot, userId);
          }, 800);
        },
        { source: 'user', scope: 'document' }
      );
    })();

    return () => {
      unlisten?.();
    };
  };

  // Subscribe to remote saves from other collaborators
  useEffect(() => {
    const sub = supabase
      .channel(`whiteboard-${boardId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'whiteboards', filter: `id=eq.${boardId}` },
        (payload) => {
          const row = payload.new as { updated_by?: string; document?: any };
          // Ignore the echo of our own recent save
          if (row.updated_by === userId && Date.now() - lastSavedAt.current < 2500) return;
          const editor = editorRef.current;
          if (editor && row.document) {
            isApplyingRemote.current = true;
            try {
              editor.store.loadStoreSnapshot(row.document);
            } catch (e) {
              console.error('Failed to apply remote whiteboard snapshot:', e);
            } finally {
              setTimeout(() => { isApplyingRemote.current = false; }, 50);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [boardId, userId]);

  return (
    <div className="absolute inset-0">
      <Tldraw onMount={handleMount} />
    </div>
  );
};

export default WhiteboardCanvas;
