import { supabase } from '@/lib/supabase';

export interface Project {
  id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  image_url: string | null;
  github_url: string | null;
  demo_url: string | null;
  tech_stack: string[];
  category: string;
  status: string;
  difficulty_level: string;
  team_size: number;
  start_date: string | null;
  end_date: string | null;
  is_featured: boolean;
  is_open_source: boolean;
  tags: string[];
  stars_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  member_id: string;
  role: string;
  joined_at: string;
  is_active: boolean;
  member?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateProjectData {
  title: string;
  description?: string;
  short_description?: string;
  image_url?: string;
  github_url?: string;
  demo_url?: string;
  tech_stack: string[];
  category: string;
  status: string;
  difficulty_level: string;
  team_size: number;
  start_date?: string;
  end_date?: string;
  is_featured: boolean;
  is_open_source: boolean;
  tags: string[];
}

export interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  featured: number;
  categoryDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
  techStackUsage: Record<string, number>;
}

export class ProjectsService {
  static async getAllProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }

  // Alias for compatibility with existing code
  static async getProjects(): Promise<Project[]> {
    return this.getAllProjects();
  }

  static async getProjectById(id: string): Promise<Project | null> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  static async createProject(projectData: CreateProjectData): Promise<Project | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Clean up the data - convert empty strings to null for date fields
      const cleanedData = { ...projectData };
      if (cleanedData.start_date === '') cleanedData.start_date = undefined;
      if (cleanedData.end_date === '') cleanedData.end_date = undefined;
      
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          ...cleanedData,
          created_by: user?.id
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  static async updateProject(id: string, projectData: Partial<CreateProjectData>): Promise<Project | null> {
    try {
      // Clean up the data - convert empty strings to null for date fields
      const cleanedData = { ...projectData };
      if (cleanedData.start_date === '') cleanedData.start_date = undefined;
      if (cleanedData.end_date === '') cleanedData.end_date = undefined;
      
      const { data, error } = await supabase
        .from('projects')
        .update(cleanedData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // If it's a permission error, provide a more helpful message
        if (error.code === 'PGRST116' || error.message.includes('Cannot coerce')) {
          throw new Error('Permission denied: Unable to update project. Please check your admin permissions.');
        }
        
        throw new Error(`Database error: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  static async deleteProject(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) {
        // If it's a permission error, provide a more helpful message
        if (error.code === 'PGRST116' || error.message.includes('Cannot coerce')) {
          throw new Error('Permission denied: Unable to delete project. Please check your admin permissions.');
        }
        
        throw new Error(`Database error: ${error.message}`);
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  static async getProjectStats(): Promise<ProjectStats> {
    try {
      const projects = await this.getAllProjects();
      
      const stats: ProjectStats = {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        completed: projects.filter(p => p.status === 'completed').length,
        featured: projects.filter(p => p.is_featured).length,
        categoryDistribution: {},
        statusDistribution: {},
        techStackUsage: {}
      };

      // Calculate distributions
      projects.forEach(project => {
        // Category distribution
        stats.categoryDistribution[project.category] = 
          (stats.categoryDistribution[project.category] || 0) + 1;

        // Status distribution
        stats.statusDistribution[project.status] = 
          (stats.statusDistribution[project.status] || 0) + 1;

        // Tech stack usage
        project.tech_stack.forEach(tech => {
          stats.techStackUsage[tech] = (stats.techStackUsage[tech] || 0) + 1;
        });
      });

      return stats;
    } catch (error) {
      throw error;
    }
  }

  static async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          *,
          member:members(id, name, email)
        `)
        .eq('project_id', projectId)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      throw error;
    }
  }

  static async addProjectMember(projectId: string, memberId: string, role: string = 'contributor'): Promise<ProjectMember | null> {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .insert([{
          project_id: projectId,
          member_id: memberId,
          role
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  static async removeProjectMember(projectId: string, memberId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('member_id', memberId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Helper methods for common filters
  static async getProjectsByCategory(category: string): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      throw error;
    }
  }

  static async getFeaturedProjects(): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_featured', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      throw error;
    }
  }
}