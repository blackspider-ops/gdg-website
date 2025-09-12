import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useDev } from '@/contexts/DevContext';
import { Navigate } from 'react-router-dom';
import {
    MessageSquare,
    Plus,
    Send,
    Bell,
    Users,
    CheckSquare,
    Clock,
    User,
    Calendar,
    Filter,
    Search,
    Edit3,
    Trash2,
    Pin,
    Archive
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

const AdminCommunications: React.FC = () => {
    const { isAuthenticated, currentAdmin } = useAdmin();
    const { isDevelopmentMode, allowDirectAdminAccess } = useDev();
    const [activeTab, setActiveTab] = useState('announcements');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const canAccess = isAuthenticated || (isDevelopmentMode && allowDirectAdminAccess);

    // Force scroll to top when component mounts
    useEffect(() => {
        // Multiple approaches to ensure scroll to top works
        const scrollToTop = () => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;

            // Also try Lenis if available
            const lenis = (window as any).lenis;
            if (lenis && lenis.scrollTo) {
                lenis.scrollTo(0, { immediate: true });
            }
        };

        scrollToTop();
        // Also try after a short delay
        setTimeout(scrollToTop, 50);
        setTimeout(scrollToTop, 150);
    }, []);

    if (!canAccess) {
        return <Navigate to="/" replace />;
    }

    // Mock data
    const announcements = [
        {
            id: 1,
            title: 'Upcoming Hackathon Planning Meeting',
            message: 'We need to finalize the details for our annual hackathon. Please review the budget proposal and venue options.',
            author: 'John Doe',
            authorEmail: 'john.doe@psu.edu',
            createdAt: '2024-09-10T10:30:00Z',
            priority: 'high',
            isPinned: true,
            readBy: ['jane.smith@psu.edu', 'mike.j@psu.edu'],
            totalRecipients: 5
        },
        {
            id: 2,
            title: 'New Sponsor Onboarding',
            message: 'Microsoft has confirmed their Gold sponsorship. We need to update the website and prepare welcome materials.',
            author: 'Jane Smith',
            authorEmail: 'jane.smith@psu.edu',
            createdAt: '2024-09-09T14:15:00Z',
            priority: 'medium',
            isPinned: false,
            readBy: ['john.doe@psu.edu'],
            totalRecipients: 5
        }
    ];

    const tasks = [
        {
            id: 1,
            title: 'Update event registration form',
            description: 'Add new fields for dietary restrictions and accessibility needs',
            assignedTo: 'Jane Smith',
            assignedBy: 'John Doe',
            dueDate: '2024-09-15',
            status: 'in-progress',
            priority: 'high',
            createdAt: '2024-09-05T10:00:00Z'
        }
    ];

    const messages = [
        {
            id: 1,
            from: 'John Doe',
            fromEmail: 'john.doe@psu.edu',
            to: 'Jane Smith',
            toEmail: 'jane.smith@psu.edu',
            subject: 'Budget approval needed',
            message: 'Can you review the hackathon budget? We need approval by Friday.',
            timestamp: '2024-09-10T16:45:00Z',
            isRead: false
        }
    ];

    const tabs = [
        { id: 'announcements', label: 'Announcements', icon: Bell },
        { id: 'tasks', label: 'Tasks', icon: CheckSquare },
        { id: 'messages', label: 'Messages', icon: MessageSquare },
    ];

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-800 border-red-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'in-progress': return 'bg-blue-100 text-blue-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'overdue': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
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

    const commStats = [
        { label: 'Active Announcements', value: announcements.length.toString(), color: 'text-blue-500' },
        { label: 'Pending Tasks', value: tasks.filter(t => t.status === 'pending' || t.status === 'in-progress').length.toString(), color: 'text-orange-500' },
        { label: 'Unread Messages', value: messages.filter(m => !m.isRead).length.toString(), color: 'text-red-500' },
        { label: 'Team Members', value: '8', color: 'text-green-500' },
    ];

    return (
        <AdminLayout
            title="Communications Hub"
            subtitle="Internal team communications and task management"
            icon={MessageSquare}
            actions={
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    <Plus size={16} />
                    <span>Create {activeTab === 'announcements' ? 'Announcement' : activeTab === 'tasks' ? 'Task' : 'Message'}</span>
                </button>
            }
        >
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {commStats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <MessageSquare size={24} className={stat.color} />
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                        <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-8">
                <nav className="flex space-x-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <Filter size={16} className="text-gray-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        >
                            <option value="all">All Status</option>
                            <option value="high">High Priority</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                {activeTab === 'announcements' && (
                    <>
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Team Announcements</h2>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {announcements.map((announcement) => (
                                <div key={announcement.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                {announcement.isPinned && <Pin size={16} className="text-blue-600" />}
                                                <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium border ${getPriorityColor(announcement.priority)}`}>
                                                    {announcement.priority}
                                                </span>
                                            </div>

                                            <p className="text-gray-600 mb-4">{announcement.message}</p>

                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                <div className="flex items-center space-x-1">
                                                    <User size={14} />
                                                    <span>{announcement.author}</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <Clock size={14} />
                                                    <span>{formatDate(announcement.createdAt)}</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <Users size={14} />
                                                    <span>{announcement.readBy.length}/{announcement.totalRecipients} read</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2 ml-4">
                                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
                                                <Edit3 size={16} />
                                            </button>
                                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
                                                <Archive size={16} />
                                            </button>
                                            <button className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {activeTab === 'tasks' && (
                    <>
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Task Management</h2>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {tasks.map((task) => (
                                <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(task.status)}`}>
                                                    {task.status.replace('-', ' ')}
                                                </span>
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium border ${getPriorityColor(task.priority)}`}>
                                                    {task.priority}
                                                </span>
                                            </div>

                                            <p className="text-gray-600 mb-4">{task.description}</p>

                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                <div className="flex items-center space-x-1">
                                                    <User size={14} />
                                                    <span>Assigned to: {task.assignedTo}</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <Calendar size={14} />
                                                    <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <Clock size={14} />
                                                    <span>Created: {formatDate(task.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2 ml-4">
                                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
                                                <Edit3 size={16} />
                                            </button>
                                            <button className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {activeTab === 'messages' && (
                    <>
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Internal Messages</h2>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {messages.map((message) => (
                                <div key={message.id} className={`p-6 hover:bg-gray-50 transition-colors ${!message.isRead ? 'bg-blue-50' : ''}`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900">{message.subject}</h3>
                                                {!message.isRead && (
                                                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                                )}
                                            </div>

                                            <p className="text-gray-600 mb-4">{message.message}</p>

                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                <div className="flex items-center space-x-1">
                                                    <User size={14} />
                                                    <span>From: {message.from}</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <Users size={14} />
                                                    <span>To: {message.to}</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <Clock size={14} />
                                                    <span>{formatDate(message.timestamp)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2 ml-4">
                                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
                                                <Send size={16} />
                                            </button>
                                            <button className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Create New {activeTab === 'announcements' ? 'Announcement' : activeTab === 'tasks' ? 'Task' : 'Message'}
                            </h2>
                        </div>

                        <form className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {activeTab === 'messages' ? 'Subject' : 'Title'}
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                    placeholder={`Enter ${activeTab === 'messages' ? 'subject' : 'title'}`}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {activeTab === 'tasks' ? 'Description' : 'Message'}
                                </label>
                                <textarea
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                    placeholder={`Enter ${activeTab === 'tasks' ? 'description' : 'message'}`}
                                />
                            </div>
                        </form>

                        <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                                {activeTab === 'messages' ? 'Send Message' : `Create ${activeTab === 'announcements' ? 'Announcement' : 'Task'}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminCommunications;