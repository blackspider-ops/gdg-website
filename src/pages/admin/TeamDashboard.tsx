import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { 
  Users, Calendar, MessageCircle, Bell, TrendingUp, 
  DollarSign, Activity, ChevronRight, Clock, CheckCircle,
  FileText, ArrowLeft, Megaphone
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { TeamManagementService, type AdminTeam, type TeamAnnouncement } from '@/services/teamManagementService';
import { TeamStatisticsService, type TeamStats } from '@/services/teamStatisticsService';
import { TeamActivityService, type TeamActivity } from '@/services/teamActivityService';
import TeamChat from '@/components/admin/TeamChat';

const TeamDashboard = () => {
  const { isAuthenticated, currentAdmin, userTeams, isSuperAdmin, isAdmin } = useAdmin();
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  
  const [team, setTeam] = useState<AdminTeam | null>(null);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [announcements, setAnnouncements] = useState<TeamAnnouncement[]>([]);
  const [recentActivity, setRecentActivity] = useState<TeamActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'overview' | 'chat' | 'announcements'>('overview');

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check if user is a member of this team or is a super admin/admin
  const userTeam = userTeams.find(t => t.team_id === teamId);
  if (!userTeam && !isSuperAdmin && !isAdmin && teamId) {
    return <Navigate to="/admin" replace />;
  }

  useEffect(() => {
    if (teamId) {
      loadTeamData();
    }
  }, [teamId]);

  const loadTeamData = async () => {
    if (!teamId) return;
    setIsLoading(true);
    try {
      const [teamData, statsData, announcementsData, activityData] = await Promise.all([
        TeamManagementService.getTeamById(teamId),
        TeamStatisticsService.getTeamStats(teamId),
        TeamManagementService.getTeamAnnouncements(teamId, true),
        TeamActivityService.getTeamActivity(teamId, 10)
      ]);
      
      setTeam(teamData);
      setStats(statsData);
      setAnnouncements(announcementsData);
      setRecentActivity(activityData);
    } catch (error) {
      console.error('Failed to load team data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAnnouncementRead = async (announcementId: string) => {
    if (!currentAdmin) return;
    await TeamManagementService.markAnnouncementAsRead(announcementId, currentAdmin.id);
    setAnnouncements(prev =>
      prev.map(a => 
        a.id === announcementId 
          ? { ...a, read_by: [...(a.read_by || []), currentAdmin.id] }
          : a
      )
    );
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Team Dashboard" subtitle="Loading..." icon={Users}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!team) {
    return (
      <AdminLayout title="Team Dashboard" subtitle="Team not found" icon={Users}>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Team not found or you don't have access.</p>
          <button
            onClick={() => navigate('/admin')}
            className="mt-4 text-primary hover:underline"
          >
            Return to Dashboard
          </button>
        </div>
      </AdminLayout>
    );
  }

  const unreadAnnouncements = announcements.filter(
    a => currentAdmin && !a.read_by?.includes(currentAdmin.id)
  );

  return (
    <AdminLayout
      title={team.name}
      subtitle={team.description || 'Team Dashboard'}
      icon={Users}
      actions={
        <button
          onClick={() => navigate('/admin/teams')}
          className="flex items-center space-x-2 px-3 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft size={16} />
          <span>All Teams</span>
        </button>
      }
    >
      {/* Team Header */}
      <div 
        className="rounded-xl p-6 mb-6 text-white"
        style={{ backgroundColor: team.color }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{team.name}</h1>
              <p className="text-white/80">{team.description}</p>
              <p className="text-sm text-white/60 mt-1">
                Your role: <span className="capitalize font-medium">{userTeam?.role.replace('_', ' ')}</span>
              </p>
            </div>
          </div>
          {unreadAnnouncements.length > 0 && (
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <p className="text-sm font-medium">{unreadAnnouncements.length} unread announcement{unreadAnnouncements.length !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg w-fit">
        {(['overview', 'chat', 'announcements'] as const).map(section => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
              activeSection === section
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {section}
          </button>
        ))}
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Members</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.members}</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <MessageCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Messages (30d)</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.messagesCount}</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Megaphone className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Announcements</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.announcementsCount}</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Activity Score</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.activityScore}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Announcements */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground flex items-center">
                  <Bell className="w-4 h-4 mr-2" />
                  Recent Announcements
                </h3>
                <button
                  onClick={() => setActiveSection('announcements')}
                  className="text-sm text-primary hover:underline"
                >
                  View all
                </button>
              </div>
              {announcements.length === 0 ? (
                <p className="text-muted-foreground text-sm">No announcements yet</p>
              ) : (
                <div className="space-y-3">
                  {announcements.slice(0, 3).map(announcement => {
                    const isUnread = currentAdmin && !announcement.read_by?.includes(currentAdmin.id);
                    return (
                      <div
                        key={announcement.id}
                        className={`p-3 rounded-lg border ${isUnread ? 'bg-primary/5 border-primary/20' : 'bg-muted/50 border-border'}`}
                        onClick={() => isUnread && handleMarkAnnouncementRead(announcement.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-foreground text-sm">{announcement.title}</h4>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(announcement.priority)}`}>
                                {announcement.priority}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {announcement.message}
                            </p>
                          </div>
                          {isUnread && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatTimeAgo(announcement.created_at)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground flex items-center mb-4">
                <Activity className="w-4 h-4 mr-2" />
                Recent Activity
              </h3>
              {recentActivity.length === 0 ? (
                <p className="text-muted-foreground text-sm">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map(activity => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <div className={`mt-0.5 ${TeamActivityService.getActivityColor(activity.action)}`}>
                        <Activity className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">
                          {TeamActivityService.getActivityDescription(activity)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatTimeAgo(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => setActiveSection('chat')}
                className="flex items-center space-x-2 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Team Chat</span>
              </button>
              <button
                onClick={() => setActiveSection('announcements')}
                className="flex items-center space-x-2 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <Bell className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Announcements</span>
              </button>
              <button
                onClick={() => navigate('/admin/teams')}
                className="flex items-center space-x-2 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Team Settings</span>
              </button>
              <button
                onClick={() => navigate('/admin/finances')}
                className="flex items-center space-x-2 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Finances</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Section */}
      {activeSection === 'chat' && teamId && (
        <div className="bg-card rounded-xl border border-border">
          <TeamChat
            teamId={teamId}
            teamName={team.name}
            teamColor={team.color}
          />
        </div>
      )}

      {/* Announcements Section */}
      {activeSection === 'announcements' && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">All Announcements</h3>
          {announcements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No announcements yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map(announcement => {
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
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(announcement.priority)}`}>
                            {announcement.priority}
                          </span>
                          {announcement.team ? (
                            <span 
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: announcement.team.color + '20', color: announcement.team.color }}
                            >
                              {announcement.team.name}
                            </span>
                          ) : (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              Global
                            </span>
                          )}
                        </div>
                        <h4 className="font-medium text-foreground">{announcement.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{announcement.message}</p>
                        <div className="flex items-center space-x-4 mt-3 text-xs text-muted-foreground">
                          <span>By {announcement.author?.display_name || announcement.author?.email}</span>
                          <span>{formatTimeAgo(announcement.created_at)}</span>
                        </div>
                      </div>
                      {isUnread ? (
                        <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default TeamDashboard;
