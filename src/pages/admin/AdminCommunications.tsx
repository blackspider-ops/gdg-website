import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Navigate } from 'react-router-dom';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
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
    ExternalLink
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

const AdminCommunications: React.FC = () => {
    const { isAuthenticated, currentAdmin } = useAdmin();

    // State management
    const [activeTab, setActiveTab] = useState('announcements');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);

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
    useBodyScrollLock(showCreateModal || showEditModal || showDeleteModal || showEmailModal);

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
                    search: searchTerm || undefined
                }),
                currentAdmin?.id ? CommunicationsService.getMessages(currentAdmin.id) : Promise.resolve([]),
                currentAdmin?.id ? CommunicationsService.getCommunicationStats(currentAdmin.id) : Promise.resolve(null),
                CommunicationsService.getAllAdminUsers()
            ]);

            setAnnouncements(announcementsData);
            setTasks(tasksData);
            setMessages(messagesData);
            setAdminUsers(adminUsersData);

            // Update stats with actual data - use statsData if available, otherwise calculate from loaded data
            if (statsData && typeof statsData === 'object') {
                setCommStats([
                    { label: 'Total Announcements', value: statsData.total_announcements?.toString() || '0', icon: Bell, color: 'text-blue-400' },
                    { label: 'Active Tasks', value: statsData.pending_tasks?.toString() || '0', icon: CheckSquare, color: 'text-green-400' },
                    { label: 'Unread Messages', value: statsData.unread_messages?.toString() || '0', icon: MessageSquare, color: 'text-yellow-400' },
                    { label: 'Team Members', value: statsData.team_members?.toString() || '0', icon: Users, color: 'text-purple-400' }
                ]);
            } else {
                // Fallback to calculating from loaded data
                setCommStats([
                    { label: 'Total Announcements', value: (announcementsData || []).length.toString(), icon: Bell, color: 'text-blue-400' },
                    { label: 'Active Tasks', value: (tasksData || []).filter(task => task.status !== 'completed').length.toString(), icon: CheckSquare, color: 'text-green-400' },
                    { label: 'Unread Messages', value: (messagesData || []).filter(msg => !msg.is_read).length.toString(), icon: MessageSquare, color: 'text-yellow-400' },
                    { label: 'Team Members', value: (adminUsersData || []).length.toString(), icon: Users, color: 'text-purple-400' }
                ]);
            }

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

    // CRUD Functions
    const handleCreate = async () => {
        if (!currentAdmin?.id) return;

        setIsSaving(true);
        try {
            let success = false;

            if (activeTab === 'announcements' && currentAdmin?.id) {
                const result = await CommunicationsService.createAnnouncement({
                    title: createForm.title,
                    message: createForm.message,
                    priority: createForm.priority,
                    is_pinned: createForm.is_pinned
                }, currentAdmin.id);
                success = !!result;
            } else if (activeTab === 'tasks' && currentAdmin?.id) {
                const result = await CommunicationsService.createTask({
                    title: createForm.title,
                    description: createForm.description,
                    assigned_to_id: createForm.assigned_to_id,
                    due_date: createForm.due_date,
                    priority: createForm.priority
                }, currentAdmin.id);
                success = !!result;
            } else if (activeTab === 'messages' && currentAdmin?.id) {
                const result = await CommunicationsService.sendMessage({
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
            }
        } catch (error) {
            // Silently handle errors
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
                    <button
                        onClick={() => openEmailModal()}
                        className="flex items-center space-x-2 px-3 py-2 border border-border text-gray-300 rounded-lg hover:bg-muted transition-colors"
                    >
                        <Mail size={16} />
                        <span>Send Email</span>
                    </button>
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
                                onClick={() => setActiveTab(tab.id)}
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
                                                <button
                                                    onClick={() => openEmailModal(announcement)}
                                                    className="p-2 hover:bg-green-900/20 rounded-lg transition-colors text-green-400"
                                                    title="Send as email"
                                                >
                                                    <Mail size={16} />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(announcement)}
                                                    className="p-2 hover:bg-yellow-900/20 rounded-lg transition-colors text-yellow-400"
                                                    title="Edit announcement"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(announcement)}
                                                    className="p-2 hover:bg-red-900/20 rounded-lg transition-colors text-red-400"
                                                    title="Delete announcement"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
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
                            <h2 className="text-xl font-semibold text-foreground">Task Management</h2>
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
                                                <button
                                                    onClick={() => openEmailModal(task)}
                                                    className="p-2 hover:bg-green-900/20 rounded-lg transition-colors text-green-400"
                                                    title="Send as email"
                                                >
                                                    <Mail size={16} />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(task)}
                                                    className="p-2 hover:bg-yellow-900/20 rounded-lg transition-colors text-yellow-400"
                                                    title="Edit task"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(task)}
                                                    className="p-2 hover:bg-red-900/20 rounded-lg transition-colors text-red-400"
                                                    title="Delete task"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {tasks.length === 0 && (
                                    <div className="p-8 text-center">
                                        <CheckSquare size={48} className="mx-auto text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium text-foreground mb-2">No tasks yet</h3>
                                        <p className="text-muted-foreground">Create your first task to get started.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'messages' && (
                    <>
                        <div className="p-6 border-b border-border">
                            <h2 className="text-xl font-semibold text-foreground">Internal Messages</h2>
                        </div>
                        {isLoading ? (
                            <div className="p-8 text-center">
                                <RefreshCw size={24} className="animate-spin mx-auto text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">Loading messages...</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-800">
                                {(messages || []).map((message) => (
                                    <div key={message.id} className={`p-6 hover:bg-muted transition-colors ${!message.is_read ? 'bg-muted/50' : ''}`}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-foreground">{message.subject}</h3>
                                                    {!message.is_read && (
                                                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                                                    )}
                                                </div>

                                                <p className="text-muted-foreground mb-4">{message.message}</p>

                                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center space-x-1">
                                                        <User size={14} />
                                                        <span>From: {message.from_user?.email || 'Unknown'}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <Clock size={14} />
                                                        <span>{formatDate(message.created_at)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2 ml-4">
                                                {!message.is_read && (
                                                    <button
                                                        onClick={() => markAsRead(message)}
                                                        className="p-2 hover:bg-blue-900/20 rounded-lg transition-colors text-blue-400"
                                                        title="Mark as read"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setCreateForm({
                                                            ...createForm,
                                                            to_user_id: message.from_user_id,
                                                            subject: `Re: ${message.subject}`,
                                                            message: ''
                                                        });
                                                        setShowCreateModal(true);
                                                    }}
                                                    className="p-2 hover:bg-green-900/20 rounded-lg transition-colors text-green-400"
                                                    title="Reply to message"
                                                >
                                                    <Reply size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {messages.length === 0 && (
                                    <div className="p-8 text-center">
                                        <MessageSquare size={48} className="mx-auto text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium text-foreground mb-2">No messages yet</h3>
                                        <p className="text-muted-foreground">Send your first message to get started.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
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
                            setShowCreateModal(false);
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
                            <h2 className="text-xl font-semibold text-foreground">
                                Create {activeTab === 'announcements' ? 'Announcement' : activeTab === 'tasks' ? 'Task' : 'Message'}
                            </h2>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Title/Subject Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {activeTab === 'messages' ? 'Subject' : 'Title'}
                                </label>
                                <input
                                    type="text"
                                    value={activeTab === 'messages' ? createForm.subject : createForm.title}
                                    onChange={(e) => setCreateForm(prev => ({
                                        ...prev,
                                        [activeTab === 'messages' ? 'subject' : 'title']: e.target.value
                                    }))}
                                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                                    placeholder={`Enter ${activeTab === 'messages' ? 'subject' : 'title'}`}
                                />
                            </div>

                            {/* Message/Description Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {activeTab === 'tasks' ? 'Description' : 'Message'}
                                </label>
                                <textarea
                                    value={activeTab === 'tasks' ? createForm.description : createForm.message}
                                    onChange={(e) => setCreateForm(prev => ({
                                        ...prev,
                                        [activeTab === 'tasks' ? 'description' : 'message']: e.target.value
                                    }))}
                                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                                    placeholder={`Enter ${activeTab === 'tasks' ? 'description' : 'message'}`}
                                    rows={6}
                                />
                            </div>

                            {/* Priority Field (for announcements and tasks) */}
                            {(activeTab === 'announcements' || activeTab === 'tasks') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                                    <select
                                        value={createForm.priority}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, priority: e.target.value as any }))}
                                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            )}

                            {/* Pin Announcement */}
                            {activeTab === 'announcements' && (
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        id="is_pinned"
                                        checked={createForm.is_pinned}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, is_pinned: e.target.checked }))}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="is_pinned" className="text-sm font-medium text-gray-300">
                                        Pin this announcement
                                    </label>
                                </div>
                            )}

                            {/* Task-specific fields */}
                            {activeTab === 'tasks' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Assign To</label>
                                        <select
                                            value={createForm.assigned_to_id}
                                            onChange={(e) => setCreateForm(prev => ({ ...prev, assigned_to_id: e.target.value }))}
                                            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                                        >
                                            <option value="">Select user...</option>
                                            {(adminUsers || []).map(user => (
                                                <option key={user.id} value={user.id}>{user.email}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
                                        <input
                                            type="datetime-local"
                                            value={createForm.due_date}
                                            onChange={(e) => setCreateForm(prev => ({ ...prev, due_date: e.target.value }))}
                                            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Message-specific fields */}
                            {activeTab === 'messages' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Send To</label>
                                    <select
                                        value={createForm.to_user_id}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, to_user_id: e.target.value }))}
                                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                                    >
                                        <option value="">Select user...</option>
                                        {(adminUsers || []).map(user => (
                                            <option key={user.id} value={user.id}>{user.email}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Fixed Footer */}
                        <div className="flex-shrink-0 p-6 border-t border-border">
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        resetCreateForm();
                                    }}
                                    disabled={isSaving}
                                    className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors font-medium text-gray-300 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={isSaving}
                                    className="flex-1 px-6 py-3 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Creating...
                                        </>
                                    ) : (
                                        activeTab === 'messages' ? 'Send Message' : `Create ${activeTab === 'announcements' ? 'Announcement' : 'Task'}`
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
                            {/* Same form fields as create modal */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={createForm.title}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
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
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                    <textarea
                                        value={createForm.description}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                                        rows={6}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                                <select
                                    value={createForm.priority}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, priority: e.target.value as any }))}
                                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
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
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                                        <select
                                            value={createForm.status}
                                            onChange={(e) => setCreateForm(prev => ({ ...prev, status: e.target.value as any }))}
                                            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                            <option value="overdue">Overdue</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Assign To</label>
                                        <select
                                            value={createForm.assigned_to_id}
                                            onChange={(e) => setCreateForm(prev => ({ ...prev, assigned_to_id: e.target.value }))}
                                            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                                        >
                                            <option value="">Select user...</option>
                                            {(adminUsers || []).map(user => (
                                                <option key={user.id} value={user.id}>{user.email}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
                                        <input
                                            type="datetime-local"
                                            value={createForm.due_date}
                                            onChange={(e) => setCreateForm(prev => ({
                                                ...prev,
                                                due_date: e.target.value
                                            }))}
                                            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
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
                            setShowEmailModal(false);
                            resetEmailForm();
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
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-foreground">
                                    {selectedItemForEmail ? 'Send Item as Email' : 'Send Direct Email'}
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowEmailModal(false);
                                        resetEmailForm();
                                    }}
                                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <XCircle size={20} className="text-muted-foreground" />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Email Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Email Type</label>
                                <select
                                    value={emailForm.email_type}
                                    onChange={(e) => setEmailForm(prev => ({ ...prev, email_type: e.target.value as any }))}
                                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                                >
                                    <option value="custom">Custom Email</option>
                                    <option value="announcement">Announcement</option>
                                    <option value="task_notification">Task Notification</option>
                                    <option value="direct_message">Direct Message</option>
                                </select>
                            </div>

                            {/* Recipients */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Recipients (comma-separated emails)
                                </label>
                                <textarea
                                    value={emailForm.to_emails}
                                    onChange={(e) => setEmailForm(prev => ({ ...prev, to_emails: e.target.value }))}
                                    placeholder="user1@example.com, user2@example.com"
                                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                                    rows={3}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Leave empty to send to all active admin users
                                </p>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                                <input
                                    type="text"
                                    value={emailForm.subject}
                                    onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                                    placeholder="Email subject"
                                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                                />
                            </div>

                            {/* Message */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                                <textarea
                                    value={emailForm.message}
                                    onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                                    placeholder="Email message content"
                                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                                    rows={8}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
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
                        <div className="flex-shrink-0 p-6 border-t border-border">
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => {
                                        setShowEmailModal(false);
                                        resetEmailForm();
                                    }}
                                    disabled={isSendingEmail}
                                    className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors font-medium text-gray-300 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendEmail}
                                    disabled={isSendingEmail || !emailForm.subject || !emailForm.message}
                                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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