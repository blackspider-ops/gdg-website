import React, { useState, useEffect } from 'react';
import { Activity, Download, Filter, RefreshCw, Calendar, User, Clock } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { AuditService, type AuditLogEntry, type AuditStats, type AuditFilters } from '@/services/auditService';

interface ComprehensiveAuditLogProps {
  currentAdmin?: any;
}

const ComprehensiveAuditLog: React.FC<ComprehensiveAuditLogProps> = ({ currentAdmin }) => {
  // Check if current user is super admin - audit log is super admin only
  const isSuperAdmin = currentAdmin?.role === 'super_admin';
  
  if (!isSuperAdmin) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <Activity size={48} className="mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Access Restricted</h3>
        <p className="text-muted-foreground">
          Audit log access is restricted to Super Administrators only.
        </p>
      </div>
    );
  }
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [allAdmins, setAllAdmins] = useState<Array<{id: string, email: string}>>([]);
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
  const [isFiltering, setIsFiltering] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadAuditData();
    
    // Log that the audit log was viewed
    if (currentAdmin?.id) {
      AuditService.logAction(
        currentAdmin.id,
        'view_audit_log',
        undefined,
        { description: 'Viewed comprehensive audit log' }
      );
    }
  }, [currentAdmin]);

  const loadAuditData = async (filters?: AuditFilters) => {
    setIsLoading(true);
    try {
      const [entries, stats, admins] = await Promise.all([
        AuditService.getAuditLog(filters, 1000), // Load more entries for better filtering
        AuditService.getAuditStats(),
        loadAllAdmins()
      ]);
      setAuditEntries(entries || []);
      setAllAdmins(admins);
      setAuditStats(stats || {
        totalActions: 0,
        todayActions: 0,
        weekActions: 0,
        monthActions: 0,
        topActions: [],
        topAdmins: []
      });
    } catch (error) {
      // Silently handle errors
      setAuditEntries([]);
      setAllAdmins([]);
      setAuditStats({
        totalActions: 0,
        todayActions: 0,
        weekActions: 0,
        monthActions: 0,
        topActions: [],
        topAdmins: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllAdmins = async () => {
    try {
      return await AuditService.getActiveAdmins();
    } catch (error) {
      return [];
    }
  };

  const applyFilters = async () => {
    setIsFiltering(true);
    
    const filters: AuditFilters = {};
    
    if (selectedAction) {
      filters.action = selectedAction as any;
    }
    
    if (selectedAdmin) {
      filters.adminId = selectedAdmin;
    }
    
    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom).toISOString();
    }
    
    if (dateTo) {
      // Set to end of day for dateTo
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      filters.dateTo = endDate.toISOString();
    }
    
    if (searchTerm.trim()) {
      filters.search = searchTerm.trim();
    }

    await loadAuditData(filters);
    setIsFiltering(false);
  };

  const clearFilters = async () => {
    setSelectedAction('');
    setSelectedAdmin('');
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
    await loadAuditData();
  };

  const handleExport = async () => {
    const filters: AuditFilters = {};
    
    if (selectedAction) filters.action = selectedAction as any;
    if (selectedAdmin) filters.adminId = selectedAdmin;
    if (dateFrom) filters.dateFrom = new Date(dateFrom).toISOString();
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      filters.dateTo = endDate.toISOString();
    }
    if (searchTerm.trim()) filters.search = searchTerm.trim();

    const csvData = await AuditService.exportAuditLog(filters);
    if (csvData) {
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Create filename with filter info
      let filename = 'audit-log';
      if (dateFrom || dateTo) {
        filename += `_${dateFrom || 'start'}-to-${dateTo || 'end'}`;
      }
      if (selectedAdmin) {
        const adminEmail = allAdmins.find(a => a.id === selectedAdmin)?.email || 'admin';
        filename += `_${adminEmail.replace('@', '_at_')}`;
      }
      filename += `_${new Date().toISOString().split('T')[0]}.csv`;
      
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  // Set default date range (last 30 days)
  const setDefaultDateRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  };

  // Set date range for last 7 days
  const setWeekRange = () => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    setDateFrom(weekAgo.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  };

  // Set date range for today
  const setTodayRange = () => {
    const today = new Date().toISOString().split('T')[0];
    setDateFrom(today);
    setDateTo(today);
  };

  const getActionColor = (action: string) => {
    const actionLower = action.toLowerCase();
    
    if (actionLower.includes('create')) {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
    if (actionLower.includes('update') || actionLower.includes('edit')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
    if (actionLower.includes('delete') || actionLower.includes('remove')) {
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    }
    if (actionLower.includes('login') || actionLower.includes('auth')) {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    }
    if (actionLower.includes('view') || actionLower.includes('access')) {
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400';
    }
    if (actionLower.includes('export') || actionLower.includes('download')) {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    }
    if (actionLower.includes('promote') || actionLower.includes('role')) {
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400';
    }
    if (actionLower.includes('password') || actionLower.includes('reset')) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
    
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  const renderDetails = (details: any) => {
    if (!details) return 'N/A';
    
    if (typeof details === 'string') {
      return details;
    }
    
    if (typeof details === 'object') {
      // Handle common object structures
      if (details.description) {
        return details.description;
      }
      
      if (details.viewed_at) {
        return `Viewed at: ${new Date(details.viewed_at).toLocaleString()}`;
      }
      
      // For other objects, create a readable summary
      const entries = Object.entries(details);
      if (entries.length === 0) return 'N/A';
      
      return entries
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    }
    
    return String(details);
  };

  // Get unique action types for filter dropdown
  const uniqueActions = [...new Set(auditEntries.map(log => log.action))].sort();

  // Client-side filtering is minimal since server-side filtering is applied
  const filteredLogs = auditEntries;

  return (
    <AdminLayout 
      title="Audit Log" 
      subtitle="Comprehensive system activity tracking"
      icon={Activity}
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Actions</p>
                <p className="text-2xl font-bold text-foreground">{auditStats.totalActions}</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Week Actions</p>
                <p className="text-2xl font-bold text-foreground">{auditStats.weekActions}</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Actions Today</p>
                <p className="text-2xl font-bold text-foreground">{auditStats.todayActions}</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {(selectedAction || selectedAdmin || dateFrom || dateTo || searchTerm) ? 'Filtered Results' : 'Total Entries'}
                </p>
                <p className="text-2xl font-bold text-foreground">{filteredLogs.length}</p>
                {(selectedAction || selectedAdmin || dateFrom || dateTo || searchTerm) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {filteredLogs.length} of {auditStats.totalActions} total
                  </p>
                )}
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Filters</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-3 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
            >
              <Filter size={16} />
              <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
            </button>
          </div>

          {showFilters && (
            <div className="space-y-4">
              {/* Search and Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Search audit log..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/35"
                />
                
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/35"
                >
                  <option value="">All Actions</option>
                  {uniqueActions.map(action => (
                    <option key={action} value={action}>
                      {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedAdmin}
                  onChange={(e) => setSelectedAdmin(e.target.value)}
                  className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/35"
                >
                  <option value="">All Admins</option>
                  {allAdmins.map(admin => (
                    <option key={admin.id} value={admin.id}>
                      {admin.email}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <button
                    onClick={applyFilters}
                    disabled={isFiltering}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Filter size={16} className={isFiltering ? 'animate-spin' : ''} />
                    <span>Apply</span>
                  </button>
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/35"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/35"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Quick Ranges</label>
                  <div className="flex gap-2">
                    <button
                      onClick={setTodayRange}
                      className="px-3 py-2 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
                    >
                      Today
                    </button>
                    <button
                      onClick={setWeekRange}
                      className="px-3 py-2 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
                    >
                      7 Days
                    </button>
                    <button
                      onClick={setDefaultDateRange}
                      className="px-3 py-2 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
                    >
                      30 Days
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Actions</label>
                  <div className="flex gap-2">
                    <button
                      onClick={clearFilters}
                      className="px-3 py-2 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => loadAuditData()}
                      disabled={isRefreshing}
                      className="flex items-center space-x-1 px-3 py-2 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
                    >
                      <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Filters Display */}
              {(selectedAction || selectedAdmin || dateFrom || dateTo || searchTerm) && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {searchTerm && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                      Search: "{searchTerm}"
                    </span>
                  )}
                  {selectedAction && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                      Action: {selectedAction.replace(/_/g, ' ')}
                    </span>
                  )}
                  {selectedAdmin && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                      Admin: {allAdmins.find(a => a.id === selectedAdmin)?.email}
                    </span>
                  )}
                  {dateFrom && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                      From: {new Date(dateFrom).toLocaleDateString()}
                    </span>
                  )}
                  {dateTo && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                      To: {new Date(dateTo).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Export Controls */}
        <div className="flex justify-end">
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Download size={16} />
            <span>Export Filtered Results</span>
          </button>
        </div>

        {/* Audit Log Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading audit log...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <Activity size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No audit log entries found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <Clock size={14} />
                        <span>Timestamp</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <User size={14} />
                        <span>Admin</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <Activity size={14} />
                        <span>Action</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Target
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {new Date(log.created_at).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {(log.admin_users?.email || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {log.admin_users?.email || 'Unknown'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {log.admin_users?.role || 'unknown'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs">
                        <div className="truncate" title={renderDetails(log.details)}>
                          {renderDetails(log.details)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {log.target_email || log.target_id || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ComprehensiveAuditLog;