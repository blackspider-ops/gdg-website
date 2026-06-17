import React, { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Hash, Plus, Send, Loader2, Pin, Trash2, X } from 'lucide-react';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdmin } from '@/contexts/AdminContext';
import { supabase } from '@/lib/supabase';
import { ChannelsService, Channel, ChannelMessage } from '@/services/channelsService';

const AdminChannels = () => {
  const { isAuthenticated, currentAdmin } = useAdmin();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChannel = channels.find(c => c.id === activeChannelId) || null;

  // Load channel list
  useEffect(() => {
    (async () => {
      setIsLoadingChannels(true);
      const data = await ChannelsService.getChannels();
      setChannels(data);
      if (data.length > 0) setActiveChannelId(prev => prev ?? data[0].id);
      setIsLoadingChannels(false);
    })();
  }, []);

  // Load messages + subscribe to realtime for the active channel
  useEffect(() => {
    if (!activeChannelId) return;
    let cancelled = false;

    const load = async () => {
      setIsLoadingMessages(true);
      const data = await ChannelsService.getMessages(activeChannelId);
      if (!cancelled) {
        setMessages(data);
        setIsLoadingMessages(false);
      }
    };
    load();

    const sub = supabase
      .channel(`channel-messages-${activeChannelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'channel_messages', filter: `channel_id=eq.${activeChannelId}` },
        () => { ChannelsService.getMessages(activeChannelId).then(d => { if (!cancelled) setMessages(d); }); }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(sub);
    };
  }, [activeChannelId]);

  // Auto-scroll to newest
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isAuthenticated) return <Navigate to="/" replace />;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !activeChannelId || !currentAdmin?.id || isSending) return;
    setIsSending(true);
    const sent = await ChannelsService.sendMessage(activeChannelId, currentAdmin.id, text);
    if (sent) {
      setDraft('');
      // Optimistic: realtime will also refresh, but append immediately for snappiness
      setMessages(prev => [...prev, { ...sent, sender: { id: currentAdmin.id, email: currentAdmin.email, display_name: currentAdmin.display_name } }]);
    }
    setIsSending(false);
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name || !currentAdmin?.id) return;
    const created = await ChannelsService.createChannel(name, newDesc, currentAdmin.id);
    if (created) {
      setChannels(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setActiveChannelId(created.id);
      setNewName('');
      setNewDesc('');
      setShowNewChannel(false);
    }
  };

  const handlePin = async (m: ChannelMessage) => {
    await ChannelsService.togglePin(m.id, !m.is_pinned);
    setMessages(prev => prev.map(x => (x.id === m.id ? { ...x, is_pinned: !m.is_pinned } : x)));
  };

  const handleDelete = async (m: ChannelMessage) => {
    if (!confirm('Delete this message?')) return;
    await ChannelsService.deleteMessage(m.id);
    setMessages(prev => prev.filter(x => x.id !== m.id));
  };

  const senderName = (m: ChannelMessage) => m.sender?.display_name || m.sender?.email || 'Unknown';

  return (
    <AdminPageWrapper pageName="Channels" pageTitle="Channels">
      <AdminLayout
        title="Channels"
        subtitle="Org-wide topic channels for everyone"
        icon={Hash}
        actions={
          <button
            onClick={() => setShowNewChannel(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            <span>New Channel</span>
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Channel list */}
          <div className="md:col-span-1 bg-card border border-border rounded-lg p-3 h-[70vh] overflow-y-auto">
            {isLoadingChannels ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : channels.length === 0 ? (
              <p className="text-sm text-muted-foreground p-3">No channels yet. Create one.</p>
            ) : (
              <ul className="space-y-1">
                {channels.map(c => (
                  <li key={c.id}>
                    <button
                      onClick={() => setActiveChannelId(c.id)}
                      className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 transition-colors ${
                        c.id === activeChannelId ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-foreground'
                      }`}
                    >
                      <Hash size={16} className="flex-shrink-0" />
                      <span className="truncate">{c.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Message pane */}
          <div className="md:col-span-3 bg-card border border-border rounded-lg flex flex-col h-[70vh]">
            {!activeChannel ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select or create a channel to start chatting.
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Hash size={18} />{activeChannel.name}
                  </div>
                  {activeChannel.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{activeChannel.description}</p>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isLoadingMessages ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No messages yet. Say hi 👋</p>
                  ) : (
                    messages.map(m => (
                      <div key={m.id} className="group flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gdg-blue to-gdg-green flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                          {senderName(m).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{senderName(m)}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {m.is_pinned && <Pin size={12} className="text-primary" />}
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-wrap break-words">{m.message}</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <button onClick={() => handlePin(m)} className="p-1 text-muted-foreground hover:text-primary" title={m.is_pinned ? 'Unpin' : 'Pin'}>
                            <Pin size={14} />
                          </button>
                          <button onClick={() => handleDelete(m)} className="p-1 text-muted-foreground hover:text-red-400" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className="p-3 border-t border-border flex items-center gap-2">
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={`Message #${activeChannel.name}`}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim() || isSending}
                    className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* New channel modal */}
        {showNewChannel && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">New Channel</h3>
                <button onClick={() => setShowNewChannel(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreateChannel} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Name *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. announcements"
                    maxLength={60}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="What's this channel for?"
                    maxLength={200}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowNewChannel(false)} className="px-4 py-2 text-muted-foreground hover:text-foreground">
                    Cancel
                  </button>
                  <button type="submit" disabled={!newName.trim()} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50">
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

export default AdminChannels;
