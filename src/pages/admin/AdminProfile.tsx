import { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Navigate } from 'react-router-dom';
import {
  User,
  Key,
  Save,
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
  Mail,
  Calendar,
  Clock
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminService } from '@/services/adminService';

const AdminProfile = () => {
  const { isAuthenticated, currentAdmin } = useAdmin();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  if (!isAuthenticated || !currentAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all password fields' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters long' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      // First verify current password by attempting to authenticate
      const authResult = await AdminService.authenticate(currentAdmin.email, passwordForm.currentPassword);
      
      if (!authResult) {
        setMessage({ type: 'error', text: 'Current password is incorrect' });
        setIsSaving(false);
        return;
      }

      // Update password
      const success = await AdminService.updatePassword(currentAdmin.id, passwordForm.newPassword);
      
      if (success) {
        // Log the action
        await AdminService.logAdminAction(currentAdmin.id, 'change_password', currentAdmin.email);
        
        setMessage({ type: 'success', text: 'Password changed successfully' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setIsChangingPassword(false);
      } else {
        setMessage({ type: 'error', text: 'Failed to change password. Please try again.' });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: 'An error occurred while changing password' });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <AdminLayout
      title="My Profile"
      subtitle="Manage your admin account settings"
      icon={User}
    >
      <div className="max-w-2xl">
        {/* Profile Information */}
        <div className="bg-black rounded-xl shadow-sm border border-gray-800 mb-8">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">Profile Information</h2>
            <p className="text-gray-400 mt-1">Your admin account details</p>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User size={24} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{currentAdmin.email}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    {currentAdmin.role === 'super_admin' ? (
                      <ShieldCheck size={16} className="text-red-600" />
                    ) : (
                      <Shield size={16} className="text-blue-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      currentAdmin.role === 'super_admin' ? 'text-red-700' : 'text-blue-700'
                    }`}>
                      {currentAdmin.role === 'super_admin' ? 'Super Administrator' : 'Administrator'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3 p-4 bg-gray-900 rounded-lg">
                  <Mail size={20} className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Email</p>
                    <p className="text-sm text-gray-400">{currentAdmin.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-900 rounded-lg">
                  <Calendar size={20} className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Account Created</p>
                    <p className="text-sm text-gray-400">{formatDate(currentAdmin.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-900 rounded-lg">
                  <Clock size={20} className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Last Login</p>
                    <p className="text-sm text-gray-400">
                      {currentAdmin.last_login ? formatDate(currentAdmin.last_login) : 'Never'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-900 rounded-lg">
                  <Shield size={20} className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Account Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      currentAdmin.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {currentAdmin.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Password Management */}
        <div className="bg-black rounded-xl shadow-sm border border-gray-800">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Password & Security</h2>
              <p className="text-gray-400 mt-1">Change your password to keep your account secure</p>
            </div>
            {!isChangingPassword && (
              <button
                onClick={() => setIsChangingPassword(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Key size={16} />
                <span>Change Password</span>
              </button>
            )}
          </div>

          <div className="p-6">
            {!isChangingPassword ? (
              <div className="text-center py-8">
                <Key size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Password Security</h3>
                <p className="text-gray-400 mb-4">
                  Keep your account secure by using a strong, unique password.
                </p>
                <p className="text-sm text-gray-500">
                  Last password change: {currentAdmin.last_login ? formatDate(currentAdmin.last_login) : 'Unknown'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {message && (
                  <div className={`p-4 rounded-lg ${
                    message.type === 'success' 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {message.text}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-12 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-400"
                    >
                      {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-12 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      placeholder="Enter your new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-400"
                    >
                      {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-12 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-400"
                    >
                      {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                    <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setMessage(null);
                    }}
                    className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-900 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={isSaving || !passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                  >
                    <Save size={16} />
                    <span>{isSaving ? 'Changing...' : 'Change Password'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProfile;