import { supabase } from '@/lib/supabase';
import { AuditService, type AuditActionType } from './auditService';

// Types
export interface MediaFolder {
  id: string;
  name: string;
  parent_id?: string;
  path: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  created_by_user?: {
    email: string;
    role: string;
  };
  item_count?: number;
  subfolder_count?: number;
}

export interface MediaFile {
  id: string;
  name: string;
  original_name: string;
  file_type: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other';
  mime_type: string;
  file_size: number;
  file_path: string;
  thumbnail_path?: string;
  folder_id?: string;
  uploaded_by: string;
  width?: number;
  height?: number;
  duration?: number;
  is_starred: boolean;
  is_public: boolean;
  alt_text?: string;
  description?: string;
  tags: string[];
  seo_title?: string;
  seo_description?: string;
  created_at: string;
  updated_at: string;
  uploaded_by_user?: {
    email: string;
    role: string;
  };
  folder?: {
    name: string;
    path: string;
  };
}

export interface MediaStats {
  total_files: number;
  total_folders: number;
  total_size: number;
  starred_files: number;
  public_files: number;
  files_by_type: Record<string, number>;
  recent_uploads: number;
}

export interface MediaFilters {
  search?: string;
  file_type?: string;
  folder_id?: string;
  is_starred?: boolean;
  is_public?: boolean;
  uploaded_by?: string;
  date_from?: string;
  date_to?: string;
}

export class MediaService {
  // FOLDERS
  static async getFolders(parentId?: string): Promise<MediaFolder[]> {
    try {
      let query = supabase
        .from('media_folders')
        .select(`
          *,
          created_by_user:admin_users!media_folders_created_by_fkey(email, role)
        `)
        .order('name');

      if (parentId === 'root' || !parentId) {
        query = query.is('parent_id', null);
      } else {
        query = query.eq('parent_id', parentId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get item counts for each folder
      const enrichedData = await Promise.all(
        (data || []).map(async (folder) => {
          const [filesCount, subfoldersCount] = await Promise.all([
            supabase
              .from('media_files')
              .select('id', { count: 'exact' })
              .eq('folder_id', folder.id),
            supabase
              .from('media_folders')
              .select('id', { count: 'exact' })
              .eq('parent_id', folder.id)
          ]);

          return {
            ...folder,
            item_count: (filesCount.count || 0) + (subfoldersCount.count || 0),
            subfolder_count: subfoldersCount.count || 0
          };
        })
      );

      return enrichedData;
    } catch (error) {
      return [];
    }
  }

  static async createFolder(
    name: string,
    parentId?: string,
    description?: string,
    createdBy?: string
  ): Promise<MediaFolder | null> {
    try {
      const { data, error } = await supabase
        .from('media_folders')
        .insert({
          name,
          parent_id: parentId === 'root' ? null : parentId,
          description,
          created_by: createdBy
        })
        .select(`
          *,
          created_by_user:admin_users!media_folders_created_by_fkey(email, role)
        `)
        .single();

      if (error) throw error;

      // Log the action
      if (createdBy) {
        await AuditService.logAction(
          createdBy,
          'create_media_folder',
          undefined,
          {
            description: `Created media folder: ${name}`,
            folder_name: name,
            parent_id: parentId
          }
        );
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  static async updateFolder(
    id: string,
    updates: Partial<MediaFolder>,
    userId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('media_folders')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Log the action
      await AuditService.logAction(
        userId,
        'update_media_folder',
        undefined,
        {
          description: `Updated media folder: ${updates.name || 'Unknown'}`,
          folder_id: id,
          changes: updates
        }
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  static async deleteFolder(id: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('media_folders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log the action
      await AuditService.logAction(
        userId,
        'delete_media_folder',
        undefined,
        {
          description: 'Deleted media folder',
          folder_id: id
        }
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  // FILES
  static async getFiles(filters?: MediaFilters): Promise<MediaFile[]> {
    try {
      let query = supabase
        .from('media_files')
        .select(`
          *,
          uploaded_by_user:admin_users!media_files_uploaded_by_fkey(email, role),
          folder:media_folders!media_files_folder_id_fkey(name, path)
        `)
        .order('created_at', { ascending: false });

      if (filters?.folder_id) {
        if (filters.folder_id === 'root') {
          query = query.is('folder_id', null);
        } else {
          query = query.eq('folder_id', filters.folder_id);
        }
      }

      if (filters?.file_type && filters.file_type !== 'all') {
        query = query.eq('file_type', filters.file_type);
      }

      if (filters?.is_starred !== undefined) {
        query = query.eq('is_starred', filters.is_starred);
      }

      if (filters?.is_public !== undefined) {
        query = query.eq('is_public', filters.is_public);
      }

      if (filters?.uploaded_by) {
        query = query.eq('uploaded_by', filters.uploaded_by);
      }

      if (filters?.search) {
        query = query.or(`
          name.ilike.%${filters.search}%,
          original_name.ilike.%${filters.search}%,
          description.ilike.%${filters.search}%,
          alt_text.ilike.%${filters.search}%
        `);
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      return [];
    }
  }

  static async uploadFile(
    file: File,
    folderId?: string,
    uploadedBy?: string,
    metadata?: {
      alt_text?: string;
      description?: string;
      tags?: string[];
      is_public?: boolean;
    }
  ): Promise<MediaFile | null> {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `media/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get file type from mime type
      const fileType = this.getFileTypeFromMime(file.type);

      // Create database record
      const { data, error } = await supabase
        .from('media_files')
        .insert({
          name: fileName,
          original_name: file.name,
          file_type: fileType,
          mime_type: file.type,
          file_size: file.size,
          file_path: uploadData.path,
          folder_id: folderId === 'root' ? null : folderId,
          uploaded_by: uploadedBy,
          is_starred: false,
          is_public: metadata?.is_public || false,
          alt_text: metadata?.alt_text,
          description: metadata?.description,
          tags: metadata?.tags || []
        })
        .select(`
          *,
          uploaded_by_user:admin_users!media_files_uploaded_by_fkey(email, role),
          folder:media_folders!media_files_folder_id_fkey(name, path)
        `)
        .single();

      if (error) throw error;

      // Log the action
      if (uploadedBy) {
        await AuditService.logAction(
          uploadedBy,
          'upload_media_file',
          undefined,
          {
            description: `Uploaded file: ${file.name}`,
            file_name: file.name,
            file_type: fileType,
            file_size: file.size,
            folder_id: folderId
          }
        );
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  static async updateFile(
    id: string,
    updates: Partial<MediaFile>,
    userId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('media_files')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Log the action
      await AuditService.logAction(
        userId,
        'update_media_file',
        undefined,
        {
          description: `Updated media file: ${updates.name || 'Unknown'}`,
          file_id: id,
          changes: updates
        }
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  static async deleteFile(id: string, userId: string): Promise<boolean> {
    try {
      // Get file info first
      const { data: file } = await supabase
        .from('media_files')
        .select('file_path, name')
        .eq('id', id)
        .single();

      if (file) {
        // Delete from storage
        await supabase.storage
          .from('media')
          .remove([file.file_path]);
      }

      // Delete from database
      const { error } = await supabase
        .from('media_files')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log the action
      await AuditService.logAction(
        userId,
        'delete_media_file',
        undefined,
        {
          description: `Deleted media file: ${file?.name || 'Unknown'}`,
          file_id: id
        }
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  static async toggleStar(id: string, userId: string): Promise<boolean> {
    try {
      // Get current starred status
      const { data: currentFile } = await supabase
        .from('media_files')
        .select('is_starred, name')
        .eq('id', id)
        .single();

      if (!currentFile) return false;

      const newStarredStatus = !currentFile.is_starred;

      const { error } = await supabase
        .from('media_files')
        .update({ is_starred: newStarredStatus })
        .eq('id', id);

      if (error) throw error;

      // Log the action
      await AuditService.logAction(
        userId,
        'update_media_file',
        undefined,
        {
          description: `${newStarredStatus ? 'Starred' : 'Unstarred'} file: ${currentFile.name}`,
          file_id: id,
          action: newStarredStatus ? 'star' : 'unstar'
        }
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  // STATISTICS
  static async getMediaStats(): Promise<MediaStats> {
    try {
      const [
        filesResult,
        foldersResult,
        starredResult,
        publicResult,
        recentResult,
        typeResults
      ] = await Promise.all([
        supabase.from('media_files').select('id', { count: 'exact' }),
        supabase.from('media_folders').select('id', { count: 'exact' }),
        supabase.from('media_files').select('id', { count: 'exact' }).eq('is_starred', true),
        supabase.from('media_files').select('id', { count: 'exact' }).eq('is_public', true),
        supabase.from('media_files').select('id', { count: 'exact' }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('media_files').select('file_type, file_size')
      ]);

      // Calculate total size
      const totalSize = typeResults.data?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0;

      // Calculate files by type
      const filesByType = typeResults.data?.reduce((acc, file) => {
        acc[file.file_type] = (acc[file.file_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        total_files: filesResult.count || 0,
        total_folders: foldersResult.count || 0,
        total_size: totalSize,
        starred_files: starredResult.count || 0,
        public_files: publicResult.count || 0,
        files_by_type: filesByType,
        recent_uploads: recentResult.count || 0
      };
    } catch (error) {
      return {
        total_files: 0,
        total_folders: 0,
        total_size: 0,
        starred_files: 0,
        public_files: 0,
        files_by_type: {},
        recent_uploads: 0
      };
    }
  }

  // UTILITY FUNCTIONS
  static getFileTypeFromMime(mimeType: string): MediaFile['file_type'] {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf' || 
        mimeType.includes('document') || 
        mimeType.includes('text/')) return 'document';
    if (mimeType.includes('zip') || 
        mimeType.includes('archive')) return 'archive';
    return 'other';
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static getFileUrl(filePath: string): string {
    const { data } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }

  static async copyFileUrl(filePath: string): Promise<string> {
    const url = this.getFileUrl(filePath);
    await navigator.clipboard.writeText(url);
    return url;
  }

  // SEARCH AND FILTERING
  static async searchFiles(query: string): Promise<MediaFile[]> {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .select(`
          *,
          uploaded_by_user:admin_users!media_files_uploaded_by_fkey(email, role),
          folder:media_folders!media_files_folder_id_fkey(name, path)
        `)
        .or(`
          name.ilike.%${query}%,
          original_name.ilike.%${query}%,
          description.ilike.%${query}%,
          alt_text.ilike.%${query}%
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  // BULK OPERATIONS
  static async bulkDelete(fileIds: string[], userId: string): Promise<boolean> {
    try {
      // Get file paths for storage deletion
      const { data: files } = await supabase
        .from('media_files')
        .select('file_path, name')
        .in('id', fileIds);

      // Delete from storage
      if (files && files.length > 0) {
        const filePaths = files.map(f => f.file_path);
        await supabase.storage
          .from('media')
          .remove(filePaths);
      }

      // Delete from database
      const { error } = await supabase
        .from('media_files')
        .delete()
        .in('id', fileIds);

      if (error) throw error;

      // Log the action
      await AuditService.logAction(
        userId,
        'bulk_delete_media_files',
        undefined,
        {
          description: `Bulk deleted ${fileIds.length} media files`,
          file_count: fileIds.length,
          file_ids: fileIds
        }
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  static async bulkUpdateTags(fileIds: string[], tags: string[], userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('media_files')
        .update({ tags })
        .in('id', fileIds);

      if (error) throw error;

      // Log the action
      await AuditService.logAction(
        userId,
        'bulk_update_media_tags',
        undefined,
        {
          description: `Updated tags for ${fileIds.length} files`,
          file_count: fileIds.length,
          tags
        }
      );

      return true;
    } catch (error) {
      return false;
    }
  }
}