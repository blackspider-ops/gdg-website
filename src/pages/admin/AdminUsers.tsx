import { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Navigate } from 'react-router-dom';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import {
  Users,
  Plus,
  Edit3,
  Trash2,
  Shield,
  ShieldCheck,
  Key,
  Eye,
  EyeOff,
  Save,
  X,
  AlertTriangle,
  Clock,
  Mail,
  Copy
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminSecurityManagement from '@/components/admin/AdminSecurityManagement';
import ComprehensiveAuditLog from '@/components/admin/ComprehensiveAuditLog';
import { AdminService } from '@/services/adminService';
import { SecurityService, type SecurityMetrics, type SessionInfo } from '@/services/securityService';
import { TeamService, type TeamMember } from '@/services/teamService';
import { AuditService } from '@/services/auditService';
import type { AdminUser, AdminAction } from '@/lib/supabase';

const AdminUsers = () => {
  const { isAuthenticated, currentAdmin } = useAdmin();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>({
    activeSessionsCount: 0,
    recentLoginsCount: 0,
    securityAlertsCount: 0,
    failedLoginAttempts: 0
  });
  const [activeSessions, setActiveSessions] = useState<SessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showPromoteSuccessModal, setShowPromoteSuccessModal] = useState(false);
  const [promotedAdminInfo, setPromotedAdminInfo] = useState<{
    name: string;
    email: string;
    role: string;
    temporaryPassword: string;
    isTemporary: boolean;
  } | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState<TeamMember | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'team' | 'audit' | 'security'>('users');

  // Lock body scroll when any modal is open
  useBodyScrollLock(showCreateModal || showEditModal || showDeleteModal || showPasswordModal || showPromoteModal || showPromoteSuccessModal);

  // Form states
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    role: 'admin' as 'admin' | 'super_admin'
  });
  const [editForm, setEditForm] = useState({
    email: '',
    role: 'admin' as 'admin' | 'super_admin',
    is_active: true
  });
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [promoteForm, setPromoteForm] = useState({
    email: '',
    password: '',
    role: 'admin' as 'admin' | 'super_admin',
    useTemporaryPassword: true,
    temporaryPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Check if current user is super admin
  const isSuperAdmin = AdminService.isSuperAdmin(currentAdmin);

  if (!isAuthenticated || !isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Log when audit tab is viewed
    if (activeTab === 'audit' && currentAdmin?.id) {
      AuditService.logAction(
        currentAdmin.id,
        'view_audit_log',
        undefined,
        {
          description: 'Viewed comprehensive audit log',
          viewed_at: new Date().toISOString()
        }
      );
    }
  }, [activeTab, currentAdmin?.id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [adminUsers, actions, metrics, sessions, allTeamMembers] = await Promise.all([
        AdminService.getAllAdmins(),
        AdminService.getAdminActions(100),
        SecurityService.getSecurityMetrics(),
        SecurityService.getActiveSessions(currentAdmin?.id),
        TeamService.getAllTeamMembers()
      ]);
      setAdmins(adminUsers);
      setAdminActions(actions);
      setSecurityMetrics(metrics);
      setActiveSessions(sessions);
      setTeamMembers(allTeamMembers);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!createForm.email || !createForm.password) return;
    
    setIsSaving(true);
    try {
      const newAdmin = await AdminService.createAdmin(
        createForm.email,
        createForm.password,
        createForm.role
      );

      if (newAdmin) {
        await AuditService.logAction(
          currentAdmin!.id,
          'create_admin',
          createForm.email,
          { 
            role: createForm.role,
            description: `Created new ${createForm.role} account for ${createForm.email}`
          }
        );
        
        setShowCreateModal(false);
        setCreateForm({ email: '', password: '', role: 'admin' });
        await loadData();
      }
    } catch (error) {
      console.error('Error creating admin:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditAdmin = async () => {
    if (!selectedAdmin) return;
    
    setIsSaving(true);
    try {
      const success = await AdminService.updateAdmin(
        selectedAdmin.id,
        {
          email: editForm.email,
          role: editForm.role,
          is_active: editForm.is_active
        },
        currentAdmin!.id
      );

      if (success) {
        await AuditService.logAction(
          currentAdmin!.id,
          'update_admin',
          selectedAdmin.email,
          {
            description: `Updated admin account for ${selectedAdmin.email}`,
            changes: {
              email: editForm.email !== selectedAdmin.email ? { from: selectedAdmin.email, to: editForm.email } : undefined,
              role: editForm.role !== selectedAdmin.role ? { from: selectedAdmin.role, to: editForm.role } : undefined,
              is_active: editForm.is_active !== selectedAdmin.is_active ? { from: selectedAdmin.is_active, to: editForm.is_active } : undefined
            }
          }
        );
        
        setShowEditModal(false);
        setSelectedAdmin(null);
        await loadData();
      }
    } catch (error) {
      console.error('Error updating admin:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;
    
    setIsSaving(true);
    try {
      const success = await AdminService.deleteAdmin(selectedAdmin.id, currentAdmin!.id);
      
      if (success) {
        await AuditService.logAction(
          currentAdmin!.id,
          'delete_admin',
          selectedAdmin.email,
          {
            description: `Deleted admin account for ${selectedAdmin.email}`,
            deleted_admin_role: selectedAdmin.role
          }
        );
        
        setShowDeleteModal(false);
        setSelectedAdmin(null);
        await loadData();
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedAdmin || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword) {
      return;
    }
    
    setIsSaving(true);
    try {
      const success = await AdminService.resetAdminPassword(
        selectedAdmin.id,
        passwordForm.newPassword,
        currentAdmin!.id
      );

      if (success) {
        await AuditService.logAction(
          currentAdmin!.id,
          'reset_password',
          selectedAdmin.email,
          {
            description: `Reset password for admin ${selectedAdmin.email}`,
            target_admin_role: selectedAdmin.role
          }
        );
        
        setShowPasswordModal(false);
        setSelectedAdmin(null);
        setPasswordForm({ newPassword: '', confirmPassword: '' });
        await loadData();
      }
    } catch (error) {
      console.error('Error resetting password:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePromoteTeamMember = async () => {
    if (!selectedTeamMember || !promoteForm.email || !promoteForm.password) return;
    
    setIsSaving(true);
    try {
      const newAdmin = await AdminService.createAdmin(
        promoteForm.email,
        promoteForm.password,
        promoteForm.role,
        promoteForm.useTemporaryPassword
      );

      if (newAdmin) {
        await AuditService.logAction(
          currentAdmin!.id,
          'promote_team_member',
          promoteForm.email,
          { 
            description: `Promoted team member ${selectedTeamMember.name} to ${promoteForm.role}`,
            team_member_name: selectedTeamMember.name,
            team_member_role: selectedTeamMember.role,
            promoted_to_role: promoteForm.role,
            admin_email: promoteForm.email,
            temporary_password: promoteForm.useTemporaryPassword,
            password_must_change: promoteForm.useTemporaryPassword
          },
          selectedTeamMember.id,
          'team_member'
        );
        
        // Show success modal with password info
        setPromotedAdminInfo({
          name: selectedTeamMember.name,
          email: promoteForm.email,
          role: promoteForm.role,
          temporaryPassword: promoteForm.password,
          isTemporary: promoteForm.useTemporaryPassword
        });
        
        setShowPromoteModal(false);
        setShowPromoteSuccessModal(true);
        setSelectedTeamMember(null);
        setPromoteForm({ 
          email: '', 
          password: '', 
          role: 'admin', 
          useTemporaryPassword: true, 
          temporaryPassword: '' 
        });
        await loadData();
      }
    } catch (error) {
      console.error('Error promoting team member:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setEditForm({
      email: admin.email,
      role: admin.role,
      is_active: admin.is_active
    });
    setShowEditModal(true);
  };

  const openPasswordModal = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    setShowPasswordModal(true);
  };

  const openDeleteModal = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setShowDeleteModal(true);
  };

  const generateTemporaryPassword = () => {
    // Generate a secure temporary password
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const openPromoteModal = (teamMember: TeamMember) => {
    const tempPassword = generateTemporaryPassword();
    setSelectedTeamMember(teamMember);
    setPromoteForm({ 
      email: teamMember.email || '', 
      password: tempPassword, 
      role: 'admin',
      useTemporaryPassword: true,
      temporaryPassword: tempPassword
    });
    setShowPromoteModal(true);
  };

  // Check if team member is already an admin
  const isTeamMemberAdmin = (teamMember: TeamMember) => {
    return admins.some(admin => 
      admin.email === teamMember.email || 
      admin.email.toLowerCase().includes(teamMember.name.toLowerCase().replace(/\s+/g, '.'))
    );
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

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login': return <Shield size={16} className="text-green-600" />;
      case 'create_admin': return <Plus size={16} className="text-blue-600" />;
      case 'update_admin': return <Edit3 size={16} className="text-yellow-600" />;
      case 'delete_admin': return <Trash2 size={16} className="text-red-600" />;
      case 'reset_password': return <Key size={16} className="text-purple-600" />;
      default: return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'login': return 'bg-green-50 text-green-700 border-green-200';
      case 'create_admin': return 'bg-gray-900 text-blue-700 border-blue-200';
      case 'update_admin': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'delete_admin': return 'bg-red-50 text-red-700 border-red-200';
      case 'reset_password': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-900 text-gray-300 border-gray-800';
    }
  };

  return (
    <AdminLayout
      title="Admin Users"
      subtitle="Manage administrator accounts and permissions"
      icon={Users}
      actions={
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus size={16} />
          <span>Add Admin</span>
        </button>
      }
    >
      {/* Tabs */}
      <div className="border-b border-gray-800 mb-8">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'
            }`}
          >
            <Users size={16} />
            <span>Admin Users</span>
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'team'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'
            }`}
          >
            <Shield size={16} />
            <span>Team Members</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'audit'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'
            }`}
          >
            <Clock size={16} />
            <span>Audit Log</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'security'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'
            }`}
          >
            <Key size={16} />
            <span>Security</span>
          </button>
        </nav>
      </div>

      {/* Admin Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-black rounded-xl shadow-sm border border-gray-800">
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-400 mt-2">Loading admin users...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left py-3 px-4 font-medium text-white">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-white">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-white">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-white">Last Login</th>
                      <th className="text-left py-3 px-4 font-medium text-white">Created</th>
                      <th className="text-right py-3 px-4 font-medium text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin) => (
                      <tr key={admin.id} className="border-b border-gray-100 hover:bg-gray-900">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <Mail size={16} className="text-gray-400" />
                            <span className="font-medium text-white">{admin.email}</span>
                            {admin.id === currentAdmin?.id && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">You</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            {admin.role === 'super_admin' ? (
                              <ShieldCheck size={16} className="text-red-600" />
                            ) : (
                              <Shield size={16} className="text-blue-600" />
                            )}
                            <span className={`text-sm font-medium ${
                              admin.role === 'super_admin' ? 'text-red-700' : 'text-blue-700'
                            }`}>
                              {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            admin.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {admin.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-400">
                          {admin.last_login ? formatDate(admin.last_login) : 'Never'}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-400">
                          {formatDate(admin.created_at)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openEditModal(admin)}
                              className="p-2 text-blue-600 hover:bg-gray-900 rounded-lg transition-colors"
                              title="Edit admin"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => openPasswordModal(admin)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Reset password"
                            >
                              <Key size={16} />
                            </button>
                            {admin.id !== currentAdmin?.id && (
                              <button
                                onClick={() => openDeleteModal(admin)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete admin"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {admins.length === 0 && (
                  <div className="text-center py-8">
                    <Users size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No admin users found</h3>
                    <p className="text-gray-400">Create your first admin user to get started.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Team Members Tab */}
      {activeTab === 'team' && (
        <div className="bg-black rounded-xl shadow-sm border border-gray-800">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Team Members</h3>
                <p className="text-gray-400 mt-1">Promote team members to admin status</p>
              </div>
              <div className="text-sm text-gray-400">
                {teamMembers.length} total members • {teamMembers.filter(m => m.is_active).length} active
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-400 mt-2">Loading team members...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left py-3 px-4 font-medium text-white">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-white">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-white">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-white">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-white">Admin Status</th>
                      <th className="text-right py-3 px-4 font-medium text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((member) => {
                      const isAdmin = isTeamMemberAdmin(member);
                      return (
                        <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-900">
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              {member.image_url ? (
                                <img 
                                  src={member.image_url} 
                                  alt={member.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-white">
                                    {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <span className="font-medium text-white">{member.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-300">{member.role}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-300">
                              {member.email || 'No email provided'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              member.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {member.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {isAdmin ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Shield size={12} className="mr-1" />
                                Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Member
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end space-x-2">
                              {!isAdmin && member.is_active && (
                                <button
                                  onClick={() => openPromoteModal(member)}
                                  className="flex items-center space-x-1 px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                  title="Promote to admin"
                                >
                                  <ShieldCheck size={12} />
                                  <span>Promote</span>
                                </button>
                              )}
                              {isAdmin && (
                                <span className="text-xs text-gray-400">Already admin</span>
                              )}
                              {!member.is_active && (
                                <span className="text-xs text-gray-500">Inactive</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {teamMembers.length === 0 && (
                  <div className="text-center py-8">
                    <Users size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No team members found</h3>
                    <p className="text-gray-400">Team members will appear here once they are added to the system.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <ComprehensiveAuditLog currentAdmin={currentAdmin} />
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <AdminSecurityManagement currentAdmin={currentAdmin} />
      )}

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-black rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-white">Create New Admin</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={createForm.password}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-3 pr-12 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    placeholder="Enter secure password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-400"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'super_admin' }))}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-800 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-900 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAdmin}
                disabled={isSaving || !createForm.email || !createForm.password}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                <Save size={16} />
                <span>{isSaving ? 'Creating...' : 'Create Admin'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-black rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-white">Edit Admin User</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'super_admin' }))}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-400 border-gray-700 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-white">
                  Active user
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-800 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-900 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleEditAdmin}
                disabled={isSaving}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                <Save size={16} />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-black rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-white">Reset Password</h3>
              <p className="text-sm text-gray-400 mt-1">
                Reset password for {selectedAdmin.email}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-4 py-3 pr-12 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-400"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-3 pr-12 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-400"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              {passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                <p className="text-sm text-red-600">Passwords do not match</p>
              )}
            </div>
            <div className="p-6 border-t border-gray-800 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-900 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={isSaving || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
              >
                <Key size={16} />
                <span>{isSaving ? 'Resetting...' : 'Reset Password'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Admin Modal */}
      {showDeleteModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-black rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center space-x-3">
                <AlertTriangle size={24} className="text-red-600" />
                <h3 className="text-lg font-semibold text-white">Delete Admin User</h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-400">
                Are you sure you want to delete the admin user <strong>{selectedAdmin.email}</strong>? 
                This action cannot be undone.
              </p>
            </div>
            <div className="p-6 border-t border-gray-800 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-900 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAdmin}
                disabled={isSaving}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                <Trash2 size={16} />
                <span>{isSaving ? 'Deleting...' : 'Delete Admin'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promote Team Member Modal */}
      {showPromoteModal && selectedTeamMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-black rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-white">Promote Team Member to Admin</h3>
              <p className="text-sm text-gray-400 mt-1">
                Promote {selectedTeamMember.name} ({selectedTeamMember.role}) to admin status
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-200">
                    <p className="font-medium mb-1">Team Member Information</p>
                    <p><strong>Name:</strong> {selectedTeamMember.name}</p>
                    <p><strong>Current Role:</strong> {selectedTeamMember.role}</p>
                    {selectedTeamMember.email && <p><strong>Email:</strong> {selectedTeamMember.email}</p>}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Admin Email</label>
                <input
                  type="email"
                  value={promoteForm.email}
                  onChange={(e) => setPromoteForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-black text-white"
                  placeholder="Enter admin email address"
                />
                <p className="text-xs text-gray-400 mt-1">
                  This will be the email used to log into the admin panel
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">Password Setup</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="useTemporaryPassword"
                      checked={promoteForm.useTemporaryPassword}
                      onChange={(e) => {
                        const useTemp = e.target.checked;
                        setPromoteForm(prev => ({ 
                          ...prev, 
                          useTemporaryPassword: useTemp,
                          password: useTemp ? prev.temporaryPassword : ''
                        }));
                      }}
                      className="w-4 h-4 text-blue-600 bg-black border border-gray-700 rounded focus:ring-blue-400 focus:ring-2"
                    />
                    <label htmlFor="useTemporaryPassword" className="text-sm text-gray-300">
                      Use temporary password
                    </label>
                  </div>
                </div>
                
                {promoteForm.useTemporaryPassword ? (
                  <div className="space-y-3">
                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <Key size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-200">
                          <p className="font-medium mb-1">Temporary Password Generated</p>
                          <p>The user will be required to change this password on their first login.</p>
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={promoteForm.temporaryPassword}
                        readOnly
                        className="w-full px-4 py-3 pr-24 border border-gray-700 rounded-lg bg-gray-900 text-white font-mono text-sm"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            const newPassword = generateTemporaryPassword();
                            setPromoteForm(prev => ({ 
                              ...prev, 
                              temporaryPassword: newPassword,
                              password: newPassword
                            }));
                          }}
                          className="text-blue-400 hover:text-blue-300 text-xs"
                          title="Generate new password"
                        >
                          ↻
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-400 hover:text-gray-300"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      Copy this password and share it securely with {selectedTeamMember.name}. They must change it on first login.
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={promoteForm.password}
                      onChange={(e) => setPromoteForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-4 py-3 pr-12 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-black text-white"
                      placeholder="Enter permanent password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Admin Role</label>
                <select
                  value={promoteForm.role}
                  onChange={(e) => setPromoteForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'super_admin' }))}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-black text-white"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Super admins have full access to all admin functions
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-800 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowPromoteModal(false)}
                className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-900 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handlePromoteTeamMember}
                disabled={isSaving || !promoteForm.email || !promoteForm.password}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                <ShieldCheck size={16} />
                <span>{isSaving ? 'Promoting...' : 'Promote to Admin'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promotion Success Modal */}
      {showPromoteSuccessModal && promotedAdminInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-black rounded-xl shadow-xl max-w-lg w-full mx-4">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <ShieldCheck size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Team Member Promoted Successfully!</h3>
                  <p className="text-sm text-gray-400">
                    {promotedAdminInfo.name} has been promoted to {promotedAdminInfo.role}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <h4 className="font-medium text-green-300 mb-3">Admin Account Created</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white font-medium">{promotedAdminInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white font-medium">{promotedAdminInfo.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Role:</span>
                    <span className="text-white font-medium">
                      {promotedAdminInfo.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </span>
                  </div>
                </div>
              </div>

              {promotedAdminInfo.isTemporary && (
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-300 mb-3 flex items-center space-x-2">
                    <Key size={16} />
                    <span>Temporary Password</span>
                  </h4>
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={promotedAdminInfo.temporaryPassword}
                        readOnly
                        className="w-full px-4 py-3 pr-12 border border-yellow-500/30 rounded-lg bg-yellow-900/10 text-yellow-100 font-mono text-sm"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(promotedAdminInfo.temporaryPassword);
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-yellow-400 hover:text-yellow-300"
                        title="Copy password"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                    <div className="text-sm text-yellow-200 space-y-1">
                      <p>• Share this password securely with {promotedAdminInfo.name}</p>
                      <p>• They must change it on their first login</p>
                      <p>• This password will not be shown again</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h4 className="font-medium text-blue-300 mb-2">Next Steps</h4>
                <div className="text-sm text-blue-200 space-y-1">
                  <p>1. Share the login credentials with {promotedAdminInfo.name}</p>
                  <p>2. Direct them to the admin login page</p>
                  {promotedAdminInfo.isTemporary && (
                    <p>3. They will be prompted to change their password on first login</p>
                  )}
                  <p>{promotedAdminInfo.isTemporary ? '4' : '3'}. They can now access admin functions based on their role</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-800 flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowPromoteSuccessModal(false);
                  setPromotedAdminInfo(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUsers;