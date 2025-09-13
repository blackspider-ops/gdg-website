import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useDev } from '@/contexts/DevContext';
import { Navigate } from 'react-router-dom';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Users, 
  Building2, 
  TrendingUp, 
  FileText, 
  Filter, 
  RefreshCw,
  Eye,
  Clock,
  PieChart,
  LineChart,
  Activity
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

const AdminReports = () => {
  const { isAuthenticated, currentAdmin } = useAdmin();
  const { isDevelopmentMode, allowDirectAdminAccess } = useDev();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('last-30-days');
  const [exportFormat, setExportFormat] = useState('csv');
  const [isGenerating, setIsGenerating] = useState(false);

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
  const reportStats = [
    { label: 'Total Members', value: '247', change: '+12%', color: 'text-blue-500', trend: 'up' },
    { label: 'Active Events', value: '8', change: '+2', color: 'text-green-500', trend: 'up' },
    { label: 'Total Sponsors', value: '15', change: '+3', color: 'text-purple-500', trend: 'up' },
    { label: 'Revenue (YTD)', value: '$45,200', change: '+18%', color: 'text-orange-500', trend: 'up' },
  ];

  const memberReports = [
    {
      id: 1,
      name: 'Active Members List',
      description: 'Complete list of all active club members with contact information',
      lastGenerated: '2024-09-10T14:30:00Z',
      recordCount: 247,
      format: 'CSV/Excel',
      category: 'members'
    },
    {
      id: 2,
      name: 'New Member Registrations',
      description: 'Members who joined in the selected date range',
      lastGenerated: '2024-09-09T10:15:00Z',
      recordCount: 23,
      format: 'CSV/Excel',
      category: 'members'
    }
  ];

  const eventReports = [
    {
      id: 4,
      name: 'Event Attendance Summary',
      description: 'Attendance records for all events in date range',
      lastGenerated: '2024-09-10T11:20:00Z',
      recordCount: 156,
      format: 'CSV/Excel',
      category: 'events'
    }
  ];

  const sponsorReports = [
    {
      id: 7,
      name: 'Sponsor Contact Directory',
      description: 'Complete contact information for all sponsors',
      lastGenerated: '2024-09-09T13:15:00Z',
      recordCount: 15,
      format: 'CSV/Excel',
      category: 'sponsors'
    }
  ];

  const allReports = [...memberReports, ...eventReports, ...sponsorReports];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'sponsors', label: 'Sponsors', icon: Building2 },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReportsByCategory = (category: string) => {
    return allReports.filter(report => report.category === category);
  };

  const handleExport = async (reportId: number) => {
    setIsGenerating(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    // In real app, this would trigger download
    console.log(`Exporting report ${reportId} as ${exportFormat}`);
  };

  const quickExports = [
    {
      name: 'All Active Members',
      description: 'Export complete member list with contact info',
      icon: Users,
      count: 247,
      action: () => handleExport(1)
    },
    {
      name: 'Upcoming Events',
      description: 'List of all scheduled events with details',
      icon: Calendar,
      count: 8,
      action: () => handleExport(4)
    },
    {
      name: 'Sponsor Contacts',
      description: 'All sponsor contact information',
      icon: Building2,
      count: 15,
      action: () => handleExport(7)
    },
    {
      name: 'Monthly Analytics',
      description: 'Key metrics and performance data',
      icon: TrendingUp,
      count: 12,
      action: () => handleExport(3)
    }
  ];

  return (
    <AdminLayout
      title="Reports & Analytics"
      subtitle="Generate reports and export data"
      icon={BarChart3}
      actions={
        <div className="flex items-center space-x-3">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            className="px-4 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white"
          >
            <option value="csv">CSV Format</option>
            <option value="excel">Excel Format</option>
            <option value="pdf">PDF Format</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            <RefreshCw size={16} />
            <span>Refresh Data</span>
          </button>
        </div>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {reportStats.map((stat, index) => (
          <div key={index} className="bg-black rounded-xl p-6 shadow-sm border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <Activity size={24} className={stat.color} />
              <div className={`flex items-center space-x-1 text-sm ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp size={14} />
                <span>{stat.change}</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-sm text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Date Range Selector */}
      <div className="bg-black rounded-xl p-6 shadow-sm border border-gray-800 mb-8">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Report Date Range</h3>
            <p className="text-gray-400">Select the time period for your reports</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Filter size={16} className="text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white"
            >
              <option value="last-7-days">Last 7 Days</option>
              <option value="last-30-days">Last 30 Days</option>
              <option value="last-90-days">Last 90 Days</option>
              <option value="this-semester">This Semester</option>
              <option value="this-year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800 mb-8">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-black rounded-xl shadow-sm border border-gray-800">
        {/* Overview */}
        {activeTab === 'overview' && (
          <>
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-semibold text-white">Quick Exports</h2>
              <p className="text-gray-400 mt-1">Generate and download commonly used reports</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quickExports.map((exportItem, index) => {
                  const Icon = exportItem.icon;
                  return (
                    <div key={index} className="border border-gray-800 rounded-lg p-6 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Icon size={20} className="text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{exportItem.name}</h3>
                            <p className="text-sm text-gray-400">{exportItem.description}</p>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-500">{exportItem.count} records</span>
                      </div>
                      <button
                        onClick={exportItem.action}
                        disabled={isGenerating}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download size={16} />
                        <span>{isGenerating ? 'Generating...' : 'Export Now'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Members Reports */}
        {activeTab === 'members' && (
          <>
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-semibold text-white">Member Reports</h2>
              <p className="text-gray-400 mt-1">Export member data and analytics</p>
            </div>
            <div className="divide-y divide-gray-200">
              {getReportsByCategory('members').map((report) => (
                <div key={report.id} className="p-6 hover:bg-gray-900 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <FileText size={20} className="text-blue-600" />
                        <h3 className="text-lg font-semibold text-white">{report.name}</h3>
                      </div>
                      <p className="text-gray-400 mb-3">{report.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock size={14} />
                          <span>Last generated: {formatDate(report.lastGenerated)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users size={14} />
                          <span>{report.recordCount} records</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FileText size={14} />
                          <span>{report.format}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleExport(report.id)}
                        disabled={isGenerating}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                      >
                        <Download size={16} />
                        <span>Export</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Events Reports */}
        {activeTab === 'events' && (
          <>
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-semibold text-white">Event Reports</h2>
              <p className="text-gray-400 mt-1">Export event data and attendance records</p>
            </div>
            <div className="divide-y divide-gray-200">
              {getReportsByCategory('events').map((report) => (
                <div key={report.id} className="p-6 hover:bg-gray-900 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Calendar size={20} className="text-green-600" />
                        <h3 className="text-lg font-semibold text-white">{report.name}</h3>
                      </div>
                      <p className="text-gray-400 mb-3">{report.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock size={14} />
                          <span>Last generated: {formatDate(report.lastGenerated)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Activity size={14} />
                          <span>{report.recordCount} records</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FileText size={14} />
                          <span>{report.format}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleExport(report.id)}
                        disabled={isGenerating}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                      >
                        <Download size={16} />
                        <span>Export</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Sponsors Reports */}
        {activeTab === 'sponsors' && (
          <>
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-semibold text-white">Sponsor Reports</h2>
              <p className="text-gray-400 mt-1">Export sponsor data and engagement metrics</p>
            </div>
            <div className="divide-y divide-gray-200">
              {getReportsByCategory('sponsors').map((report) => (
                <div key={report.id} className="p-6 hover:bg-gray-900 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Building2 size={20} className="text-purple-600" />
                        <h3 className="text-lg font-semibold text-white">{report.name}</h3>
                      </div>
                      <p className="text-gray-400 mb-3">{report.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock size={14} />
                          <span>Last generated: {formatDate(report.lastGenerated)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Building2 size={14} />
                          <span>{report.recordCount} records</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FileText size={14} />
                          <span>{report.format}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleExport(report.id)}
                        disabled={isGenerating}
                        className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
                      >
                        <Download size={16} />
                        <span>Export</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Analytics */}
        {activeTab === 'analytics' && (
          <>
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-semibold text-white">Analytics Dashboard</h2>
              <p className="text-gray-400 mt-1">Visual analytics and trend reports</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart placeholders */}
                <div className="border border-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Member Growth</h3>
                    <LineChart size={20} className="text-blue-600" />
                  </div>
                  <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <TrendingUp size={32} className="mx-auto mb-2" />
                      <p>Member growth chart would appear here</p>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Event Attendance</h3>
                    <BarChart3 size={20} className="text-green-600" />
                  </div>
                  <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <BarChart3 size={32} className="mx-auto mb-2" />
                      <p>Event attendance chart would appear here</p>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Revenue Breakdown</h3>
                    <PieChart size={20} className="text-purple-600" />
                  </div>
                  <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <PieChart size={32} className="mx-auto mb-2" />
                      <p>Revenue breakdown chart would appear here</p>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Engagement Metrics</h3>
                    <Activity size={20} className="text-orange-600" />
                  </div>
                  <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Activity size={32} className="mx-auto mb-2" />
                      <p>Engagement metrics would appear here</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-center">
                <button className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  <Download size={16} />
                  <span>Export Analytics Report</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReports;