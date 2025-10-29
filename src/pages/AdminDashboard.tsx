import { useAdmin } from '@/contexts/AdminContext';
import { Navigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { 
  Users, 
  Calendar, 
  Mail, 
  BarChart3, 
  Settings, 
  LogOut,
  Shield,
  FileText,
  Activity,
  Building2,
  MessageSquare,
  FolderOpen,
  RefreshCw,
  BookOpen,
  PenTool,
  Globe,
  Link as LinkIcon,
  Clock,
  Bell,
  MessageCircle
} from 'lucide-react';

import { EventsService } from '@/services/eventsService';
import { MembersService } from '@/services/membersService';
import { BlogService } from '@/services/blogService';
import { ProjectsService } from '@/services/projectsService';
import { SponsorsService } from '@/services/sponsorsService';
import { NewsletterService } from '@/services/newsletterService';
import { useTaskScheduler } from '@/hooks/useTaskScheduler';
import { CommunicationsService } from '@/services/communicationsService';
import { BlogCommentsService } from '@/services/blogCommentsService';
import { AuditService } from '@/services/auditService';

const AdminDashboard = () => {
  const { isAuthenticated, currentAdmin, logout } = useAdmin();
  const [dashboardStats, setDashboardStats] = useState({
    totalMembers: 0,
    upcomingEvents: 0,
    newsletterSubscribers: 0,
    activeProjects: 0,
    totalSponsors: 0,
    blogPosts: 0,
    pendingTasks: 0,
    unreadMessages: 0,
    unreadAnnouncements: 0,
    pendingComments: 0
  });
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    color: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Enable automatic task overdue checking globally
  useTaskScheduler(true);

  const loadDashboardStats = async () => {
    setIsLoading(true);
    try {
      // Load stats in batches to improve perceived performance
      const [memberStats, eventStats] = await Promise.all([
        MembersService.getMemberStats(),
        EventsService.getEventStats()
      ]);

      // Update UI with first batch
      setDashboardStats(prev => ({
        ...prev,
        totalMembers: memberStats.total,
        upcomingEvents: eventStats.upcoming
      }));

      // Load remaining stats
      const [projectStats, sponsorStats, newsletterStats, blogStats, pendingApprovals] = await Promise.all([
        ProjectsService.getProjectStats(),
        SponsorsService.getSponsorStats(),
        NewsletterService.getSubscriberStats(),
        BlogService.getBlogStats(),
        BlogService.getPendingApprovalsCount()
      ]);

      // Get pending tasks count for current user
      const userTasks = currentAdmin?.id ? await CommunicationsService.getTasks({
        assigned_to: currentAdmin.id,
        status: 'pending'
      }) : [];
      const pendingTasks = userTasks.length;

      // Get unread messages, announcements, and pending comments for current user
      const [userMessages, userAnnouncements, commentStats] = await Promise.all([
        currentAdmin?.id ? CommunicationsService.getMessages(currentAdmin.id, currentAdmin.role) : Promise.resolve([]),
        CommunicationsService.getAnnouncements({}),
        BlogCommentsService.getCommentStats()
      ]);

      const unreadMessages = userMessages.filter(msg => !msg.is_read && msg.to_user_id === currentAdmin?.id).length;
      const unreadAnnouncements = currentAdmin?.id ? await CommunicationsService.getUnreadAnnouncementsCount(currentAdmin.id) : 0;

      setDashboardStats({
        totalMembers: memberStats.total,
        upcomingEvents: eventStats.upcoming,
        newsletterSubscribers: newsletterStats.active, // Now using real data
        activeProjects: projectStats.total,
        totalSponsors: sponsorStats.active,
        blogPosts: blogStats.publishedPosts,
        pendingApprovals: pendingApprovals,
        pendingTasks: pendingTasks,
        unreadMessages: unreadMessages,
        unreadAnnouncements: unreadAnnouncements,
        pendingComments: commentStats.pending
      });

      // Generate recent activity based on real data
      const activities = [];
      
      if (memberStats.total > 0) {
        activities.push({
          id: 'members',
          type: 'member',
          message: `${memberStats.total} total members in the community`,
          timestamp: 'Current',
          color: 'bg-green-500'
        });
      }
      
      if (eventStats.upcoming > 0) {
        activities.push({
          id: 'events',
          type: 'event',
          message: `${eventStats.upcoming} upcoming event${eventStats.upcoming > 1 ? 's' : ''} scheduled`,
          timestamp: 'Upcoming',
          color: 'bg-blue-500'
        });
      }
      
      if (newsletterStats.recent > 0) {
        activities.push({
          id: 'newsletter',
          type: 'newsletter',
          message: `${newsletterStats.recent} new newsletter subscriber${newsletterStats.recent > 1 ? 's' : ''} this month`,
          timestamp: 'This month',
          color: 'bg-purple-500'
        });
      }
      
      if (projectStats.total > 0) {
        activities.push({
          id: 'projects',
          type: 'project',
          message: `${projectStats.total} active project${projectStats.total > 1 ? 's' : ''} in development`,
          timestamp: 'Active',
          color: 'bg-orange-500'
        });
      }

      // Add fallback activity if no real activities
      if (activities.length === 0) {
        activities.push({
          id: 'system',
          type: 'system',
          message: 'System is running smoothly',
          timestamp: 'Now',
          color: 'bg-green-500'
        });
      }
      
      setRecentActivity(activities.slice(0, 4)); // Show max 4 activities
    } catch (error) {
      // Set fallback values in case of error
      setDashboardStats({
        totalMembers: 0,
        upcomingEvents: 0,
        newsletterSubscribers: 0,
        activeProjects: 0,
        totalSponsors: 0,
        blogPosts: 0,
        pendingTasks: 0,
        unreadMessages: 0,
        unreadAnnouncements: 0,
        pendingComments: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load dashboard statistics on mount
  useEffect(() => {
    loadDashboardStats();
    
    // Log dashboard access
    if (currentAdmin?.id) {
      AuditService.logAction(
        currentAdmin.id,
        'view_admin_dashboard',
        undefined,
        {
          description: 'Accessed admin dashboard',
          role: currentAdmin.role,
          timestamp: new Date().toISOString()
        }
      );
    }
  }, [currentAdmin?.id]);

  // Authentication check after all hooks
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Redirect blog editors to their restricted dashboard
  if (currentAdmin?.role === 'blog_editor') {
    return <Navigate to="/admin/blog-editor" replace />;
  }

  const stats = [
    { label: 'Total Members', value: dashboardStats.totalMembers.toString(), icon: Users, color: 'text-blue-500' },
    { label: 'Upcoming Events', value: dashboardStats.upcomingEvents.toString(), icon: Calendar, color: 'text-green-500' },
    { label: 'Newsletter Subscribers', value: dashboardStats.newsletterSubscribers.toString(), icon: Mail, color: 'text-purple-500' },
    { label: 'Active Projects', value: dashboardStats.activeProjects.toString(), icon: FileText, color: 'text-orange-500' },
    { label: 'Blog Posts', value: dashboardStats.blogPosts.toString(), icon: PenTool, color: 'text-pink-500' },
    { label: 'My Pending Tasks', value: dashboardStats.pendingTasks.toString(), icon: MessageSquare, color: 'text-cyan-500', href: '/admin/communications?tab=tasks' },
    { label: 'Unread Messages', value: dashboardStats.unreadMessages.toString(), icon: MessageCircle, color: 'text-indigo-500', href: '/admin/communications?tab=messages' },
    { label: 'Unread Announcements', value: dashboardStats.unreadAnnouncements.toString(), icon: Bell, color: 'text-amber-500', href: '/admin/communications?tab=announcements' },
    { label: 'Pending Comments', value: dashboardStats.pendingComments.toString(), icon: MessageCircle, color: 'text-red-500', href: '/admin/blog?tab=comments' },
    { label: 'Pending Approvals', value: dashboardStats.pendingApprovals?.toString() || '0', icon: Clock, color: 'text-yellow-500' },
  ];

  const quickActions = [
    { label: 'Site & Content', icon: FileText, href: '/admin/content' },
    { label: 'Manage Events', icon: Calendar, href: '/admin/events' },
    { label: 'Team Management', icon: Users, href: '/admin/team' },
    { label: 'Manage Projects', icon: FolderOpen, href: '/admin/projects' },
    { label: 'View Members', icon: Users, href: '/admin/members' },
    { label: 'Resources', icon: FileText, href: '/admin/resources' },
    { label: 'Newsletter', icon: Mail, href: '/admin/newsletter' },
    { label: 'Blog', icon: FileText, href: '/admin/blog' },
    { label: 'Linktree', icon: LinkIcon, href: '/admin/linktree' },
  ];

  const businessActions = [
    { label: 'Manage Sponsors', icon: Building2, href: '/admin/sponsors' },
    { label: 'Communications Hub', icon: MessageSquare, href: '/admin/communications' },
    { label: 'Media Library', icon: FolderOpen, href: '/admin/media' },

  ];

  // Add admin user management for super admins
  const adminActions = currentAdmin && currentAdmin.role === 'super_admin' ? [
    { label: 'Admin Users', icon: Shield, href: '/admin/users' },
    { label: 'Site Status', icon: Globe, href: '/admin/site-status' },
  ] : [];

  const helpActions = [
    { label: 'Project Guide', icon: BookOpen, href: '/admin/guide' },
  ];

  const profileActions = [
    { label: 'My Profile', icon: Users, href: '/admin/profile' },
  ];

  return (
    <AdminPageWrapper pageName="Admin Dashboard" pageTitle="Dashboard">
      <div className="min-h-screen bg-background pt-20">
      <div className="editorial-grid py-8">
        {/* Header */}
        <div className="col-span-12 flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Shield size={20} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground text-sm">
                Welcome, {currentAdmin.email} ({currentAdmin.role})
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                loadDashboardStats();
                // Log refresh action
                if (currentAdmin?.id) {
                  AuditService.logAction(
                    currentAdmin.id,
                    'refresh_dashboard_stats',
                    undefined,
                    {
                      description: 'Refreshed dashboard statistics',
                      timestamp: new Date().toISOString()
                    }
                  );
                }
              }}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>



        {/* Stats Grid */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mb-8">
          {isLoading ? (
            Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="bg-card border border-border rounded-lg p-6">
                <div className="animate-pulse">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-6 h-6 bg-gray-200 rounded"></div>
                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  </div>
                  <div className="w-16 h-8 bg-gray-200 rounded mb-1"></div>
                  <div className="w-24 h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))
          ) : (
            stats.map((stat, index) => {
              const Icon = stat.icon;
              const content = (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <Icon size={24} className={stat.color} />
                    <Activity size={16} className="text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold mb-1 text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </>
              );

              if (stat.href) {
                return (
                  <Link 
                    key={index} 
                    to={stat.href}
                    className="bg-card border border-border rounded-lg p-6 hover:bg-muted/50 transition-colors cursor-pointer block"
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <div key={index} className="bg-card border border-border rounded-lg p-6">
                  {content}
                </div>
              );
            })
          )}
        </div>

        {/* Quick Actions */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-display text-lg font-semibold mb-6 text-foreground">Quick Actions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={index}
                    to={action.href}
                    className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors group"
                  >
                    <Icon size={20} className="text-primary group-hover:text-primary/80" />
                    <span className="font-medium text-foreground">{action.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Admin Management Section (Super Admins Only) */}
            {adminActions.length > 0 && (
              <>
                <div className="border-t border-border mt-6 pt-6">
                  <h3 className="font-display text-md font-semibold mb-4 text-destructive">Admin Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {adminActions.map((action, index) => {
                      const Icon = action.icon;
                      return (
                        <Link
                          key={index}
                          to={action.href}
                          className="flex items-center space-x-3 p-4 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors group"
                        >
                          <Icon size={20} className="text-red-600 group-hover:text-red-700" />
                          <span className="font-medium text-red-700">{action.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Business Management Section */}
            <div className="border-t border-border mt-6 pt-6">
              <h3 className="font-display text-md font-semibold mb-4 text-gdg-green">Business Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {businessActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={index}
                      to={action.href}
                      className="flex items-center space-x-3 p-4 border border-green-200 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
                    >
                      <Icon size={20} className="text-green-600 group-hover:text-green-700" />
                      <span className="font-medium text-green-700">{action.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Profile Section */}
            <div className="border-t border-border mt-6 pt-6">
              <h3 className="font-display text-md font-semibold mb-4 text-foreground">Account</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profileActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={index}
                      to={action.href}
                      className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors group"
                    >
                      <Icon size={20} className="text-primary group-hover:text-blue-700" />
                      <span className="font-medium text-foreground">{action.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Help & Documentation */}
            <div className="border-t border-border mt-6 pt-6">
              <h3 className="font-display text-md font-semibold mb-4 text-accent">Help & Documentation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {helpActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={index}
                      to={action.href}
                      className="flex items-center space-x-3 p-4 border border-purple-200 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
                    >
                      <Icon size={20} className="text-purple-600 group-hover:text-purple-700" />
                      <span className="font-medium text-purple-700">{action.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-display text-lg font-semibold mb-6 text-foreground">Recent Activity</h2>
            
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-start space-x-3 animate-pulse">
                    <div className="w-2 h-2 bg-muted rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded mb-1"></div>
                      <div className="h-3 bg-muted rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 ${activity.color} rounded-full mt-2`}></div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{activity.message}</div>
                      <div className="text-xs text-muted-foreground">{activity.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity size={32} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            )}
          </div>
        </div>


      </div>
    </div>
    </AdminPageWrapper>
  );
};

export default AdminDashboard;