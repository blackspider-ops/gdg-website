import { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Navigate } from 'react-router-dom';
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
  Mail
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminService } from '@/services/adminService';
import type { AdminUser, AdminAction } from '@/lib/supabase';

const AdminUsers = () => {
  const { isAuthenticated, currentAdmin } = useAdmin();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');

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

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [adminUsers, actions] = await Promise.all([
        AdminService.getAllAdmins(),
        AdminService.getAdminActions(100)
      ]);
      setAdmins(adminUsers);
      setAdminActions(actions);
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
        await AdminService.logAdminAction(
          currentAdmin!.id,
          'create_admin',
          createForm.email,
          { role: createForm.role }
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

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <div className="bg-black rounded-xl shadow-sm border border-gray-800">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Admin Actions</h3>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-400 mt-2">Loading audit log...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {adminActions.map((action) => (
                  <div key={action.id} className="flex items-center space-x-4 p-4 border border-gray-800 rounded-lg">
                    <div className="flex-shrink-0">
                      {getActionIcon(action.action)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-white">
                          {action.admin_users?.email || 'Unknown Admin'}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActionColor(action.action)}`}>
                          {action.action.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {action.target_email && (
                          <span>Target: {action.target_email} • </span>
                        )}
                        {formatDate(action.created_at)}
                      </div>
                    </div>
                  </div>
                ))}

                {adminActions.length === 0 && (
                  <div className="text-center py-8">
                    <Clock size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No audit log entries</h3>
                    <p className="text-gray-400">Admin actions will appear here once they start occurring.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
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
    </AdminLayout>
  );
};

export default AdminUsers;