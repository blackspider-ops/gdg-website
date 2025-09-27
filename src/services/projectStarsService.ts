import { supabase } from '@/lib/supabase';

export interface ProjectStar {
  id: string;
  project_id: string;
  user_id: string | null;
  user_identifier: string | null;
  created_at: string;
}

export class ProjectStarsService {
  // Generate a unique identifier for anonymous users
  private static generateUserIdentifier(): string {
    const userAgent = navigator.userAgent;
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    
    // Create a hash-like identifier
    const identifier = btoa(`${userAgent}_${timestamp}_${random}`).substring(0, 32);
    return identifier;
  }

  // Get user identifier from localStorage or create new one
  private static getUserIdentifier(): string {
    let identifier = localStorage.getItem('gdg_user_identifier');
    if (!identifier) {
      identifier = this.generateUserIdentifier();
      localStorage.setItem('gdg_user_identifier', identifier);
    }
    return identifier;
  }

  // Check if user has starred a project
  static async hasUserStarredProject(projectId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('project_stars')
        .select('id')
        .eq('project_id', projectId);

      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        const userIdentifier = this.getUserIdentifier();
        query = query.eq('user_identifier', userIdentifier);
      }

      // Use .maybeSingle() instead of .single() to avoid 406 errors
      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Error checking if user starred project:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in hasUserStarredProject:', error);
      return false;
    }
  }

  // Star a project
  static async starProject(projectId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const starData: any = {
        project_id: projectId
      };

      if (user) {
        starData.user_id = user.id;
      } else {
        starData.user_identifier = this.getUserIdentifier();
      }

      const { error } = await supabase
        .from('project_stars')
        .insert([starData]);

      if (error) {
        console.error('Error starring project:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in starProject:', error);
      return false;
    }
  }

  // Unstar a project
  static async unstarProject(projectId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let deleteQuery = supabase
        .from('project_stars')
        .delete()
        .eq('project_id', projectId);

      if (user) {
        deleteQuery = deleteQuery.eq('user_id', user.id);
      } else {
        const userIdentifier = this.getUserIdentifier();
        deleteQuery = deleteQuery.eq('user_identifier', userIdentifier);
      }

      const { error } = await deleteQuery;

      if (error) {
        console.error('Error unstarring project:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in unstarProject:', error);
      return false;
    }
  }

  // Toggle star status
  static async toggleProjectStar(projectId: string): Promise<{ starred: boolean; success: boolean; newCount: number }> {
    try {
      const isStarred = await this.hasUserStarredProject(projectId);
      
      let success: boolean;
      if (isStarred) {
        success = await this.unstarProject(projectId);
      } else {
        success = await this.starProject(projectId);
      }

      // Get updated count with manual recalculation
      let newCount = 0;
      if (success) {
        newCount = await this.recalculateStarsCount(projectId);
      }

      return {
        starred: success ? !isStarred : isStarred,
        success,
        newCount
      };
    } catch (error) {
      console.error('Error in toggleProjectStar:', error);
      return { starred: false, success: false, newCount: 0 };
    }
  }

  // Get project stars count
  static async getProjectStarsCount(projectId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('stars_count')
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error getting project stars count:', error);
        return 0;
      }

      return data?.stars_count || 0;
    } catch (error) {
      console.error('Error in getProjectStarsCount:', error);
      return 0;
    }
  }

  // Manually recalculate and update star count (fallback if trigger fails)
  static async recalculateStarsCount(projectId: string): Promise<number> {
    try {
      // Count actual stars
      const { count, error: countError } = await supabase
        .from('project_stars')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      if (countError) {
        console.error('Error counting stars:', countError);
        return 0;
      }

      const actualCount = count || 0;

      // Update the project's star count
      const { error: updateError } = await supabase
        .from('projects')
        .update({ stars_count: actualCount })
        .eq('id', projectId);

      if (updateError) {
        console.error('Error updating star count:', updateError);
        return 0;
      }

      return actualCount;
    } catch (error) {
      console.error('Error in recalculateStarsCount:', error);
      return 0;
    }
  }

  // Get multiple projects' star status for current user
  static async getUserStarredProjects(projectIds: string[]): Promise<Record<string, boolean>> {
    try {
      if (projectIds.length === 0) return {};

      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('project_stars')
        .select('project_id')
        .in('project_id', projectIds);

      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        const userIdentifier = this.getUserIdentifier();
        query = query.eq('user_identifier', userIdentifier);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting user starred projects:', error);
        return {};
      }

      const starredProjects: Record<string, boolean> = {};
      projectIds.forEach(id => {
        starredProjects[id] = false;
      });

      data?.forEach(star => {
        starredProjects[star.project_id] = true;
      });

      return starredProjects;
    } catch (error) {
      console.error('Error in getUserStarredProjects:', error);
      return {};
    }
  }
}