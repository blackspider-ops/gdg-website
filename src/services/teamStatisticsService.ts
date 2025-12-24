import { supabase } from '@/lib/supabase';

export interface TeamStatistic {
  id: string;
  team_id: string;
  stat_type: string;
  stat_period: 'daily' | 'weekly' | 'monthly' | 'all_time';
  stat_date: string;
  stat_value: number;
  created_at: string;
  updated_at: string;
}

export interface TeamStats {
  members: number;
  eventsCreated: number;
  postsPublished: number;
  messagesCount: number;
  announcementsCount: number;
  financesTotal: number;
  activityScore: number;
}

export class TeamStatisticsService {
  /**
   * Get comprehensive stats for a team
   */
  static async getTeamStats(teamId: string): Promise<TeamStats> {
    try {
      // Get member count
      const { count: memberCount } = await supabase
        .from('team_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('is_active', true);

      // Get messages count (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: messagesCount } = await supabase
        .from('team_messages')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('is_deleted', false)
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Get announcements count
      const { count: announcementsCount } = await supabase
        .from('team_announcements')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('is_active', true);

      // Get finances total
      const { data: finances } = await supabase
        .from('finances')
        .select('amount, transaction_type')
        .eq('team_id', teamId)
        .eq('status', 'completed');

      const financesTotal = (finances || []).reduce((sum, f) => {
        if (f.transaction_type === 'income') return sum + Number(f.amount);
        if (f.transaction_type === 'expense') return sum - Number(f.amount);
        return sum;
      }, 0);

      // Calculate activity score (simple formula)
      const activityScore = Math.min(100, 
        (memberCount || 0) * 10 + 
        (messagesCount || 0) * 2 + 
        (announcementsCount || 0) * 5
      );

      return {
        members: memberCount || 0,
        eventsCreated: 0, // Would need to track which team created which event
        postsPublished: 0, // Would need to track which team published which post
        messagesCount: messagesCount || 0,
        announcementsCount: announcementsCount || 0,
        financesTotal,
        activityScore
      };
    } catch (error) {
      console.error('Error fetching team stats:', error);
      return {
        members: 0,
        eventsCreated: 0,
        postsPublished: 0,
        messagesCount: 0,
        announcementsCount: 0,
        financesTotal: 0,
        activityScore: 0
      };
    }
  }

  /**
   * Get stats for all teams (for comparison)
   */
  static async getAllTeamsStats(): Promise<Record<string, TeamStats>> {
    try {
      const { data: teams } = await supabase
        .from('admin_teams')
        .select('id')
        .eq('is_active', true);

      const stats: Record<string, TeamStats> = {};
      
      for (const team of teams || []) {
        stats[team.id] = await this.getTeamStats(team.id);
      }

      return stats;
    } catch (error) {
      console.error('Error fetching all teams stats:', error);
      return {};
    }
  }

  /**
   * Record a statistic (for tracking over time)
   */
  static async recordStat(
    teamId: string,
    statType: string,
    value: number,
    period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'daily'
  ): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('team_statistics')
        .upsert({
          team_id: teamId,
          stat_type: statType,
          stat_period: period,
          stat_date: today,
          stat_value: value
        }, {
          onConflict: 'team_id,stat_type,stat_period,stat_date'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error recording stat:', error);
      return false;
    }
  }

  /**
   * Get historical stats for a team
   */
  static async getHistoricalStats(
    teamId: string,
    statType: string,
    days = 30
  ): Promise<Array<{ date: string; value: number }>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('team_statistics')
        .select('stat_date, stat_value')
        .eq('team_id', teamId)
        .eq('stat_type', statType)
        .eq('stat_period', 'daily')
        .gte('stat_date', startDate.toISOString().split('T')[0])
        .order('stat_date', { ascending: true });

      if (error) throw error;

      return (data || []).map(d => ({
        date: d.stat_date,
        value: d.stat_value
      }));
    } catch (error) {
      console.error('Error fetching historical stats:', error);
      return [];
    }
  }

  /**
   * Get team leaderboard
   */
  static async getTeamLeaderboard(
    metric: 'members' | 'activity' | 'messages' = 'activity'
  ): Promise<Array<{ teamId: string; teamName: string; value: number }>> {
    try {
      const { data: teams } = await supabase
        .from('admin_teams')
        .select('id, name')
        .eq('is_active', true);

      const leaderboard: Array<{ teamId: string; teamName: string; value: number }> = [];

      for (const team of teams || []) {
        const stats = await this.getTeamStats(team.id);
        let value = 0;

        switch (metric) {
          case 'members':
            value = stats.members;
            break;
          case 'activity':
            value = stats.activityScore;
            break;
          case 'messages':
            value = stats.messagesCount;
            break;
        }

        leaderboard.push({
          teamId: team.id,
          teamName: team.name,
          value
        });
      }

      return leaderboard.sort((a, b) => b.value - a.value);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }
}
