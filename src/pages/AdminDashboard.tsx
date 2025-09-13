import { useAdmin } from '@/contexts/AdminContext';
import { useDev } from '@/contexts/DevContext';
import { Navigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
  RefreshCw
} from 'lucide-react';
import DevSettings from '@/components/admin/DevSettings';
import { EventsService } from '@/services/eventsService';
import { MembersService } from '@/services/membersService';
import { ProjectsService } from '@/services/projectsService';
import { SponsorsService } from '@/services/sponsorsService';
import { NewsletterService } from '@/services/newsletterService';

const AdminDashboard = () => {
  const { isAuthenticated, currentAdmin, logout } = useAdmin();
  const { isDevelopmentMode, allowDirectAdminAccess } = useDev();
  const [dashboardStats, setDashboardStats] = useState({
    totalMembers: 0,
    upcomingEvents: 0,
    newsletterSubscribers: 0,
    activeProjects: 0,
    totalSponsors: 0
  });
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    color: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Allow direct access in development mode if enabled
  const canAccess = isAuthenticated || (isDevelopmentMode && allowDirectAdminAccess);

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  // Load dashboard statistics
  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setIsLoading(true);
    try {
      const [memberStats, eventStats, projectStats, sponsorStats, newsletterStats] = await Promise.all([
        MembersService.getMemberStats(),
        EventsService.getEventStats(),
        ProjectsService.getProjectStats(),
        SponsorsService.getSponsorStats(),
        NewsletterService.getSubscriberStats()
      ]);

      setDashboardStats({
        totalMembers: memberStats.total,
        upcomingEvents: eventStats.upcoming,
        newsletterSubscribers: newsletterStats.active, // Now using real data
        activeProjects: projectStats.total,
        totalSponsors: sponsorStats.active
      });

      // Generate recent activity based on real data
      const activities = [];
      
      if (memberStats.recent > 0) {
        activities.push({
          id: 'members',
          type: 'member',
          message: `${memberStats.recent} new member${memberStats.recent > 1 ? 's' : ''} joined recently`,
          timestamp: 'Recent',
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
      console.error('Error loading dashboard stats:', error);
      // Set fallback values in case of error
      setDashboardStats({
        totalMembers: 0,
        upcomingEvents: 0,
        newsletterSubscribers: 0,
        activeProjects: 0,
        totalSponsors: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stats = [
    { label: 'Total Members', value: dashboardStats.totalMembers.toString(), icon: Users, color: 'text-blue-500' },
    { label: 'Upcoming Events', value: dashboardStats.upcomingEvents.toString(), icon: Calendar, color: 'text-green-500' },
    { label: 'Newsletter Subscribers', value: dashboardStats.newsletterSubscribers.toString(), icon: Mail, color: 'text-purple-500' },
    { label: 'Active Projects', value: dashboardStats.activeProjects.toString(), icon: FileText, color: 'text-orange-500' },
  ];

  const quickActions = [
    { label: 'Site & Content', icon: FileText, href: '/admin/content' },
    { label: 'Manage Events', icon: Calendar, href: '/admin/events' },
    { label: 'Team Management', icon: Users, href: '/admin/team' },
    { label: 'View Members', icon: Users, href: '/admin/members' },
    { label: 'Resources', icon: FileText, href: '/admin/resources' },
    { label: 'Newsletter', icon: Mail, href: '/admin/newsletter' },
  ];

  const businessActions = [
    { label: 'Manage Sponsors', icon: Building2, href: '/admin/sponsors' },
    { label: 'Communications Hub', icon: MessageSquare, href: '/admin/communications' },
    { label: 'Media Library', icon: FolderOpen, href: '/admin/media' },
  ];

  // Add admin user management for super admins
  const adminActions = currentAdmin && currentAdmin.role === 'super_admin' ? [
    { label: 'Admin Users', icon: Shield, href: '/admin/users' },
  ] : [];

  const profileActions = [
    { label: 'My Profile', icon: Users, href: '/admin/profile' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 pt-20">
      <div className="editorial-grid py-8">
        {/* Header */}
        <div className="col-span-12 flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-gray-400 text-sm">
                {currentAdmin ? (
                  <>Welcome, {currentAdmin.email} ({currentAdmin.role})</>
                ) : (
                  <>Development Mode - Direct Access Enabled</>
                )}
              </p>
              {isDevelopmentMode && (
                <div className="mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                  🚧 Development Mode Active
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={loadDashboardStats}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 text-sm border border-gray-700 rounded-lg hover:bg-gray-900 transition-colors text-gray-300 disabled:opacity-50"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            
            {currentAdmin && (
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 text-sm border border-gray-700 rounded-lg hover:bg-gray-900 transition-colors text-gray-300"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>

        {/* Development Settings */}
        <div className="col-span-12 mb-8">
          <DevSettings />
        </div>

        {/* Stats Grid */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-black border border-gray-800 rounded-lg p-6">
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
              return (
                <div key={index} className="bg-black border border-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Icon size={24} className={stat.color} />
                    <Activity size={16} className="text-gray-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold mb-1 text-white">{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Actions */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-black border border-gray-800 rounded-lg p-6">
            <h2 className="font-display text-lg font-semibold mb-6 text-white">Quick Actions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={index}
                    to={action.href}
                    className="flex items-center space-x-3 p-4 border border-gray-800 rounded-lg hover:bg-gray-900 transition-colors group"
                  >
                    <Icon size={20} className="text-blue-600 group-hover:text-blue-700" />
                    <span className="font-medium text-white">{action.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Admin Management Section (Super Admins Only) */}
            {adminActions.length > 0 && (
              <>
                <div className="border-t border-gray-800 mt-6 pt-6">
                  <h3 className="font-display text-md font-semibold mb-4 text-red-700">Admin Management</h3>
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
            <div className="border-t border-gray-800 mt-6 pt-6">
              <h3 className="font-display text-md font-semibold mb-4 text-green-700">Business Management</h3>
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
            <div className="border-t border-gray-800 mt-6 pt-6">
              <h3 className="font-display text-md font-semibold mb-4 text-white">Account</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profileActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={index}
                      to={action.href}
                      className="flex items-center space-x-3 p-4 border border-gray-800 rounded-lg hover:bg-gray-900 transition-colors group"
                    >
                      <Icon size={20} className="text-blue-600 group-hover:text-blue-700" />
                      <span className="font-medium text-white">{action.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-black border border-gray-800 rounded-lg p-6">
            <h2 className="font-display text-lg font-semibold mb-6 text-white">Recent Activity</h2>
            
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-start space-x-3 animate-pulse">
                    <div className="w-2 h-2 bg-gray-700 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-700 rounded mb-1"></div>
                      <div className="h-3 bg-gray-700 rounded w-16"></div>
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
                      <div className="text-sm font-medium text-white">{activity.message}</div>
                      <div className="text-xs text-gray-400">{activity.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-400">No recent activity</p>
              </div>
            )}
          </div>
        </div>


      </div>
    </div>
  );
};

export default AdminDashboard;