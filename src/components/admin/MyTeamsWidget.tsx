import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Bell, MessageCircle, ChevronRight, Crown, Shield,
  User, Activity, TrendingUp
} from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { TeamManagementService, type TeamAnnouncement } from '@/services/teamManagementService';
import { TeamMessagingService } from '@/services/teamMessagingService';
import { TeamActivityService, type TeamActivity } from '@/services/teamActivityService';
import { TeamStatisticsService, type TeamStats } from '@/services/teamStatisticsService';

interface TeamWithStats {
  id: string;
  name: string;
  slug: string;
  color: string;
  role: string;
  unreadMessages: number;
  unreadAnnouncements: number;
  stats?: TeamStats;
}

const MyTeamsWidget: React.FC = () => {
  const { currentAdmin, userTeams } = useAdmin();
  const [teamsWithStats, setTeamsWithStats] = useState<TeamWithStats[]>([]);
  const [recentActivity, setRecentActivity] = useState<TeamActivity[]>([]);
  const [announcements, setAnnouncements] = useState<TeamAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentAdmin && userTeams.length > 0) {
      loadTeamData();
    } else {
      setIsLoading(false);
    }
  }, [currentAdmin, userTeams]);

  const loadTeamData = async () => {
    if (!currentAdmin) return;
    
    setIsLoading(true);
    try {
      const teamIds = userTeams.map(t => t.team_id);
      
      // Get unread message counts
      const unreadCounts = await TeamMessagingService.getUnreadCountsForTeams(
        teamIds,
        currentAdmin.id
      );

      // Get announcements for all teams
      const allAnnouncements: TeamAnnouncement[] = [];
      for (const teamId of teamIds) {
        const teamAnnouncements = await TeamManagementService.getTeamAnnouncements(teamId, false);
        allAnnouncements.push(...teamAnnouncements);
      }
      
      // Filter unread announcements
      const unreadAnnouncements = allAnnouncements.filter(
        a => !a.read_by?.includes(currentAdmin.id)
      );
      setAnnouncements(unreadAnnouncements.slice(0, 5));

      // Build teams with stats
      const teams: TeamWithStats[] = userTeams
        .filter(t => t.team)
        .map(t => ({
          id: t.team!.id,
          name: t.team!.name,
          slug: t.team!.slug,
          color: t.team!.color,
          role: t.role,
          unreadMessages: unreadCounts[t.team_id] || 0,
          unreadAnnouncements: unreadAnnouncements.filter(a => a.team_id === t.team_id).length
        }));

      setTeamsWithStats(teams);

      // Get recent activity
      const activity = await TeamActivityService.getUserTeamsActivity(teamIds, 10);
      setRecentActivity(activity);
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'lead': return <Crown className="w-3 h-3 text-yellow-500" />;
      case 'co_lead': return <Shield className="w-3 h-3 text-blue-500" />;
      default: return <User className="w-3 h-3 text-gray-500" />;
    }
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

  if (userTeams.length === 0) {
    return null; // Don't show widget if user has no teams
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center">
          <Users className="w-5 h-5 mr-2 text-primary" />
          My Teams
        </h3>
        <Link 
          to="/admin/teams"
          className="text-sm text-primary hover:underline flex items-center"
        >
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-muted rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Teams List */}
          <div className="space-y-2 mb-4">
            {teamsWithStats.map(team => (
              <Link
                key={team.id}
                to={`/admin/team/${team.id}`}
                className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: team.color + '20' }}
                  >
                    <Users className="w-4 h-4" style={{ color: team.color }} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-foreground text-sm">{team.name}</span>
                      {getRoleIcon(team.role)}
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">
                      {team.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {team.unreadMessages > 0 && (
                    <span className="flex items-center text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      {team.unreadMessages}
                    </span>
                  )}
                  {team.unreadAnnouncements > 0 && (
                    <span className="flex items-center text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                      <Bell className="w-3 h-3 mr-1" />
                      {team.unreadAnnouncements}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Unread Announcements */}
          {announcements.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                <Bell className="w-4 h-4 mr-1" />
                Unread Announcements
              </h4>
              <div className="space-y-2">
                {announcements.slice(0, 3).map(announcement => (
                  <div
                    key={announcement.id}
                    className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg"
                  >
                    <p className="text-sm font-medium text-yellow-800">{announcement.title}</p>
                    <p className="text-xs text-yellow-600 line-clamp-1">{announcement.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                <Activity className="w-4 h-4 mr-1" />
                Recent Activity
              </h4>
              <div className="space-y-2">
                {recentActivity.slice(0, 5).map(activity => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-2 text-xs"
                  >
                    <span className={TeamActivityService.getActivityColor(activity.action)}>
                      •
                    </span>
                    <span className="text-muted-foreground flex-1">
                      {TeamActivityService.getActivityDescription(activity)}
                    </span>
                    <span className="text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(activity.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyTeamsWidget;
