import { supabase } from '@/lib/supabase';
import { NotificationService } from './notificationService';
import { TeamActivityService } from './teamActivityService';
import { ResendService } from './resendService';

// Types
export interface Finance {
  id: string;
  transaction_type: 'income' | 'expense' | 'transfer' | 'reimbursement';
  category: string;
  amount: number;
  currency: string;
  description: string;
  vendor_name?: string;
  reference_number?: string;
  transaction_date: string;
  team_id?: string;
  event_id?: string;
  project_id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  approval_level?: 'pending' | 'team_lead_approved' | 'admin_approved' | 'super_admin_approved' | 'rejected';
  submitted_by?: string;
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: string;
  created_by: string;
  notes?: string;
  is_recurring: boolean;
  recurring_frequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  created_at: string;
  updated_at: string;
  // Joined data
  team?: { id: string; name: string; slug: string; color: string };
  event?: { id: string; title: string };
  project?: { id: string; title: string };
  creator?: { id: string; email: string; display_name?: string };
  approver?: { id: string; email: string; display_name?: string };
  submitter?: { id: string; email: string; display_name?: string };
  attachments?: FinanceAttachment[];
}

export interface FinanceAttachment {
  id: string;
  finance_id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  uploaded_by: string;
  created_at: string;
}

export interface BudgetAllocation {
  id: string;
  name: string;
  description?: string;
  total_amount: number;
  spent_amount: number;
  team_id?: string;
  fiscal_year: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'closed' | 'exceeded';
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined data
  team?: { id: string; name: string; slug: string; color: string };
}

export interface FinanceFilters {
  transaction_type?: string;
  category?: string;
  status?: string;
  team_id?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
}

// Finance categories
export const FINANCE_CATEGORIES = {
  income: [
    'Sponsorship',
    'Membership Fees',
    'Event Revenue',
    'Donations',
    'Grants',
    'Merchandise Sales',
    'Other Income'
  ],
  expense: [
    'Event Costs',
    'Venue Rental',
    'Catering & Food',
    'Marketing & Promotion',
    'Equipment & Supplies',
    'Software & Subscriptions',
    'Travel & Transportation',
    'Speaker Fees',
    'Merchandise Production',
    'Administrative',
    'Other Expenses'
  ],
  transfer: ['Internal Transfer', 'Bank Transfer'],
  reimbursement: ['Member Reimbursement', 'Vendor Reimbursement']
};

export class FinancesService {
  // ============================================
  // FINANCE CRUD OPERATIONS
  // ============================================

  static async getFinances(filters?: FinanceFilters): Promise<Finance[]> {
    try {
      let query = supabase
        .from('finances')
        .select(`
          *,
          team:admin_teams(id, name, slug, color),
          event:events(id, title),
          project:projects(id, title),
          creator:admin_users!finances_created_by_fkey(id, email, display_name),
          approver:admin_users!finances_approved_by_fkey(id, email, display_name)
        `)
        .order('transaction_date', { ascending: false });

      if (filters) {
        if (filters.transaction_type) {
          query = query.eq('transaction_type', filters.transaction_type);
        }
        if (filters.category) {
          query = query.eq('category', filters.category);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.team_id) {
          query = query.eq('team_id', filters.team_id);
        }
        if (filters.start_date) {
          query = query.gte('transaction_date', filters.start_date);
        }
        if (filters.end_date) {
          query = query.lte('transaction_date', filters.end_date);
        }
        if (filters.min_amount !== undefined) {
          query = query.gte('amount', filters.min_amount);
        }
        if (filters.max_amount !== undefined) {
          query = query.lte('amount', filters.max_amount);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching finances:', error);
      return [];
    }
  }

  static async getFinanceById(id: string): Promise<Finance | null> {
    try {
      const { data, error } = await supabase
        .from('finances')
        .select(`
          *,
          team:admin_teams(id, name, slug, color),
          event:events(id, title),
          project:projects(id, title),
          creator:admin_users!finances_created_by_fkey(id, email, display_name),
          approver:admin_users!finances_approved_by_fkey(id, email, display_name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Get attachments
      if (data) {
        const { data: attachments } = await supabase
          .from('finance_attachments')
          .select('*')
          .eq('finance_id', id);
        
        data.attachments = attachments || [];
      }

      return data;
    } catch (error) {
      console.error('Error fetching finance:', error);
      return null;
    }
  }

  static async createFinance(finance: Partial<Finance>, createdBy: string): Promise<Finance | null> {
    try {
      const { data, error } = await supabase
        .from('finances')
        .insert({
          transaction_type: finance.transaction_type,
          category: finance.category,
          amount: finance.amount,
          currency: finance.currency || 'USD',
          description: finance.description,
          vendor_name: finance.vendor_name,
          reference_number: finance.reference_number,
          transaction_date: finance.transaction_date,
          team_id: finance.team_id,
          event_id: finance.event_id,
          project_id: finance.project_id,
          status: finance.status || 'pending',
          notes: finance.notes,
          is_recurring: finance.is_recurring || false,
          recurring_frequency: finance.recurring_frequency,
          created_by: createdBy
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating finance:', error);
      return null;
    }
  }

  static async updateFinance(id: string, updates: Partial<Finance>): Promise<Finance | null> {
    try {
      const { data, error } = await supabase
        .from('finances')
        .update({
          transaction_type: updates.transaction_type,
          category: updates.category,
          amount: updates.amount,
          currency: updates.currency,
          description: updates.description,
          vendor_name: updates.vendor_name,
          reference_number: updates.reference_number,
          transaction_date: updates.transaction_date,
          team_id: updates.team_id,
          event_id: updates.event_id,
          project_id: updates.project_id,
          status: updates.status,
          notes: updates.notes,
          is_recurring: updates.is_recurring,
          recurring_frequency: updates.recurring_frequency
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating finance:', error);
      return null;
    }
  }

  static async deleteFinance(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('finances')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting finance:', error);
      return false;
    }
  }

  // ============================================
  // APPROVAL OPERATIONS
  // ============================================

  /**
   * Submit a finance request (for team members)
   */
  static async submitFinance(
    finance: Partial<Finance>,
    submittedBy: string,
    teamId?: string
  ): Promise<Finance | null> {
    try {
      const { data, error } = await supabase
        .from('finances')
        .insert({
          transaction_type: finance.transaction_type,
          category: finance.category,
          amount: finance.amount,
          currency: finance.currency || 'USD',
          description: finance.description,
          vendor_name: finance.vendor_name,
          reference_number: finance.reference_number,
          transaction_date: finance.transaction_date,
          team_id: teamId || finance.team_id,
          event_id: finance.event_id,
          project_id: finance.project_id,
          status: 'pending',
          approval_level: 'pending',
          notes: finance.notes,
          is_recurring: finance.is_recurring || false,
          recurring_frequency: finance.recurring_frequency,
          created_by: submittedBy,
          submitted_by: submittedBy
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification to approvers
      if (data) {
        await NotificationService.notifyFinanceApprovalNeeded(
          data.id,
          finance.description || 'Finance request',
          finance.amount || 0,
          teamId || finance.team_id
        );
      }

      return data;
    } catch (error) {
      console.error('Error submitting finance:', error);
      return null;
    }
  }

  /**
   * Approve finance as team lead (first level)
   */
  static async teamLeadApprove(id: string, approverId: string): Promise<boolean> {
    try {
      // Get the finance record first
      const { data: finance } = await supabase
        .from('finances')
        .select('*, creator:admin_users!finances_created_by_fkey(id, email)')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('finances')
        .update({
          approval_level: 'team_lead_approved',
          notes: `Team lead approved on ${new Date().toISOString()}`
        })
        .eq('id', id)
        .eq('approval_level', 'pending');

      if (error) throw error;

      // Notify admins that this needs final approval
      await NotificationService.notifyFinanceApprovalNeeded(
        id,
        finance?.description || 'Finance request',
        finance?.amount || 0,
        finance?.team_id
      );

      return true;
    } catch (error) {
      console.error('Error team lead approving finance:', error);
      return false;
    }
  }

  /**
   * Final approve finance (admin/super admin)
   */
  static async approveFinance(id: string, approverId: string, approverRole: string = 'admin'): Promise<boolean> {
    try {
      // Get the finance record first
      const { data: finance } = await supabase
        .from('finances')
        .select('*, creator:admin_users!finances_created_by_fkey(id, email)')
        .eq('id', id)
        .single();

      const approvalLevel = approverRole === 'super_admin' ? 'super_admin_approved' : 'admin_approved';
      
      const { error } = await supabase
        .from('finances')
        .update({
          status: 'approved',
          approval_level: approvalLevel,
          approved_by: approverId,
          approved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Notify the submitter
      if (finance?.created_by) {
        await NotificationService.notifyUser(
          finance.created_by,
          'finance_approved',
          'Finance Request Approved',
          `Your ${finance.transaction_type} request for $${finance.amount?.toLocaleString()} has been approved.`,
          '/admin/finances'
        );

        // Send email notification
        try {
          const { data: approver } = await supabase
            .from('admin_users')
            .select('email, display_name')
            .eq('id', approverId)
            .single();

          if (finance.creator?.email && approver) {
            await ResendService.sendFinanceStatusEmail(
              finance.creator.email,
              finance.creator.display_name || finance.creator.email,
              finance.transaction_type,
              finance.amount,
              finance.description,
              'approved',
              approver.display_name || approver.email
            );
          }
        } catch (emailError) {
          console.error('Failed to send finance approval email:', emailError);
        }
      }

      return true;
    } catch (error) {
      console.error('Error approving finance:', error);
      return false;
    }
  }

  static async rejectFinance(id: string, approverId: string, reason?: string): Promise<boolean> {
    try {
      // Get the finance record first
      const { data: finance } = await supabase
        .from('finances')
        .select('*, creator:admin_users!finances_created_by_fkey(id, email, display_name)')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('finances')
        .update({
          status: 'rejected',
          approval_level: 'rejected',
          approved_by: approverId,
          approved_at: new Date().toISOString(),
          rejection_reason: reason,
          notes: reason
        })
        .eq('id', id);

      if (error) throw error;

      // Notify the submitter
      if (finance?.created_by) {
        await NotificationService.notifyUser(
          finance.created_by,
          'finance_rejected',
          'Finance Request Rejected',
          `Your ${finance.transaction_type} request for $${finance.amount?.toLocaleString()} was rejected.${reason ? ` Reason: ${reason}` : ''}`,
          '/admin/finances'
        );

        // Send email notification
        try {
          const { data: approver } = await supabase
            .from('admin_users')
            .select('email, display_name')
            .eq('id', approverId)
            .single();

          if (finance.creator?.email && approver) {
            await ResendService.sendFinanceStatusEmail(
              finance.creator.email,
              finance.creator.display_name || finance.creator.email,
              finance.transaction_type,
              finance.amount,
              finance.description,
              'rejected',
              approver.display_name || approver.email,
              reason
            );
          }
        } catch (emailError) {
          console.error('Failed to send finance rejection email:', emailError);
        }
      }

      return true;
    } catch (error) {
      console.error('Error rejecting finance:', error);
      return false;
    }
  }

  static async completeFinance(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('finances')
        .update({ status: 'completed' })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error completing finance:', error);
      return false;
    }
  }

  /**
   * Get pending approvals for a user based on their role
   */
  static async getPendingApprovalsForUser(
    userId: string,
    userRole: string,
    teamIds?: string[]
  ): Promise<Finance[]> {
    try {
      let query = supabase
        .from('finances')
        .select(`
          *,
          team:admin_teams(id, name, slug, color),
          creator:admin_users!finances_created_by_fkey(id, email, display_name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Team leads see pending items from their teams
      if (userRole === 'team_member' && teamIds && teamIds.length > 0) {
        query = query.in('team_id', teamIds).eq('approval_level', 'pending');
      }
      // Admins see team_lead_approved items
      else if (userRole === 'admin') {
        query = query.eq('approval_level', 'team_lead_approved');
      }
      // Super admins see all pending
      // No additional filter needed

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      return [];
    }
  }

  // ============================================
  // ATTACHMENT OPERATIONS
  // ============================================

  static async addAttachment(
    financeId: string,
    file: { name: string; url: string; type?: string; size?: number },
    uploadedBy: string
  ): Promise<FinanceAttachment | null> {
    try {
      const { data, error } = await supabase
        .from('finance_attachments')
        .insert({
          finance_id: financeId,
          file_name: file.name,
          file_url: file.url,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: uploadedBy
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding attachment:', error);
      return null;
    }
  }

  static async removeAttachment(attachmentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('finance_attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing attachment:', error);
      return false;
    }
  }

  static async getAttachments(financeId: string): Promise<FinanceAttachment[]> {
    try {
      const { data, error } = await supabase
        .from('finance_attachments')
        .select('*')
        .eq('finance_id', financeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching attachments:', error);
      return [];
    }
  }

  // ============================================
  // BUDGET ALLOCATION OPERATIONS
  // ============================================

  static async getBudgetAllocations(fiscalYear?: string, teamId?: string): Promise<BudgetAllocation[]> {
    try {
      let query = supabase
        .from('budget_allocations')
        .select(`
          *,
          team:admin_teams(id, name, slug, color)
        `)
        .order('start_date', { ascending: false });

      if (fiscalYear) {
        query = query.eq('fiscal_year', fiscalYear);
      }
      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching budget allocations:', error);
      return [];
    }
  }

  static async createBudgetAllocation(
    budget: Partial<BudgetAllocation>,
    createdBy: string
  ): Promise<BudgetAllocation | null> {
    try {
      const { data, error } = await supabase
        .from('budget_allocations')
        .insert({
          name: budget.name,
          description: budget.description,
          total_amount: budget.total_amount,
          spent_amount: 0,
          team_id: budget.team_id,
          fiscal_year: budget.fiscal_year,
          start_date: budget.start_date,
          end_date: budget.end_date,
          status: budget.status || 'draft',
          created_by: createdBy
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating budget allocation:', error);
      return null;
    }
  }

  static async updateBudgetAllocation(
    id: string,
    updates: Partial<BudgetAllocation>
  ): Promise<BudgetAllocation | null> {
    try {
      const { data, error } = await supabase
        .from('budget_allocations')
        .update({
          name: updates.name,
          description: updates.description,
          total_amount: updates.total_amount,
          spent_amount: updates.spent_amount,
          team_id: updates.team_id,
          fiscal_year: updates.fiscal_year,
          start_date: updates.start_date,
          end_date: updates.end_date,
          status: updates.status
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating budget allocation:', error);
      return null;
    }
  }

  static async deleteBudgetAllocation(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('budget_allocations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting budget allocation:', error);
      return false;
    }
  }

  // ============================================
  // STATISTICS & REPORTS
  // ============================================

  static async getFinanceStats(filters?: FinanceFilters): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    pendingApprovals: number;
    transactionCount: number;
    categoryBreakdown: Record<string, number>;
    monthlyTrend: Array<{ month: string; income: number; expense: number }>;
  }> {
    try {
      const finances = await this.getFinances(filters);
      
      let totalIncome = 0;
      let totalExpenses = 0;
      let pendingApprovals = 0;
      const categoryBreakdown: Record<string, number> = {};
      const monthlyData: Record<string, { income: number; expense: number }> = {};

      for (const f of finances) {
        const amount = Number(f.amount);
        
        if (f.transaction_type === 'income') {
          totalIncome += amount;
        } else if (f.transaction_type === 'expense') {
          totalExpenses += amount;
        }

        if (f.status === 'pending') {
          pendingApprovals++;
        }

        // Category breakdown
        categoryBreakdown[f.category] = (categoryBreakdown[f.category] || 0) + amount;

        // Monthly trend
        const month = f.transaction_date.substring(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
          monthlyData[month] = { income: 0, expense: 0 };
        }
        if (f.transaction_type === 'income') {
          monthlyData[month].income += amount;
        } else if (f.transaction_type === 'expense') {
          monthlyData[month].expense += amount;
        }
      }

      const monthlyTrend = Object.entries(monthlyData)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month));

      return {
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses,
        pendingApprovals,
        transactionCount: finances.length,
        categoryBreakdown,
        monthlyTrend
      };
    } catch (error) {
      console.error('Error fetching finance stats:', error);
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netBalance: 0,
        pendingApprovals: 0,
        transactionCount: 0,
        categoryBreakdown: {},
        monthlyTrend: []
      };
    }
  }

  static async getBudgetUtilization(budgetId: string): Promise<{
    budget: BudgetAllocation | null;
    transactions: Finance[];
    utilization: number;
    remaining: number;
  }> {
    try {
      const { data: budget, error } = await supabase
        .from('budget_allocations')
        .select(`
          *,
          team:admin_teams(id, name, slug, color)
        `)
        .eq('id', budgetId)
        .single();

      if (error) throw error;

      // Get related transactions
      let query = supabase
        .from('finances')
        .select('*')
        .gte('transaction_date', budget.start_date)
        .lte('transaction_date', budget.end_date)
        .eq('status', 'completed');

      if (budget.team_id) {
        query = query.eq('team_id', budget.team_id);
      }

      const { data: transactions } = await query;

      const spent = (transactions || [])
        .filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        budget,
        transactions: transactions || [],
        utilization: budget.total_amount > 0 ? (spent / budget.total_amount) * 100 : 0,
        remaining: budget.total_amount - spent
      };
    } catch (error) {
      console.error('Error fetching budget utilization:', error);
      return {
        budget: null,
        transactions: [],
        utilization: 0,
        remaining: 0
      };
    }
  }

  static async exportFinances(filters?: FinanceFilters): Promise<string> {
    try {
      const finances = await this.getFinances(filters);
      
      const headers = [
        'Date', 'Type', 'Category', 'Description', 'Amount', 'Currency',
        'Vendor', 'Reference', 'Status', 'Team', 'Event', 'Project', 'Notes'
      ];

      const rows = finances.map(f => [
        f.transaction_date,
        f.transaction_type,
        f.category,
        f.description,
        f.amount.toString(),
        f.currency,
        f.vendor_name || '',
        f.reference_number || '',
        f.status,
        f.team?.name || '',
        f.event?.title || '',
        f.project?.title || '',
        f.notes || ''
      ]);

      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
        .join('\n');

      return csv;
    } catch (error) {
      console.error('Error exporting finances:', error);
      return '';
    }
  }
}
