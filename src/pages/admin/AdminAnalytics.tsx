import React, { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useDev } from '@/contexts/DevContext';
import { Navigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Users, Calendar, Eye, MousePointer, Globe, Smartphone } from 'lucide-react';

const AdminAnalytics = () => {
  const { isAuthenticated } = useAdmin();
  const { isDevelopmentMode, allowDirectAdminAccess } = useDev();
  const [timeRange, setTimeRange] = useState('30d');

  const canAccess = isAuthenticated || (isDevelopmentMode && allowDirectAdminAccess);

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  const stats = [
    { label: 'Total Visitors', value: '12,847', change: '+12%', color: 'text-blue-500', icon: Users },
    { label: 'Page Views', value: '45,231', change: '+8%', color: 'text-green-500', icon: Eye },
    { label: 'Event Registrations', value: '342', change: '+24%', color: 'text-purple-500', icon: Calendar },
    { label: 'Newsletter Signups', value: '189', change: '+15%', color: 'text-orange-500', icon: TrendingUp },
  ];

  const topPages = [
    { page: '/', views: 8234, percentage: 35 },
    { page: '/events', views: 5421, percentage: 23 },
    { page: '/projects', views: 3210, percentage: 14 },
    { page: '/team', views: 2876, percentage: 12 },
    { page: '/blog', views: 2134, percentage: 9 },
    { page: '/contact', views: 1876, percentage: 8 },
  ];

  const deviceStats = [
    { device: 'Desktop', percentage: 65, color: 'bg-gray-9000' },
    { device: 'Mobile', percentage: 28, color: 'bg-green-500' },
    { device: 'Tablet', percentage: 7, color: 'bg-purple-500' },
  ];

  const trafficSources = [
    { source: 'Direct', visitors: 4234, percentage: 33 },
    { source: 'Google Search', visitors: 3876, percentage: 30 },
    { source: 'Social Media', visitors: 2341, percentage: 18 },
    { source: 'Referrals', visitors: 1543, percentage: 12 },
    { source: 'Email', visitors: 853, percentage: 7 },
  ];

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="editorial-grid py-8">
        {/* Header */}
        <div className="col-span-12 flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Analytics Dashboard</h1>
              <p className="text-gray-400 text-sm">Website and engagement analytics</p>
            </div>
          </div>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-black border border-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <Icon size={24} className={stat.color} />
                  <span className={`text-sm font-medium ${
                    stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Pages */}
          <div className="bg-black border border-gray-800 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-6">Top Pages</h3>
            <div className="space-y-4">
              {topPages.map((page, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{page.page}</div>
                    <div className="w-full bg-gray-900 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${page.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="font-semibold">{page.views.toLocaleString()}</div>
                    <div className="text-sm text-gray-400">{page.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Device Breakdown */}
          <div className="bg-black border border-gray-800 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-6">Device Breakdown</h3>
            <div className="space-y-6">
              {deviceStats.map((device, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {device.device === 'Desktop' && <Globe size={20} className="text-gray-400" />}
                    {device.device === 'Mobile' && <Smartphone size={20} className="text-gray-400" />}
                    {device.device === 'Tablet' && <Smartphone size={20} className="text-gray-400" />}
                    <span className="font-medium">{device.device}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-900 rounded-full h-2">
                      <div 
                        className={`${device.color} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${device.percentage}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold w-12 text-right">{device.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-black border border-gray-800 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-6">Traffic Sources</h3>
            <div className="space-y-4">
              {trafficSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{source.source}</div>
                    <div className="w-full bg-gray-900 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${source.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="font-semibold">{source.visitors.toLocaleString()}</div>
                    <div className="text-sm text-gray-400">{source.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-black border border-gray-800 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-6">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <div className="text-sm font-medium">High traffic spike detected</div>
                  <div className="text-xs text-gray-400">Events page • 2 hours ago</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-gray-9000 rounded-full mt-2"></div>
                <div>
                  <div className="text-sm font-medium">New referral source</div>
                  <div className="text-xs text-gray-400">reddit.com • 4 hours ago</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <div className="text-sm font-medium">Goal conversion increased</div>
                  <div className="text-xs text-gray-400">Newsletter signup • 1 day ago</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <div className="text-sm font-medium">Page load time improved</div>
                  <div className="text-xs text-gray-400">Homepage • 2 days ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;