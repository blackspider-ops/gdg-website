import React, { useEffect, useRef, useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { WhiteboardService } from '@/services/whiteboardService';

// Self-host-ish: point Excalidraw at a versioned CDN for its fonts/assets.
// Excalidraw (MIT) renders even if these lag, but allowing the origin in CSP
// keeps fonts crisp. (esm.sh is added to the CSP in vercel.json.)
if (typeof window !== 'undefined' && !(window as any).EXCALIDRAW_ASSET_PATH) {
  (window as any).EXCALIDRAW_ASSET_PATH = 'https://esm.sh/@excalidraw/excalidraw@0.18.1/dist/prod/';
}

interface WhiteboardCanvasProps {
  boardId: string;
  userId: string;
}

/**
 * Excalidraw infinite canvas for a single board. Persists the scene (elements)
 * to whiteboards.document (debounced) and syncs collaborators via Supabase
 * Realtime on the whiteboards row (last-write-wins).
 */
const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({ boardId, userId }) => {
  const apiRef = useRef<any>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isApplyingRemote = useRef(false);
  const lastSavedAt = useRef(0);
  const [initialData, setInitialData] = useState<any | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Load the saved scene for this board
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const board = await WhiteboardService.get(boardId);
      if (cancelled) return;
      if (board?.document?.elements) {
        setInitialData({
          elements: board.document.elements,
          appState: { viewBackgroundColor: board.document.appState?.viewBackgroundColor || '#0b0b0d' },
          scrollToContent: true,
        });
      } else {
        setInitialData({ appState: { viewBackgroundColor: '#0b0b0d' } });
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [boardId]);

  const handleChange = (elements: readonly any[], appState: any) => {
    if (isApplyingRemote.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      lastSavedAt.current = Date.now();
      const doc = {
        elements,
        appState: { viewBackgroundColor: appState?.viewBackgroundColor },
      };
      await WhiteboardService.saveDocument(boardId, doc, userId);
    }, 900);
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
          if (row.updated_by === userId && Date.now() - lastSavedAt.current < 2500) return;
          const api = apiRef.current;
          if (api && row.document?.elements) {
            isApplyingRemote.current = true;
            try {
              api.updateScene({ elements: row.document.elements });
            } catch (e) {
              console.error('Failed to apply remote whiteboard scene:', e);
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

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <Excalidraw
        excalidrawAPI={(api) => { apiRef.current = api; }}
        initialData={initialData}
        onChange={handleChange}
        theme="dark"
      />
    </div>
  );
};

export default WhiteboardCanvas;
