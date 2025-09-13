import React, { useState, useEffect } from 'react';
import {
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  User,
  Activity,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Shield,
  Settings,
  Mail,
  Database,
  Users,
  FileText,
  Plus
} from 'lucide-react';
import { AuditService, type AuditLogEntry, type AuditFilters, type AuditStats, type AuditActionType } from '@/services/auditService';
import { supabase } from '@/lib/supabase';

interface ComprehensiveAuditLogProps {
  currentAdmin?: any;
}

const ComprehensiveAuditLog: React.FC<ComprehensiveAuditLogProps> = ({ currentAdmin }) => {
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [auditStats, setAuditStats] = useState<AuditStats>({
    totalActions: 0,
    todayActions: 0,
    weekActions: 0,
    monthActions: 0,
    topActions: [],
    topAdmins: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  // Filter states
  const [filters, setFilters] = useState<AuditFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<AuditActionType | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadAuditData();
  }, []);

  useEffect(() => {
    // Apply filters when they change
    const delayedFilter = setTimeout(() => {
      applyFilters();
    }, 300);

    return () => clearTimeout(delayedFilter);
  }, [searchTerm, selectedCategory, selectedAction, dateFrom, dateTo]);

  const loadAuditData = async () => {
    setIsLoading(true);
    try {
      console.log('Loading audit data...');
      const [entries, stats] = await Promise.all([
        AuditService.getAuditLog(),
        AuditService.getAuditStats()
      ]);
      
      console.log('Audit entries loaded:', entries.length);
      console.log('Audit stats loaded:', stats);
      
      setAuditEntries(entries);
      setAuditStats(stats);
    } catch (error) {
      console.error('Error loading audit data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addSampleData = async () => {
    if (currentAdmin?.id) {
      console.log('Adding sample audit data...');
      await AuditService.addSampleAuditData(currentAdmin.id);
      await loadAuditData();
    }
  };

  const debugDatabase = async () => {
    try {
      // Check if admin_actions table exists and has data
      const { data: actions, error: actionsError } = await supabase
        .from('admin_actions')
        .select('*')
        .limit(5);
      
      console.log('Admin actions table check:', { actions, actionsError });

      // Check admin_users table
      const { data: users, error: usersError } = await supabase
        .from('admin_users')
        .select('id, email, role')
        .limit(5);
      
      console.log('Admin users table check:', { users, usersError });

      // Try to manually insert a test action
      if (currentAdmin?.id) {
        const { data: testInsert, error: insertError } = await supabase
          .from('admin_actions')
          .insert({
            admin_id: currentAdmin.id,
            action: 'view_audit_log',
            details: { test: true, timestamp: new Date().toISOString() },
            created_at: new Date().toISOString()
          })
          .select();

        console.log('Test insert result:', { testInsert, insertError });
      }
    } catch (error) {
      console.error('Database debug error:', error);
    }
  };

  const applyFilters = async () => {
    setIsRefreshing(true);
    try {
      const filterObj: AuditFilters = {
        search: searchTerm || undefined,
        action: selectedAction || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      };

      const entries = await AuditService.getAuditLog(filterObj);
      setAuditEntries(entries);
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAuditData();
    setIsRefreshing(false);
  };

  const handleExport = async () => {
    try {
      const csv = await AuditService.exportAuditLog(filters);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Log the export action
      if (currentAdmin?.id) {
        await AuditService.logAction(currentAdmin.id, 'export_audit_log', undefined, {
          filters,
          exported_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error exporting audit log:', error);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedAction('');
    setDateFrom('');
    setDateTo('');
    setFilters({});
    loadAuditData();
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

  const getActionIcon = (action: AuditActionType) => {
    const iconMap: Record<string, React.ReactNode> = {
      // User Management
      'login': <Shield size={16} className="text-green-600" />,
      'logout': <Shield size={16} className="text-gray-600" />,
      'create_admin': <Users size={16} className="text-blue-600" />,
      'update_admin': <User size={16} className="text-yellow-600" />,
      'delete_admin': <Users size={16} className="text-red-600" />,
      'reset_password': <Shield size={16} className="text-purple-600" />,
      'promote_team_member': <TrendingUp size={16} className="text-green-600" />,
      
      // Content Management
      'create_event': <Calendar size={16} className="text-blue-600" />,
      'update_event': <Calendar size={16} className="text-yellow-600" />,
      'delete_event': <Calendar size={16} className="text-red-600" />,
      'create_team_member': <Users size={16} className="text-blue-600" />,
      'update_team_member': <Users size={16} className="text-yellow-600" />,
      'delete_team_member': <Users size={16} className="text-red-600" />,
      
      // Newsletter Management
      'create_newsletter_campaign': <Mail size={16} className="text-blue-600" />,
      'send_newsletter': <Mail size={16} className="text-green-600" />,
      'schedule_newsletter': <Clock size={16} className="text-yellow-600" />,
      'delete_newsletter': <Mail size={16} className="text-red-600" />,
      
      // Settings Management
      'update_site_settings': <Settings size={16} className="text-blue-600" />,
      'update_admin_secret_code': <Shield size={16} className="text-orange-600" />,
      
      // System Actions
      'backup_database': <Database size={16} className="text-green-600" />,
      'export_audit_log': <Download size={16} className="text-blue-600" />
    };

    return iconMap[action] || <Activity size={16} className="text-gray-400" />;
  };

  const getActionColor = (action: AuditActionType) => {
    const colorMap: Record<string, string> = {
      'login': 'bg-green-900/20 text-green-400 border-green-500/30',
      'logout': 'bg-gray-900/20 text-gray-400 border-gray-500/30',
      'create_admin': 'bg-blue-900/20 text-blue-400 border-blue-500/30',
      'update_admin': 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30',
      'delete_admin': 'bg-red-900/20 text-red-400 border-red-500/30',
      'reset_password': 'bg-purple-900/20 text-purple-400 border-purple-500/30',
      'promote_team_member': 'bg-green-900/20 text-green-400 border-green-500/30',
      'send_newsletter': 'bg-green-900/20 text-green-400 border-green-500/30',
      'delete_event': 'bg-red-900/20 text-red-400 border-red-500/30',
      'delete_team_member': 'bg-red-900/20 text-red-400 border-red-500/30',
      'update_admin_secret_code': 'bg-orange-900/20 text-orange-400 border-orange-500/30'
    };

    return colorMap[action] || 'bg-gray-900/20 text-gray-400 border-gray-500/30';
  };

  const actionCategories = AuditService.getActionCategories();

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-400 mt-2">Loading comprehensive audit log...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {showStats && (
        <div className="bg-black rounded-xl shadow-sm border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Audit Statistics</h3>
            <button
              onClick={() => setShowStats(false)}
              className="text-gray-400 hover:text-gray-300"
            >
              <ChevronUp size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <BarChart3 size={20} className="text-blue-600" />
                <span className="font-medium text-white">Total Actions</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{auditStats.totalActions}</div>
              <div className="text-sm text-gray-400">All time</div>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <Calendar size={20} className="text-green-600" />
                <span className="font-medium text-white">Today</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{auditStats.todayActions}</div>
              <div className="text-sm text-gray-400">Actions today</div>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <TrendingUp size={20} className="text-yellow-600" />
                <span className="font-medium text-white">This Week</span>
              </div>
              <div className="text-2xl font-bold text-yellow-600">{auditStats.weekActions}</div>
              <div className="text-sm text-gray-400">Last 7 days</div>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <Activity size={20} className="text-purple-600" />
                <span className="font-medium text-white">This Month</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">{auditStats.monthActions}</div>
              <div className="text-sm text-gray-400">Last 30 days</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Actions */}
            <div className="border border-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-white mb-4">Top Actions (30 days)</h4>
              <div className="space-y-2">
                {auditStats.topActions.map((item, index) => (
                  <div key={item.action} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                      <span className="text-gray-300 text-sm">
                        {item.action.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-white font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Admins */}
            <div className="border border-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-white mb-4">Most Active Admins (30 days)</h4>
              <div className="space-y-2">
                {auditStats.topAdmins.map((item, index) => (
                  <div key={item.admin} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                      <span className="text-gray-300 text-sm">{item.admin}</span>
                    </div>
                    <span className="text-white font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!showStats && (
        <button
          onClick={() => setShowStats(true)}
          className="w-full bg-black rounded-xl shadow-sm border border-gray-800 p-4 text-gray-400 hover:text-gray-300 transition-colors"
        >
          <div className="flex items-center justify-center space-x-2">
            <BarChart3 size={20} />
            <span>Show Audit Statistics</span>
            <ChevronDown size={20} />
          </div>
        </button>
      )}

      {/* Filters and Controls */}
      <div className="bg-black rounded-xl shadow-sm border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Audit Log</h3>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-3 py-2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Filter size={16} />
              <span>Filters</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
            {process.env.NODE_ENV === 'development' && (
              <>
                <button
                  onClick={addSampleData}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus size={16} />
                  <span>Add Sample Data</span>
                </button>
                <button
                  onClick={debugDatabase}
                  className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Activity size={16} />
                  <span>Debug DB</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="border border-gray-800 rounded-lg p-4 mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-black text-white"
                    placeholder="Search actions, emails..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedAction('');
                  }}
                  className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-black text-white"
                >
                  <option value="">All Categories</option>
                  {Object.keys(actionCategories).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Action</label>
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value as AuditActionType)}
                  className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-black text-white"
                >
                  <option value="">All Actions</option>
                  {selectedCategory && actionCategories[selectedCategory]?.map(action => (
                    <option key={action} value={action}>
                      {action.replace('_', ' ')}
                    </option>
                  ))}
                  {!selectedCategory && Object.values(actionCategories).flat().map(action => (
                    <option key={action} value={action}>
                      {action.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date Range</label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-black text-white"
                  />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-black text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {auditEntries.length} entries found
              </div>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}

        {/* Audit Entries */}
        <div className="space-y-3">
          {auditEntries.map((entry) => (
            <div key={entry.id} className="border border-gray-800 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {getActionIcon(entry.action)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="font-medium text-white">
                        {entry.admin_users?.email || 'Unknown Admin'}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActionColor(entry.action)}`}>
                        {AuditService.getActionDescription(entry.action, entry.details)}
                      </span>
                      {entry.admin_users?.role === 'super_admin' && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                          Super Admin
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400 space-x-4">
                      <span>{formatDate(entry.created_at)}</span>
                      {entry.target_email && (
                        <span>Target: {entry.target_email}</span>
                      )}
                      {entry.ip_address && (
                        <span>IP: {entry.ip_address}</span>
                      )}
                    </div>
                    {entry.details && Object.keys(entry.details).length > 0 && (
                      <div className="mt-2">
                        <button
                          onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                          className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300"
                        >
                          <Eye size={12} />
                          <span>{expandedEntry === entry.id ? 'Hide' : 'Show'} Details</span>
                        </button>
                        {expandedEntry === entry.id && (
                          <div className="mt-2 p-3 bg-gray-900 rounded-lg">
                            <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                              {JSON.stringify(entry.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {auditEntries.length === 0 && (
            <div className="text-center py-8">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No audit entries found</h3>
              <p className="text-gray-400 mb-4">
                {Object.keys(filters).length > 0 
                  ? 'Try adjusting your filters to see more results.'
                  : 'Admin actions will appear here as they occur.'
                }
              </p>
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Debug info:</p>
                  <p>• Check browser console for detailed logs</p>
                  <p>• Use "Debug DB" button to check database structure</p>
                  <p>• Use "Add Sample Data" to create test entries</p>
                  <p>• Ensure migrations have been run successfully</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveAuditLog;