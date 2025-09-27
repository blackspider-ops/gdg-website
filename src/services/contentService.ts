import { supabase } from '@/lib/supabase';
import { invalidateContentCache } from '@/utils/adminCacheUtils';

// Types for content management
export interface SiteSetting {
    id: string;
    key: string;
    value: any;
    description?: string;
    updated_at: string;
    updated_by?: string;
}

export interface PageContent {
    id: string;
    page_slug: string;
    section_key: string;
    content: any;
    is_active: boolean;
    order_index: number;
    updated_at: string;
    updated_by?: string;
}

export interface NavigationItem {
    id: string;
    label: string;
    href: string;
    icon?: string;
    order_index: number;
    is_active: boolean;
    parent_id?: string;
    updated_at: string;
    updated_by?: string;
}

export interface SocialLink {
    id: string;
    platform: string;
    url: string;
    icon: string;
    is_active: boolean;
    order_index: number;
    updated_at: string;
    updated_by?: string;
}

export interface FooterContent {
    id: string;
    section_key: string;
    content: any;
    is_active: boolean;
    order_index: number;
    updated_at: string;
    updated_by?: string;
}

export class ContentService {
    // Site Settings
    static async getSiteSettings(): Promise<SiteSetting[]> {
        const { data, error } = await supabase
            .from('site_settings')
            .select('*')
            .order('key');

        if (error) throw error;
        return data || [];
    }

