import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Navigate } from 'react-router-dom';
import {
    FileText,
    Download,
    Eye,
    RefreshCw,
    Search,
    File,
    Calendar,
    User,
    AlertCircle
} from 'lucide-react';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { 
    MediaService, 
    type MediaFile, 
    type MediaFolder
} from '@/services/mediaService';

const BlogEditorMedia: React.FC = () => {
    const { isAuthenticated, currentAdmin } = useAdmin();
    
    // State management
    const [isLoading, setIsLoading] = useState(true);
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [blogFolder, setBlogFolder] = useState<MediaFolder | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Authentication check
    if (!isAuthenticated || currentAdmin?.role !== 'blog_editor') {
        return <Navigate to="/" replace />;
    }

    useEffect(() => {
        loadBlogSubmissions();
    }, []);

    const loadBlogSubmissions = async () => {
        setIsLoading(true);
        try {
            // Find the blog-submissions folder
            const folders = await MediaService.getFolders();
            const blogSubmissionsFolder = folders.find(f => f.name === 'blog-submissions');
            
            if (blogSubmissionsFolder) {
                setBlogFolder(blogSubmissionsFolder);
                
                // Load files from the blog-submissions folder
                const blogFiles = await MediaService.getFiles({
                    folder_id: blogSubmissionsFolder.id,
                    search: searchTerm || undefined
                });
                
                setFiles(blogFiles);
            } else {
                // Create the folder if it doesn't exist
                const newFolder = await MediaService.createFolder(
                    'blog-submissions',
                    'root',
                    'Blog submission files from contact form',
                    currentAdmin?.id
                );
                
                if (newFolder) {
                    setBlogFolder(newFolder);
                    setFiles([]);
                }
            }
        } catch (error) {
            console.error('Error loading blog submissions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewFile = async (file: MediaFile) => {
        try {
            const signedUrl = await MediaService.getSignedFileUrl(file.file_path);
            const fileUrl = signedUrl || MediaService.getFileUrl(file.file_path);
            window.open(fileUrl, '_blank');
        } catch (error) {
            console.error('Error viewing file:', error);
        }
    };

    const handleDownloadFile = async (file: MediaFile) => {
        try {
            await MediaService.downloadFile(file.file_path, file.original_name);
        } catch (error) {
            console.error('Error downloading file:', error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const filteredFiles = files.filter(file => 
        searchTerm === '' || 
        file.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminPageWrapper pageName="Blog Submissions" pageTitle="Blog Submissions">
            <div className="min-h-screen bg-background pt-20">
                <div className="editorial-grid py-8">
                    {/* Header */}
                    <div className="col-span-12 flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                                <FileText size={20} className="text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="font-display text-2xl font-bold text-foreground">Blog Submissions</h1>
                                <p className="text-muted-foreground text-sm">
                                    Files submitted through the contact form for blog posts
                                </p>
                            </div>
                        </div>
                        
                        <button
                            onClick={loadBlogSubmissions}
                            disabled={isLoading}
                            className="flex items-center space-x-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                            <span>Refresh</span>
                        </button>
                    </div>

                    {/* Search */}
                    <div className="col-span-12 mb-6">
                        <div className="relative max-w-md">
                            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search submissions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gdg-blue bg-background text-foreground"
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="col-span-12">
                        {isLoading ? (
                            <div className="bg-card border border-border rounded-lg p-8 text-center">
                                <RefreshCw size={24} className="animate-spin mx-auto text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">Loading blog submissions...</p>
                            </div>
                        ) : filteredFiles.length === 0 ? (
                            <div className="bg-card border border-border rounded-lg p-8 text-center">
                                <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
                                <p className="text-muted-foreground">
                                    {searchTerm 
                                        ? 'No submissions match your search criteria.' 
                                        : 'Blog submissions from the contact form will appear here.'
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="bg-card border border-border rounded-lg overflow-hidden">
                                <div className="p-4 border-b border-border">
                                    <h3 className="font-semibold text-foreground">
                                        {filteredFiles.length} submission{filteredFiles.length !== 1 ? 's' : ''}
                                    </h3>
                                </div>
                                
                                <div className="divide-y divide-border">
                                    {filteredFiles.map((file) => (
                                        <div key={file.id} className="p-6 hover:bg-muted/30 transition-colors">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start space-x-4 flex-1">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                                            <FileText size={24} className="text-red-600" />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-foreground mb-1 truncate">
                                                            {file.original_name}
                                                        </h4>
                                                        
                                                        {file.description && (
                                                            <p className="text-sm text-muted-foreground mb-2">
                                                                {file.description}
                                                            </p>
                                                        )}
                                                        
                                                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                                            <div className="flex items-center space-x-1">
                                                                <Calendar size={12} />
                                                                <span>{formatDate(file.created_at)}</span>
                                                            </div>
                                                            
                                                            <div className="flex items-center space-x-1">
                                                                <File size={12} />
                                                                <span>{formatFileSize(file.file_size)}</span>
                                                            </div>
                                                            
                                                            {file.uploaded_by_user && (
                                                                <div className="flex items-center space-x-1">
                                                                    <User size={12} />
                                                                    <span>{file.uploaded_by_user.email}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {file.tags && file.tags.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {file.tags.map((tag) => (
                                                                    <span 
                                                                        key={tag}
                                                                        className="px-2 py-1 bg-gdg-blue/10 text-gdg-blue text-xs rounded-full"
                                                                    >
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center space-x-2 ml-4">
                                                    <button
                                                        onClick={() => handleViewFile(file)}
                                                        className="flex items-center space-x-1 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
                                                        title="View file"
                                                    >
                                                        <Eye size={14} />
                                                        <span>View</span>
                                                    </button>
                                                    
                                                    <button
                                                        onClick={() => handleDownloadFile(file)}
                                                        className="flex items-center space-x-1 px-3 py-2 text-sm bg-gdg-blue text-white rounded-lg hover:bg-gdg-blue/90 transition-colors"
                                                        title="Download file"
                                                    >
                                                        <Download size={14} />
                                                        <span>Download</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Info Box */}
                    <div className="col-span-12 mt-8">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-blue-900 mb-1">About Blog Submissions</h4>
                                    <p className="text-sm text-blue-700">
                                        These are files submitted through the contact form when users select "Blog Submission". 
                                        You can view and download these files to review potential blog content. 
                                        Contact the admin team to publish approved submissions.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminPageWrapper>
    );
};

export default BlogEditorMedia;