import React from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Navigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  Mail, 
  BarChart3, 
  Settings, 
  LogOut,
  Shield,
  Database,
  FileText,
  Activity
} from 'lucide-react';

const AdminDashboard = () => {
  const { isAuthenticated, currentAdmin, logout } = useAdmin();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const stats = [
    { label: 'Total Members', value: '247', icon: Users, color: 'text-blue-500' },
    { label: 'Upcoming Events', value: '5', icon: Calendar, color: 'text-green-500' },
    { label: 'Newsletter Subscribers', value: '189', icon: Mail, color: 'text-purple-500' },
    { label: 'Active Projects', value: '12', icon: FileText, color: 'text-orange-500' },
  ];

  const quickActions = [
    { label: 'Manage Events', icon: Calendar, href: '#events' },
    { label: 'View Members', icon: Users, href: '#members' },
    { label: 'Newsletter', icon: Mail, href: '#newsletter' },
    { label: 'Content Management', icon: FileText, href: '#content' },
    { label: 'Analytics', icon: BarChart3, href: '#analytics' },
    { label: 'Settings', icon: Settings, href: '#settings' },
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
                Welcome, {currentAdmin?.email} ({currentAdmin?.role})
              </p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="flex items-center space-x-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
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
                  <a
                    key={index}
                    href={action.href}
                    className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors group"
                  >
                    <Icon size={20} className="text-primary group-hover:text-primary/80" />
                    <span className="font-medium">{action.label}</span>
                  </a>
                );
              })}
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