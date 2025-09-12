import { useAdmin } from '@/contexts/AdminContext';
import { useDev } from '@/contexts/DevContext';
import { Navigate, Link } from 'react-router-dom';
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
  Download
} from 'lucide-react';
import DevSettings from '@/components/admin/DevSettings';

const AdminDashboard = () => {
  const { isAuthenticated, currentAdmin, logout } = useAdmin();
  const { isDevelopmentMode, allowDirectAdminAccess } = useDev();

  // Allow direct access in development mode if enabled
  const canAccess = isAuthenticated || (isDevelopmentMode && allowDirectAdminAccess);

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  const stats = [
    { label: 'Total Members', value: '247', icon: Users, color: 'text-blue-500' },
    { label: 'Upcoming Events', value: '5', icon: Calendar, color: 'text-green-500' },
    { label: 'Newsletter Subscribers', value: '189', icon: Mail, color: 'text-purple-500' },
    { label: 'Active Projects', value: '12', icon: FileText, color: 'text-orange-500' },
  ];

  const quickActions = [
    { label: 'Content Management', icon: FileText, href: '/admin/content' },
    { label: 'Manage Events', icon: Calendar, href: '/admin/events' },
    { label: 'View Members', icon: Users, href: '/admin/members' },
    { label: 'Newsletter', icon: Mail, href: '/admin/newsletter' },
    { label: 'Analytics', icon: BarChart3, href: '/admin/analytics' },
    { label: 'Settings', icon: Settings, href: '/admin/settings' },
  ];

  const businessActions = [
    { label: 'Manage Sponsors', icon: Building2, href: '/admin/sponsors' },
    { label: 'Communications Hub', icon: MessageSquare, href: '/admin/communications' },
    { label: 'Media Library', icon: FolderOpen, href: '/admin/media' },
    { label: 'Reports & Export', icon: Download, href: '/admin/reports' },
  ];

  // Add admin user management for super admins
  const adminActions = currentAdmin && currentAdmin.role === 'super_admin' ? [
    { label: 'Admin Users', icon: Shield, href: '/admin/users' },
  ] : [];

  const profileActions = [
    { label: 'My Profile', icon: Users, href: '/admin/profile' },
  ];

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="editorial-grid py-8">
        {/* Header */}
        <div className="col-span-12 flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Shield size={20} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground text-sm">
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
          
          {currentAdmin && (
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          )}
        </div>

        {/* Development Settings */}
        <div className="col-span-12 mb-8">
          <DevSettings />
        </div>

        {/* Stats Grid */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <Icon size={24} className={stat.color} />
                  <Activity size={16} className="text-muted-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-display text-lg font-semibold mb-6">Quick Actions</h2>
            
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
                    <span className="font-medium">{action.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Admin Management Section (Super Admins Only) */}
            {adminActions.length > 0 && (
              <>
                <div className="border-t border-border mt-6 pt-6">
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
            <div className="border-t border-border mt-6 pt-6">
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
            <div className="border-t border-border mt-6 pt-6">
              <h3 className="font-display text-md font-semibold mb-4">Account</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profileActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={index}
                      to={action.href}
                      className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors group"
                    >
                      <Icon size={20} className="text-primary group-hover:text-primary/80" />
                      <span className="font-medium">{action.label}</span>
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
            <h2 className="font-display text-lg font-semibold mb-6">Recent Activity</h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <div className="text-sm font-medium">New member joined</div>
                  <div className="text-xs text-muted-foreground">2 hours ago</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <div className="text-sm font-medium">Event created</div>
                  <div className="text-xs text-muted-foreground">5 hours ago</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <div className="text-sm font-medium">Newsletter sent</div>
                  <div className="text-xs text-muted-foreground">1 day ago</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <div className="text-sm font-medium">Project updated</div>
                  <div className="text-xs text-muted-foreground">2 days ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="col-span-12">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-display text-lg font-semibold mb-6">System Status</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <div className="font-medium">Database</div>
                  <div className="text-sm text-muted-foreground">Operational</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <div className="font-medium">API Services</div>
                  <div className="text-sm text-muted-foreground">Operational</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <div className="font-medium">Email Service</div>
                  <div className="text-sm text-muted-foreground">Operational</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;