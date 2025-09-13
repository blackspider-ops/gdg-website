import { supabase } from '@/lib/supabase';

export interface Project {
  id: string;
  title: string;
  description: string;
  tech_stack: string[];
  github_url?: string;
  demo_url?: string;
  image_url?: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export class ProjectsService {
  static async getProjects(): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }

  static async getFeaturedProjects(): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_featured', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching featured projects:', error);
      return [];
    }
  }

  static async createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project | null> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...project,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating project:', error);
      return null;
    }
  }

  static async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating project:', error);
      return null;
    }
  }

  static async deleteProject(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  }

  static async getProjectStats() {
    try {
      const [totalProjects, featuredProjects] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact' }),
        supabase.from('projects').select('id', { count: 'exact' }).eq('is_featured', true)
      ]);

      // Get tech stack distribution
      const { data: techData } = await supabase
        .from('projects')
        .select('tech_stack');

      const techStats = techData?.reduce((acc, project) => {
        project.tech_stack.forEach((tech: string) => {
          acc[tech] = (acc[tech] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        total: totalProjects.count || 0,
        featured: featuredProjects.count || 0,
        techDistribution: techStats
      };
    } catch (error) {
      console.error('Error fetching project stats:', error);
      return {
        total: 0,
        featured: 0,
        techDistribution: {}
      };
    }
  }
}