    static async getSiteSetting(key: string): Promise<any> {
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('value')
                .eq('key', key)
                .single();

            if (error) {
                return null;
            }
            return data?.value;
        } catch (error) {
            return null;
        }
    }

    static async updateSiteSetting(key: string, value: any, adminId?: string): Promise<boolean> {
        const { error } = await supabase
            .from('site_settings')
            .upsert({
                key,
                value,
                updated_by: adminId,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'key'
            });

        if (!error) {
            // Invalidate cache after successful update
            await invalidateContentCache('siteSettings', { forceReload: false });
        }

        return !error;
    }

    // Page Content
    static async getPageContent(pageSlug: string): Promise<PageContent[]> {
        const { data, error } = await supabase
            .from('page_content')
            .select('*')
            .eq('page_slug', pageSlug)
            .eq('is_active', true)
            .order('order_index');

        if (error) throw error;
        return data || [];
    }

    static async getPageSection(pageSlug: string, sectionKey: string): Promise<any> {
        const { data, error } = await supabase
            .from('page_content')
            .select('content')
            .eq('page_slug', pageSlug)
            .eq('section_key', sectionKey)
            .eq('is_active', true)
            .single();

        if (error) return null;
        return data?.content;
    }

    static async updatePageContent(
        pageSlug: string,
        sectionKey: string,
        content: any,
        adminId?: string
    ): Promise<boolean> {
        const { error } = await supabase
            .from('page_content')
            .upsert({
                page_slug: pageSlug,
                section_key: sectionKey,
                content,
                is_active: true,
                order_index: 0,
                updated_by: adminId,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'page_slug,section_key'
            });

        if (!error) {
            // Invalidate cache after successful update
            await invalidateContentCache('pageContent', { forceReload: false });
        }

        return !error;
    }

    // Navigation
    static async getNavigationItems(): Promise<NavigationItem[]> {
        const { data, error } = await supabase
            .from('navigation_items')
            .select('*')
            .eq('is_active', true)
            .order('order_index');

        if (error) throw error;
        return data || [];
    }

    static async updateNavigationItem(item: Partial<NavigationItem>, adminId?: string): Promise<boolean> {
        const { error } = await supabase
            .from('navigation_items')
            .upsert({
                ...item,
                updated_by: adminId,
                updated_at: new Date().toISOString()
            });

        if (!error) {
            // Invalidate cache after successful update
            await invalidateContentCache('navigationItems', { forceReload: false });
        }

        return !error;
    }

    static async deleteNavigationItem(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('navigation_items')
            .delete()
            .eq('id', id);

        return !error;
    }

    // Social Links
    static async getSocialLinks(): Promise<SocialLink[]> {
        const { data, error } = await supabase
            .from('social_links')
            .select('*')
            .eq('is_active', true)
            .order('order_index');

        if (error) throw error;
        return data || [];
    }

    static async updateSocialLink(link: Partial<SocialLink>, adminId?: string): Promise<boolean> {
        const { error } = await supabase
            .from('social_links')
            .upsert({
                ...link,
                updated_by: adminId,
                updated_at: new Date().toISOString()
            });

        return !error;
    }

    // Footer Content
    static async getFooterContent(): Promise<FooterContent[]> {
        const { data, error } = await supabase
            .from('footer_content')
            .select('*')
            .eq('is_active', true)
            .order('order_index');

        if (error) throw error;
        return data || [];
    }

    static async getFooterSection(sectionKey: string): Promise<any> {
        const { data, error } = await supabase
            .from('footer_content')
            .select('content')
            .eq('section_key', sectionKey)
            .eq('is_active', true)
            .single();

        if (error) return null;
        return data?.content;
    }

    static async updateFooterContent(
        sectionKey: string,
        content: any,
        adminId?: string
    ): Promise<boolean> {
        const { error } = await supabase
            .from('footer_content')
            .upsert({
                section_key: sectionKey,
                content,
                is_active: true,
                order_index: 0,
                updated_by: adminId,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'section_key'
            });

        return !error;
    }

    // Events
    static async getEvents(): Promise<any[]> {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    static async createEvent(event: any, adminId?: string): Promise<boolean> {
        const { error } = await supabase
            .from('events')
            .insert({
                ...event,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

        if (!error) {
            // Invalidate cache after successful creation
            await invalidateContentCache('events', { forceReload: false });
        }

        return !error;
    }

    static async updateEvent(id: string, event: any, adminId?: string): Promise<boolean> {
        const { error } = await supabase
            .from('events')
            .update({
                ...event,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (!error) {
            // Invalidate cache after successful update
            await invalidateContentCache('events', { forceReload: false });
        }

        return !error;
    }

    static async deleteEvent(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', id);

        if (!error) {
            // Invalidate cache after successful deletion
            await invalidateContentCache('events', { forceReload: false });
        }

        return !error;
    }

    // Team Members
    static async getTeamMembers(): Promise<any[]> {
        const { data, error } = await supabase
            .from('team_members')
            .select('*')
            .eq('is_active', true)
            .order('order_index');

        if (error) throw error;
        return data || [];
    }

    static async updateTeamMember(member: any, adminId?: string): Promise<boolean> {
        const { error } = await supabase
            .from('team_members')
            .upsert({
                ...member,
                updated_at: new Date().toISOString()
            });

        if (!error) {
            // Invalidate cache after successful update
            await invalidateContentCache('team', { forceReload: false });
        }

        return !error;
    }

    // Projects
    static async getProjects(): Promise<any[]> {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    static async updateProject(project: any, adminId?: string): Promise<boolean> {
        const { error } = await supabase
            .from('projects')
            .upsert({
                ...project,
                updated_at: new Date().toISOString()
            });

        if (!error) {
            // Invalidate cache after successful update
            await invalidateContentCache('projects', { forceReload: false });
        }

        return !error;
    }

    // Sponsors
    static async getSponsors(): Promise<any[]> {
        const { data, error } = await supabase
            .from('sponsors')
            .select('*')
            .eq('is_active', true)
            .order('order_index');

        if (error) throw error;
        return data || [];
    }

    static async updateSponsor(sponsor: any, adminId?: string): Promise<boolean> {
        const { error } = await supabase
            .from('sponsors')
            .upsert({
                ...sponsor,
                updated_at: new Date().toISOString()
            });

        return !error;
    }

    // Admin Secret Code Management
    static async getAdminSecretCode(): Promise<string> {
        try {
            const code = await this.getSiteSetting('admin_secret_code');
            return code || 'gdg-secret@psu.edu'; // Default fallback
        } catch (error) {
            return 'gdg-secret@psu.edu'; // Default fallback
        }
    }

    static async updateAdminSecretCode(newCode: string, adminId?: string): Promise<boolean> {
        return await this.updateSiteSetting('admin_secret_code', newCode, adminId);
    }
}