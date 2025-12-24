import React, { useState, useEffect, useRef } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Navigate } from 'react-router-dom';
import { 
  DollarSign, Plus, Edit3, Trash2, Download, Filter, Search,
  TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, 
  FileText, Upload, Eye, Calendar, Building2, X, Save,
  PieChart, BarChart3, Wallet, Receipt, Paperclip, File, Users
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  FinancesService, 
  type Finance, 
  type BudgetAllocation,
  type FinanceFilters,
  type FinanceAttachment,
  FINANCE_CATEGORIES 
} from '@/services/financesService';
import { TeamManagementService, type AdminTeam } from '@/services/teamManagementService';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { supabase } from '@/lib/supabase';

const AdminFinances = () => {
  const { isAuthenticated, currentAdmin, isSuperAdmin, isAdmin, userTeams } = useAdmin();
  const [activeTab, setActiveTab] = useState<'transactions' | 'budgets' | 'reports'>('transactions');
  const [finances, setFinances] = useState<Finance[]>([]);
  const [budgets, setBudgets] = useState<BudgetAllocation[]>([]);
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    pendingApprovals: 0,
    transactionCount: 0,
    categoryBreakdown: {} as Record<string, number>,
    monthlyTrend: [] as Array<{ month: string; income: number; expense: number }>
  });
  
  const [filters, setFilters] = useState<FinanceFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Finance | null>(null);
  const [editingBudget, setEditingBudget] = useState<BudgetAllocation | null>(null);
  const [selectedTransactionForAttachments, setSelectedTransactionForAttachments] = useState<Finance | null>(null);
  const [attachments, setAttachments] = useState<FinanceAttachment[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useBodyScrollLock(showTransactionModal || showBudgetModal || showAttachmentsModal);

  // Transaction form state
  const [transactionForm, setTransactionForm] = useState({
    transaction_type: 'expense' as 'income' | 'expense' | 'transfer' | 'reimbursement',
    category: '',
    amount: '',
    description: '',
    vendor_name: '',
    reference_number: '',
    transaction_date: new Date().toISOString().split('T')[0],
    team_id: '',
    notes: ''
  });

  // Budget form state
  const [budgetForm, setBudgetForm] = useState({
    name: '',
    description: '',
    total_amount: '',
    team_id: '',
    fiscal_year: new Date().getFullYear().toString(),
    start_date: '',
    end_date: ''
  });

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Only super admins and admins can access finances
  if (!isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [financesData, budgetsData, teamsData, statsData] = await Promise.all([
        FinancesService.getFinances(filters),
        FinancesService.getBudgetAllocations(),
        TeamManagementService.getTeams(),
        FinancesService.getFinanceStats(filters)
      ]);
      
      setFinances(financesData);
      setBudgets(budgetsData);
      setTeams(teamsData);
      setStats(statsData);
    } catch (err) {
      setError('Failed to load financial data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTransaction = async () => {
    if (!transactionForm.category || !transactionForm.amount || !transactionForm.description) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const transaction = await FinancesService.createFinance(
        {
          transaction_type: transactionForm.transaction_type,
          category: transactionForm.category,
          amount: parseFloat(transactionForm.amount),
          description: transactionForm.description,
          vendor_name: transactionForm.vendor_name || undefined,
          reference_number: transactionForm.reference_number || undefined,
          transaction_date: transactionForm.transaction_date,
          team_id: transactionForm.team_id || undefined,
          notes: transactionForm.notes || undefined
        },
        currentAdmin!.id
      );

      if (transaction) {
        setSuccess('Transaction created successfully');
        setShowTransactionModal(false);
        resetTransactionForm();
        loadData();
      } else {
        setError('Failed to create transaction');
      }
    } catch (err) {
      setError('Failed to create transaction');
    }
  };

  const handleUpdateTransaction = async () => {
    if (!editingTransaction) return;

    try {
      const updated = await FinancesService.updateFinance(editingTransaction.id, {
        transaction_type: transactionForm.transaction_type,
        category: transactionForm.category,
        amount: parseFloat(transactionForm.amount),
        description: transactionForm.description,
        vendor_name: transactionForm.vendor_name || undefined,
        reference_number: transactionForm.reference_number || undefined,
        transaction_date: transactionForm.transaction_date,
        team_id: transactionForm.team_id || undefined,
        notes: transactionForm.notes || undefined
      });

      if (updated) {
        setSuccess('Transaction updated successfully');
        setShowTransactionModal(false);
        setEditingTransaction(null);
        resetTransactionForm();
        loadData();
      } else {
        setError('Failed to update transaction');
      }
    } catch (err) {
      setError('Failed to update transaction');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const success = await FinancesService.deleteFinance(id);
      if (success) {
        setSuccess('Transaction deleted');
        loadData();
      } else {
        setError('Failed to delete transaction');
      }
    } catch (err) {
      setError('Failed to delete transaction');
    }
  };

  const handleApproveTransaction = async (id: string) => {
    try {
      const success = await FinancesService.approveFinance(id, currentAdmin!.id, currentAdmin!.role);
      if (success) {
        setSuccess('Transaction approved');
        loadData();
      } else {
        setError('Failed to approve transaction');
      }
    } catch (err) {
      setError('Failed to approve transaction');
    }
  };

  const handleTeamLeadApprove = async (id: string) => {
    try {
      const success = await FinancesService.teamLeadApprove(id, currentAdmin!.id);
      if (success) {
        setSuccess('Transaction forwarded for admin approval');
        loadData();
      } else {
        setError('Failed to approve transaction');
      }
    } catch (err) {
      setError('Failed to approve transaction');
    }
  };

  const handleRejectTransaction = async (id: string) => {
    const reason = prompt('Reason for rejection (optional):');
    try {
      const success = await FinancesService.rejectFinance(id, currentAdmin!.id, reason || undefined);
      if (success) {
        setSuccess('Transaction rejected');
        loadData();
      } else {
        setError('Failed to reject transaction');
      }
    } catch (err) {
      setError('Failed to reject transaction');
    }
  };

  const handleCreateBudget = async () => {
    if (!budgetForm.name || !budgetForm.total_amount || !budgetForm.start_date || !budgetForm.end_date) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const budget = await FinancesService.createBudgetAllocation(
        {
          name: budgetForm.name,
          description: budgetForm.description || undefined,
          total_amount: parseFloat(budgetForm.total_amount),
          team_id: budgetForm.team_id || undefined,
          fiscal_year: budgetForm.fiscal_year,
          start_date: budgetForm.start_date,
          end_date: budgetForm.end_date
        },
        currentAdmin!.id
      );

      if (budget) {
        setSuccess('Budget created successfully');
        setShowBudgetModal(false);
        resetBudgetForm();
        loadData();
      } else {
        setError('Failed to create budget');
      }
    } catch (err) {
      setError('Failed to create budget');
    }
  };

  const handleExport = async () => {
    try {
      const csv = await FinancesService.exportFinances(filters);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finances-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      setSuccess('Export downloaded');
    } catch (err) {
      setError('Failed to export data');
    }
  };

  const handleOpenAttachments = async (transaction: Finance) => {
    setSelectedTransactionForAttachments(transaction);
    setShowAttachmentsModal(true);
    try {
      const attachmentsList = await FinancesService.getAttachments(transaction.id);
      setAttachments(attachmentsList);
    } catch (err) {
      console.error('Failed to load attachments:', err);
    }
  };

  const handleUploadAttachment = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedTransactionForAttachments || !currentAdmin) return;

    setIsUploadingAttachment(true);
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedTransactionForAttachments.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('finance-attachments')
        .upload(fileName, file);

      if (uploadError) {
        // If bucket doesn't exist, use a fallback URL approach
        console.warn('Storage upload failed, using direct URL:', uploadError);
        // Create a data URL as fallback
        const reader = new FileReader();
        reader.onload = async () => {
          const attachment = await FinancesService.addAttachment(
            selectedTransactionForAttachments.id,
            {
              name: file.name,
              url: reader.result as string,
              type: file.type,
              size: file.size
            },
            currentAdmin.id
          );
          if (attachment) {
            setAttachments(prev => [...prev, attachment]);
            setSuccess('Attachment uploaded');
          }
        };
        reader.readAsDataURL(file);
      } else {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('finance-attachments')
          .getPublicUrl(fileName);

        const attachment = await FinancesService.addAttachment(
          selectedTransactionForAttachments.id,
          {
            name: file.name,
            url: urlData.publicUrl,
            type: file.type,
            size: file.size
          },
          currentAdmin.id
        );

        if (attachment) {
          setAttachments(prev => [...prev, attachment]);
          setSuccess('Attachment uploaded');
        }
      }
    } catch (err) {
      setError('Failed to upload attachment');
    } finally {
      setIsUploadingAttachment(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    if (!confirm('Remove this attachment?')) return;

    try {
      const success = await FinancesService.removeAttachment(attachmentId);
      if (success) {
        setAttachments(prev => prev.filter(a => a.id !== attachmentId));
        setSuccess('Attachment removed');
      } else {
        setError('Failed to remove attachment');
      }
    } catch (err) {
      setError('Failed to remove attachment');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const resetTransactionForm = () => {
    setTransactionForm({
      transaction_type: 'expense',
      category: '',
      amount: '',
      description: '',
      vendor_name: '',
      reference_number: '',
      transaction_date: new Date().toISOString().split('T')[0],
      team_id: '',
      notes: ''
    });
  };

  const resetBudgetForm = () => {
    setBudgetForm({
      name: '',
      description: '',
      total_amount: '',
      team_id: '',
      fiscal_year: new Date().getFullYear().toString(),
      start_date: '',
      end_date: ''
    });
  };

  const openEditTransaction = (transaction: Finance) => {
    setEditingTransaction(transaction);
    setTransactionForm({
      transaction_type: transaction.transaction_type,
      category: transaction.category,
      amount: transaction.amount.toString(),
      description: transaction.description,
      vendor_name: transaction.vendor_name || '',
      reference_number: transaction.reference_number || '',
      transaction_date: transaction.transaction_date,
      team_id: transaction.team_id || '',
      notes: transaction.notes || ''
    });
    setShowTransactionModal(true);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'expense': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'transfer': return <DollarSign className="w-4 h-4 text-blue-500" />;
      case 'reimbursement': return <Receipt className="w-4 h-4 text-purple-500" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const getApprovalLevelBadge = (level?: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      team_lead_approved: 'bg-blue-100 text-blue-800',
      admin_approved: 'bg-green-100 text-green-800',
      super_admin_approved: 'bg-purple-100 text-purple-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return styles[level || 'pending'] || 'bg-gray-100 text-gray-800';
  };

  const getApprovalLevelText = (level?: string) => {
    const texts: Record<string, string> = {
      pending: 'Awaiting Team Lead',
      team_lead_approved: 'Awaiting Admin',
      admin_approved: 'Admin Approved',
      super_admin_approved: 'Super Admin Approved',
      rejected: 'Rejected'
    };
    return texts[level || 'pending'] || level;
  };

  // Check if current user is a team lead for the finance's team
  const canTeamLeadApprove = (finance: Finance) => {
    if (!finance.team_id) return false;
    return userTeams.some(t => 
      t.team_id === finance.team_id && 
      (t.role === 'lead' || t.role === 'co_lead')
    );
  };

  const filteredFinances = finances.filter(f =>
    f.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = FINANCE_CATEGORIES[transactionForm.transaction_type] || [];

  return (
    <AdminLayout
      title="Finances"
      subtitle="Track expenses, income, and budgets"
      icon={DollarSign}
      actions={
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
          <button
            onClick={() => {
              resetTransactionForm();
              setEditingTransaction(null);
              setShowTransactionModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={18} />
            <span>Add Transaction</span>
          </button>
        </div>
      }
    >
      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
          <button onClick={() => setError(null)} className="float-right">&times;</button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
          <button onClick={() => setSuccess(null)} className="float-right">&times;</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-2xl font-bold text-green-600">
                ${stats.totalIncome.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                ${stats.totalExpenses.toLocaleString()}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500 opacity-50" />
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Net Balance</p>
              <p className={`text-2xl font-bold ${stats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${stats.netBalance.toLocaleString()}
              </p>
            </div>
            <Wallet className="w-8 h-8 text-primary opacity-50" />
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Approvals</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.pendingApprovals}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg w-fit">
        {(['transactions', 'budgets', 'reports'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>


      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="bg-card rounded-xl border border-border">
          {/* Filters */}
          <div className="p-4 border-b border-border">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm"
                />
              </div>
              <select
                value={filters.transaction_type || ''}
                onChange={(e) => setFilters({ ...filters, transaction_type: e.target.value || undefined })}
                className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="transfer">Transfer</option>
                <option value="reimbursement">Reimbursement</option>
              </select>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
                className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={filters.team_id || ''}
                onChange={(e) => setFilters({ ...filters, team_id: e.target.value || undefined })}
                className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
              >
                <option value="">All Teams</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Transactions List */}
          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : filteredFinances.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium mb-1">No transactions found</p>
                <p className="text-sm">
                  {searchTerm || filters.transaction_type || filters.status || filters.team_id
                    ? 'Try adjusting your filters or search term'
                    : 'Add your first transaction to start tracking finances'}
                </p>
              </div>
            ) : (
              filteredFinances.map(finance => (
                <div key={finance.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        {getTypeIcon(finance.transaction_type)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{finance.description}</p>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>{finance.category}</span>
                          {finance.vendor_name && (
                            <>
                              <span>•</span>
                              <span>{finance.vendor_name}</span>
                            </>
                          )}
                          {finance.team && (
                            <>
                              <span>•</span>
                              <span style={{ color: finance.team.color }}>{finance.team.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className={`font-bold ${
                          finance.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {finance.transaction_type === 'income' ? '+' : '-'}${finance.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">{finance.transaction_date}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(finance.status)}`}>
                        {finance.status}
                        {finance.approval_level && finance.approval_level !== 'pending' && finance.status === 'pending' && (
                          <span className="ml-1 opacity-70">
                            ({finance.approval_level.replace('_', ' ')})
                          </span>
                        )}
                      </span>
                      <div className="flex items-center space-x-1">
                        {/* Team Lead Approval - for pending items from their team */}
                        {finance.status === 'pending' && 
                         finance.approval_level === 'pending' && 
                         canTeamLeadApprove(finance) && (
                          <>
                            <button
                              onClick={() => handleTeamLeadApprove(finance.id)}
                              className="p-1.5 hover:bg-blue-100 text-blue-600 rounded"
                              title="Forward for Admin Approval"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => handleRejectTransaction(finance.id)}
                              className="p-1.5 hover:bg-red-100 text-red-600 rounded"
                              title="Reject"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        {/* Admin Approval - for team_lead_approved items */}
                        {finance.status === 'pending' && 
                         finance.approval_level === 'team_lead_approved' && 
                         (currentAdmin?.role === 'admin' || isSuperAdmin) && (
                          <>
                            <button
                              onClick={() => handleApproveTransaction(finance.id)}
                              className="p-1.5 hover:bg-green-100 text-green-600 rounded"
                              title="Final Approve"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => handleRejectTransaction(finance.id)}
                              className="p-1.5 hover:bg-red-100 text-red-600 rounded"
                              title="Reject"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        {/* Super Admin can approve anything pending */}
                        {finance.status === 'pending' && isSuperAdmin && finance.approval_level === 'pending' && !canTeamLeadApprove(finance) && (
                          <>
                            <button
                              onClick={() => handleApproveTransaction(finance.id)}
                              className="p-1.5 hover:bg-green-100 text-green-600 rounded"
                              title="Approve (Skip Workflow)"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => handleRejectTransaction(finance.id)}
                              className="p-1.5 hover:bg-red-100 text-red-600 rounded"
                              title="Reject"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleOpenAttachments(finance)}
                          className="p-1.5 hover:bg-muted rounded"
                          title="Attachments"
                        >
                          <Paperclip size={16} />
                        </button>
                        <button
                          onClick={() => openEditTransaction(finance)}
                          className="p-1.5 hover:bg-muted rounded"
                        >
                          <Edit3 size={16} />
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleDeleteTransaction(finance.id)}
                            className="p-1.5 hover:bg-red-100 text-red-600 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Budgets Tab */}
      {activeTab === 'budgets' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => {
                resetBudgetForm();
                setEditingBudget(null);
                setShowBudgetModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus size={18} />
              <span>Create Budget</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground bg-card rounded-xl border border-border">
                <Wallet className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium mb-1">No budgets created yet</p>
                <p className="text-sm">Create a budget to track spending limits for teams or projects</p>
              </div>
            ) : (
              budgets.map(budget => {
                const utilization = budget.total_amount > 0 
                  ? (budget.spent_amount / budget.total_amount) * 100 
                  : 0;
                const remaining = budget.total_amount - budget.spent_amount;
                
                return (
                  <div key={budget.id} className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-foreground">{budget.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        budget.status === 'active' ? 'bg-green-100 text-green-800' :
                        budget.status === 'exceeded' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {budget.status}
                      </span>
                    </div>
                    {budget.team && (
                      <p className="text-sm mb-2" style={{ color: budget.team.color }}>
                        {budget.team.name}
                      </p>
                    )}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Spent</span>
                        <span className="font-medium">${budget.spent_amount.toLocaleString()} / ${budget.total_amount.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            utilization > 100 ? 'bg-red-500' :
                            utilization > 80 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(utilization, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Remaining</span>
                      <span className={`font-medium ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${remaining.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {budget.start_date} - {budget.end_date}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Report Actions */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-foreground">Financial Reports</h3>
            <div className="flex items-center space-x-2">
              <select
                value={filters.team_id || ''}
                onChange={(e) => setFilters({ ...filters, team_id: e.target.value || undefined })}
                className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
              >
                <option value="">All Teams</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
              >
                <Download size={16} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Total Transactions</p>
              <p className="text-2xl font-bold text-foreground">{stats.transactionCount}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Avg Transaction</p>
              <p className="text-2xl font-bold text-foreground">
                ${stats.transactionCount > 0 
                  ? Math.round((stats.totalIncome + stats.totalExpenses) / stats.transactionCount).toLocaleString()
                  : 0}
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Categories Used</p>
              <p className="text-2xl font-bold text-foreground">{Object.keys(stats.categoryBreakdown).length}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Profit Margin</p>
              <p className={`text-2xl font-bold ${stats.totalIncome > 0 && ((stats.totalIncome - stats.totalExpenses) / stats.totalIncome * 100) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.totalIncome > 0 
                  ? `${((stats.totalIncome - stats.totalExpenses) / stats.totalIncome * 100).toFixed(1)}%`
                  : 'N/A'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-medium text-foreground mb-4 flex items-center">
                <PieChart className="w-5 h-5 mr-2" />
                Spending by Category
              </h3>
              {Object.keys(stats.categoryBreakdown).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PieChart className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="font-medium mb-1">No spending data</p>
                  <p className="text-sm">Add expense transactions to see category breakdown</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(stats.categoryBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 8)
                    .map(([category, amount]) => {
                      const percentage = stats.totalExpenses > 0 
                        ? (amount / stats.totalExpenses) * 100 
                        : 0;
                      return (
                        <div key={category}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">{category}</span>
                            <span className="font-medium">${amount.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-primary"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Monthly Trend */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-medium text-foreground mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Monthly Trend
              </h3>
              {stats.monthlyTrend.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="font-medium mb-1">No trend data</p>
                  <p className="text-sm">Add transactions to see monthly trends</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.monthlyTrend.slice(-6).map(({ month, income, expense }) => {
                    const total = income + expense;
                    return (
                      <div key={month} className="flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground w-20">{month}</span>
                        <div className="flex-1 flex items-center space-x-2">
                          <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden flex">
                            {total > 0 && (
                              <>
                                <div
                                  className="h-4 bg-green-500"
                                  style={{ width: `${(income / total) * 100}%` }}
                                />
                                <div
                                  className="h-4 bg-red-500"
                                  style={{ width: `${(expense / total) * 100}%` }}
                                />
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-right w-32">
                          <span className="text-green-600">+${income.toLocaleString()}</span>
                          {' / '}
                          <span className="text-red-600">-${expense.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex items-center justify-center space-x-4 mt-4 pt-4 border-t border-border">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  <span className="text-xs text-muted-foreground">Income</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded" />
                  <span className="text-xs text-muted-foreground">Expenses</span>
                </div>
              </div>
            </div>
          </div>

          {/* Team Breakdown */}
          {teams.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-medium text-foreground mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Spending by Team
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map(team => {
                  const teamFinances = finances.filter(f => f.team_id === team.id);
                  const teamExpenses = teamFinances
                    .filter(f => f.transaction_type === 'expense')
                    .reduce((sum, f) => sum + f.amount, 0);
                  const teamIncome = teamFinances
                    .filter(f => f.transaction_type === 'income')
                    .reduce((sum, f) => sum + f.amount, 0);
                  
                  return (
                    <div 
                      key={team.id} 
                      className="p-4 bg-muted/50 rounded-lg border border-border"
                    >
                      <div className="flex items-center space-x-2 mb-3">
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center"
                          style={{ backgroundColor: team.color + '20' }}
                        >
                          <Users className="w-3 h-3" style={{ color: team.color }} />
                        </div>
                        <span className="font-medium text-foreground">{team.name}</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Income</span>
                          <span className="text-green-600">+${teamIncome.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Expenses</span>
                          <span className="text-red-600">-${teamExpenses.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-border">
                          <span className="text-muted-foreground">Net</span>
                          <span className={teamIncome - teamExpenses >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ${(teamIncome - teamExpenses).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Budget vs Actual */}
          {budgets.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-medium text-foreground mb-4 flex items-center">
                <Wallet className="w-5 h-5 mr-2" />
                Budget vs Actual
              </h3>
              <div className="space-y-4">
                {budgets.filter(b => b.status === 'active').map(budget => {
                  const utilization = budget.total_amount > 0 
                    ? (budget.spent_amount / budget.total_amount) * 100 
                    : 0;
                  const isOverBudget = utilization > 100;
                  
                  return (
                    <div key={budget.id} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-foreground">{budget.name}</h4>
                          {budget.team && (
                            <span className="text-xs" style={{ color: budget.team.color }}>
                              {budget.team.name}
                            </span>
                          )}
                        </div>
                        <span className={`text-sm font-medium ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                          {utilization.toFixed(1)}% used
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3 mb-2">
                        <div
                          className={`h-3 rounded-full transition-all ${
                            isOverBudget ? 'bg-red-500' : utilization > 80 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(utilization, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Spent: ${budget.spent_amount.toLocaleString()}</span>
                        <span>Budget: ${budget.total_amount.toLocaleString()}</span>
                        <span>Remaining: ${(budget.total_amount - budget.spent_amount).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}


      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">
                  {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
                </h2>
                <button
                  onClick={() => {
                    setShowTransactionModal(false);
                    setEditingTransaction(null);
                    resetTransactionForm();
                  }}
                  className="p-2 hover:bg-muted rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Transaction Type *
                  </label>
                  <select
                    value={transactionForm.transaction_type}
                    onChange={(e) => setTransactionForm({ 
                      ...transactionForm, 
                      transaction_type: e.target.value as any,
                      category: '' // Reset category when type changes
                    })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="transfer">Transfer</option>
                    <option value="reimbursement">Reimbursement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Category *
                  </label>
                  <select
                    value={transactionForm.category}
                    onChange={(e) => setTransactionForm({ ...transactionForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={transactionForm.amount}
                      onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={transactionForm.transaction_date}
                      onChange={(e) => setTransactionForm({ ...transactionForm, transaction_date: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={transactionForm.description}
                    onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    placeholder="What is this transaction for?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Vendor/Payee
                    </label>
                    <input
                      type="text"
                      value={transactionForm.vendor_name}
                      onChange={(e) => setTransactionForm({ ...transactionForm, vendor_name: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                      placeholder="Company or person"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Reference #
                    </label>
                    <input
                      type="text"
                      value={transactionForm.reference_number}
                      onChange={(e) => setTransactionForm({ ...transactionForm, reference_number: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                      placeholder="Invoice/Receipt #"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Team
                  </label>
                  <select
                    value={transactionForm.team_id}
                    onChange={(e) => setTransactionForm({ ...transactionForm, team_id: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  >
                    <option value="">No team (General)</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Notes
                  </label>
                  <textarea
                    value={transactionForm.notes}
                    onChange={(e) => setTransactionForm({ ...transactionForm, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    rows={2}
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowTransactionModal(false);
                      setEditingTransaction(null);
                      resetTransactionForm();
                    }}
                    className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingTransaction ? handleUpdateTransaction : handleCreateTransaction}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Save size={16} />
                    <span>{editingTransaction ? 'Update' : 'Create'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">
                  {editingBudget ? 'Edit Budget' : 'Create Budget'}
                </h2>
                <button
                  onClick={() => {
                    setShowBudgetModal(false);
                    setEditingBudget(null);
                    resetBudgetForm();
                  }}
                  className="p-2 hover:bg-muted rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Budget Name *
                  </label>
                  <input
                    type="text"
                    value={budgetForm.name}
                    onChange={(e) => setBudgetForm({ ...budgetForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    placeholder="e.g., Q1 Events Budget"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Description
                  </label>
                  <textarea
                    value={budgetForm.description}
                    onChange={(e) => setBudgetForm({ ...budgetForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Total Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={budgetForm.total_amount}
                      onChange={(e) => setBudgetForm({ ...budgetForm, total_amount: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Fiscal Year
                    </label>
                    <input
                      type="text"
                      value={budgetForm.fiscal_year}
                      onChange={(e) => setBudgetForm({ ...budgetForm, fiscal_year: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                      placeholder="2025"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={budgetForm.start_date}
                      onChange={(e) => setBudgetForm({ ...budgetForm, start_date: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={budgetForm.end_date}
                      onChange={(e) => setBudgetForm({ ...budgetForm, end_date: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Team
                  </label>
                  <select
                    value={budgetForm.team_id}
                    onChange={(e) => setBudgetForm({ ...budgetForm, team_id: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  >
                    <option value="">Organization-wide</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowBudgetModal(false);
                      setEditingBudget(null);
                      resetBudgetForm();
                    }}
                    className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateBudget}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Save size={16} />
                    <span>{editingBudget ? 'Update' : 'Create'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attachments Modal */}
      {showAttachmentsModal && selectedTransactionForAttachments && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Attachments</h2>
                <button
                  onClick={() => {
                    setShowAttachmentsModal(false);
                    setSelectedTransactionForAttachments(null);
                    setAttachments([]);
                  }}
                  className="p-2 hover:bg-muted rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedTransactionForAttachments.description}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Upload Section */}
              <div className="mb-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleUploadAttachment}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAttachment}
                  className="w-full flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  {isUploadingAttachment ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span className="text-muted-foreground">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <span className="text-muted-foreground">Upload Receipt or Invoice</span>
                    </>
                  )}
                </button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Supported: PDF, Images, Word, Excel (max 10MB)
                </p>
              </div>

              {/* Attachments List */}
              {attachments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No attachments yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attachments.map(attachment => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <File className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {attachment.file_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.file_size)} • {new Date(attachment.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <a
                          href={attachment.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"
                          title="View"
                        >
                          <Eye size={16} />
                        </a>
                        <a
                          href={attachment.file_url}
                          download={attachment.file_name}
                          className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"
                          title="Download"
                        >
                          <Download size={16} />
                        </a>
                        <button
                          onClick={() => handleRemoveAttachment(attachment.id)}
                          className="p-2 hover:bg-red-100 rounded-lg text-muted-foreground hover:text-red-600"
                          title="Remove"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border">
              <button
                onClick={() => {
                  setShowAttachmentsModal(false);
                  setSelectedTransactionForAttachments(null);
                  setAttachments([]);
                }}
                className="w-full px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminFinances;
