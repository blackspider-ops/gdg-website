import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

// Add CSS for line clamping
const styles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
import {
    MessageSquare,
    Bell,
    CheckSquare,
    Plus,
    RefreshCw,
    Search,
    Filter,
    Pin,
    User,
    Clock,
    Users,
    Calendar,
    MessageCircle,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Mail,
    Send,
    Reply,
    AlertCircle,
    XCircle,
    ExternalLink,
    AlertTriangle
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
    CommunicationsService,
    type Announcement,
    type CommunicationTask,
    type InternalMessage,
    type CommunicationStats
} from '@/services/communicationsService';
import { AuditService } from '@/services/auditService';
import { useTaskScheduler } from '@/hooks/useTaskScheduler';

const AdminCommunications: React.FC = () => {
    const { isAuthenticated, currentAdmin } = useAdmin();
    const [searchParams, setSearchParams] = useSearchParams();

    // Get initial tab from URL params or default to announcements
    const initialTab = searchParams.get('tab') || 'announcements';
    
    // State management
    const [activeTab, setActiveTab] = useState(initialTab);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [isCheckingOverdue, setIsCheckingOverdue] = useState(false);
    const [overdueCheckResult, setOverdueCheckResult] = useState<string>('');
    const [selectedConversation, setSelectedConversation] = useState<InternalMessage | null>(null);
    const [conversationMessages, setConversationMessages] = useState<InternalMessage[]>([]);
    const [replyMessage, setReplyMessage] = useState('');
    const [showConversationModal, setShowConversationModal] = useState(false);

    // Data state
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [tasks, setTasks] = useState<CommunicationTask[]>([]);
    const [messages, setMessages] = useState<InternalMessage[]>([]);
    const [commStats, setCommStats] = useState([
        { label: 'Total Announcements', value: '0', icon: Bell, color: 'text-blue-400' },
        { label: 'Active Tasks', value: '0', icon: CheckSquare, color: 'text-green-400' },
        { label: 'Unread Messages', value: '0', icon: MessageSquare, color: 'text-yellow-400' },
        { label: 'Team Members', value: '0', icon: Users, color: 'text-purple-400' }
    ]);
    const [adminUsers, setAdminUsers] = useState<Array<{ id: string; email: string; role: string }>>([]);

    // Form state
    const [createForm, setCreateForm] = useState({
        title: '',
        message: '',
        description: '',
        subject: '',
        priority: 'medium' as 'low' | 'medium' | 'high',
        status: 'pending' as 'pending' | 'in-progress' | 'completed' | 'overdue',
        is_pinned: false,
        assigned_to_id: '',
        to_user_id: '',
        due_date: ''
    });

    const [selectedItem, setSelectedItem] = useState<Announcement | CommunicationTask | InternalMessage | null>(null);

    // Error state
    const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
    const [submitError, setSubmitError] = useState<string>('');

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Email state
    const [emailForm, setEmailForm] = useState({
        to_emails: '',
        subject: '',
        message: '',
        email_type: 'custom' as 'announcement' | 'task_notification' | 'direct_message' | 'custom'
    });
    const [selectedItemForEmail, setSelectedItemForEmail] = useState<Announcement | CommunicationTask | null>(null);

    // Lock body scroll when modal is open
    useBodyScrollLock(showCreateModal || showEditModal || showDeleteModal || showEmailModal || showConversationModal);

    // Enable automatic overdue task checking
    const { forceCheck } = useTaskScheduler(true);

    // Load data on component mount
    useEffect(() => {
        if (isAuthenticated && currentAdmin) {
            loadAllData();
        }
    }, [isAuthenticated, currentAdmin]);

    // Force scroll to top when component mounts
    useEffect(() => {
        const scrollToTop = () => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;

            const lenis = (window as any).lenis;
            if (lenis && lenis.scrollTo) {
                lenis.scrollTo(0, { immediate: true });
            }
        };

        scrollToTop();
        setTimeout(scrollToTop, 50);
        setTimeout(scrollToTop, 150);
    }, []);

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // Data loading functions
    const loadAllData = async () => {
        setIsLoading(true);
        try {
            const [
                announcementsData,
                tasksData,
                messagesData,
                statsData,
                adminUsersData
            ] = await Promise.all([
                CommunicationsService.getAnnouncements({
                    priority: filterStatus === 'all' ? undefined : filterStatus,
                    search: searchTerm || undefined
                }),
                CommunicationsService.getTasks({
                    status: filterStatus === 'all' ? undefined : filterStatus,
                    search: searchTerm || undefined,
                    // Show tasks where user is either assignee OR assigner
                    user_id: currentAdmin?.id
                }),
                currentAdmin?.id ? CommunicationsService.getMessages(currentAdmin.id, currentAdmin.role) : Promise.resolve([]),
                currentAdmin?.id ? CommunicationsService.getCommunicationStats(currentAdmin.id) : Promise.resolve(null),
                CommunicationsService.getAllAdminUsers()
            ]);

            setAnnouncements(announcementsData);
            setTasks(tasksData);
            setMessages(messagesData);
            setAdminUsers(adminUsersData);

            // Always calculate from user-specific filtered data for personalized experience
            const activeTasksCount = (tasksData || []).filter(task => task.status !== 'completed').length;
            
            // Use global stats for announcements and team members, but user-specific for tasks and messages
            const globalStats = statsData && typeof statsData === 'object';
            
            setCommStats([
                { 
                    label: 'Total Announcements', 
                    value: globalStats ? (statsData.total_announcements?.toString() || '0') : (announcementsData || []).length.toString(), 
                    icon: Bell, 
                    color: 'text-blue-400' 
                },
                { 
                    label: 'My Tasks', 
                    value: activeTasksCount.toString(), 
                    icon: CheckSquare, 
                    color: 'text-green-400' 
                },
                { 
                    label: 'Unread Messages', 
                    value: (messagesData || []).filter(msg => !msg.is_read).length.toString(), 
                    icon: MessageSquare, 
                    color: 'text-yellow-400' 
                },
                { 
                    label: 'Team Members', 
                    value: globalStats ? (statsData.team_members?.toString() || '0') : (adminUsersData || []).length.toString(), 
                    icon: Users, 
                    color: 'text-purple-400' 
                }
            ]);

            // Log viewing action
            if (currentAdmin?.id) {
                try {
                    await AuditService.logAction(
                        currentAdmin.id,
                        'view_communications',
                        undefined,
                        {
                            description: 'Viewed communications hub',
                            active_tab: activeTab
                        }
                    );
                } catch (auditError) {
                    // Silently handle warnings
                    // Continue execution even if audit logging fails
                }
            }
        } catch (error) {
            // Silently handle errors
            // Set default empty arrays to prevent crashes
            setAnnouncements([]);
            setTasks([]);
            setMessages([]);
            setAdminUsers([]);
            // Keep default stats
            setCommStats([
                { label: 'Total Announcements', value: '0', icon: Bell, color: 'text-blue-400' },
                { label: 'Active Tasks', value: '0', icon: CheckSquare, color: 'text-green-400' },
                { label: 'Unread Messages', value: '0', icon: MessageSquare, color: 'text-yellow-400' },
                { label: 'Team Members', value: '0', icon: Users, color: 'text-purple-400' }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshData = () => {
        loadAllData();
    };

    // Validation function
    const validateForm = (): boolean => {
        const errors: {[key: string]: string} = {};
        
        if (activeTab === 'announcements') {
            if (!createForm.title.trim()) {
                errors.title = 'Title is required';
            }
            if (!createForm.message.trim()) {
                errors.message = 'Message is required';
            }
        } else if (activeTab === 'tasks') {
            if (!createForm.title.trim()) {
                errors.title = 'Title is required';
            }
            if (!createForm.description.trim()) {
                errors.description = 'Description is required';
            }
            if (!createForm.assigned_to_id) {
                errors.assigned_to_id = 'Please assign the task to someone';
            }
            if (!createForm.due_date) {
                errors.due_date = 'Due date is required';
            } else {
                // Check if due date is in the past
                const dueDate = new Date(createForm.due_date);
                const now = new Date();
                if (dueDate < now) {
                    errors.due_date = 'Due date cannot be in the past';
                }
            }
        } else if (activeTab === 'messages') {
            if (!createForm.subject.trim()) {
                errors.subject = 'Subject is required';
            }
            if (!createForm.message.trim()) {
                errors.message = 'Message is required';
            }
            if (!createForm.to_user_id) {
                errors.to_user_id = 'Please select a recipient';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // CRUD Functions
    const handleCreate = async () => {
        if (!currentAdmin?.id) return;

        // Clear previous errors
        setSubmitError('');
        setFormErrors({});

        // Validate form
        if (!validateForm()) {
            return;
        }

        setIsSaving(true);
        try {
            let success = false;
            let result = null;

            if (activeTab === 'announcements' && currentAdmin?.id) {
                result = await CommunicationsService.createAnnouncement({
                    title: createForm.title,
                    message: createForm.message,
                    priority: createForm.priority,
                    is_pinned: createForm.is_pinned
                }, currentAdmin.id);
                success = !!result;
            } else if (activeTab === 'tasks' && currentAdmin?.id) {
                result = await CommunicationsService.createTask({
                    title: createForm.title,
                    description: createForm.description,
                    assigned_to_id: createForm.assigned_to_id,
                    due_date: createForm.due_date,
                    priority: createForm.priority
                }, currentAdmin.id);
                success = !!result;
            } else if (activeTab === 'messages' && currentAdmin?.id) {
                result = await CommunicationsService.sendMessage({
                    to_user_id: createForm.to_user_id,
                    subject: createForm.subject,
                    message: createForm.message
                }, currentAdmin.id);
                success = !!result;
            }

            if (success) {
                setShowCreateModal(false);
                resetCreateForm();
                await loadAllData();
            } else {
                setSubmitError('Failed to create. Please check your input and try again.');
            }
        } catch (error: any) {
            setSubmitError(error.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const openEditModal = (item: Announcement | CommunicationTask | InternalMessage) => {
        setSelectedItem(item);

        if ('title' in item && 'message' in item) {
            // Announcement
            setCreateForm({
                ...createForm,
                title: item.title,
                message: item.message,
                priority: item.priority,
                is_pinned: item.is_pinned
            });
        } else if ('title' in item && 'description' in item) {
            // Task
            setCreateForm({
                ...createForm,
                title: item.title,
                description: item.description || '',
                assigned_to_id: item.assigned_to_id || '',
                due_date: item.due_date || '',
                status: item.status,
                priority: item.priority
            });
        }

        setShowEditModal(true);
    };

    const handleUpdate = async () => {
        if (!selectedItem || !currentAdmin?.id) return;

        setIsSaving(true);
        try {
            let success = false;

            if ('title' in selectedItem && 'message' in selectedItem && currentAdmin?.id) {
                // Announcement
                success = await CommunicationsService.updateAnnouncement(
                    selectedItem.id,
                    {
                        title: createForm.title,
                        message: createForm.message,
                        priority: createForm.priority,
                        is_pinned: createForm.is_pinned
                    },
                    currentAdmin.id
                );
            } else if ('title' in selectedItem && 'description' in selectedItem && currentAdmin?.id) {
                // Task
                success = await CommunicationsService.updateTask(
                    selectedItem.id,
                    {
                        title: createForm.title,
                        description: createForm.description,
                        assigned_to_id: createForm.assigned_to_id,
                        due_date: createForm.due_date,
                        status: createForm.status,
                        priority: createForm.priority
                    },
                    currentAdmin.id
                );
            }

            if (success) {
                setShowEditModal(false);
                setSelectedItem(null);
                resetCreateForm();
                await loadAllData();
            }
        } catch (error) {
            // Silently handle errors
        } finally {
            setIsSaving(false);
        }
    };

    const openDeleteModal = (item: Announcement | CommunicationTask | InternalMessage) => {
        setSelectedItem(item);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!selectedItem || !currentAdmin?.id) return;

        setIsSaving(true);
        try {
            let success = false;

            if ('title' in selectedItem && 'message' in selectedItem) {
                // Announcement
                success = currentAdmin?.id ? await CommunicationsService.deleteAnnouncement(selectedItem.id, currentAdmin.id) : false;
            } else if ('title' in selectedItem && 'description' in selectedItem) {
                // Task
                success = currentAdmin?.id ? await CommunicationsService.deleteTask(selectedItem.id, currentAdmin.id) : false;
            }

            if (success) {
                setShowDeleteModal(false);
                setSelectedItem(null);
                await loadAllData();
            }
        } catch (error) {
            // Silently handle errors
        } finally {
            setIsSaving(false);
        }
    };

    const markAsRead = async (item: Announcement | InternalMessage) => {
        if (!currentAdmin?.id) return;

        if ('title' in item && 'message' in item && 'author_id' in item) {
            // Announcement
            if (currentAdmin?.id) {
                await CommunicationsService.markAnnouncementAsRead(item.id, currentAdmin.id);
            }
        } else if ('subject' in item) {
            // Message
            if (currentAdmin?.id) {
                await CommunicationsService.markMessageAsRead(item.id, currentAdmin.id);
            }
        }

        await loadAllData();
    };

    const resetCreateForm = () => {
        setCreateForm({
            title: '',
            message: '',
            description: '',
            subject: '',
            priority: 'medium',
            status: 'pending',
            is_pinned: false,
            assigned_to_id: '',
            to_user_id: '',
            due_date: ''
        });
        setFormErrors({});
        setSubmitError('');
    };

    // Email handlers
    const openEmailModal = (item?: Announcement | CommunicationTask) => {
        if (item) {
            setSelectedItemForEmail(item);
            if ('title' in item && 'message' in item) {
                // Announcement
                setEmailForm({
                    to_emails: '',
                    subject: `[Announcement] ${item.title}`,
                    message: item.message,
                    email_type: 'announcement'
                });
            } else if ('title' in item && 'description' in item) {
                // Task
                setEmailForm({
                    to_emails: item.assigned_to?.email || '',
                    subject: `[Task] ${item.title}`,
                    message: item.description || '',
                    email_type: 'task_notification'
                });
            }
        } else {
            setSelectedItemForEmail(null);
            setEmailForm({
                to_emails: '',
                subject: '',
                message: '',
                email_type: 'custom'
            });
        }
        setShowEmailModal(true);
    };

    const handleSendEmail = async () => {
        if (!currentAdmin?.id) return;

        setIsSendingEmail(true);
        try {
            const emailList = (emailForm.to_emails || '')
                .split(',')
                .map(email => email.trim())
                .filter(email => email.length > 0);

            let result;

            if (selectedItemForEmail && 'title' in selectedItemForEmail && 'message' in selectedItemForEmail) {
                // Send announcement email
                result = currentAdmin?.id ? await CommunicationsService.sendAnnouncementEmail(
                    selectedItemForEmail.id,
                    emailList,
                    currentAdmin.id
                ) : { success: false, error: 'User not authenticated' };
            } else if (selectedItemForEmail && 'title' in selectedItemForEmail && 'description' in selectedItemForEmail) {
                // Send task notification
                result = currentAdmin?.id ? await CommunicationsService.sendTaskNotificationEmail(
                    selectedItemForEmail.id,
                    emailList,
                    currentAdmin.id
                ) : { success: false, error: 'User not authenticated' };
            } else {
                // Send direct email
                result = currentAdmin?.id ? await CommunicationsService.sendDirectEmail({
                    to_emails: emailList,
                    subject: emailForm.subject,
                    message: emailForm.message,
                    email_type: emailForm.email_type,
                    sender_name: `${currentAdmin.email} (GDG@PSU)`
                }, currentAdmin.id) : { success: false, error: 'User not authenticated' };
            }

            if (result.success) {
                setShowEmailModal(false);
                resetEmailForm();
            }
        } catch (error: any) {
            // Silently handle email errors
        } finally {
            setIsSendingEmail(false);
        }
    };

    const resetEmailForm = () => {
        setEmailForm({
            to_emails: '',
            subject: '',
            message: '',
            email_type: 'custom'
        });
        setSelectedItemForEmail(null);
    };

    // Load conversation messages - get all messages in the same thread
    const openConversation = async (message: InternalMessage) => {
        setSelectedConversation(message);
        
        // Find the root message (the one without reply_to_id or the one this is replying to)
        const rootMessageId = message.reply_to_id || message.id;
        
        // Get all messages in this thread (root message + all replies)
        const threadMessages = messages.filter(msg => 
            msg.id === rootMessageId || msg.reply_to_id === rootMessageId
        ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        
        setConversationMessages(threadMessages);
        setShowConversationModal(true);
        
        // Mark all unread messages in this thread as read (only messages TO the current user)
        const unreadMessagesToUser = threadMessages.filter(msg => 
            !msg.is_read && msg.to_user_id === currentAdmin?.id
        );
        
        for (const unreadMessage of unreadMessagesToUser) {
            await markAsRead(unreadMessage);
        }
        
        // Refresh the conversation list to update unread counts
        if (unreadMessagesToUser.length > 0) {
            await loadAllData();
        }
    };

    const closeConversation = () => {
        setSelectedConversation(null);
        setConversationMessages([]);
        setReplyMessage('');
        setShowConversationModal(false);
    };

    const sendReply = async () => {
        if (!selectedConversation || !currentAdmin?.id || !replyMessage.trim()) return;

        // Check if this is a super admin replying to a conversation they're not originally part of
        const threadMessages = conversationMessages;
        const isUserInvolved = threadMessages.some(msg => 
            msg.from_user_id === currentAdmin?.id || msg.to_user_id === currentAdmin?.id
        );
        const isAdminView = currentAdmin?.role === 'super_admin' && !isUserInvolved;

        if (isAdminView) {
            const confirmed = confirm(
                'You are replying as a super admin to a conversation you were not originally part of. ' +
                'This will notify the participants that an admin has joined the conversation. ' +
                'Do you want to continue?'
            );
            if (!confirmed) {
                return;
            }
        }

        try {
            // Find the root message ID for threading
            const rootMessageId = selectedConversation.reply_to_id || selectedConversation.id;
            
            const result = await CommunicationsService.sendMessage({
                to_user_id: selectedConversation.from_user_id,
                subject: selectedConversation.subject.startsWith('Re:') ? selectedConversation.subject : `Re: ${selectedConversation.subject}`,
                message: replyMessage,
                reply_to_id: rootMessageId
            }, currentAdmin.id);

            if (result) {
                setReplyMessage('');
                // Refresh the conversation and main list
                await loadAllData();
                // Add the new message to the current conversation view
                setConversationMessages(prev => [...prev, result]);
            }
        } catch (error) {
            console.error('Failed to send reply:', error);
        }
    };

    const deleteMessage = async (messageId: string) => {
        if (!currentAdmin?.id) return;

        try {
            const success = await CommunicationsService.deleteMessage(messageId, currentAdmin.id);
            
            if (success) {
                // Remove the message from the current conversation view
                setConversationMessages(prev => prev.filter(msg => msg.id !== messageId));
                // Refresh the main conversation list
                await loadAllData();
            }
        } catch (error) {
            console.error('Failed to delete message:', error);
        }
    };

    const deleteConversationThread = async () => {
        if (!selectedConversation || !currentAdmin?.id || currentAdmin.role !== 'super_admin') return;

        // Confirm deletion
        if (!confirm('Are you sure you want to delete this entire conversation thread? This action cannot be undone.')) {
            return;
        }

        try {
            const success = await CommunicationsService.deleteMessageThread(selectedConversation.id, currentAdmin.id);
            
            if (success) {
                // Close the conversation modal
                closeConversation();
                // Refresh the main conversation list
                await loadAllData();
            }
        } catch (error) {
            console.error('Failed to delete conversation thread:', error);
        }
    };

    // Manual overdue check function
    const handleManualOverdueCheck = async () => {
        if (!currentAdmin?.id) return;

        setIsCheckingOverdue(true);
        setOverdueCheckResult('');
        
        try {
            // Try using the hook's forceCheck method first, then fallback to service
            let result;
            try {
                result = await forceCheck();
            } catch (hookError) {
                console.warn('Hook forceCheck failed, using service directly:', hookError);
                result = await CommunicationsService.checkOverdueTasks();
            }
            
            if (result.success) {
                if (result.marked > 0) {
                    setOverdueCheckResult(`✅ Successfully marked ${result.marked} task(s) as overdue and sent ${result.notified} notification(s)`);
                } else {
                    setOverdueCheckResult('✅ No overdue tasks found');
                }
                // Refresh the tasks list to show updated statuses
                await loadAllData();
            } else {
                setOverdueCheckResult(`❌ Failed to check overdue tasks: ${result.error || 'Unknown error'}`);
            }
        } catch (error: any) {
            setOverdueCheckResult(`❌ Error checking overdue tasks: ${error.message || 'Unknown error'}`);
        } finally {
            setIsCheckingOverdue(false);
            // Clear the result message after 5 seconds
            setTimeout(() => setOverdueCheckResult(''), 5000);
        }
    };

    // Utility functions
    const tabs = [
        { id: 'announcements', label: 'Announcements', icon: Bell },
        { id: 'tasks', label: 'Tasks', icon: CheckSquare },
        { id: 'messages', label: 'Messages', icon: MessageSquare }
    ];

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-900/20 text-red-400 border-red-500/30';
            case 'medium': return 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30';
            case 'low': return 'bg-green-900/20 text-green-400 border-green-500/30';
            default: return 'bg-muted/20 text-muted-foreground border-gray-500/30';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-900/20 text-green-400';
            case 'in-progress': return 'bg-blue-900/20 text-blue-400';
            case 'pending': return 'bg-yellow-900/20 text-yellow-400';
            case 'overdue': return 'bg-red-900/20 text-red-400';
            default: return 'bg-muted/20 text-muted-foreground';
        }
    };

    const getItemTitle = (item: Announcement | CommunicationTask | InternalMessage): string => {
        if ('title' in item) return item.title;
        if ('subject' in item) return item.subject;
        return 'Unknown';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AdminLayout
            title="Communications Hub"
            subtitle="Internal team communications and task management"
            icon={MessageSquare}
            actions={
                <div className="flex items-center space-x-3">
                    <button
                        onClick={refreshData}
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-3 py-2 border border-border text-gray-300 rounded-lg hover:bg-muted transition-colors"
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                        <span>Refresh</span>
                    </button>
                    {/* Hide email functionality from blog editors */}
                    {currentAdmin?.role !== 'blog_editor' && (
                        <button
                            onClick={() => openEmailModal()}
                            className="flex items-center space-x-2 px-3 py-2 border border-border text-gray-300 rounded-lg hover:bg-muted transition-colors"
                        >
                            <Mail size={16} />
                            <span>Send Email</span>
                        </button>
                    )}
                    {/* Hide task creation from blog editors, but allow announcements and messages */}
                    {(activeTab !== 'tasks' || currentAdmin?.role !== 'blog_editor') && (
                        <button
                            onClick={() => {
                                resetCreateForm();
                                setShowCreateModal(true);
                            }}
                            className="flex items-center space-x-2 px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                        >
                            <Plus size={16} />
                            <span>Create {activeTab === 'announcements' ? 'Announcement' : activeTab === 'tasks' ? 'Task' : 'Message'}</span>
                        </button>
                    )}
                </div>
            }
        >
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {(commStats || []).map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="bg-card rounded-xl p-6 shadow-sm border border-border">
                            <div className="flex items-center justify-between mb-4">
                                <Icon size={24} className={stat.color} />
                            </div>
                            <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                            <div className="text-sm text-muted-foreground">{stat.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Tabs */}
            <div className="border-b border-border mb-8">
                <nav className="flex space-x-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setSearchParams({ tab: tab.id });
                                }}
                                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                    ? 'border-blue-600 text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-gray-300 hover:border-border'
                                    }`}
                            >
                                <Icon size={16} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Search and Filters */}
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <Filter size={16} className="text-muted-foreground" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                        >
                            <option value="all">All Status</option>
                            <option value="high">High Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="low">Low Priority</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="bg-card rounded-xl shadow-sm border border-border">
                {activeTab === 'announcements' && (
                    <>
                        <div className="p-6 border-b border-border">
                            <h2 className="text-xl font-semibold text-foreground">Team Announcements</h2>
                        </div>
                        {isLoading ? (
                            <div className="p-8 text-center">
                                <RefreshCw size={24} className="animate-spin mx-auto text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">Loading announcements...</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-800">
                                {(announcements || []).map((announcement) => (
                                    <div key={announcement.id} className="p-6 hover:bg-muted transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    {announcement.is_pinned && <Pin size={16} className="text-primary" />}
                                                    <h3 className="text-lg font-semibold text-foreground">{announcement.title}</h3>
                                                    <span className={`px-2 py-1 text-xs rounded-full font-medium border ${getPriorityColor(announcement.priority)}`}>
                                                        {announcement.priority}
                                                    </span>
                                                    {!announcement.is_read_by_current_user && (
                                                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                                                    )}
                                                </div>

                                                <p className="text-muted-foreground mb-4">{announcement.message}</p>

                                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center space-x-1">
                                                        <User size={14} />
                                                        <span>{announcement.author?.email || 'Unknown'}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <Clock size={14} />
                                                        <span>{formatDate(announcement.created_at)}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <Users size={14} />
                                                        <span>{announcement.read_count || 0}/{announcement.total_recipients || 0} read</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2 ml-4">
                                                {!announcement.is_read_by_current_user && (
                                                    <button
                                                        onClick={() => markAsRead(announcement)}
                                                        className="p-2 hover:bg-blue-900/20 rounded-lg transition-colors text-blue-400"
                                                        title="Mark as read"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                )}
                                                {/* Hide email functionality from blog editors */}
                                                {currentAdmin?.role !== 'blog_editor' && (
                                                    <button
                                                        onClick={() => openEmailModal(announcement)}
                                                        className="p-2 hover:bg-green-900/20 rounded-lg transition-colors text-green-400"
                                                        title="Send as email"
                                                    >
                                                        <Mail size={16} />
                                                    </button>
                                                )}
                                                {/* Edit: Super admins can edit any announcement, others can edit their own */}
                                                {(currentAdmin?.role === 'super_admin' || announcement.author_id === currentAdmin?.id) && (
                                                    <button
                                                        onClick={() => openEditModal(announcement)}
                                                        className="p-2 hover:bg-yellow-900/20 rounded-lg transition-colors text-yellow-400"
                                                        title={currentAdmin?.role === 'super_admin' ? "Edit announcement" : "Edit your announcement"}
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                )}
                                                
                                                {/* Delete: Super admins can delete any announcement, others can only delete their own */}
                                                {(currentAdmin?.role === 'super_admin' || announcement.author_id === currentAdmin?.id) && (
                                                    <button
                                                        onClick={() => openDeleteModal(announcement)}
                                                        className="p-2 hover:bg-red-900/20 rounded-lg transition-colors text-red-400"
                                                        title={currentAdmin?.role === 'super_admin' ? "Delete announcement" : "Delete your announcement"}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {announcements.length === 0 && (
                                    <div className="p-8 text-center">
                                        <Bell size={48} className="mx-auto text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium text-foreground mb-2">No announcements yet</h3>
                                        <p className="text-muted-foreground">Create your first announcement to get started.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'tasks' && (
                    <>
                        <div className="p-6 border-b border-border">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-foreground">Task Management</h2>
                                {/* Manual overdue check button - only for super_admins */}
                                {currentAdmin?.role === 'super_admin' && (
                                    <div className="flex items-center space-x-3">
                                        <button
                                            onClick={handleManualOverdueCheck}
                                            disabled={isCheckingOverdue}
                                            className="flex items-center space-x-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Manually check for overdue tasks and send notifications"
                                        >
                                            <AlertTriangle size={16} className={isCheckingOverdue ? 'animate-pulse' : ''} />
                                            <span>{isCheckingOverdue ? 'Checking...' : 'Check Overdue'}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                            {/* Show result message */}
                            {overdueCheckResult && (
                                <div className={`mt-3 p-3 rounded-lg text-sm ${
                                    overdueCheckResult.startsWith('✅') 
                                        ? 'bg-green-900/20 text-green-400 border border-green-500/30' 
                                        : 'bg-red-900/20 text-red-400 border border-red-500/30'
                                }`}>
                                    {overdueCheckResult}
                                </div>
                            )}
                        </div>
                        {isLoading ? (
                            <div className="p-8 text-center">
                                <RefreshCw size={24} className="animate-spin mx-auto text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">Loading tasks...</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-800">
                                {(tasks || []).map((task) => (
                                    <div key={task.id} className="p-6 hover:bg-muted transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-foreground">{task.title}</h3>
                                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(task.status)}`}>
                                                        {task.status.split('-').join(' ')}
                                                    </span>
                                                    <span className={`px-2 py-1 text-xs rounded-full font-medium border ${getPriorityColor(task.priority)}`}>
                                                        {task.priority}
                                                    </span>
                                                    {/* Show "Assigned by you" tag if current user is the assigner but NOT the assignee */}
                                                    {task.assigned_by_id === currentAdmin?.id && task.assigned_to_id !== currentAdmin?.id && (
                                                        <span className="px-2 py-1 text-xs rounded-full font-medium bg-blue-900/20 text-blue-400 border border-blue-500/30">
                                                            Assigned by you
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-muted-foreground mb-4">{task.description}</p>

                                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center space-x-1">
                                                        <User size={14} />
                                                        <span>Assigned to: {task.assigned_to?.email || 'Unassigned'}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <User size={14} />
                                                        <span>By: {task.assigned_by?.email || 'Unknown'}</span>
                                                    </div>
                                                    {task.due_date && (
                                                        <div className="flex items-center space-x-1">
                                                            <Calendar size={14} />
                                                            <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center space-x-1">
                                                        <Clock size={14} />
                                                        <span>Created: {formatDate(task.created_at)}</span>
                                                    </div>
                                                    {task.comments_count && task.comments_count > 0 && (
                                                        <div className="flex items-center space-x-1">
                                                            <MessageCircle size={14} />
                                                            <span>{task.comments_count} comments</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2 ml-4">
                                                {/* Hide email functionality from blog editors */}
                                                {currentAdmin?.role !== 'blog_editor' && (
                                                    <button
                                                        onClick={() => openEmailModal(task)}
                                                        className="p-2 hover:bg-green-900/20 rounded-lg transition-colors text-green-400"
                                                        title="Send as email"
                                                    >
                                                        <Mail size={16} />
                                                    </button>
                                                )}
                                                {/* Edit permissions: assigned_by, assigned_to, or super_admin can edit */}
                                                {(currentAdmin?.role === 'super_admin' || 
                                                  task.assigned_by_id === currentAdmin?.id || 
                                                  task.assigned_to_id === currentAdmin?.id) && (
                                                    <button
                                                        onClick={() => openEditModal(task)}
                                                        className="p-2 hover:bg-yellow-900/20 rounded-lg transition-colors text-yellow-400"
                                                        title={task.assigned_to_id === currentAdmin?.id ? "Edit task status" : "Edit task"}
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                )}
                                                
                                                {/* Delete permissions: only assigned_by or super_admin can delete */}
                                                {(currentAdmin?.role === 'super_admin' || task.assigned_by_id === currentAdmin?.id) && (
                                                    <button
                                                        onClick={() => openDeleteModal(task)}
                                                        className="p-2 hover:bg-red-900/20 rounded-lg transition-colors text-red-400"
                                                        title="Delete task"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {tasks.length === 0 && (
                                    <div className="p-8 text-center">
                                        <CheckSquare size={48} className="mx-auto text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium text-foreground mb-2">No tasks found</h3>
                                        <p className="text-muted-foreground">
                                            You don't have any tasks assigned to you or created by you at the moment.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'messages' && (
                    <div className="flex flex-col h-[700px]">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <div className="flex items-center space-x-3">
                                <MessageSquare size={20} className="text-primary" />
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">Team Messages</h2>
                                    <p className="text-sm text-muted-foreground">Internal communication hub</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                <span className="text-sm text-muted-foreground">
                                    {messages.filter(m => !m.is_read && m.to_user_id === currentAdmin?.id).length} unread
                                </span>
                            </div>
                        </div>

                        {/* Conversations List */}
                        <div className="flex-1 overflow-y-auto">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <RefreshCw size={24} className="animate-spin text-muted-foreground" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center max-w-md">
                                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/20 flex items-center justify-center">
                                            <MessageSquare size={32} className="text-muted-foreground/60" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-foreground mb-2">No conversations yet</h3>
                                        <p className="text-muted-foreground mb-6 leading-relaxed">
                                            Start communicating with your team members by sending your first message.
                                        </p>
                                        <button
                                            onClick={() => {
                                                resetCreateForm();
                                                setShowCreateModal(true);
                                            }}
                                            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm"
                                        >
                                            Start a conversation
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/30">
                                    {(() => {
                                        // Group messages by thread (root message ID)
                                        const threads = new Map();
                                        
                                        messages.forEach(message => {
                                            const threadId = message.reply_to_id || message.id;
                                            if (!threads.has(threadId)) {
                                                threads.set(threadId, []);
                                            }
                                            threads.get(threadId).push(message);
                                        });
                                        
                                        // Get the latest message from each thread for display
                                        const threadPreviews = Array.from(threads.values()).map(threadMessages => {
                                            // Sort by date and get the latest message
                                            const sortedMessages = threadMessages.sort((a, b) => 
                                                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                                            );
                                            const latestMessage = sortedMessages[0];
                                            const rootMessage = threadMessages.find(m => !m.reply_to_id) || threadMessages[0];
                                            
                                            // Check for unread messages that are TO the current user
                                            const hasUnreadForUser = threadMessages.some(m => 
                                                !m.is_read && m.to_user_id === currentAdmin?.id
                                            );
                                            
                                            return {
                                                ...latestMessage,
                                                threadCount: threadMessages.length,
                                                rootSubject: rootMessage.subject,
                                                hasUnread: hasUnreadForUser,
                                                threadMessages: threadMessages // Keep reference for later use
                                            };
                                        }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                                        
                                        return threadPreviews.map((thread) => {
                                            // Check if current user is involved in this conversation
                                            const threadMessages = threads.get(thread.reply_to_id || thread.id) || [];
                                            const isUserInvolved = threadMessages.some(msg => 
                                                msg.from_user_id === currentAdmin?.id || msg.to_user_id === currentAdmin?.id
                                            );
                                            const isAdminView = currentAdmin?.role === 'super_admin' && !isUserInvolved;

                                            return (
                                                <div 
                                                    key={thread.id} 
                                                    className={`p-5 hover:bg-muted/40 transition-all duration-200 cursor-pointer border-l-4 relative ${
                                                        isAdminView 
                                                            ? 'border-l-orange-500/60 bg-gradient-to-r from-orange-500/8 to-transparent' 
                                                            : thread.hasUnread
                                                                ? 'border-l-blue-500/60 bg-gradient-to-r from-blue-500/8 to-transparent'
                                                                : 'border-l-transparent hover:border-l-primary/50 hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent'
                                                    }`}
                                                    onClick={() => openConversation(thread)}
                                                >
                                                    <div className="flex items-start space-x-4">
                                                        {/* Avatar */}
                                                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${
                                                            isAdminView 
                                                                ? 'bg-gradient-to-br from-orange-500 to-orange-600 ring-2 ring-orange-500/20' 
                                                                : 'bg-gradient-to-br from-blue-500 to-blue-600'
                                                        }`}>
                                                            {thread.from_user?.email?.charAt(0).toUpperCase() || 'U'}
                                                        </div>
                                                        
                                                        {/* Conversation Preview */}
                                                        <div className="flex-1 min-w-0">
                                                            {/* Header */}
                                                            <div className="flex items-center space-x-2 mb-2">
                                                                <span className="font-semibold text-foreground truncate text-base">
                                                                    {thread.rootSubject}
                                                                </span>
                                                                {thread.hasUnread && (
                                                                    <span className="px-2.5 py-1 bg-blue-500 text-white text-xs rounded-full font-semibold shadow-sm">
                                                                        New
                                                                    </span>
                                                                )}
                                                                {thread.threadCount > 1 && (
                                                                    <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                                                                        {thread.threadCount} messages
                                                                    </span>
                                                                )}
                                                                {isAdminView && (
                                                                    <span className="text-xs px-2.5 py-1 bg-orange-500/15 text-orange-400 rounded-full border border-orange-500/30 font-medium">
                                                                        admin view
                                                                    </span>
                                                                )}
                                                            </div>
                                                            
                                                            {/* Sender and timestamp */}
                                                            <div className="flex items-center space-x-3 text-sm text-muted-foreground mb-2">
                                                                <div className="flex items-center space-x-1.5">
                                                                    <User size={13} />
                                                                    <span className="font-medium">{thread.from_user?.email?.split('@')[0] || 'Unknown'}</span>
                                                                </div>
                                                                <div className="flex items-center space-x-1.5">
                                                                    <Clock size={13} />
                                                                    <span>{formatDate(thread.created_at)}</span>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Message preview */}
                                                            <div className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">
                                                                {thread.message}
                                                            </div>
                                                        </div>

                                                        {/* Status indicator */}
                                                        <div className="flex-shrink-0 flex flex-col items-center space-y-1">
                                                            {thread.hasUnread && (
                                                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                                                            )}
                                                            {isAdminView && (
                                                                <div className="w-2.5 h-2.5 bg-orange-500 rounded-full"></div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            )}
                        </div>

                        {/* New Message Button */}
                        <div className="p-4 border-t border-border">
                            <button
                                onClick={() => {
                                    resetCreateForm();
                                    setShowCreateModal(true);
                                }}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                            >
                                <Plus size={16} />
                                <span>New Message</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    style={{
                        overflow: 'hidden',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowCreateModal(false);
                            resetCreateForm();
                        }
                    }}
                    onWheel={(e) => e.preventDefault()}
                    onTouchMove={(e) => e.preventDefault()}
                    onScroll={(e) => e.preventDefault()}
                >
                    <div
                        className="bg-card rounded-2xl shadow-2xl border border-border/50 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col backdrop-blur-xl"
                        onClick={(e) => e.stopPropagation()}
                        onWheel={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                    >
                        {/* Fixed Header */}
                        <div className="flex-shrink-0 p-8 border-b border-border/50 bg-gradient-to-r from-card to-muted/20">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    {activeTab === 'announcements' ? (
                                        <Bell size={20} className="text-primary" />
                                    ) : activeTab === 'tasks' ? (
                                        <CheckSquare size={20} className="text-primary" />
                                    ) : (
                                        <MessageSquare size={20} className="text-primary" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground">
                                        Create {activeTab === 'announcements' ? 'Announcement' : activeTab === 'tasks' ? 'Task' : 'Message'}
                                    </h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {activeTab === 'announcements' 
                                            ? 'Share important updates with your team' 
                                            : activeTab === 'tasks' 
                                                ? 'Assign a new task to a team member'
                                                : 'Send a direct message to a colleague'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {/* Error Display */}
                            {submitError && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-xl backdrop-blur-sm">
                                    <div className="flex items-center space-x-3">
                                        <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium">Error</p>
                                            <p className="text-sm opacity-90">{submitError}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Title/Subject Field */}
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-foreground">
                                    {activeTab === 'messages' ? 'Subject' : 'Title'} 
                                    <span className="text-red-400 ml-1">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={activeTab === 'messages' ? createForm.subject : createForm.title}
                                        onChange={(e) => setCreateForm(prev => ({
                                            ...prev,
                                            [activeTab === 'messages' ? 'subject' : 'title']: e.target.value
                                        }))}
                                        className={`w-full px-4 py-3 border border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 bg-card text-foreground transition-all duration-200 placeholder:text-muted-foreground/60 ${
                                            formErrors[activeTab === 'messages' ? 'subject' : 'title'] 
                                                ? 'border-red-500/50 focus:ring-red-400/20 focus:border-red-400' 
                                                : 'hover:border-border'
                                        }`}
                                        placeholder={`Enter a compelling ${activeTab === 'messages' ? 'subject' : 'title'}...`}
                                    />
                                </div>
                                {formErrors[activeTab === 'messages' ? 'subject' : 'title'] && (
                                    <div className="flex items-center space-x-2 text-red-400 text-sm">
                                        <AlertCircle size={16} />
                                        <span>{formErrors[activeTab === 'messages' ? 'subject' : 'title']}</span>
                                    </div>
                                )}
                            </div>

                            {/* Message/Description Field */}
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-foreground">
                                    {activeTab === 'tasks' ? 'Description' : 'Message'} 
                                    <span className="text-red-400 ml-1">*</span>
                                </label>
                                <div className="relative">
                                    <textarea
                                        value={activeTab === 'tasks' ? createForm.description : createForm.message}
                                        onChange={(e) => setCreateForm(prev => ({
                                            ...prev,
                                            [activeTab === 'tasks' ? 'description' : 'message']: e.target.value
                                        }))}
                                        className={`w-full px-4 py-3 border border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 bg-card text-foreground transition-all duration-200 placeholder:text-muted-foreground/60 resize-none ${
                                            formErrors[activeTab === 'tasks' ? 'description' : 'message'] 
                                                ? 'border-red-500/50 focus:ring-red-400/20 focus:border-red-400' 
                                                : 'hover:border-border'
                                        }`}
                                        placeholder={activeTab === 'tasks' 
                                            ? 'Describe what needs to be done, include any relevant details or requirements...' 
                                            : 'Write your message here...'
                                        }
                                        rows={6}
                                    />
                                </div>
                                {formErrors[activeTab === 'tasks' ? 'description' : 'message'] && (
                                    <div className="flex items-center space-x-2 text-red-400 text-sm">
                                        <AlertCircle size={16} />
                                        <span>{formErrors[activeTab === 'tasks' ? 'description' : 'message']}</span>
                                    </div>
                                )}
                            </div>

                            {/* Priority Field (for announcements and tasks) */}
                            {(activeTab === 'announcements' || activeTab === 'tasks') && (
                                <div className="space-y-3">
                                    <label className="block text-sm font-semibold text-foreground">Priority Level</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { value: 'low', label: 'Low', color: 'bg-green-500/10 border-green-500/20 text-green-400', icon: '🟢' },
                                            { value: 'medium', label: 'Medium', color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400', icon: '🟡' },
                                            { value: 'high', label: 'High', color: 'bg-red-500/10 border-red-500/20 text-red-400', icon: '🔴' }
                                        ].map((priority) => (
                                            <button
                                                key={priority.value}
                                                type="button"
                                                onClick={() => setCreateForm(prev => ({ ...prev, priority: priority.value as any }))}
                                                className={`p-4 border-2 rounded-xl transition-all duration-200 text-center ${
                                                    createForm.priority === priority.value
                                                        ? `${priority.color} border-opacity-100 scale-105`
                                                        : 'bg-card/50 border-border/50 text-muted-foreground hover:border-border'
                                                }`}
                                            >
                                                <div className="text-lg mb-1">{priority.icon}</div>
                                                <div className="font-medium text-sm">{priority.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Pin Announcement */}
                            {activeTab === 'announcements' && (
                                <div className="space-y-3">
                                    <label className="block text-sm font-semibold text-foreground">Options</label>
                                    <div className="bg-card/50 border-2 border-border/50 rounded-xl p-4">
                                        <label className="flex items-center space-x-3 cursor-pointer group">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    id="is_pinned"
                                                    checked={createForm.is_pinned}
                                                    onChange={(e) => setCreateForm(prev => ({ ...prev, is_pinned: e.target.checked }))}
                                                    className="sr-only"
                                                />
                                                <div className={`w-6 h-6 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
                                                    createForm.is_pinned 
                                                        ? 'bg-primary border-primary' 
                                                        : 'border-border/50 group-hover:border-border'
                                                }`}>
                                                    {createForm.is_pinned && (
                                                        <Pin size={14} className="text-primary-foreground" />
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-medium text-foreground">Pin this announcement</div>
                                                <div className="text-sm text-muted-foreground">Pinned announcements appear at the top</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Task-specific fields */}
                            {activeTab === 'tasks' && (
                                <>
                                    <div className="space-y-3">
                                        <label className="block text-sm font-semibold text-foreground">
                                            Assign To 
                                            <span className="text-red-400 ml-1">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={createForm.assigned_to_id}
                                                onChange={(e) => setCreateForm(prev => ({ ...prev, assigned_to_id: e.target.value }))}
                                                className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary bg-card/50 text-foreground transition-all duration-200 appearance-none ${
                                                    formErrors.assigned_to_id 
                                                        ? 'border-red-500/50 focus:ring-red-400/20 focus:border-red-400' 
                                                        : 'border-border/50 hover:border-border'
                                                }`}
                                            >
                                                <option value="">Choose a team member...</option>
                                                {(adminUsers || []).map(user => (
                                                    <option key={user.id} value={user.id}>
                                                        {user.email} ({user.role})
                                                    </option>
                                                ))}
                                            </select>
                                            <User size={20} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                        </div>
                                        {formErrors.assigned_to_id && (
                                            <div className="flex items-center space-x-2 text-red-400 text-sm">
                                                <AlertCircle size={16} />
                                                <span>{formErrors.assigned_to_id}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-sm font-semibold text-foreground">
                                            Due Date 
                                            <span className="text-red-400 ml-1">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="datetime-local"
                                                value={createForm.due_date}
                                                onChange={(e) => setCreateForm(prev => ({ ...prev, due_date: e.target.value }))}
                                                className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary bg-card/50 text-foreground transition-all duration-200 ${
                                                    formErrors.due_date 
                                                        ? 'border-red-500/50 focus:ring-red-400/20 focus:border-red-400' 
                                                        : 'border-border/50 hover:border-border'
                                                }`}
                                            />
                                            <Calendar size={20} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                        </div>
                                        {formErrors.due_date && (
                                            <div className="flex items-center space-x-2 text-red-400 text-sm">
                                                <AlertCircle size={16} />
                                                <span>{formErrors.due_date}</span>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Message-specific fields */}
                            {activeTab === 'messages' && (
                                <div className="space-y-3">
                                    <label className="block text-sm font-semibold text-foreground">
                                        Send To 
                                        <span className="text-red-400 ml-1">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={createForm.to_user_id}
                                            onChange={(e) => setCreateForm(prev => ({ ...prev, to_user_id: e.target.value }))}
                                            className={`w-full px-4 py-3 border border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 bg-card text-foreground transition-all duration-200 appearance-none ${
                                                formErrors.to_user_id 
                                                    ? 'border-red-500/50 focus:ring-red-400/20 focus:border-red-400' 
                                                    : 'hover:border-border'
                                            }`}
                                        >
                                            <option value="">Choose a recipient...</option>
                                            {(adminUsers || []).map(user => (
                                                <option key={user.id} value={user.id}>
                                                    {user.email} ({user.role})
                                                </option>
                                            ))}
                                        </select>
                                        <User size={20} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                    </div>
                                    {formErrors.to_user_id && (
                                        <div className="flex items-center space-x-2 text-red-400 text-sm">
                                            <AlertCircle size={16} />
                                            <span>{formErrors.to_user_id}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Fixed Footer */}
                        <div className="flex-shrink-0 p-8 border-t border-border/50 bg-gradient-to-r from-card to-muted/10">
                            <div className="flex space-x-4">
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        resetCreateForm();
                                    }}
                                    disabled={isSaving}
                                    className="flex-1 px-6 py-4 border-2 border-border/50 rounded-xl hover:bg-muted/50 hover:border-border transition-all duration-200 font-semibold text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={isSaving}
                                    className="flex-1 px-6 py-4 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-xl hover:from-primary/90 hover:to-primary/80 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-primary/25"
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground mr-3"></div>
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            {activeTab === 'announcements' ? (
                                                <Bell size={18} className="mr-2" />
                                            ) : activeTab === 'tasks' ? (
                                                <CheckSquare size={18} className="mr-2" />
                                            ) : (
                                                <Send size={18} className="mr-2" />
                                            )}
                                            {activeTab === 'messages' ? 'Send Message' : `Create ${activeTab === 'announcements' ? 'Announcement' : 'Task'}`}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedItem && (
                <div
                    className="fixed inset-0 z-50 bg-card bg-opacity-50 flex items-center justify-center p-4"
                    style={{
                        overflow: 'hidden',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowEditModal(false);
                            setSelectedItem(null);
                            resetCreateForm();
                        }
                    }}
                    onWheel={(e) => e.preventDefault()}
                    onTouchMove={(e) => e.preventDefault()}
                    onScroll={(e) => e.preventDefault()}
                >
                    <div
                        className="bg-card rounded-xl shadow-xl border border-border w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                        onWheel={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                    >
                        {/* Fixed Header */}
                        <div className="flex-shrink-0 p-6 border-b border-border">
                            <h2 className="text-xl font-semibold text-foreground">Edit {getItemTitle(selectedItem)}</h2>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Task content fields - editable by assigned_by or super_admin */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Title
                                    {('description' in selectedItem) && !(currentAdmin?.role === 'super_admin' || selectedItem.assigned_by_id === currentAdmin?.id) && (
                                        <span className="text-xs text-muted-foreground ml-2">(Read-only: Only task creator can edit content)</span>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    value={createForm.title}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                                    disabled={('description' in selectedItem) && !(currentAdmin?.role === 'super_admin' || selectedItem.assigned_by_id === currentAdmin?.id)}
                                    className={`w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground ${
                                        ('description' in selectedItem) && !(currentAdmin?.role === 'super_admin' || selectedItem.assigned_by_id === currentAdmin?.id) 
                                            ? 'opacity-50 cursor-not-allowed' 
                                            : ''
                                    }`}
                                />
                            </div>

                            {'message' in selectedItem ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                                    <textarea
                                        value={createForm.message}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, message: e.target.value }))}
                                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                                        rows={6}
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Description
                                        {!(currentAdmin?.role === 'super_admin' || selectedItem.assigned_by_id === currentAdmin?.id) && (
                                            <span className="text-xs text-muted-foreground ml-2">(Read-only: Only task creator can edit content)</span>
                                        )}
                                    </label>
                                    <textarea
                                        value={createForm.description}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                                        disabled={!(currentAdmin?.role === 'super_admin' || selectedItem.assigned_by_id === currentAdmin?.id)}
                                        className={`w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground ${
                                            !(currentAdmin?.role === 'super_admin' || selectedItem.assigned_by_id === currentAdmin?.id) 
                                                ? 'opacity-50 cursor-not-allowed' 
                                                : ''
                                        }`}
                                        rows={6}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Priority
                                    {('description' in selectedItem) && !(currentAdmin?.role === 'super_admin' || selectedItem.assigned_by_id === currentAdmin?.id) && (
                                        <span className="text-xs text-muted-foreground ml-2">(Read-only: Only task creator can edit priority)</span>
                                    )}
                                </label>
                                <select
                                    value={createForm.priority}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, priority: e.target.value as any }))}
                                    disabled={('description' in selectedItem) && !(currentAdmin?.role === 'super_admin' || selectedItem.assigned_by_id === currentAdmin?.id)}
                                    className={`w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground ${
                                        ('description' in selectedItem) && !(currentAdmin?.role === 'super_admin' || selectedItem.assigned_by_id === currentAdmin?.id) 
                                            ? 'opacity-50 cursor-not-allowed' 
                                            : ''
                                    }`}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                            {'message' in selectedItem && (
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        id="edit_is_pinned"
                                        checked={createForm.is_pinned}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, is_pinned: e.target.checked }))}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="edit_is_pinned" className="text-sm font-medium text-gray-300">
                                        Pin this announcement
                                    </label>
                                </div>
                            )}

                            {'description' in selectedItem && (
                                <>
                                    {/* Status can only be changed by assignee or super_admin */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Status
                                            {!(currentAdmin?.role === 'super_admin' || selectedItem.assigned_to_id === currentAdmin?.id) && (
                                                <span className="text-xs text-muted-foreground ml-2">(Read-only: Only assignee can change status)</span>
                                            )}
                                        </label>
                                        <select
                                            value={createForm.status}
                                            onChange={(e) => setCreateForm(prev => ({ ...prev, status: e.target.value as any }))}
                                            disabled={!(currentAdmin?.role === 'super_admin' || selectedItem.assigned_to_id === currentAdmin?.id)}
                                            className={`w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground ${
                                                !(currentAdmin?.role === 'super_admin' || selectedItem.assigned_to_id === currentAdmin?.id) 
                                                    ? 'opacity-50 cursor-not-allowed' 
                                                    : ''
                                            }`}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                            <option value="overdue">Overdue</option>
                                        </select>
                                    </div>

                                    {/* Task content can only be changed by assigned_by or super_admin */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Assign To
                                            {!(currentAdmin?.role === 'super_admin' || selectedItem.assigned_by_id === currentAdmin?.id) && (
                                                <span className="text-xs text-muted-foreground ml-2">(Read-only: Only task creator can change assignment)</span>
                                            )}
                                        </label>
                                        <select
                                            value={createForm.assigned_to_id}
                                            onChange={(e) => setCreateForm(prev => ({ ...prev, assigned_to_id: e.target.value }))}
                                            disabled={!(currentAdmin?.role === 'super_admin' || selectedItem.assigned_by_id === currentAdmin?.id)}
                                            className={`w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground ${
                                                !(currentAdmin?.role === 'super_admin' || selectedItem.assigned_by_id === currentAdmin?.id) 
                                                    ? 'opacity-50 cursor-not-allowed' 
                                                    : ''
                                            }`}
                                        >
                                            <option value="">Select user...</option>
                                            {(adminUsers || []).map(user => (
                                                <option key={user.id} value={user.id}>{user.email}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Due Date
                                            {!(currentAdmin?.role === 'super_admin' || selectedItem.assigned_by_id === currentAdmin?.id) && (
                                                <span className="text-xs text-muted-foreground ml-2">(Read-only: Only task creator can change due date)</span>
                                            )}
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={createForm.due_date}
                                            onChange={(e) => setCreateForm(prev => ({
                                                ...prev,
                                                due_date: e.target.value
                                            }))}
                                            disabled={!(currentAdmin?.role === 'super_admin' || selectedItem.assigned_by_id === currentAdmin?.id)}
                                            className={`w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground ${
                                                !(currentAdmin?.role === 'super_admin' || selectedItem.assigned_by_id === currentAdmin?.id) 
                                                    ? 'opacity-50 cursor-not-allowed' 
                                                    : ''
                                            }`}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Fixed Footer */}
                        <div className="flex-shrink-0 p-6 border-t border-border">
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedItem(null);
                                        resetCreateForm();
                                    }}
                                    disabled={isSaving}
                                    className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors font-medium text-gray-300 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    disabled={isSaving}
                                    className="flex-1 px-6 py-3 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Updating...
                                        </>
                                    ) : (
                                        'Update'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Conversation Modal */}
            {showConversationModal && selectedConversation && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    style={{
                        overflow: 'hidden',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            closeConversation();
                        }
                    }}
                    onWheel={(e) => e.preventDefault()}
                    onTouchMove={(e) => e.preventDefault()}
                    onScroll={(e) => e.preventDefault()}
                >
                    <div
                        className="bg-card rounded-2xl shadow-2xl border border-border/50 w-full max-w-6xl max-h-[90vh] overflow-hidden flex backdrop-blur-xl"
                        onClick={(e) => e.stopPropagation()}
                        onWheel={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                    >
                        {/* Left Panel - Conversation Info */}
                        <div className="w-80 border-r border-border/30 bg-gradient-to-b from-muted/20 to-muted/5 flex flex-col">
                            {/* Header */}
                            <div className="p-6 border-b border-border/30 bg-gradient-to-r from-card to-muted/10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                                            <MessageSquare size={18} className="text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground">Conversation Details</h3>
                                            <p className="text-xs text-muted-foreground mt-0.5">Thread information</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        {/* Super admin delete thread button */}
                                        {currentAdmin?.role === 'super_admin' && (
                                            <button
                                                onClick={deleteConversationThread}
                                                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-400 hover:text-red-300"
                                                title="Delete entire conversation thread (Admin)"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={closeConversation}
                                            className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
                                        >
                                            <XCircle size={16} className="text-muted-foreground" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Conversation Info */}
                            <div className="flex-1 p-6 space-y-8">
                                <div className="bg-card/50 rounded-xl p-4 border border-border/30">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">Subject</label>
                                    <div className="font-semibold text-foreground text-sm leading-relaxed">
                                        {conversationMessages[0]?.subject || 'No subject'}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4 block">Participants</label>
                                    <div className="space-y-3">
                                        {Array.from(new Set(conversationMessages.map(m => m.from_user?.email).filter(Boolean))).map(email => {
                                            const isCurrentUser = email === currentAdmin?.email;
                                            return (
                                                <div key={email} className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                                                    isCurrentUser ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30'
                                                }`}>
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                                                        isCurrentUser ? 'bg-primary' : 'bg-blue-500'
                                                    }`}>
                                                        {email?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-semibold text-foreground flex items-center space-x-2">
                                                            <span>{email?.split('@')[0]}</span>
                                                            {isCurrentUser && (
                                                                <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">You</span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{email}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="bg-muted/20 rounded-lg p-4">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Started</label>
                                        <div className="text-sm font-medium text-foreground">
                                            {new Date(conversationMessages[0]?.created_at || '').toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>

                                    <div className="bg-muted/20 rounded-lg p-4">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Messages</label>
                                        <div className="text-sm font-medium text-foreground">
                                            {conversationMessages.length} message{conversationMessages.length !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Panel - Messages & Reply */}
                        <div className="flex-1 flex flex-col bg-background">
                            {/* Header */}
                            <div className="p-6 border-b border-border/30 bg-gradient-to-r from-card/80 to-muted/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground mb-1">
                                            {conversationMessages[0]?.subject || 'Messages & Feedback'}
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            {conversationMessages.length} message{conversationMessages.length !== 1 ? 's' : ''} in this thread
                                        </p>
                                    </div>
                                    {(() => {
                                        // Check if current user is involved in this conversation
                                        const threadMessages = conversationMessages;
                                        const isUserInvolved = threadMessages.some(msg => 
                                            msg.from_user_id === currentAdmin?.id || msg.to_user_id === currentAdmin?.id
                                        );
                                        const isAdminView = currentAdmin?.role === 'super_admin' && !isUserInvolved;
                                        
                                        return isAdminView && (
                                            <div className="flex items-center space-x-2 px-3 py-2 bg-orange-500/10 text-orange-400 rounded-lg border border-orange-500/20">
                                                <Eye size={16} />
                                                <span className="text-sm font-medium">Admin Oversight</span>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="max-w-4xl mx-auto space-y-6">
                                    {conversationMessages.map((message, index) => {
                                        // Check if this is the user's last sent message
                                        const isCurrentUser = message.from_user_id === currentAdmin?.id;
                                        const userMessages = conversationMessages.filter(msg => msg.from_user_id === currentAdmin?.id);
                                        const isLastUserMessage = isCurrentUser && userMessages.length > 0 && 
                                            userMessages[userMessages.length - 1].id === message.id;
                                        
                                        // Super admins can delete any message, regular users can only delete their last message
                                        const canDeleteMessage = currentAdmin?.role === 'super_admin' || isLastUserMessage;
                                        
                                        return (
                                            <div key={message.id} className="group">
                                                <div className={`flex items-start space-x-4 p-5 rounded-xl transition-all duration-200 ${
                                                    isCurrentUser 
                                                        ? 'bg-primary/5 border border-primary/10 hover:bg-primary/8' 
                                                        : 'bg-muted/20 border border-border/30 hover:bg-muted/30'
                                                }`}>
                                                    {/* Avatar */}
                                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${
                                                        isCurrentUser 
                                                            ? 'bg-gradient-to-br from-primary to-primary/80' 
                                                            : 'bg-gradient-to-br from-blue-500 to-blue-600'
                                                    }`}>
                                                        {message.from_user?.email?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    
                                                    {/* Message Content */}
                                                    <div className="flex-1 min-w-0">
                                                        {/* Header with user, date, and type */}
                                                        <div className="flex items-center space-x-3 mb-3">
                                                            <span className="font-semibold text-foreground">
                                                                {message.from_user?.email?.split('@')[0] || 'Unknown User'}
                                                            </span>
                                                            {isCurrentUser && (
                                                                <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full font-medium">
                                                                    You
                                                                </span>
                                                            )}
                                                            <span className="text-sm text-muted-foreground">
                                                                {new Date(message.created_at).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    year: 'numeric'
                                                                })}, {new Date(message.created_at).toLocaleTimeString('en-US', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                    hour12: true
                                                                })}
                                                            </span>
                                                            {/* Super admin indicator for viewing others' messages */}
                                                            {currentAdmin?.role === 'super_admin' && !isCurrentUser && (() => {
                                                                const threadMessages = conversationMessages;
                                                                const isUserInvolved = threadMessages.some(msg => 
                                                                    msg.from_user_id === currentAdmin?.id || msg.to_user_id === currentAdmin?.id
                                                                );
                                                                return !isUserInvolved && (
                                                                    <span className="text-xs px-2 py-1 bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20 font-medium">
                                                                        admin view
                                                                    </span>
                                                                );
                                                            })()} 
                                                        </div>
                                                        
                                                        {/* Message content */}
                                                        <div className="text-foreground whitespace-pre-wrap leading-relaxed">
                                                            {message.message}
                                                        </div>
                                                    </div>

                                                    {/* Delete button */}
                                                    {canDeleteMessage && (
                                                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                            <button
                                                                onClick={() => deleteMessage(message.id)}
                                                                className="p-2.5 hover:bg-red-500/10 rounded-lg transition-colors text-red-400 hover:text-red-300"
                                                                title={currentAdmin?.role === 'super_admin' ? 'Delete message (Admin)' : 'Delete your last message'}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Reply Input */}
                            <div className="border-t border-border/30 bg-gradient-to-r from-card/80 to-muted/20">
                                <div className="p-6">
                                    <div className="max-w-4xl mx-auto">
                                        {(() => {
                                            // Check if this is a super admin replying to a conversation they're not originally part of
                                            const threadMessages = conversationMessages;
                                            const isUserInvolved = threadMessages.some(msg => 
                                                msg.from_user_id === currentAdmin?.id || msg.to_user_id === currentAdmin?.id
                                            );
                                            const isAdminView = currentAdmin?.role === 'super_admin' && !isUserInvolved;
                                            
                                            return isAdminView && (
                                                <div className="mb-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                                                    <div className="flex items-center space-x-3">
                                                        <AlertTriangle size={18} className="text-orange-400 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-sm font-medium text-orange-400">Admin Reply Notice</p>
                                                            <p className="text-xs text-orange-400/80 mt-1">
                                                                You are replying as a super admin to a conversation you were not originally part of. 
                                                                This will notify participants that an admin has joined the conversation.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                        
                                        <div className="flex items-start space-x-4">
                                            {/* Current user avatar */}
                                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                                {currentAdmin?.email?.charAt(0).toUpperCase() || 'Y'}
                                            </div>
                                            
                                            {/* Input area */}
                                            <div className="flex-1 relative">
                                                <div className="relative">
                                                    <textarea
                                                        placeholder="Type your reply..."
                                                        value={replyMessage}
                                                        onChange={(e) => {
                                                            if (e.target.value.length <= 1000) {
                                                                setReplyMessage(e.target.value);
                                                            }
                                                        }}
                                                        className="w-full px-5 py-4 pr-16 border-2 border-border/30 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 bg-background text-foreground resize-none min-h-[120px] transition-all duration-200 placeholder:text-muted-foreground/60"
                                                        rows={4}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                e.preventDefault();
                                                                sendReply();
                                                            }
                                                        }}
                                                    />
                                                    
                                                    {/* Send button inside textarea */}
                                                    <button
                                                        onClick={sendReply}
                                                        disabled={!replyMessage.trim()}
                                                        className="absolute bottom-4 right-4 p-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                                        title="Send reply (Enter)"
                                                    >
                                                        <Send size={16} />
                                                    </button>
                                                </div>
                                                
                                                {/* Helper text */}
                                                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                                                    <span>Press Enter to send, Shift+Enter for new line</span>
                                                    <span>{replyMessage.length}/1000</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedItem && (
                <div className="fixed inset-0 z-50 bg-card bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-md">
                        <div className="p-6 border-b border-border">
                            <div className="flex items-center space-x-3">
                                <AlertCircle size={24} className="text-red-600" />
                                <h2 className="text-xl font-semibold text-foreground">Confirm Delete</h2>
                            </div>
                        </div>

                        <div className="p-6">
                            <p className="text-muted-foreground">
                                Are you sure you want to delete "{getItemTitle(selectedItem)}"?
                                This action cannot be undone.
                            </p>

                            <div className="flex space-x-3 pt-6">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setSelectedItem(null);
                                    }}
                                    disabled={isSaving}
                                    className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors font-medium text-gray-300 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isSaving}
                                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Email Modal */}
            {showEmailModal && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    style={{
                        overflow: 'hidden',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowEmailModal(false);
                            resetEmailForm();
                        }
                    }}
                    onWheel={(e) => e.preventDefault()}
                    onTouchMove={(e) => e.preventDefault()}
                    onScroll={(e) => e.preventDefault()}
                >
                    <div
                        className="bg-card rounded-2xl shadow-2xl border border-border/50 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col backdrop-blur-xl"
                        onClick={(e) => e.stopPropagation()}
                        onWheel={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                    >
                        {/* Fixed Header */}
                        <div className="flex-shrink-0 p-8 border-b border-border/50 bg-gradient-to-r from-card to-muted/20">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Mail size={20} className="text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground">
                                        {selectedItemForEmail ? 'Send Item as Email' : 'Send Direct Email'}
                                    </h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Send email notifications to team members
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {/* Email Type */}
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-foreground">Email Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { value: 'custom', label: 'Custom', icon: '📧' },
                                        { value: 'announcement', label: 'Announcement', icon: '📢' },
                                        { value: 'task_notification', label: 'Task', icon: '✅' },
                                        { value: 'direct_message', label: 'Direct', icon: '💬' }
                                    ].map((type) => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setEmailForm(prev => ({ ...prev, email_type: type.value as any }))}
                                            className={`p-4 border-2 rounded-xl transition-all duration-200 text-center ${
                                                emailForm.email_type === type.value
                                                    ? 'border-primary/50 bg-primary/10 text-primary'
                                                    : 'border-border/50 text-muted-foreground hover:border-border'
                                            }`}
                                        >
                                            <div className="text-lg mb-1">{type.icon}</div>
                                            <div className="font-medium text-sm">{type.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Recipients */}
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-foreground">
                                    Recipients
                                </label>
                                <div className="relative">
                                    <textarea
                                        value={emailForm.to_emails}
                                        onChange={(e) => setEmailForm(prev => ({ ...prev, to_emails: e.target.value }))}
                                        placeholder="user1@example.com, user2@example.com"
                                        className="w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary bg-card/50 text-foreground transition-all duration-200 placeholder:text-muted-foreground/60 resize-none"
                                        rows={3}
                                    />
                                    <Users size={20} className="absolute right-4 top-4 text-muted-foreground pointer-events-none" />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Leave empty to send to all active admin users
                                </p>
                            </div>

                            {/* Subject */}
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-foreground">Subject</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={emailForm.subject}
                                        onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                                        placeholder="Enter email subject..."
                                        className="w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary bg-card/50 text-foreground transition-all duration-200 placeholder:text-muted-foreground/60"
                                    />
                                </div>
                            </div>

                            {/* Message */}
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-foreground">Message</label>
                                <div className="relative">
                                    <textarea
                                        value={emailForm.message}
                                        onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                                        placeholder="Write your email message here..."
                                        className="w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary bg-card/50 text-foreground transition-all duration-200 placeholder:text-muted-foreground/60 resize-none"
                                        rows={8}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    HTML formatting is supported
                                </p>
                            </div>

                            {isSendingEmail && (
                                <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <RefreshCw size={16} className="animate-spin text-blue-400" />
                                        <span className="text-blue-400">Sending email...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Fixed Footer */}
                        <div className="flex-shrink-0 p-8 border-t border-border/50 bg-gradient-to-r from-card to-muted/10">
                            <div className="flex space-x-4">
                                <button
                                    onClick={() => {
                                        setShowEmailModal(false);
                                        resetEmailForm();
                                    }}
                                    disabled={isSendingEmail}
                                    className="flex-1 px-6 py-4 border-2 border-border/50 rounded-xl hover:bg-muted/50 hover:border-border transition-all duration-200 font-semibold text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendEmail}
                                    disabled={isSendingEmail || !emailForm.subject || !emailForm.message}
                                    className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl hover:from-green-500 hover:to-green-400 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-green-600/25"
                                >
                                    {isSendingEmail ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Sending...
                                        </>
                                    ) : (
                                        'Send Email'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminCommunications;