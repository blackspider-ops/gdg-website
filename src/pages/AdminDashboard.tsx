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
  MessageCircle,
  DollarSign
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
import { TeamManagementService } from '@/services/teamManagementService';
import { FinancesService } from '@/services/financesService';
import { PermissionsService, TEAM_PAGE_ACCESS, PAGE_PERMISSIONS } from '@/services/permissionsService';
import MyTeamsWidget from '@/components/admin/MyTeamsWidget';

const AdminDashboard = () => {
  const { isAuthenticated, currentAdmin, logout, userTeams, isSuperAdmin, isAdmin } = useAdmin();
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
  const [teamQuickStats, setTeamQuickStats] = useState<{
    totalTeams: number;
    activeTeams: number;
    totalMemberships: number;
    teamDistribution: Record<string, number>;
    pendingFinanceApprovals: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Compute accessible pages synchronously based on role and team memberships
  const getAccessiblePagesSync = (): string[] => {
    if (!currentAdmin) return [];
    
    // Super admins can access everything
    if (isSuperAdmin) {
      return Object.keys(PAGE_PERMISSIONS);
    }
    
    // Regular admins can access most pages except /admin/users
    if (isAdmin) {
      return Object.keys(PAGE_PERMISSIONS).filter(p => p !== '/admin/users');
    }
    
    // Team members - base pages they always have access to
    const basePages = ['/admin', '/admin/profile', '/admin/guide', '/admin/teams', '/admin/finances', '/admin/communications', '/admin/projects'];
    
    // Add pages based on team membership
    const teamPages = new Set<string>();
    userTeams.forEach(membership => {
      const teamSlug = membership.team?.slug;
      if (teamSlug && TEAM_PAGE_ACCESS[teamSlug]) {
        TEAM_PAGE_ACCESS[teamSlug].forEach(page => teamPages.add(page));
      }
    });
    
    return [...basePages, ...teamPages];
  };

  const accessiblePages = getAccessiblePagesSync();

  // Enable automatic task overdue checking globally
  useTaskScheduler(true);

  const loadDashboardStats = async () => {
    setIsLoading(true);
    try {
      // Load ALL stats in parallel for faster loading
      const [
        memberStats,
        eventStats,
        projectStats,
        sponsorStats,
        newsletterStats,
        blogStats,
        pendingApprovals,
        userTasks,
        userMessages,
        commentStats,
        unreadAnnouncements
      ] = await Promise.all([
        MembersService.getMemberStats().catch(() => ({ total: 0 })),
        EventsService.getEventStats().catch(() => ({ upcoming: 0 })),
        ProjectsService.getProjectStats().catch(() => ({ total: 0 })),
        SponsorsService.getSponsorStats().catch(() => ({ active: 0 })),
        NewsletterService.getSubscriberStats().catch(() => ({ active: 0, recent: 0 })),
        BlogService.getBlogStats().catch(() => ({ publishedPosts: 0 })),
        BlogService.getPendingApprovalsCount().catch(() => 0),
        currentAdmin?.id 
          ? CommunicationsService.getTasks({ assigned_to: currentAdmin.id, status: 'pending' }).catch(() => [])
          : Promise.resolve([]),
        currentAdmin?.id 
          ? CommunicationsService.getMessages(currentAdmin.id, currentAdmin.role).catch(() => [])
          : Promise.resolve([]),
        BlogCommentsService.getCommentStats().catch(() => ({ pending: 0 })),
        currentAdmin?.id 
          ? CommunicationsService.getUnreadAnnouncementsCount(currentAdmin.id).catch(() => 0)
          : Promise.resolve(0)
      ]);

      const unreadMessages = userMessages.filter(msg => !msg.is_read && msg.to_user_id === currentAdmin?.id).length;

      setDashboardStats({
        totalMembers: memberStats.total,
        upcomingEvents: eventStats.upcoming,
        newsletterSubscribers: newsletterStats.active,
        activeProjects: projectStats.total,
        totalSponsors: sponsorStats.active,
        blogPosts: blogStats.publishedPosts,
        pendingApprovals: pendingApprovals,
        pendingTasks: userTasks.length,
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

      // Load team quick stats (for admins and super admins)
      if (currentAdmin?.role === 'super_admin' || currentAdmin?.role === 'admin') {
        try {
          const [teamStats, financeStats] = await Promise.all([
            TeamManagementService.getTeamStats(),
            FinancesService.getFinanceStats({ status: 'pending' })
          ]);
          setTeamQuickStats({
            ...teamStats,
            pendingFinanceApprovals: financeStats.pendingApprovals
          });
        } catch (err) {
          console.error('Failed to load team stats:', err);
        }
      }
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

  const allStats = [
    { label: 'Total Members', value: dashboardStats.totalMembers.toString(), icon: Users, color: 'text-blue-500', requiredPage: '/admin/members' },
    { label: 'Upcoming Events', value: dashboardStats.upcomingEvents.toString(), icon: Calendar, color: 'text-green-500', requiredPage: '/admin/events' },
    { label: 'Newsletter Subscribers', value: dashboardStats.newsletterSubscribers.toString(), icon: Mail, color: 'text-purple-500', requiredPage: '/admin/newsletter' },
    { label: 'Active Projects', value: dashboardStats.activeProjects.toString(), icon: FileText, color: 'text-orange-500', requiredPage: '/admin/projects' },
    { label: 'Blog Posts', value: dashboardStats.blogPosts.toString(), icon: PenTool, color: 'text-pink-500', requiredPage: '/admin/blog' },
    { label: 'My Pending Tasks', value: dashboardStats.pendingTasks.toString(), icon: MessageSquare, color: 'text-cyan-500', href: '/admin/communications?tab=tasks', requiredPage: '/admin/communications' },
    { label: 'Unread Messages', value: dashboardStats.unreadMessages.toString(), icon: MessageCircle, color: 'text-indigo-500', href: '/admin/communications?tab=messages', requiredPage: '/admin/communications' },
    { label: 'Unread Announcements', value: dashboardStats.unreadAnnouncements.toString(), icon: Bell, color: 'text-amber-500', href: '/admin/communications?tab=announcements', requiredPage: '/admin/communications' },
    { label: 'Pending Comments', value: dashboardStats.pendingComments.toString(), icon: MessageCircle, color: 'text-red-500', href: '/admin/blog?tab=comments', requiredPage: '/admin/blog' },
    { label: 'Pending Approvals', value: dashboardStats.pendingApprovals?.toString() || '0', icon: Clock, color: 'text-yellow-500', requiredPage: '/admin/blog' },
  ];

  // Helper function to check if user can access a page
  const canAccess = (path: string) => {
    // Super admins can access everything
    if (currentAdmin?.role === 'super_admin') return true;
    // Regular admins can access most pages except /admin/users
    if (currentAdmin?.role === 'admin') return path !== '/admin/users';
    // For team members, check the accessible pages list
    return accessiblePages.includes(path);
  };

  // Filter stats based on user access
  const stats = allStats.filter(stat => canAccess(stat.requiredPage));

  // Filter quick actions based on role and permissions
  const allQuickActions = [
    { label: 'Site & Content', icon: FileText, href: '/admin/content', roles: ['super_admin'] },
    { label: 'Team Management', icon: Users, href: '/admin/team', roles: ['super_admin'] },
    { label: 'Manage Events', icon: Calendar, href: '/admin/events', roles: ['super_admin', 'admin', 'team_member'] },
    { label: 'Manage Projects', icon: FolderOpen, href: '/admin/projects', roles: ['super_admin', 'admin', 'team_member'] },
    { label: 'View Members', icon: Users, href: '/admin/members', roles: ['super_admin', 'admin', 'team_member'] },
    { label: 'Resources', icon: FileText, href: '/admin/resources', roles: ['super_admin', 'admin', 'team_member'] },
    { label: 'Newsletter', icon: Mail, href: '/admin/newsletter', roles: ['super_admin', 'admin', 'team_member'] },
    { label: 'Blog', icon: PenTool, href: '/admin/blog', roles: ['super_admin', 'admin', 'team_member'] },
    { label: 'Linktree', icon: LinkIcon, href: '/admin/linktree', roles: ['super_admin', 'admin', 'team_member'] },
  ];

  const quickActions = allQuickActions.filter(action => 
    action.roles.includes(currentAdmin?.role || '') && canAccess(action.href)
  );

  // Filter business actions based on role and permissions
  const allBusinessActions = [
    { label: 'Manage Sponsors', icon: Building2, href: '/admin/sponsors', roles: ['super_admin'] },
    { label: 'Communications Hub', icon: MessageSquare, href: '/admin/communications', roles: ['super_admin', 'admin', 'team_member'] },
    { label: 'Media Library', icon: FolderOpen, href: '/admin/media', roles: ['super_admin', 'admin', 'team_member'] },
    { label: 'Finances', icon: DollarSign, href: '/admin/finances', roles: ['super_admin', 'admin', 'team_member'] },
  ];

  const businessActions = allBusinessActions.filter(action => 
    action.roles.includes(currentAdmin?.role || '') && canAccess(action.href)
  );

  // Admin actions - only for super admins and admins
  const allAdminActions = [
    { label: 'Admin Users', icon: Shield, href: '/admin/users', roles: ['super_admin'] },
    { label: 'Admin Teams', icon: Users, href: '/admin/teams', roles: ['super_admin', 'admin', 'team_member'] },
    { label: 'Audit Log', icon: FileText, href: '/admin/audit-log', roles: ['super_admin', 'admin'] },
    { label: 'Site Status', icon: Globe, href: '/admin/site-status', roles: ['super_admin'] },
  ];

  const adminActions = allAdminActions.filter(action => 
    action.roles.includes(currentAdmin?.role || '') && canAccess(action.href)
  );

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

        {/* Communications Hub - Prominent Section (Only for regular admins who have access) */}
        {currentAdmin?.role === 'admin' && canAccess('/admin/communications') && (
          <div className="col-span-12 mb-8">
            <Link
              to="/admin/communications"
              className="block bg-gradient-to-r from-gdg-green/10 to-gdg-blue/10 border-2 border-gdg-green rounded-lg p-8 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gdg-green rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageSquare size={32} className="text-white" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-foreground mb-1">Communications Hub</h2>
                    <p className="text-muted-foreground">Manage messages, tasks, and announcements</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  {dashboardStats.unreadMessages > 0 && (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gdg-blue">{dashboardStats.unreadMessages}</div>
                      <div className="text-sm text-muted-foreground">Unread Messages</div>
                    </div>
                  )}
                  {dashboardStats.pendingTasks > 0 && (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gdg-yellow">{dashboardStats.pendingTasks}</div>
                      <div className="text-sm text-muted-foreground">Pending Tasks</div>
                    </div>
                  )}
                  {dashboardStats.unreadAnnouncements > 0 && (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gdg-red">{dashboardStats.unreadAnnouncements}</div>
                      <div className="text-sm text-muted-foreground">New Announcements</div>
                    </div>
                  )}
                  {dashboardStats.unreadMessages === 0 && dashboardStats.pendingTasks === 0 && dashboardStats.unreadAnnouncements === 0 && (
                    <div className="text-center px-6">
                      <div className="text-lg text-muted-foreground">All caught up! 🎉</div>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </div>
        )}

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
            {businessActions.length > 0 && (
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
            )}

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
          {/* My Teams Widget */}
          <MyTeamsWidget />

          {/* Team Quick Stats - For Admins */}
          {teamQuickStats && (currentAdmin?.role === 'super_admin' || currentAdmin?.role === 'admin') && (
            <div className="bg-card border border-border rounded-lg p-6 mt-6">
              <h2 className="font-display text-lg font-semibold mb-4 text-foreground flex items-center">
                <BarChart3 size={18} className="mr-2 text-primary" />
                Team Overview
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-foreground">{teamQuickStats.activeTeams}</div>
                  <div className="text-xs text-muted-foreground">Active Teams</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-foreground">{teamQuickStats.totalMemberships}</div>
                  <div className="text-xs text-muted-foreground">Team Members</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 col-span-2">
                  <div className="text-2xl font-bold text-yellow-600">{teamQuickStats.pendingFinanceApprovals}</div>
                  <div className="text-xs text-muted-foreground">Pending Finance Approvals</div>
                </div>
              </div>
              {Object.keys(teamQuickStats.teamDistribution).length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Members by Team</h3>
                  <div className="space-y-2">
                    {Object.entries(teamQuickStats.teamDistribution)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([teamName, count]) => (
                        <div key={teamName} className="flex items-center justify-between text-sm">
                          <span className="text-foreground truncate">{teamName}</span>
                          <span className="text-muted-foreground ml-2">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="bg-card border border-border rounded-lg p-6 mt-6">
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