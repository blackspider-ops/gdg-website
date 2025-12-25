import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Navigate } from 'react-router-dom';
import { 
  Users, Plus, Edit3, Trash2, UserPlus, Settings, 
  Shield, Crown, User, Search, MoreHorizontal, X, Save,
  Palette, Hash, Lock, Mail, Copy, Clock, Activity,
  MessageCircle, Send, CheckCircle, Link as LinkIcon,
  BarChart3, TrendingUp, FileText, Megaphone, ArrowRightLeft
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { TeamManagementService, type AdminTeam, type TeamMembership, type TeamAnnouncement } from '@/services/teamManagementService';
import { TeamInviteService, type TeamInvite } from '@/services/teamInviteService';
import { TeamActivityService, type TeamActivity } from '@/services/teamActivityService';
import { TeamStatisticsService, type TeamStats } from '@/services/teamStatisticsService';
import { PermissionsService, PAGE_PERMISSIONS } from '@/services/permissionsService';
import { AdminService } from '@/services/adminService';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import TeamChat from '@/components/admin/TeamChat';
import type { AdminUser } from '@/lib/supabase';

// Lucide icon options for teams
const TEAM_ICONS = [
  'users', 'calendar', 'code', 'palette', 'pen-tool', 'megaphone',
  'handshake', 'heart', 'star', 'zap', 'target', 'briefcase'
];

// Color options for teams
const TEAM_COLORS = [
  '#4285F4', '#EA4335', '#FBBC04', '#34A853', '#9C27B0', '#FF5722',
  '#00BCD4', '#795548', '#607D8B', '#E91E63', '#3F51B5', '#009688'
];

const AdminTeams = () => {
  const { isAuthenticated, currentAdmin, isSuperAdmin, isAdmin, userTeams } = useAdmin();
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [manageableTeams, setManageableTeams] = useState<AdminTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<AdminTeam | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMembership[]>([]);
  const [teamInvites, setTeamInvites] = useState<TeamInvite[]>([]);
  const [teamActivity, setTeamActivity] = useState<TeamActivity[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [teamAnnouncements, setTeamAnnouncements] = useState<TeamAnnouncement[]>([]);
  const [teamPageAccess, setTeamPageAccess] = useState<string[]>([]);
  const [availableAdmins, setAvailableAdmins] = useState<AdminUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<AdminTeam | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [canManageSelectedTeam, setCanManageSelectedTeam] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'announcements' | 'chat' | 'activity' | 'stats' | 'access'>('members');
  const [copiedInviteLink, setCopiedInviteLink] = useState<string | null>(null);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [bulkSelectedUsers, setBulkSelectedUsers] = useState<string[]>([]);
  const [bulkRole, setBulkRole] = useState<'lead' | 'co_lead' | 'member'>('member');
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferringMember, setTransferringMember] = useState<TeamMembership | null>(null);
  const [transferTargetTeam, setTransferTargetTeam] = useState('');

  useBodyScrollLock(showTeamModal || showMemberModal || showInviteModal || showBulkAddModal || showAnnouncementModal || showTransferModal);

  // Team form state
  const [teamForm, setTeamForm] = useState({
    name: '',
    description: '',
    color: '#4285F4',
    icon: 'users',
    team_lead_id: ''
  });

  // Member form state
  const [memberForm, setMemberForm] = useState({
    admin_user_id: '',
    role: 'member' as 'lead' | 'co_lead' | 'member'
  });

  // Invite form state
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'member' as 'lead' | 'co_lead' | 'member'
  });

  // Announcement form state
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    is_pinned: false,
    scheduled_for: ''
  });

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Super admins, admins, and team leads can access this page
  const isTeamLead = userTeams.some(t => t.role === 'lead' || t.role === 'co_lead');
  if (!isAdmin && !isTeamLead) {
    return <Navigate to="/admin" replace />;
  }

  useEffect(() => {
    loadTeams();
    loadAvailableAdmins();
  }, []);

  useEffect(() => {
    if (selectedTeam && currentAdmin) {
      loadTeamMembers(selectedTeam.id);
      loadTeamInvites(selectedTeam.id);
      loadTeamActivity(selectedTeam.id);
      loadTeamStats(selectedTeam.id);
      loadTeamPageAccess(selectedTeam.id);
      loadTeamAnnouncements(selectedTeam.id);
      checkTeamManagePermission(selectedTeam.id);
    }
  }, [selectedTeam, currentAdmin]);

  const loadTeamInvites = async (teamId: string) => {
    try {
      const invites = await TeamInviteService.getTeamInvites(teamId);
      setTeamInvites(invites);
    } catch (err) {
      console.error('Failed to load team invites:', err);
    }
  };

  const loadTeamActivity = async (teamId: string) => {
    try {
      const activity = await TeamActivityService.getTeamActivity(teamId, 20);
      setTeamActivity(activity);
    } catch (err) {
      console.error('Failed to load team activity:', err);
    }
  };

  const loadTeamStats = async (teamId: string) => {
    try {
      const stats = await TeamStatisticsService.getTeamStats(teamId);
      setTeamStats(stats);
    } catch (err) {
      console.error('Failed to load team stats:', err);
    }
  };

  const loadTeamPageAccess = async (teamId: string) => {
    try {
      const access = await PermissionsService.getTeamPageAccess(teamId);
      setTeamPageAccess(access);
    } catch (err) {
      console.error('Failed to load team page access:', err);
    }
  };

  const loadTeamAnnouncements = async (teamId: string) => {
    try {
      const announcements = await TeamManagementService.getTeamAnnouncements(teamId, false);
      setTeamAnnouncements(announcements);
    } catch (err) {
      console.error('Failed to load team announcements:', err);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!selectedTeam || !announcementForm.title.trim() || !announcementForm.message.trim()) {
      setError('Title and message are required');
      return;
    }

    try {
      const announcement = await TeamManagementService.createTeamAnnouncement(
        {
          team_id: selectedTeam.id,
          title: announcementForm.title,
          message: announcementForm.message,
          priority: announcementForm.priority,
          is_pinned: announcementForm.is_pinned,
          scheduled_for: announcementForm.scheduled_for || undefined
        },
        currentAdmin!.id
      );

      if (announcement) {
        const isScheduled = announcementForm.scheduled_for && new Date(announcementForm.scheduled_for) > new Date();
        setSuccess(isScheduled ? 'Announcement scheduled successfully' : 'Announcement created successfully');
        setShowAnnouncementModal(false);
        resetAnnouncementForm();
        loadTeamAnnouncements(selectedTeam.id);
      } else {
        setError('Failed to create announcement');
      }
    } catch (err) {
      setError('Failed to create announcement');
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!confirm('Delete this announcement?')) return;

    try {
      const success = await TeamManagementService.deleteTeamAnnouncement(announcementId);
      if (success) {
        setSuccess('Announcement deleted');
        if (selectedTeam) {
          loadTeamAnnouncements(selectedTeam.id);
        }
      } else {
        setError('Failed to delete announcement');
      }
    } catch (err) {
      setError('Failed to delete announcement');
    }
  };

  const handleMarkAnnouncementRead = async (announcementId: string) => {
    if (!currentAdmin) return;
    await TeamManagementService.markAnnouncementAsRead(announcementId, currentAdmin.id);
    setTeamAnnouncements(prev =>
      prev.map(a => 
        a.id === announcementId 
          ? { ...a, read_by: [...(a.read_by || []), currentAdmin.id] }
          : a
      )
    );
  };

  const handleTransferMember = async () => {
    if (!transferringMember || !transferTargetTeam) {
      setError('Please select a target team');
      return;
    }

    try {
      // Remove from current team
      const removeSuccess = await TeamManagementService.removeTeamMember(
        transferringMember.id,
        currentAdmin!.id,
        currentAdmin!.role
      );

      if (removeSuccess) {
        // Add to new team
        const addSuccess = await TeamManagementService.addTeamMember(
          transferTargetTeam,
          transferringMember.admin_user_id,
          transferringMember.role,
          currentAdmin!.id,
          currentAdmin!.role
        );

        if (addSuccess) {
          setSuccess('Member transferred successfully');
          setShowTransferModal(false);
          setTransferringMember(null);
          setTransferTargetTeam('');
          if (selectedTeam) {
            loadTeamMembers(selectedTeam.id);
          }
        } else {
          setError('Failed to add member to new team');
        }
      } else {
        setError('Failed to remove member from current team');
      }
    } catch (err) {
      setError('Failed to transfer member');
    }
  };

  const resetAnnouncementForm = () => {
    setAnnouncementForm({
      title: '',
      message: '',
      priority: 'normal',
      is_pinned: false,
      scheduled_for: ''
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleTogglePageAccess = async (pagePath: string) => {
    if (!selectedTeam) return;
    
    const hasAccess = teamPageAccess.includes(pagePath);
    const success = await PermissionsService.setTeamPageAccess(
      selectedTeam.id,
      pagePath,
      !hasAccess
    );
    
    if (success) {
      if (hasAccess) {
        setTeamPageAccess(prev => prev.filter(p => p !== pagePath));
      } else {
        setTeamPageAccess(prev => [...prev, pagePath]);
      }
      setSuccess(`Page access ${hasAccess ? 'removed' : 'granted'}`);
    } else {
      setError('Failed to update page access');
    }
  };

  const checkTeamManagePermission = async (teamId: string) => {
    if (!currentAdmin) return;
    const canManage = await TeamManagementService.canManageTeam(
      currentAdmin.id, 
      currentAdmin.role, 
      teamId
    );
    setCanManageSelectedTeam(canManage);
  };

  const loadTeams = async () => {
    setIsLoading(true);
    try {
      // Load all teams for viewing
      const allTeams = await TeamManagementService.getTeams(isSuperAdmin);
      setTeams(allTeams);
      
      // Load teams the user can manage
      if (currentAdmin) {
        const manageable = await TeamManagementService.getManageableTeams(
          currentAdmin.id, 
          currentAdmin.role
        );
        setManageableTeams(manageable);
      }
      
      if (allTeams.length > 0 && !selectedTeam) {
        setSelectedTeam(allTeams[0]);
      }
    } catch (err) {
      setError('Failed to load teams');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamMembers = async (teamId: string) => {
    try {
      const members = await TeamManagementService.getTeamMembers(teamId);
      setTeamMembers(members);
    } catch (err) {
      console.error('Failed to load team members:', err);
    }
  };

  const loadAvailableAdmins = async () => {
    try {
      const admins = await AdminService.getAllAdmins();
      setAvailableAdmins(admins);
    } catch (err) {
      console.error('Failed to load admins:', err);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamForm.name.trim()) {
      setError('Team name is required');
      return;
    }

    try {
      const team = await TeamManagementService.createTeam(
        {
          name: teamForm.name,
          description: teamForm.description,
          color: teamForm.color,
          icon: teamForm.icon,
          team_lead_id: teamForm.team_lead_id || undefined
        },
        currentAdmin!.id
      );

      if (team) {
        setSuccess('Team created successfully');
        setShowTeamModal(false);
        resetTeamForm();
        loadTeams();
      } else {
        setError('Failed to create team');
      }
    } catch (err) {
      setError('Failed to create team');
    }
  };

  const handleUpdateTeam = async () => {
    if (!editingTeam || !teamForm.name.trim()) {
      setError('Team name is required');
      return;
    }

    try {
      const updated = await TeamManagementService.updateTeam(editingTeam.id, {
        name: teamForm.name,
        description: teamForm.description,
        color: teamForm.color,
        icon: teamForm.icon,
        team_lead_id: teamForm.team_lead_id || undefined
      });

      if (updated) {
        setSuccess('Team updated successfully');
        setShowTeamModal(false);
        setEditingTeam(null);
        resetTeamForm();
        loadTeams();
      } else {
        setError('Failed to update team');
      }
    } catch (err) {
      setError('Failed to update team');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to deactivate this team?')) return;

    try {
      const success = await TeamManagementService.deleteTeam(teamId);
      if (success) {
        setSuccess('Team deactivated successfully');
        loadTeams();
        if (selectedTeam?.id === teamId) {
          setSelectedTeam(null);
        }
      } else {
        setError('Failed to deactivate team');
      }
    } catch (err) {
      setError('Failed to deactivate team');
    }
  };

  const handleAddMember = async () => {
    if (!selectedTeam || !memberForm.admin_user_id) {
      setError('Please select a user');
      return;
    }

    try {
      const membership = await TeamManagementService.addTeamMember(
        selectedTeam.id,
        memberForm.admin_user_id,
        memberForm.role,
        currentAdmin!.id,
        currentAdmin!.role
      );

      if (membership) {
        setSuccess('Member added successfully');
        setShowMemberModal(false);
        resetMemberForm();
        loadTeamMembers(selectedTeam.id);
      } else {
        setError('Failed to add member. You may not have permission or the user is already in the team.');
      }
    } catch (err) {
      setError('Failed to add member');
    }
  };

  const handleRemoveMember = async (membershipId: string) => {
    if (!confirm('Remove this member from the team?')) return;

    try {
      const success = await TeamManagementService.removeTeamMember(
        membershipId,
        currentAdmin!.id,
        currentAdmin!.role
      );
      if (success) {
        setSuccess('Member removed');
        if (selectedTeam) {
          loadTeamMembers(selectedTeam.id);
        }
      } else {
        setError('Failed to remove member. You may not have permission.');
      }
    } catch (err) {
      setError('Failed to remove member');
    }
  };

  const handleUpdateMemberRole = async (membershipId: string, role: 'lead' | 'co_lead' | 'member') => {
    try {
      const success = await TeamManagementService.updateTeamMemberRole(
        membershipId, 
        role,
        currentAdmin!.id,
        currentAdmin!.role
      );
      if (success) {
        setSuccess('Role updated');
        if (selectedTeam) {
          loadTeamMembers(selectedTeam.id);
        }
      } else {
        setError('Failed to update role. You may not have permission.');
      }
    } catch (err) {
      setError('Failed to update role');
    }
  };

  const resetTeamForm = () => {
    setTeamForm({
      name: '',
      description: '',
      color: '#4285F4',
      icon: 'users',
      team_lead_id: ''
    });
  };

  const resetMemberForm = () => {
    setMemberForm({
      admin_user_id: '',
      role: 'member'
    });
  };

  const resetInviteForm = () => {
    setInviteForm({
      email: '',
      role: 'member'
    });
  };

  const handleSendInvite = async () => {
    if (!selectedTeam || !inviteForm.email.trim()) {
      setError('Please enter an email address');
      return;
    }

    try {
      const invite = await TeamInviteService.createInvite(
        selectedTeam.id,
        inviteForm.email,
        inviteForm.role,
        currentAdmin!.id
      );

      if (invite) {
        setSuccess('Invite sent successfully');
        setShowInviteModal(false);
        resetInviteForm();
        loadTeamInvites(selectedTeam.id);
      } else {
        // User was added directly (already exists)
        setSuccess('User added to team directly (already had an account)');
        setShowInviteModal(false);
        resetInviteForm();
        loadTeamMembers(selectedTeam.id);
      }
    } catch (err) {
      setError('Failed to send invite');
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm('Cancel this invite?')) return;

    try {
      const success = await TeamInviteService.cancelInvite(inviteId);
      if (success) {
        setSuccess('Invite cancelled');
        if (selectedTeam) {
          loadTeamInvites(selectedTeam.id);
        }
      } else {
        setError('Failed to cancel invite');
      }
    } catch (err) {
      setError('Failed to cancel invite');
    }
  };

  const handleCopyInviteLink = (token: string) => {
    const url = TeamInviteService.getInviteUrl(token);
    navigator.clipboard.writeText(url);
    setCopiedInviteLink(token);
    setTimeout(() => setCopiedInviteLink(null), 2000);
  };

  const handleBulkAddMembers = async () => {
    if (!selectedTeam || bulkSelectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }

    try {
      let successCount = 0;
      let failCount = 0;

      for (const userId of bulkSelectedUsers) {
        const membership = await TeamManagementService.addTeamMember(
          selectedTeam.id,
          userId,
          bulkRole,
          currentAdmin!.id,
          currentAdmin!.role
        );
        if (membership) {
          successCount++;
        } else {
          failCount++;
        }
      }

      if (successCount > 0) {
        setSuccess(`Added ${successCount} member${successCount > 1 ? 's' : ''} successfully${failCount > 0 ? ` (${failCount} failed)` : ''}`);
        setShowBulkAddModal(false);
        setBulkSelectedUsers([]);
        setBulkRole('member');
        loadTeamMembers(selectedTeam.id);
      } else {
        setError('Failed to add members. They may already be in the team or you lack permission.');
      }
    } catch (err) {
      setError('Failed to add members');
    }
  };

  const toggleBulkUserSelection = (userId: string) => {
    setBulkSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllAvailableUsers = () => {
    setBulkSelectedUsers(availableForTeam.map(a => a.id));
  };

  const clearBulkSelection = () => {
    setBulkSelectedUsers([]);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const openEditTeam = (team: AdminTeam) => {
    setEditingTeam(team);
    setTeamForm({
      name: team.name,
      description: team.description || '',
      color: team.color,
      icon: team.icon,
      team_lead_id: team.team_lead_id || ''
    });
    setShowTeamModal(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'lead': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'co_lead': return <Shield className="w-4 h-4 text-blue-500" />;
      default: return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get admins not already in the selected team
  const availableForTeam = availableAdmins.filter(admin =>
    !teamMembers.some(m => m.admin_user_id === admin.id)
  );

  return (
    <AdminLayout
      title="Admin Teams"
      subtitle="Manage teams and team memberships"
      icon={Users}
      actions={
        isSuperAdmin && (
          <button
            onClick={() => {
              resetTeamForm();
              setEditingTeam(null);
              setShowTeamModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={18} />
            <span>Create Team</span>
          </button>
        )
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams List */}
        <div className="lg:col-span-1 bg-card rounded-xl border border-border p-4">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredTeams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium mb-1">No teams found</p>
              <p className="text-sm">
                {searchTerm ? 'Try a different search term' : isSuperAdmin ? 'Create your first team to get started' : 'No teams available yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTeams.map(team => {
                const canManageThisTeam = manageableTeams.some(t => t.id === team.id);
                return (
                  <div
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedTeam?.id === team.id
                        ? 'bg-primary/10 border border-primary'
                        : 'bg-background hover:bg-muted border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: team.color + '20' }}
                        >
                          <Users className="w-4 h-4" style={{ color: team.color }} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-foreground">{team.name}</h3>
                            {canManageThisTeam && !isSuperAdmin && !isAdmin && (
                              <Crown className="w-3 h-3 text-yellow-500" title="You lead this team" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {team.member_count || 0} members
                          </p>
                        </div>
                      </div>
                      {isSuperAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditTeam(team);
                          }}
                          className="p-1 hover:bg-muted rounded"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Team Details */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          {selectedTeam ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: selectedTeam.color + '20' }}
                  >
                    <Users className="w-6 h-6" style={{ color: selectedTeam.color }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{selectedTeam.name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedTeam.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {canManageSelectedTeam && (
                    <>
                      <button
                        onClick={() => setShowMemberModal(true)}
                        className="flex items-center space-x-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
                      >
                        <UserPlus size={16} />
                        <span>Add</span>
                      </button>
                      <button
                        onClick={() => setShowBulkAddModal(true)}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        title="Add multiple members at once"
                      >
                        <Users size={16} />
                        <span>Bulk</span>
                      </button>
                      <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Mail size={16} />
                        <span>Invite</span>
                      </button>
                    </>
                  )}
                  {!canManageSelectedTeam && (
                    <div className="flex items-center space-x-2 px-3 py-2 bg-muted text-muted-foreground rounded-lg text-sm">
                      <Lock size={16} />
                      <span>View Only</span>
                    </div>
                  )}
                  {isSuperAdmin && (
                    <>
                      <button
                        onClick={() => openEditTeam(selectedTeam)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(selectedTeam.id)}
                        className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Permission Notice for Team Leads */}
              {!isSuperAdmin && !isAdmin && canManageSelectedTeam && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>You are a lead of this team. You can add and manage members.</span>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex space-x-1 mb-4 border-b border-border">
                <button
                  onClick={() => setActiveTab('members')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'members'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-1" />
                  Members ({teamMembers.length})
                </button>
                <button
                  onClick={() => setActiveTab('announcements')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'announcements'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Megaphone className="w-4 h-4 inline mr-1" />
                  Announcements ({teamAnnouncements.length})
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'chat'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 inline mr-1" />
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'activity'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Activity className="w-4 h-4 inline mr-1" />
                  Activity
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'stats'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 inline mr-1" />
                  Stats
                </button>
                {isSuperAdmin && (
                  <button
                    onClick={() => setActiveTab('access')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'access'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <FileText className="w-4 h-4 inline mr-1" />
                    Page Access
                  </button>
                )}
              </div>

              {/* Tab Content */}
              {activeTab === 'members' && (
                <div>
                  {/* Pending Invites */}
                  {teamInvites.length > 0 && canManageSelectedTeam && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                        <Mail className="w-4 h-4 mr-1" />
                        Pending Invites ({teamInvites.length})
                      </h4>
                      <div className="space-y-2">
                        {teamInvites.map(invite => (
                          <div
                            key={invite.id}
                            className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                          >
                            <div className="flex items-center space-x-3">
                              <Mail className="w-4 h-4 text-yellow-600" />
                              <div>
                                <p className="font-medium text-yellow-800">{invite.email}</p>
                                <p className="text-xs text-yellow-600 capitalize">
                                  {invite.role.replace('_', ' ')} • Expires {new Date(invite.expires_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleCopyInviteLink(invite.token)}
                                className="p-1 hover:bg-yellow-100 rounded text-yellow-700"
                                title="Copy invite link"
                              >
                                {copiedInviteLink === invite.token ? (
                                  <CheckCircle size={14} className="text-green-600" />
                                ) : (
                                  <Copy size={14} />
                                )}
                              </button>
                              <button
                                onClick={() => handleCancelInvite(invite.id)}
                                className="p-1 hover:bg-red-100 text-red-600 rounded"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Team Members */}
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Team Members</h3>
                  {teamMembers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-muted/50 rounded-lg">
                      <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="font-medium mb-1">No members yet</p>
                      <p className="text-sm">
                        {canManageSelectedTeam 
                          ? 'Add members using the buttons above or send an invite' 
                          : 'This team has no members yet'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {teamMembers.map(member => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
                        >
                          <div className="flex items-center space-x-3">
                            {getRoleIcon(member.role)}
                            <div>
                              <p className="font-medium text-foreground">
                                {member.admin_user?.display_name || member.admin_user?.email}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {member.role.replace('_', ' ')} • {member.admin_user?.role}
                              </p>
                            </div>
                          </div>
                          {canManageSelectedTeam ? (
                            <div className="flex items-center space-x-2">
                              <select
                                value={member.role}
                                onChange={(e) => handleUpdateMemberRole(member.id, e.target.value as any)}
                                className="text-xs px-2 py-1 bg-muted border border-border rounded"
                              >
                                <option value="member">Member</option>
                                <option value="co_lead">Co-Lead</option>
                                <option value="lead">Lead</option>
                              </select>
                              {(isSuperAdmin || isAdmin) && teams.length > 1 && (
                                <button
                                  onClick={() => {
                                    setTransferringMember(member);
                                    setShowTransferModal(true);
                                  }}
                                  className="p-1 hover:bg-blue-100 text-blue-600 rounded"
                                  title="Transfer to another team"
                                >
                                  <ArrowRightLeft size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="p-1 hover:bg-red-100 text-red-600 rounded"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              member.role === 'lead' ? 'bg-yellow-100 text-yellow-800' :
                              member.role === 'co_lead' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {member.role.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'announcements' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Team Announcements</h3>
                    {canManageSelectedTeam && (
                      <button
                        onClick={() => setShowAnnouncementModal(true)}
                        className="flex items-center space-x-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
                      >
                        <Plus size={14} />
                        <span>New Announcement</span>
                      </button>
                    )}
                  </div>
                  {teamAnnouncements.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-muted/50 rounded-lg">
                      <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="font-medium mb-1">No announcements yet</p>
                      <p className="text-sm">
                        {canManageSelectedTeam 
                          ? 'Create an announcement to keep your team informed' 
                          : 'Team announcements will appear here'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {teamAnnouncements.map(announcement => {
                        const isUnread = currentAdmin && !announcement.read_by?.includes(currentAdmin.id);
                        return (
                          <div
                            key={announcement.id}
                            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                              isUnread 
                                ? 'bg-primary/5 border-primary/20 hover:bg-primary/10' 
                                : 'bg-muted/50 border-border hover:bg-muted'
                            }`}
                            onClick={() => isUnread && handleMarkAnnouncementRead(announcement.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  {announcement.is_pinned && (
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                      📌 Pinned
                                    </span>
                                  )}
                                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(announcement.priority)}`}>
                                    {announcement.priority}
                                  </span>
                                </div>
                                <h4 className="font-medium text-foreground">{announcement.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{announcement.message}</p>
                                <div className="flex items-center space-x-4 mt-3 text-xs text-muted-foreground">
                                  <span>By {announcement.author?.display_name || announcement.author?.email}</span>
                                  <span>{formatTimeAgo(announcement.created_at)}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {isUnread && (
                                  <div className="w-2 h-2 bg-primary rounded-full" />
                                )}
                                {canManageSelectedTeam && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteAnnouncement(announcement.id);
                                    }}
                                    className="p-1 hover:bg-red-100 text-red-600 rounded"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'chat' && (
                <TeamChat
                  teamId={selectedTeam.id}
                  teamName={selectedTeam.name}
                  teamColor={selectedTeam.color}
                />
              )}

              {activeTab === 'activity' && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent Activity</h3>
                  {teamActivity.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-muted/50 rounded-lg">
                      <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="font-medium mb-1">No activity yet</p>
                      <p className="text-sm">Team actions like member changes and announcements will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {teamActivity.map(activity => (
                        <div
                          key={activity.id}
                          className="flex items-start space-x-3 p-3 bg-background rounded-lg border border-border"
                        >
                          <div className={`mt-0.5 ${TeamActivityService.getActivityColor(activity.action)}`}>
                            <Activity className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-foreground">
                              {TeamActivityService.getActivityDescription(activity)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimeAgo(activity.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'stats' && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Team Statistics</h3>
                  {teamStats ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-background rounded-lg border border-border">
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-muted-foreground">Members</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{teamStats.members}</p>
                      </div>
                      <div className="p-4 bg-background rounded-lg border border-border">
                        <div className="flex items-center space-x-2 mb-2">
                          <MessageCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-muted-foreground">Messages (30d)</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{teamStats.messagesCount}</p>
                      </div>
                      <div className="p-4 bg-background rounded-lg border border-border">
                        <div className="flex items-center space-x-2 mb-2">
                          <Activity className="w-4 h-4 text-purple-500" />
                          <span className="text-sm text-muted-foreground">Announcements</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{teamStats.announcementsCount}</p>
                      </div>
                      <div className="p-4 bg-background rounded-lg border border-border">
                        <div className="flex items-center space-x-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-orange-500" />
                          <span className="text-sm text-muted-foreground">Activity Score</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{teamStats.activityScore}</p>
                      </div>
                      <div className="col-span-2 p-4 bg-background rounded-lg border border-border">
                        <div className="flex items-center space-x-2 mb-2">
                          <BarChart3 className="w-4 h-4 text-cyan-500" />
                          <span className="text-sm text-muted-foreground">Finances Balance</span>
                        </div>
                        <p className={`text-2xl font-bold ${teamStats.financesTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${teamStats.financesTotal.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground bg-muted/50 rounded-lg">
                      Loading statistics...
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'access' && isSuperAdmin && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Page Access Control</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Configure which admin pages this team's members can access. Team members will only see pages they have access to.
                  </p>
                  <div className="space-y-2">
                    {Object.keys(PAGE_PERMISSIONS)
                      .filter(path => !['/admin', '/admin/profile', '/admin/guide'].includes(path))
                      .map(pagePath => {
                        const hasAccess = teamPageAccess.includes(pagePath);
                        const pageName = pagePath.replace('/admin/', '').replace(/-/g, ' ');
                        return (
                          <label
                            key={pagePath}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                              hasAccess
                                ? 'bg-green-50 border-green-200'
                                : 'bg-background border-border hover:bg-muted'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={hasAccess}
                                onChange={() => handleTogglePageAccess(pagePath)}
                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                              />
                              <div>
                                <p className="font-medium text-foreground capitalize">{pageName}</p>
                                <p className="text-xs text-muted-foreground">{pagePath}</p>
                              </div>
                            </div>
                            {hasAccess && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Select a team to view details
            </div>
          )}
        </div>
      </div>


      {/* Create/Edit Team Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">
                  {editingTeam ? 'Edit Team' : 'Create Team'}
                </h2>
                <button
                  onClick={() => {
                    setShowTeamModal(false);
                    setEditingTeam(null);
                    resetTeamForm();
                  }}
                  className="p-2 hover:bg-muted rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    value={teamForm.name}
                    onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    placeholder="e.g., Events Team"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Description
                  </label>
                  <textarea
                    value={teamForm.description}
                    onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    rows={3}
                    placeholder="What does this team do?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Team Lead
                  </label>
                  <select
                    value={teamForm.team_lead_id}
                    onChange={(e) => setTeamForm({ ...teamForm, team_lead_id: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  >
                    <option value="">Select a team lead</option>
                    {availableAdmins.map(admin => (
                      <option key={admin.id} value={admin.id}>
                        {admin.display_name || admin.email} ({admin.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Team Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TEAM_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setTeamForm({ ...teamForm, color })}
                        className={`w-8 h-8 rounded-lg transition-transform ${
                          teamForm.color === color ? 'ring-2 ring-primary ring-offset-2 scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowTeamModal(false);
                      setEditingTeam(null);
                      resetTeamForm();
                    }}
                    className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingTeam ? handleUpdateTeam : handleCreateTeam}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Save size={16} />
                    <span>{editingTeam ? 'Update' : 'Create'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Add Team Member</h2>
                <button
                  onClick={() => {
                    setShowMemberModal(false);
                    resetMemberForm();
                  }}
                  className="p-2 hover:bg-muted rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Select User *
                  </label>
                  {availableForTeam.length === 0 ? (
                    <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                      All users are already members of this team
                    </div>
                  ) : (
                    <select
                      value={memberForm.admin_user_id}
                      onChange={(e) => setMemberForm({ ...memberForm, admin_user_id: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    >
                      <option value="">Choose a user</option>
                      {availableForTeam.map(admin => (
                        <option key={admin.id} value={admin.id}>
                          {admin.display_name || admin.email} ({admin.role})
                        </option>
                      ))}
                    </select>
                  )}
                  {teamMembers.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {teamMembers.length} user{teamMembers.length !== 1 ? 's' : ''} already in team
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Role in Team
                  </label>
                  <select
                    value={memberForm.role}
                    onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value as any })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  >
                    <option value="member">Member</option>
                    <option value="co_lead">Co-Lead</option>
                    <option value="lead">Lead</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowMemberModal(false);
                      resetMemberForm();
                    }}
                    className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMember}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <UserPlus size={16} />
                    <span>Add Member</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Invite to Team</h2>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    resetInviteForm();
                  }}
                  className="p-2 hover:bg-muted rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Send an invite link to someone who doesn't have an account yet. They'll be able to create an account and join the team.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Role in Team
                  </label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as any })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  >
                    <option value="member">Member</option>
                    <option value="co_lead">Co-Lead</option>
                    <option value="lead">Lead</option>
                  </select>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
                  <p className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Invite link expires in 7 days
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowInviteModal(false);
                      resetInviteForm();
                    }}
                    className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendInvite}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Send size={16} />
                    <span>Send Invite</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Members Modal */}
      {showBulkAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Bulk Add Members</h2>
                <button
                  onClick={() => {
                    setShowBulkAddModal(false);
                    setBulkSelectedUsers([]);
                    setBulkRole('member');
                  }}
                  className="p-2 hover:bg-muted rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Select multiple users to add to {selectedTeam?.name}
              </p>
            </div>

            <div className="p-4 border-b border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {bulkSelectedUsers.length} selected
                  </span>
                  <button
                    onClick={selectAllAvailableUsers}
                    className="text-xs text-primary hover:underline"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearBulkSelection}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-muted-foreground">Role:</label>
                  <select
                    value={bulkRole}
                    onChange={(e) => setBulkRole(e.target.value as any)}
                    className="text-sm px-2 py-1 bg-background border border-border rounded"
                  >
                    <option value="member">Member</option>
                    <option value="co_lead">Co-Lead</option>
                    <option value="lead">Lead</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {availableForTeam.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium mb-1">All users are already in this team</p>
                  <p className="text-sm">{teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''} currently in team</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Show existing members as disabled */}
                  {teamMembers.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">Already in team ({teamMembers.length})</p>
                      {teamMembers.map(member => (
                        <div
                          key={member.id}
                          className="flex items-center p-3 rounded-lg border border-border bg-muted/30 opacity-50 mb-1"
                        >
                          <input
                            type="checkbox"
                            checked={true}
                            disabled={true}
                            className="w-4 h-4 rounded border-border"
                          />
                          <div className="ml-3 flex-1">
                            <p className="font-medium text-muted-foreground">
                              {member.admin_user?.display_name || member.admin_user?.email || 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.admin_user?.email} • {member.role.replace('_', ' ')}
                            </p>
                          </div>
                          <span className="text-xs bg-muted px-2 py-1 rounded">In team</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Show available users */}
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Available to add ({availableForTeam.length})</p>
                  {availableForTeam.map(admin => (
                    <label
                      key={admin.id}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                        bulkSelectedUsers.includes(admin.id)
                          ? 'bg-primary/10 border-primary'
                          : 'bg-background border-border hover:bg-muted'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={bulkSelectedUsers.includes(admin.id)}
                        onChange={() => toggleBulkUserSelection(admin.id)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <div className="ml-3 flex-1">
                        <p className="font-medium text-foreground">
                          {admin.display_name || admin.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {admin.email} • {admin.role}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border bg-muted/30">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowBulkAddModal(false);
                    setBulkSelectedUsers([]);
                    setBulkRole('member');
                  }}
                  className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAddMembers}
                  disabled={bulkSelectedUsers.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  <Users size={16} />
                  <span>Add {bulkSelectedUsers.length} Member{bulkSelectedUsers.length !== 1 ? 's' : ''}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">New Announcement</h2>
                <button
                  onClick={() => {
                    setShowAnnouncementModal(false);
                    resetAnnouncementForm();
                  }}
                  className="p-2 hover:bg-muted rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    placeholder="Announcement title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Message *
                  </label>
                  <textarea
                    value={announcementForm.message}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    rows={4}
                    placeholder="What do you want to announce?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Priority
                    </label>
                    <select
                      value={announcementForm.priority}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value as any })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={announcementForm.is_pinned}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, is_pinned: e.target.checked })}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">Pin announcement</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Schedule for later (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={announcementForm.scheduled_for}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, scheduled_for: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to post immediately
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowAnnouncementModal(false);
                      resetAnnouncementForm();
                    }}
                    className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateAnnouncement}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Megaphone size={16} />
                    <span>{announcementForm.scheduled_for ? 'Schedule' : 'Post'} Announcement</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Member Modal */}
      {showTransferModal && transferringMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Transfer Member</h2>
                <button
                  onClick={() => {
                    setShowTransferModal(false);
                    setTransferringMember(null);
                    setTransferTargetTeam('');
                  }}
                  className="p-2 hover:bg-muted rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Transferring:</p>
                  <p className="font-medium text-foreground">
                    {transferringMember.admin_user?.display_name || transferringMember.admin_user?.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    From: {selectedTeam?.name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Transfer to Team *
                  </label>
                  <select
                    value={transferTargetTeam}
                    onChange={(e) => setTransferTargetTeam(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  >
                    <option value="">Select target team</option>
                    {teams
                      .filter(t => t.id !== selectedTeam?.id)
                      .map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                  </select>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                  <p>The member will be removed from the current team and added to the selected team with the same role ({transferringMember.role.replace('_', ' ')}).</p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowTransferModal(false);
                      setTransferringMember(null);
                      setTransferTargetTeam('');
                    }}
                    className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTransferMember}
                    disabled={!transferTargetTeam}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <ArrowRightLeft size={16} />
                    <span>Transfer</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminTeams;
