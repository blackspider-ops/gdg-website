import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Pin, Trash2, Edit3, MoreHorizontal, Search,
  Paperclip, Image, X, Check
} from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { TeamMessagingService, type TeamMessage } from '@/services/teamMessagingService';
import { supabase } from '@/lib/supabase';

interface TeamChatProps {
  teamId: string;
  teamName: string;
  teamColor: string;
}

const TeamChat: React.FC<TeamChatProps> = ({ teamId, teamName, teamColor }) => {
  const { currentAdmin } = useAdmin();
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<TeamMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showPinned, setShowPinned] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TeamMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMessages();
    loadPinnedMessages();

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel(`team-chat-${teamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_messages',
          filter: `team_id=eq.${teamId}`
        },
        async (payload) => {
          // Fetch the full message with sender info
          const newMsg = await TeamMessagingService.getMessageById(payload.new.id);
          if (newMsg) {
            setMessages(prev => {
              // Avoid duplicates (in case we sent it ourselves)
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'team_messages',
          filter: `team_id=eq.${teamId}`
        },
        async (payload) => {
          // Update the message in state
          setMessages(prev => prev.map(m => 
            m.id === payload.new.id 
              ? { ...m, message: payload.new.message, is_pinned: payload.new.is_pinned }
              : m
          ));
          // Refresh pinned messages if pin status changed
          if (payload.old.is_pinned !== payload.new.is_pinned) {
            loadPinnedMessages();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'team_messages',
          filter: `team_id=eq.${teamId}`
        },
        (payload) => {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
          loadPinnedMessages();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount or teamId change
    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Mark messages as read when viewing
    if (currentAdmin && messages.length > 0) {
      const unreadIds = messages
        .filter(m => !m.read_by?.includes(currentAdmin.id))
        .map(m => m.id);
      
      if (unreadIds.length > 0) {
        TeamMessagingService.markAsRead(unreadIds, currentAdmin.id);
      }
    }
  }, [messages, currentAdmin]);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const data = await TeamMessagingService.getTeamMessages(teamId);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPinnedMessages = async () => {
    try {
      const data = await TeamMessagingService.getPinnedMessages(teamId);
      setPinnedMessages(data);
    } catch (error) {
      console.error('Error loading pinned messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !currentAdmin || isSending) return;

    setIsSending(true);
    try {
      const message = await TeamMessagingService.sendMessage(
        teamId,
        currentAdmin.id,
        newMessage.trim()
      );

      if (message) {
        setMessages(prev => [...prev, message]);
        setNewMessage('');
        inputRef.current?.focus();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePin = async (messageId: string, isPinned: boolean) => {
    const success = await TeamMessagingService.togglePin(messageId, !isPinned);
    if (success) {
      loadMessages();
      loadPinnedMessages();
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm('Delete this message?')) return;
    
    const success = await TeamMessagingService.deleteMessage(messageId);
    if (success) {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    }
  };

  const handleEdit = async (messageId: string) => {
    if (!editText.trim()) return;
    
    const success = await TeamMessagingService.editMessage(messageId, editText.trim());
    if (success) {
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, message: editText.trim() } : m
      ));
      setEditingId(null);
      setEditText('');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await TeamMessagingService.searchMessages(teamId, searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
           ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (senderId: string) => currentAdmin?.id === senderId;

  return (
    <div className="flex flex-col h-[500px] bg-card rounded-xl border border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: teamColor }}
          />
          <h3 className="font-medium text-foreground">{teamName} Chat</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPinned(!showPinned)}
            className={`p-2 rounded-lg transition-colors ${
              showPinned ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'
            }`}
            title="Pinned messages"
          >
            <Pin size={16} />
            {pinnedMessages.length > 0 && (
              <span className="ml-1 text-xs">{pinnedMessages.length}</span>
            )}
          </button>
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-32 px-3 py-1 text-sm bg-background border border-border rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Pinned Messages Panel */}
      {showPinned && pinnedMessages.length > 0 && (
        <div className="p-3 bg-yellow-50 border-b border-yellow-200">
          <h4 className="text-xs font-medium text-yellow-800 mb-2">Pinned Messages</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {pinnedMessages.map(msg => (
              <div key={msg.id} className="text-xs p-2 bg-white rounded border border-yellow-200">
                <span className="font-medium">{msg.sender?.display_name || msg.sender?.email}:</span>
                <span className="ml-1 text-gray-600">{msg.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="p-3 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-blue-800">Search Results ({searchResults.length})</h4>
            <button
              onClick={() => { setSearchResults([]); setSearchQuery(''); }}
              className="text-blue-600 hover:text-blue-800"
            >
              <X size={14} />
            </button>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {searchResults.map(msg => (
              <div key={msg.id} className="text-xs p-2 bg-white rounded border border-blue-200">
                <span className="font-medium">{msg.sender?.display_name || msg.sender?.email}:</span>
                <span className="ml-1 text-gray-600">{msg.message}</span>
                <span className="ml-2 text-gray-400">{formatTime(msg.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`flex ${isOwnMessage(message.sender_id) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  isOwnMessage(message.sender_id)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {!isOwnMessage(message.sender_id) && (
                  <p className="text-xs font-medium mb-1 opacity-70">
                    {message.sender?.display_name || message.sender?.email}
                  </p>
                )}
                
                {editingId === message.id ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm bg-background text-foreground rounded"
                      autoFocus
                    />
                    <button onClick={() => handleEdit(message.id)} className="text-green-500">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                )}
                
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs opacity-60">{formatTime(message.created_at)}</span>
                  
                  {isOwnMessage(message.sender_id) && editingId !== message.id && (
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={() => handlePin(message.id, message.is_pinned)}
                        className={`p-1 rounded opacity-60 hover:opacity-100 ${
                          message.is_pinned ? 'text-yellow-300' : ''
                        }`}
                      >
                        <Pin size={12} />
                      </button>
                      <button
                        onClick={() => { setEditingId(message.id); setEditText(message.message); }}
                        className="p-1 rounded opacity-60 hover:opacity-100"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(message.id)}
                        className="p-1 rounded opacity-60 hover:opacity-100 text-red-300"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
                
                {message.is_pinned && (
                  <Pin size={10} className="absolute top-1 right-1 text-yellow-500" />
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-sm"
            disabled={isSending}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamChat;
