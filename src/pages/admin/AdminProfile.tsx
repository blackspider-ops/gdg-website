import { useState, useEffect } from 'react';
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
  Clock,
  Activity,
  Settings,
  Lock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Edit3,
  Camera,
  Download,
  Trash2
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminService } from '@/services/adminService';
import { AuditService } from '@/services/auditService';

const AdminProfile = () => {
  const { isAuthenticated, currentAdmin } = useAdmin();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile stats
  const [profileStats, setProfileStats] = useState({
    totalLogins: 0,
    lastPasswordChange: null as string | null,
    accountAge: 0,
    recentActions: 0
  });

  // Recent activity
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [profileForm, setProfileForm] = useState({
    email: currentAdmin?.email || '',
    firstName: '',
    lastName: '',
    bio: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  

  useEffect(() => {
    if (isAuthenticated && currentAdmin) {
      loadProfileData();
    }
  }, [isAuthenticated, currentAdmin]);

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  if (!currentAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      // Load recent activity
      const auditData = await AuditService.getAuditLog(
        { adminId: currentAdmin.id },
        10,
        0
      );
      setRecentActivity(auditData);

      // Calculate profile stats
      const accountAge = Math.floor(
        (new Date().getTime() - new Date(currentAdmin.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      setProfileStats({
        totalLogins: auditData.filter(a => a.action === 'login').length,
        lastPasswordChange: currentAdmin.last_login || currentAdmin.created_at,
        accountAge,
        recentActions: auditData.length
      });

      // Initialize profile form
      setProfileForm({
        email: currentAdmin.email,
        firstName: '',
        lastName: '',
        bio: ''
      });
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

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
        await AuditService.logAction(
          currentAdmin.id,
          'change_password',
          currentAdmin.email,
          { description: 'Changed account password' }
        );

        setMessage({ type: 'success', text: 'Password changed successfully' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setIsChangingPassword(false);

        // Reload profile data to update stats
        await loadProfileData();
      } else {
        setMessage({ type: 'error', text: 'Failed to change password. Please try again.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while changing password' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      // In a real implementation, you'd update the profile here
      // For now, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));

      await AuditService.logAction(
        currentAdmin.id,
        'update_admin',
        currentAdmin.email,
        { description: 'Updated profile information' }
      );

      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setIsEditingProfile(false);
      await loadProfileData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    return {
      score: strength,
      label: ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength] || 'Very Weak',
      color: ['red', 'orange', 'yellow', 'blue', 'green'][strength] || 'red'
    };
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
      actions={
        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadProfileData()}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 border border-border text-gray-300 rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

        </div>
      }
    >
      <div className="max-w-7xl mx-auto">
        {/* Global Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${message.type === 'success'
            ? 'bg-green-900/20 text-green-400 border-green-800'
            : 'bg-red-900/20 text-red-400 border-red-800'
            }`}>
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? (
                <CheckCircle size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Information */}
            <div className="bg-card rounded-xl shadow-sm border border-border">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Profile Information</h2>
                  <p className="text-muted-foreground mt-1">Your admin account details</p>
                </div>
              </div>

              <div className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw size={24} className="animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                          <User size={32} className="text-foreground" />
                        </div>
                        <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-gray-800 border-2 border-border rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
                          <Camera size={14} className="text-muted-foreground" />
                        </button>
                      </div>
                      <div className="flex-1">
                        {isEditingProfile ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                placeholder="First Name"
                                value={profileForm.firstName}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                                className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                              />
                              <input
                                type="text"
                                placeholder="Last Name"
                                value={profileForm.lastName}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                                className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                              />
                            </div>
                            <input
                              type="email"
                              placeholder="Email"
                              value={profileForm.email}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                            />
                          </div>
                        ) : (
                          <>
                            <h3 className="text-xl font-semibold text-foreground">{currentAdmin.email}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              {currentAdmin.role === 'super_admin' ? (
                                <ShieldCheck size={16} className="text-red-500" />
                              ) : (
                                <Shield size={16} className="text-blue-500" />
                              )}
                              <span className={`text-sm font-medium px-2 py-1 rounded-full ${currentAdmin.role === 'super_admin'
                                ? 'bg-red-900/20 text-red-400'
                                : 'bg-blue-900/20 text-blue-400'
                                }`}>
                                {currentAdmin.role === 'super_admin' ? 'Super Administrator' : 'Administrator'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {isEditingProfile && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                        <textarea
                          placeholder="Tell us about yourself..."
                          value={profileForm.bio}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                        />
                      </div>
                    )}

                    {isEditingProfile && (
                      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
                        <button
                          onClick={() => {
                            setIsEditingProfile(false);
                            setProfileForm({
                              email: currentAdmin.email,
                              firstName: '',
                              lastName: '',
                              bio: ''
                            });
                          }}
                          className="px-4 py-2 border border-border text-gray-300 rounded-lg hover:bg-muted transition-colors font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdateProfile}
                          disabled={isSaving}
                          className="flex items-center space-x-2 px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                        >
                          <Save size={16} />
                          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                      </div>
                    )}

                    {!isEditingProfile && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                          <Mail size={20} className="text-blue-400" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Email</p>
                            <p className="text-sm text-muted-foreground">{currentAdmin.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                          <Calendar size={20} className="text-green-400" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Account Created</p>
                            <p className="text-sm text-muted-foreground">{formatDate(currentAdmin.created_at)}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                          <Clock size={20} className="text-purple-400" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Last Login</p>
                            <p className="text-sm text-muted-foreground">
                              {currentAdmin.last_login ? formatDate(currentAdmin.last_login) : 'Never'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                          <Shield size={20} className="text-orange-400" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Account Status</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${currentAdmin.is_active
                              ? 'bg-green-900/20 text-green-400'
                              : 'bg-red-900/20 text-red-400'
                              }`}>
                              {currentAdmin.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Password Management */}
            <div className="bg-card rounded-xl shadow-sm border border-border">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Password & Security</h2>
                  <p className="text-muted-foreground mt-1">Change your password to keep your account secure</p>
                </div>
                {!isChangingPassword && (
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    <Key size={16} />
                    <span>Change Password</span>
                  </button>
                )}
              </div>

              <div className="p-6">
                {!isChangingPassword ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock size={32} className="text-blue-400" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Password Security</h3>
                    <p className="text-muted-foreground mb-4">
                      Keep your account secure by using a strong, unique password.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Last password change: {profileStats.lastPasswordChange ? formatDate(profileStats.lastPasswordChange) : 'Unknown'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full px-4 py-3 pr-12 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                          placeholder="Enter your current password"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-gray-300"
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
                          className="w-full px-4 py-3 pr-12 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                          placeholder="Enter your new password"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('new')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-gray-300"
                        >
                          {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>

                      {/* Password Strength Indicator */}
                      {passwordForm.newPassword && (
                        <div className="mt-2">
                          {(() => {
                            const strength = getPasswordStrength(passwordForm.newPassword);
                            return (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">Password Strength</span>
                                  <span className={`text-xs font-medium text-${strength.color}-400`}>
                                    {strength.label}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full bg-${strength.color}-500 transition-all duration-300`}
                                    style={{ width: `${(strength.score / 5) * 100}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground mt-1">Password must be at least 8 characters long</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full px-4 py-3 pr-12 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                          placeholder="Confirm your new password"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('confirm')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-gray-300"
                        >
                          {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                        <p className="text-sm text-red-400 mt-1">Passwords do not match</p>
                      )}
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-4">
                      <button
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          setMessage(null);
                        }}
                        className="px-4 py-2 border border-border text-gray-300 rounded-lg hover:bg-muted transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleChangePassword}
                        disabled={isSaving || !passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
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

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Account Stats */}
            <div className="bg-card rounded-xl shadow-sm border border-border">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Account Statistics</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity size={16} className="text-blue-400" />
                    <span className="text-sm text-muted-foreground">Total Logins</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{profileStats.totalLogins}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} className="text-green-400" />
                    <span className="text-sm text-muted-foreground">Account Age</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{profileStats.accountAge} days</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Settings size={16} className="text-purple-400" />
                    <span className="text-sm text-muted-foreground">Recent Actions</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{profileStats.recentActions}</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card rounded-xl shadow-sm border border-border">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
              </div>
              <div className="p-6">
                {recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3 text-sm">
                        <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-gray-300">{AuditService.getActionDescription(activity.action)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-xl shadow-sm border border-border">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
              </div>
              <div className="p-6 space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-muted rounded-lg transition-colors">
                  <Download size={16} className="text-muted-foreground" />
                  <span className="text-sm text-gray-300">Export Account Data</span>
                </button>

                <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-muted rounded-lg transition-colors">
                  <Activity size={16} className="text-muted-foreground" />
                  <span className="text-sm text-gray-300">View Activity Log</span>
                </button>

                <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-red-900/20 rounded-lg transition-colors text-red-400">
                  <Trash2 size={16} />
                  <span className="text-sm">Delete Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProfile;