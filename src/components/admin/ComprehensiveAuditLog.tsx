import React, { useState, useEffect } from 'react';
import { Activity, Download, Filter, RefreshCw } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { AuditService, type AuditLogEntry, type AuditStats, type AuditFilters } from '@/services/auditService';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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

  const loadAuditData = async () => {
    setIsLoading(true);
    try {
      const [entries, stats] = await Promise.all([
        AuditService.getAuditLog(),
        AuditService.getAuditStats()
      ]);
      setAuditEntries(entries || []);
      setAuditStats(stats || {
        totalActions: 0,
        todayActions: 0,
        weekActions: 0,
        monthActions: 0,
        topActions: [],
        topAdmins: []
      });
    } catch (error) {
      console.error('Error loading audit data:', error);
      // Set empty data on error
      setAuditEntries([]);
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

  const handleExport = async () => {
    const csvData = await AuditService.exportAuditLog();
    if (csvData) {
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'update':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'delete':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'login':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-foreground dark:bg-gray-900/20 dark:text-muted-foreground';
    }
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

  const filteredLogs = auditEntries.filter(log => {
    const detailsString = typeof log.details === 'object' 
      ? JSON.stringify(log.details) 
      : (log.details || '');
    
    const matchesSearch = !searchTerm || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      detailsString.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.admin_users?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = !selectedAction || log.action === selectedAction;
    
    return matchesSearch && matchesAction;
  });

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
                <p className="text-sm font-medium text-muted-foreground">Total Entries</p>
                <p className="text-2xl font-bold text-foreground">{filteredLogs.length}</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
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
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
            </select>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={loadAuditData}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-3 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
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
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {log.admin_users?.email || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {renderDetails(log.details)}
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