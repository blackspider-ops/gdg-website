import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Navigate } from 'react-router-dom';
import { 
  FileText, Search, Filter, Download, Calendar, User,
  RefreshCw, ChevronLeft, ChevronRight, Clock, Activity,
  Shield, AlertTriangle, Trash2
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { AuditService, type AuditLogEntry, type AuditFilters, type AuditStats, type AuditActionType } from '@/services/auditService';

const AdminAuditLog = () => {
  const { isAuthenticated, currentAdmin, isSuperAdmin, isAdmin } = useAdmin();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [activeAdmins, setActiveAdmins] = useState<Array<{id: string, email: string}>>([]);
  const [filters, setFilters] = useState<AuditFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 50;

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Only super admins and admins can view audit logs
  if (!isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  useEffect(() => {
    loadData();
  }, [filters, page]);

  useEffect(() => {
    loadStats();
    loadActiveAdmins();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const appliedFilters = { ...filters };
      if (searchTerm) {
        appliedFilters.search = searchTerm;
      }
      
      const data = await AuditService.getAuditLog(appliedFilters, pageSize, page * pageSize);
      setLogs(data);
      setHasMore(data.length === pageSize);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    const statsData = await AuditService.getAuditStats();
    setStats(statsData);
  };

  const loadActiveAdmins = async () => {
    const admins = await AuditService.getActiveAdmins();
    setActiveAdmins(admins);
  };

  const handleSearch = () => {
    setPage(0);
    setFilters({ ...filters, search: searchTerm });
  };

  const handleExport = async () => {
    const csv = await AuditService.exportAuditLog(filters);
    if (csv) {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const handleClearOldLogs = async () => {
    if (!isSuperAdmin || !currentAdmin) return;
    
    const days = prompt('Clear logs older than how many days? (e.g., 90)');
    if (!days || isNaN(parseInt(days))) return;
    
    if (!confirm(`Are you sure you want to delete all audit logs older than ${days} days? This cannot be undone.`)) return;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    
    const success = await AuditService.clearAuditLog(currentAdmin.id, cutoffDate);
    if (success) {
      loadData();
      loadStats();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getActionCategory = (action: string): string => {
    const categories = AuditService.getActionCategories();
    for (const [category, actions] of Object.entries(categories)) {
      if (actions.includes(action as AuditActionType)) {
        return category;
      }
    }
    return 'Other';
  };

  const getActionColor = (action: string): string => {
    if (action.includes('delete') || action.includes('reject')) return 'text-red-600 bg-red-50';
    if (action.includes('create') || action.includes('approve')) return 'text-green-600 bg-green-50';
    if (action.includes('update') || action.includes('edit')) return 'text-blue-600 bg-blue-50';
    if (action.includes('login') || action.includes('logout')) return 'text-purple-600 bg-purple-50';
    if (action.includes('view') || action.includes('access')) return 'text-gray-600 bg-gray-50';
    return 'text-gray-600 bg-gray-50';
  };

  const actionCategories = AuditService.getActionCategories();

  return (
    <AdminLayout
      title="Audit Log"
      subtitle="Track all admin actions and system events"
      icon={FileText}
      actions={
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
          {isSuperAdmin && (
            <button
              onClick={handleClearOldLogs}
              className="flex items-center space-x-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
            >
              <Trash2 size={16} />
              <span>Clear Old</span>
            </button>
          )}
          <button
            onClick={() => { setPage(0); loadData(); loadStats(); }}
            className="flex items-center space-x-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>
      }
    >
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Total Actions</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalActions.toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Today</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.todayActions.toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">This Week</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.weekActions.toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">This Month</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.monthActions.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search actions, users, targets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm"
            />
          </div>

          {/* Action Type Filter */}
          <select
            value={filters.action || ''}
            onChange={(e) => {
              setPage(0);
              setFilters({ ...filters, action: e.target.value as AuditActionType || undefined });
            }}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
          >
            <option value="">All Actions</option>
            {Object.entries(actionCategories).map(([category, actions]) => (
              <optgroup key={category} label={category}>
                {actions.map(action => (
                  <option key={action} value={action}>
                    {action.replace(/_/g, ' ')}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {/* Admin Filter */}
          <select
            value={filters.adminId || ''}
            onChange={(e) => {
              setPage(0);
              setFilters({ ...filters, adminId: e.target.value || undefined });
            }}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
          >
            <option value="">All Admins</option>
            {activeAdmins.map(admin => (
              <option key={admin.id} value={admin.id}>{admin.email}</option>
            ))}
          </select>

          {/* Date From */}
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => {
              setPage(0);
              setFilters({ ...filters, dateFrom: e.target.value || undefined });
            }}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
            placeholder="From date"
          />

          {/* Date To */}
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => {
              setPage(0);
              setFilters({ ...filters, dateTo: e.target.value || undefined });
            }}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
            placeholder="To date"
          />

          {/* Clear Filters */}
          {(filters.action || filters.adminId || filters.dateFrom || filters.dateTo || searchTerm) && (
            <button
              onClick={() => {
                setFilters({});
                setSearchTerm('');
                setPage(0);
              }}
              className="px-3 py-2 text-muted-foreground hover:bg-muted rounded-lg text-sm"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Target
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium mb-1">No audit logs found</p>
                    <p className="text-sm">
                      {filters.action || filters.adminId || filters.dateFrom || filters.dateTo || searchTerm
                        ? 'Try adjusting your filters or search term'
                        : 'Admin actions will be recorded here automatically'}
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-foreground">{formatDate(log.created_at)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {log.admin_users?.email || 'Unknown'}
                          </div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {log.admin_users?.role?.replace('_', ' ') || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <div className="text-xs text-muted-foreground mt-1">
                        {getActionCategory(log.action)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-foreground">
                        {log.target_email || log.target_id || '-'}
                      </div>
                      {log.target_type && (
                        <div className="text-xs text-muted-foreground">
                          {log.target_type}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-muted-foreground max-w-xs truncate">
                        {log.details?.description || 
                         AuditService.getActionDescription(log.action, log.details)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Showing {page * pageSize + 1} - {page * pageSize + logs.length} entries
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 hover:bg-muted rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-muted-foreground">Page {page + 1}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore}
              className="p-2 hover:bg-muted rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Top Actions & Admins */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Top Actions */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">Top Actions (30 days)</h3>
            <div className="space-y-3">
              {stats.topActions.map(({ action, count }, index) => (
                <div key={action} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-muted-foreground w-4">{index + 1}.</span>
                    <span className={`text-sm px-2 py-0.5 rounded ${getActionColor(action)}`}>
                      {action.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Admins */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">Most Active Admins (30 days)</h3>
            <div className="space-y-3">
              {stats.topAdmins.map(({ admin, count }, index) => (
                <div key={admin} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-muted-foreground w-4">{index + 1}.</span>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{admin}</span>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-foreground">{count} actions</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAuditLog;
