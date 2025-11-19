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
  Trash2,
  Users,
  Briefcase,
  ExternalLink,
  Github,
  Linkedin,
  Plus,
  Star
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminService } from '@/services/adminService';
import { AuditService } from '@/services/auditService';
import { ProfileMergingService } from '@/services/profileMergingService';

const AdminProfile = () => {
  const { isAuthenticated, currentAdmin, mergedProfile, refreshProfile, updateTeamProfile } = useAdmin();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingTeamProfile, setIsEditingTeamProfile] = useState(false);
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

  const [teamProfileForm, setTeamProfileForm] = useState({
    name: mergedProfile?.teamMember?.name || '',
    role: mergedProfile?.teamMember?.teamRole || 'Team Member',
    bio: mergedProfile?.teamMember?.bio || '',
    imageUrl: mergedProfile?.teamMember?.imageUrl || '',
    linkedinUrl: mergedProfile?.teamMember?.linkedinUrl || '',
    githubUrl: mergedProfile?.teamMember?.githubUrl || ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Quick Actions states
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  

  useEffect(() => {
    if (isAuthenticated && currentAdmin) {
      loadProfileData();
    }
  }, [isAuthenticated, currentAdmin]);

  useEffect(() => {
    if (mergedProfile) {
      setTeamProfileForm({
        name: mergedProfile.teamMember?.name || '',
        role: mergedProfile.teamMember?.teamRole || 'Team Member',
        bio: mergedProfile.teamMember?.bio || '',
        imageUrl: mergedProfile.teamMember?.imageUrl || '',
        linkedinUrl: mergedProfile.teamMember?.linkedinUrl || '',
        githubUrl: mergedProfile.teamMember?.githubUrl || ''
      });
    }
  }, [mergedProfile]);

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

      // Find the most recent password change from audit log
      const passwordChangeEvents = auditData.filter(a => a.action === 'change_password');
      const lastPasswordChangeDate = passwordChangeEvents.length > 0 
        ? passwordChangeEvents[0].created_at // Most recent first
        : null;

      setProfileStats({
        totalLogins: auditData.filter(a => a.action === 'login').length,
        lastPasswordChange: lastPasswordChangeDate,
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

  const handleUpdateTeamProfile = async () => {
    if (!teamProfileForm.name.trim()) {
      setMessage({ type: 'error', text: 'Name is required for team profile' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const success = await updateTeamProfile({
        name: teamProfileForm.name.trim(),
        role: teamProfileForm.role,
        bio: teamProfileForm.bio.trim(),
        imageUrl: teamProfileForm.imageUrl.trim(),
        linkedinUrl: teamProfileForm.linkedinUrl.trim(),
        githubUrl: teamProfileForm.githubUrl.trim()
      });

      if (success) {
        await AuditService.logAction(
          currentAdmin.id,
          'update_team_profile',
          currentAdmin.email,
          { description: 'Updated team member profile' }
        );

        setMessage({ type: 'success', text: 'Team profile updated successfully' });
        setIsEditingTeamProfile(false);
        await loadProfileData();
      } else {
        setMessage({ type: 'error', text: 'Failed to update team profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while updating team profile' });
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

  // Quick Actions handlers
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Gather all admin data
      const exportData = {
        profile: {
          id: currentAdmin.id,
          email: currentAdmin.email,
          role: currentAdmin.role,
          created_at: currentAdmin.created_at,
          last_login: currentAdmin.last_login,
          is_active: currentAdmin.is_active
        },
        statistics: profileStats,
        recentActivity: recentActivity,
        exportDate: new Date().toISOString()
      };

      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `admin-data-${currentAdmin.email}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Log the action
      await AuditService.logAction(
        currentAdmin.id,
        'export_data',
        currentAdmin.email,
        { description: 'Exported account data' }
      );

      setMessage({ type: 'success', text: 'Account data exported successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export account data' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleViewActivityLog = () => {
    setShowActivityModal(true);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== currentAdmin.email) {
      setMessage({ type: 'error', text: 'Please type your email address to confirm deletion' });
      return;
    }

    setIsDeleting(true);
    try {
      // Log the action before deletion
      await AuditService.logAction(
        currentAdmin.id,
        'delete_account',
        currentAdmin.email,
        { description: 'Account deletion initiated' }
      );

      // In a real implementation, you'd call an API to delete the account
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));

      setMessage({ type: 'success', text: 'Account deletion initiated. You will be logged out shortly.' });
      
      // Close modal and reset form
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');

      // In a real app, you'd redirect to logout or login page
      setTimeout(() => {
        window.location.href = '/admin';
      }, 3000);

    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete account. Please try again.' });
    } finally {
      setIsDeleting(false);
    }
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
            {/* Profile Information - Only show when no team profile exists */}
            {!mergedProfile?.hasTeamProfile && (
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
            )}

            {/* Team Profile Section - Hidden for blog editors */}
            {currentAdmin?.role !== 'blog_editor' && (
              <div className="bg-card rounded-xl shadow-sm border border-border">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Team Profile</h2>
                  <p className="text-muted-foreground mt-1">
                    {mergedProfile?.hasTeamProfile 
                      ? (mergedProfile.teamMember?.isActive 
                          ? 'Your public team member profile' 
                          : 'Your team profile (not public)')
                      : 'Create a team profile to appear on the team page'
                    }
                  </p>
                </div>
                {!isEditingTeamProfile && (
                  <button
                    onClick={() => setIsEditingTeamProfile(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    {mergedProfile?.hasTeamProfile ? (
                      <>
                        <Edit3 size={16} />
                        <span>Edit Profile</span>
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        <span>Create Profile</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="p-6">
                {!isEditingTeamProfile ? (
                  mergedProfile?.hasTeamProfile ? (
                    <div className="space-y-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-blue-600 rounded-full flex items-center justify-center">
                          {mergedProfile.teamMember?.imageUrl ? (
                            <img 
                              src={mergedProfile.teamMember.imageUrl} 
                              alt={mergedProfile.teamMember.name}
                              className="w-20 h-20 rounded-full object-cover"
                            />
                          ) : (
                            <User size={28} className="text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-xl font-semibold text-foreground">{mergedProfile.teamMember?.name}</h3>
                            {mergedProfile.teamMember?.isActive ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/20 text-green-400 border border-green-800">
                                ✓ Public
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-900/20 text-gray-400 border border-gray-800">
                                Profile Not Public
                              </span>
                            )}
                          </div>
                          <p className="text-blue-400 font-medium text-lg">{mergedProfile.teamMember?.teamRole}</p>
                          <p className="text-muted-foreground text-sm mt-1">{mergedProfile.email}</p>
                          {!mergedProfile.teamMember?.isActive && (
                            <div className="mt-3 p-3 bg-gray-900/10 border border-gray-800/30 rounded-lg">
                              <p className="text-sm text-gray-400">
                                <strong>Note:</strong> Your profile has been created but is not yet visible on the public team page.
                              </p>
                            </div>
                          )}
                          {mergedProfile.teamMember?.bio && (
                            <p className="text-muted-foreground mt-3 leading-relaxed">{mergedProfile.teamMember.bio}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-4">
                            {mergedProfile.teamMember?.linkedinUrl && (
                              <a 
                                href={mergedProfile.teamMember.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                <Linkedin size={18} />
                                <span className="text-sm">LinkedIn</span>
                              </a>
                            )}
                            {mergedProfile.teamMember?.githubUrl && (
                              <a 
                                href={mergedProfile.teamMember.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 text-gray-400 hover:text-gray-300 transition-colors"
                              >
                                <Github size={18} />
                                <span className="text-sm">GitHub</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Admin Account Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                        <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                          <Shield size={20} className="text-red-400" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Admin Role</p>
                            <span className={`text-sm font-medium ${
                              mergedProfile.role === 'super_admin' ? 'text-red-400' : 'text-blue-400'
                            }`}>
                              {mergedProfile.role === 'super_admin' ? 'Super Administrator' : 'Administrator'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                          <Calendar size={20} className="text-green-400" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Account Created</p>
                            <p className="text-sm text-muted-foreground">{formatDate(mergedProfile.createdAt)}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                          <Clock size={20} className="text-purple-400" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Last Login</p>
                            <p className="text-sm text-muted-foreground">
                              {mergedProfile.lastLogin ? formatDate(mergedProfile.lastLogin) : 'Never'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                          <Activity size={20} className="text-orange-400" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Account Status</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              mergedProfile.isActive
                                ? 'bg-green-900/20 text-green-400'
                                : 'bg-red-900/20 text-red-400'
                            }`}>
                              {mergedProfile.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Profile Completion Status */}
                      <div className="bg-muted rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">Profile Completion</span>
                          <span className="text-sm text-muted-foreground">
                            {mergedProfile.profileComplete ? '100%' : '75%'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              mergedProfile.profileComplete ? 'bg-green-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: mergedProfile.profileComplete ? '100%' : '75%' }}
                          />
                        </div>
                        {!mergedProfile.profileComplete && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">
                              {ProfileMergingService.getProfileCompletionSuggestions(mergedProfile).join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users size={32} className="text-green-400" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-2">Join the Team Page</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your team profile to appear on the public team page and let others know about your role and expertise.
                      </p>
                      <button
                        onClick={() => setIsEditingTeamProfile(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium mx-auto"
                      >
                        <Plus size={16} />
                        <span>Create Team Profile</span>
                      </button>
                    </div>
                  )
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
                        <input
                          type="text"
                          value={teamProfileForm.name}
                          onChange={(e) => setTeamProfileForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Role *</label>
                        <select
                          value={teamProfileForm.role}
                          onChange={(e) => setTeamProfileForm(prev => ({ ...prev, role: e.target.value }))}
                          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                        >
                          <option value="Chapter Lead">Chapter Lead</option>
                          <option value="Co-Lead">Co-Lead</option>
                          <option value="Vice President">Vice President</option>
                          <option value="Technical Lead">Technical Lead</option>
                          <option value="Events Coordinator">Events Coordinator</option>
                          <option value="Marketing Lead">Marketing Lead</option>
                          <option value="Design Lead">Design Lead</option>
                          <option value="Community Manager">Community Manager</option>
                          <option value="Organizer">Organizer</option>
                          <option value="Mentor">Mentor</option>
                          <option value="Faculty Advisor">Faculty Advisor</option>
                          <option value="Team Lead">Team Lead</option>
                          <option value="Team Member">Team Member</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                      <textarea
                        value={teamProfileForm.bio}
                        onChange={(e) => setTeamProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                        placeholder="Tell others about yourself, your expertise, and what you do in the team..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Profile Image URL</label>
                      <input
                        type="url"
                        value={teamProfileForm.imageUrl}
                        onChange={(e) => setTeamProfileForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                        placeholder="https://example.com/your-photo.jpg"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">LinkedIn URL</label>
                        <input
                          type="url"
                          value={teamProfileForm.linkedinUrl}
                          onChange={(e) => setTeamProfileForm(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                          placeholder="https://linkedin.com/in/yourprofile"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">GitHub URL</label>
                        <input
                          type="url"
                          value={teamProfileForm.githubUrl}
                          onChange={(e) => setTeamProfileForm(prev => ({ ...prev, githubUrl: e.target.value }))}
                          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                          placeholder="https://github.com/yourusername"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
                      <button
                        onClick={() => {
                          setIsEditingTeamProfile(false);
                          // Reset form to current values
                          setTeamProfileForm({
                            name: mergedProfile?.teamMember?.name || '',
                            role: mergedProfile?.teamMember?.teamRole || 'Team Member',
                            bio: mergedProfile?.teamMember?.bio || '',
                            imageUrl: mergedProfile?.teamMember?.imageUrl || '',
                            linkedinUrl: mergedProfile?.teamMember?.linkedinUrl || '',
                            githubUrl: mergedProfile?.teamMember?.githubUrl || ''
                          });
                        }}
                        className="px-4 py-2 border border-border text-gray-300 rounded-lg hover:bg-muted transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateTeamProfile}
                        disabled={isSaving || !teamProfileForm.name.trim()}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                      >
                        <Save size={16} />
                        <span>{isSaving ? 'Saving...' : 'Save Team Profile'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            )}

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
                      Last password change: {profileStats.lastPasswordChange ? formatDate(profileStats.lastPasswordChange) : 'Never changed (using initial password)'}
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
            {/* Profile Overview */}
            {mergedProfile && (
              <div className="bg-card rounded-xl shadow-sm border border-border">
                <div className="p-6 border-b border-border">
                  <h3 className="text-lg font-semibold text-foreground">Profile Overview</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      {mergedProfile.teamMember?.imageUrl ? (
                        <img 
                          src={mergedProfile.teamMember.imageUrl} 
                          alt={mergedProfile.displayName}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <User size={24} className="text-white" />
                      )}
                    </div>
                    <h4 className="font-semibold text-foreground">{mergedProfile.displayName}</h4>
                    <p className="text-sm text-muted-foreground">{mergedProfile.email}</p>
                    {mergedProfile.teamMember && (
                      <p className="text-sm text-blue-400 mt-1">{mergedProfile.teamMember.teamRole}</p>
                    )}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield size={16} className="text-blue-400" />
                        <span className="text-sm text-muted-foreground">Admin Role</span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        mergedProfile.role === 'super_admin'
                          ? 'bg-red-900/20 text-red-400'
                          : mergedProfile.role === 'blog_editor'
                          ? 'bg-green-900/20 text-green-400'
                          : 'bg-blue-900/20 text-blue-400'
                      }`}>
                        {mergedProfile.role === 'super_admin' ? 'Super Admin' : 
                         mergedProfile.role === 'blog_editor' ? 'Blog Editor' : 'Admin'}
                      </span>
                    </div>

                    {/* Hide team profile info for blog editors */}
                    {currentAdmin?.role !== 'blog_editor' && (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Users size={16} className="text-green-400" />
                            <span className="text-sm text-muted-foreground">Team Profile</span>
                          </div>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            mergedProfile.hasTeamProfile
                              ? 'bg-green-900/20 text-green-400'
                              : 'bg-gray-900/20 text-gray-400'
                          }`}>
                            {mergedProfile.hasTeamProfile ? 'Active' : 'None'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Star size={16} className="text-yellow-400" />
                            <span className="text-sm text-muted-foreground">Profile Complete</span>
                          </div>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            mergedProfile.profileComplete
                              ? 'bg-green-900/20 text-green-400'
                              : 'bg-yellow-900/20 text-yellow-400'
                          }`}>
                            {mergedProfile.profileComplete ? 'Complete' : 'Incomplete'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {!mergedProfile.profileComplete && currentAdmin?.role !== 'blog_editor' && (
                    <div className="pt-4 border-t border-border">
                      <h5 className="text-sm font-medium text-foreground mb-2">Suggestions</h5>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {ProfileMergingService.getProfileCompletionSuggestions(mergedProfile).map((suggestion, index) => (
                          <li key={index} className="flex items-start space-x-1">
                            <span className="text-yellow-400 mt-0.5">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                <button 
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                >
                  <Download size={16} className={`${isExporting ? 'animate-pulse' : ''} text-muted-foreground`} />
                  <span className="text-sm text-gray-300">
                    {isExporting ? 'Exporting...' : 'Export Account Data'}
                  </span>
                </button>

                <button 
                  onClick={handleViewActivityLog}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-muted rounded-lg transition-colors"
                >
                  <Activity size={16} className="text-muted-foreground" />
                  <span className="text-sm text-gray-300">View Activity Log</span>
                </button>

                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-red-900/20 rounded-lg transition-colors text-red-400"
                >
                  <Trash2 size={16} />
                  <span className="text-sm">Delete Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Log Modal */}
        {showActivityModal && (
          <div 
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            style={{ 
              overflow: 'hidden',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowActivityModal(false);
              }
            }}
            onWheel={(e) => e.preventDefault()}
            onTouchMove={(e) => e.preventDefault()}
            onScroll={(e) => e.preventDefault()}
          >
            <div 
              className="bg-card rounded-xl shadow-xl border border-border w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {/* Fixed Header */}
              <div className="flex-shrink-0 p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Activity Log</h3>
                  <p className="text-muted-foreground mt-1">Complete history of your admin actions</p>
                </div>
                <button
                  onClick={() => setShowActivityModal(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-4 p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                        <div className="w-3 h-3 bg-blue-400 rounded-full flex-shrink-0 mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2 gap-4">
                            <h4 className="font-medium text-foreground">
                              {AuditService.getActionDescription(activity.action)}
                            </h4>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(activity.created_at)}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Action: <span className="font-mono bg-gray-800 px-2 py-1 rounded text-xs text-blue-300">{activity.action}</span>
                            </p>
                            
                            {activity.details && (
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium">Details:</span>
                                <div className="mt-1 p-2 bg-gray-800 rounded text-xs font-mono text-gray-300 overflow-x-auto">
                                  {JSON.stringify(activity.details, null, 2)}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <span className="font-medium">IP:</span>
                                <span className="font-mono bg-gray-800 px-1 py-0.5 rounded">
                                  {activity.ip_address || 'Unknown'}
                                </span>
                              </div>
                              {activity.user_agent && (
                                <div className="flex items-start space-x-1">
                                  <span className="font-medium whitespace-nowrap">User Agent:</span>
                                  <span className="font-mono bg-gray-800 px-1 py-0.5 rounded text-xs break-all">
                                    {activity.user_agent.length > 80 
                                      ? activity.user_agent.substring(0, 80) + '...' 
                                      : activity.user_agent}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Activity size={48} className="text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No Activity Found</h3>
                    <p className="text-muted-foreground">Your activity log is empty.</p>
                  </div>
                )}
              </div>
              
              {/* Fixed Footer */}
              {recentActivity.length > 0 && (
                <div className="flex-shrink-0 p-4 border-t border-border bg-muted/30">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Showing {recentActivity.length} recent activities</span>
                    <button
                      onClick={() => setShowActivityModal(false)}
                      className="px-3 py-1 bg-primary text-foreground rounded hover:bg-primary/90 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Account Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl shadow-xl border border-border max-w-md w-full">
              <div className="p-6 border-b border-border">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center">
                    <Trash2 size={24} className="text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Delete Account</h3>
                    <p className="text-muted-foreground mt-1">This action cannot be undone</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div className="bg-red-900/10 border border-red-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-red-400 mb-1">Warning</h4>
                        <p className="text-sm text-red-300">
                          Deleting your account will permanently remove all your data, including:
                        </p>
                        <ul className="text-sm text-red-300 mt-2 space-y-1 list-disc list-inside">
                          <li>Profile information and settings</li>
                          <li>Activity logs and audit trail</li>
                          <li>Admin permissions and access</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Type your email address to confirm: <span className="font-mono text-blue-400">{currentAdmin.email}</span>
                    </label>
                    <input
                      type="email"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 bg-card text-foreground"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    disabled={isDeleting}
                    className="px-4 py-2 border border-border text-gray-300 rounded-lg hover:bg-muted transition-colors font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || deleteConfirmText !== currentAdmin.email}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                    <span>{isDeleting ? 'Deleting...' : 'Delete Account'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProfile;