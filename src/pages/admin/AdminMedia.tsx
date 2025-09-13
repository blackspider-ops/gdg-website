import React, { useState, useEffect, useRef } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Navigate } from 'react-router-dom';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import {
    Image,
    Upload,
    FolderPlus,
    Search,
    Filter,
    Grid3X3,
    List,
    Star,
    Download,
    Trash2,
    Edit3,
    Eye,
    Copy,
    Folder,
    File,
    Play,
    FileText,
    Archive,
    MoreHorizontal,
    RefreshCw,
    Plus,
    X,
    Save,
    AlertCircle,
    CheckCircle,
    Home,
    ChevronRight,
    Video,
    Music,
    Package
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
    MediaService, 
    type MediaFile, 
    type MediaFolder, 
    type MediaStats,
    type MediaFilters
} from '@/services/mediaService';
import { AuditService } from '@/services/auditService';

const AdminMedia: React.FC = () => {
    const { isAuthenticated, currentAdmin } = useAdmin();
    
    // State management
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Data state
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [folders, setFolders] = useState<MediaFolder[]>([]);
    const [stats, setStats] = useState<MediaStats>({
        total_files: 0,
        total_folders: 0,
        total_size: 0,
        starred_files: 0,
        public_files: 0,
        files_by_type: {},
        recent_uploads: 0
    });
    
    // Navigation state
    const [currentFolderId, setCurrentFolderId] = useState<string>('root');
    const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; name: string }>>([{ id: 'root', name: 'Media Library' }]);
    
    // Selection and filtering
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [showStarredOnly, setShowStarredOnly] = useState(false);
    
    // Form state
    const [folderForm, setFolderForm] = useState({ name: '', description: '' });
    const [editForm, setEditForm] = useState<Partial<MediaFile>>({});
    const [selectedItem, setSelectedItem] = useState<MediaFile | MediaFolder | null>(null);
    
    // File upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
    
    // Lock body scroll when modal is open
    useBodyScrollLock(showUploadModal || showCreateFolderModal || showEditModal || showDeleteModal);

    

    // Load data on component mount
    useEffect(() => {
        if (canAccess && currentAdmin) {
            loadAllData();
        }
    }, [canAccess, currentAdmin, currentFolderId]);

    // Force scroll to top when component mounts
    useEffect(() => {
        const scrollToTop = () => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;

            const lenis = (window as any).lenis;
            if (lenis && lenis.scrollTo) {
                lenis.scrollTo(0, { immediate: true });
            }
        };

        scrollToTop();
        setTimeout(scrollToTop, 50);
        setTimeout(scrollToTop, 150);
    }, []);

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // Data loading functions
    const loadAllData = async () => {
        setIsLoading(true);
        try {
            const filters: MediaFilters = {
                folder_id: currentFolderId,
                file_type: filterType === 'all' ? undefined : filterType,
                is_starred: showStarredOnly ? true : undefined,
                search: searchTerm || undefined
            };

            const [filesData, foldersData, statsData] = await Promise.all([
                MediaService.getFiles(filters),
                MediaService.getFolders(currentFolderId),
                MediaService.getMediaStats()
            ]);

            setFiles(filesData);
            setFolders(foldersData);
            setStats(statsData);

            // Log viewing action
            if (currentAdmin?.id) {
                await AuditService.logAction(
                    currentAdmin.id,
                    'view_media_library',
                    undefined,
                    {
                        description: 'Viewed media library',
                        folder_id: currentFolderId,
                        filters
                    }
                );
            }
        } catch (error) {
        } finally {
            setIsLoading(false);
        }
    };

    const refreshData = () => {
        loadAllData();
    };

    // Navigation functions
    const navigateToFolder = (folderId: string, folderName: string) => {
        setCurrentFolderId(folderId);
        if (folderId === 'root') {
            setBreadcrumbs([{ id: 'root', name: 'Media Library' }]);
        } else {
            setBreadcrumbs(prev => [...prev, { id: folderId, name: folderName }]);
        }
        setSelectedFiles([]);
    };

    const navigateToBreadcrumb = (index: number) => {
        const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
        setBreadcrumbs(newBreadcrumbs);
        const targetFolder = newBreadcrumbs[newBreadcrumbs.length - 1];
        setCurrentFolderId(targetFolder.id);
        setSelectedFiles([]);
    };

    // CRUD Functions
    const handleCreateFolder = async () => {
        if (!currentAdmin?.id || !folderForm.name.trim()) return;
        
        setIsSaving(true);
        try {
            const result = await MediaService.createFolder(
                folderForm.name.trim(),
                currentFolderId,
                folderForm.description.trim() || undefined,
                currentAdmin.id
            );
            
            if (result) {
                setShowCreateFolderModal(false);
                setFolderForm({ name: '', description: '' });
                await loadAllData();
            }
        } catch (error) {
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (uploadedFiles: FileList) => {
        if (!currentAdmin?.id || !uploadedFiles.length) return;
        
        setIsSaving(true);
        try {
            const uploadPromises = Array.from(uploadedFiles).map(async (file) => {
                return MediaService.uploadFile(
                    file,
                    currentFolderId,
                    currentAdmin.id,
                    {
                        is_public: false,
                        tags: []
                    }
                );
            });
            
            await Promise.all(uploadPromises);
            setShowUploadModal(false);
            await loadAllData();
        } catch (error) {
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (item: MediaFile | MediaFolder) => {
        setSelectedItem(item);
        if ('file_type' in item) {
            // It's a file
            setEditForm({
                name: item.name,
                alt_text: item.alt_text,
                description: item.description,
                tags: item.tags,
                is_public: item.is_public
            });
        } else {
            // It's a folder
            setFolderForm({
                name: item.name,
                description: item.description || ''
            });
        }
        setShowEditModal(true);
    };

    const handleUpdate = async () => {
        if (!selectedItem || !currentAdmin?.id) return;
        
        setIsSaving(true);
        try {
            let success = false;
            
            if ('file_type' in selectedItem) {
                // Update file
                success = await MediaService.updateFile(
                    selectedItem.id,
                    editForm,
                    currentAdmin.id
                );
            } else {
                // Update folder
                success = await MediaService.updateFolder(
                    selectedItem.id,
                    {
                        name: folderForm.name,
                        description: folderForm.description
                    },
                    currentAdmin.id
                );
            }
            
            if (success) {
                setShowEditModal(false);
                setSelectedItem(null);
                setEditForm({});
                setFolderForm({ name: '', description: '' });
                await loadAllData();
            }
        } catch (error) {
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedItem || !currentAdmin?.id) return;
        
        setIsSaving(true);
        try {
            let success = false;
            
            if ('file_type' in selectedItem) {
                // Delete file
                success = await MediaService.deleteFile(selectedItem.id, currentAdmin.id);
            } else {
                // Delete folder
                success = await MediaService.deleteFolder(selectedItem.id, currentAdmin.id);
            }
            
            if (success) {
                setShowDeleteModal(false);
                setSelectedItem(null);
                await loadAllData();
            }
        } catch (error) {
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleStar = async (fileId: string) => {
        if (!currentAdmin?.id) return;
        
        await MediaService.toggleStar(fileId, currentAdmin.id);
        await loadAllData();
    };

    const handleCopyUrl = async (filePath: string) => {
        try {
            await MediaService.copyFileUrl(filePath);
            // You could add a toast notification here
        } catch (error) {
        }
    };

    const openDeleteModal = (item: MediaFile | MediaFolder) => {
        setSelectedItem(item);
        setShowDeleteModal(true);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFileUpload(e.target.files);
        }
    };

    const toggleFileSelection = (fileId: string) => {
        setSelectedFiles(prev => 
            prev.includes(fileId) 
                ? prev.filter(id => id !== fileId)
                : [...prev, fileId]
        );
    };

    const selectAllFiles = () => {
        setSelectedFiles(files.map(f => f.id));
    };

    const clearSelection = () => {
        setSelectedFiles([]);
    };

    // Utility functions
    const getFileIcon = (fileType: string) => {
        switch (fileType) {
            case 'image': return <Image size={20} className="text-primary" />;
            case 'video': return <Video size={20} className="text-purple-600" />;
            case 'audio': return <Music size={20} className="text-green-600" />;
            case 'document': return <FileText size={20} className="text-red-600" />;
            case 'archive': return <Package size={20} className="text-yellow-600" />;
            default: return <File size={20} className="text-gray-600" />;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getItemName = (item: MediaFile | MediaFolder): string => {
        return item.name;
    };

    const mediaStatsData = [
        { 
            label: 'Total Files', 
            value: stats.total_files.toString(), 
            color: 'text-blue-500',
            icon: File
        },
        { 
            label: 'Storage Used', 
            value: MediaService.formatFileSize(stats.total_size), 
            color: 'text-green-500',
            icon: Archive
        },
        { 
            label: 'Folders', 
            value: stats.total_folders.toString(), 
            color: 'text-purple-500',
            icon: Folder
        },
        { 
            label: 'Recent Uploads', 
            value: stats.recent_uploads.toString(), 
            color: 'text-orange-500',
            icon: Upload
        },
    ];

    return (
        <AdminLayout
            title="Media Library"
            subtitle="Manage images, videos, documents and other media files"
            icon={Image}
            actions={
                <div className="flex items-center space-x-3">
                    <button
                        onClick={refreshData}
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-3 py-2 border border-border text-gray-300 rounded-lg hover:bg-muted transition-colors"
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                        <span>Refresh</span>
                    </button>
                    <button
                        onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                        className="flex items-center space-x-2 px-3 py-2 border border-border text-gray-300 rounded-lg hover:bg-muted transition-colors"
                    >
                        {viewMode === 'grid' ? <List size={16} /> : <Grid3X3 size={16} />}
                        <span>{viewMode === 'grid' ? 'List' : 'Grid'}</span>
                    </button>
                    <button
                        onClick={() => {
                            setFolderForm({ name: '', description: '' });
                            setShowCreateFolderModal(true);
                        }}
                        className="flex items-center space-x-2 px-3 py-2 border border-border text-gray-300 rounded-lg hover:bg-muted transition-colors"
                    >
                        <FolderPlus size={16} />
                        <span>New Folder</span>
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                    >
                        <Upload size={16} />
                        <span>Upload Files</span>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileInputChange}
                        className="hidden"
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                    />
                </div>
            }
        >
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {mediaStatsData.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="bg-card rounded-xl p-6 shadow-sm border border-border">
                            <div className="flex items-center justify-between mb-4">
                                <Icon size={24} className={stat.color} />
                            </div>
                            <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                            <div className="text-sm text-muted-foreground">{stat.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Breadcrumbs */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-4 mb-6">
                <nav className="flex items-center space-x-2 text-sm">
                    {breadcrumbs.map((crumb, index) => (
                        <React.Fragment key={crumb.id}>
                            <button
                                onClick={() => navigateToBreadcrumb(index)}
                                className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                                    index === breadcrumbs.length - 1
                                        ? 'text-blue-400 bg-blue-900/20'
                                        : 'text-muted-foreground hover:text-gray-300 hover:bg-gray-800'
                                }`}
                            >
                                {index === 0 ? <Home size={14} /> : <Folder size={14} />}
                                <span>{crumb.name}</span>
                            </button>
                            {index < breadcrumbs.length - 1 && (
                                <ChevronRight size={14} className="text-gray-600" />
                            )}
                        </React.Fragment>
                    ))}
                </nav>
            </div>

            {/* Search and Filters */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search media files..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    // Debounce search
                                    setTimeout(() => loadAllData(), 300);
                                }}
                                className="pl-10 pr-4 py-2 w-64 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                            />
                        </div>
                        
                        <select
                            value={filterType}
                            onChange={(e) => {
                                setFilterType(e.target.value);
                                loadAllData();
                            }}
                            className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                        >
                            <option value="all">All Types</option>
                            <option value="image">Images</option>
                            <option value="video">Videos</option>
                            <option value="audio">Audio</option>
                            <option value="document">Documents</option>
                            <option value="archive">Archives</option>
                        </select>

                        <button
                            onClick={() => {
                                setShowStarredOnly(!showStarredOnly);
                                loadAllData();
                            }}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                                showStarredOnly
                                    ? 'bg-yellow-600 text-foreground'
                                    : 'border border-border text-gray-300 hover:bg-muted'
                            }`}
                        >
                            <Star size={16} className={showStarredOnly ? 'fill-current' : ''} />
                            <span>Starred</span>
                        </button>
                    </div>
                    
                    {selectedFiles.length > 0 && (
                        <div className="flex items-center space-x-3">
                            <span className="text-sm text-muted-foreground">
                                {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                            </span>
                            <button 
                                onClick={selectAllFiles}
                                className="px-3 py-1 text-sm border border-border text-gray-300 rounded-lg hover:bg-muted transition-colors"
                            >
                                Select All
                            </button>
                            <button 
                                onClick={() => {
                                    // Bulk delete functionality
                                    if (window.confirm(`Delete ${selectedFiles.length} selected files?`)) {
                                        MediaService.bulkDelete(selectedFiles, currentAdmin?.id || '');
                                        clearSelection();
                                        loadAllData();
                                    }
                                }}
                                className="px-3 py-1 text-sm bg-red-600 text-foreground rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Delete Selected
                            </button>
                            <button 
                                onClick={clearSelection}
                                className="px-3 py-1 text-sm border border-border text-gray-300 rounded-lg hover:bg-muted transition-colors"
                            >
                                Clear Selection
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="bg-card rounded-xl shadow-sm border border-border">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <RefreshCw size={24} className="animate-spin mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Loading media library...</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                            {/* Folders */}
                            {folders.map((folder) => (
                                <div key={folder.id} className="group cursor-pointer">
                                    <div 
                                        className="relative bg-muted rounded-lg p-4 hover:bg-gray-800 transition-colors border border-border"
                                        onClick={() => navigateToFolder(folder.id, folder.name)}
                                    >
                                        <div className="flex flex-col items-center text-center">
                                            <Folder size={48} className="text-primary mb-3" />
                                            <h3 className="font-medium text-foreground text-sm mb-1 truncate w-full">{folder.name}</h3>
                                            <p className="text-xs text-muted-foreground">{folder.item_count || 0} items</p>
                                        </div>
                                        
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="flex items-center space-x-1">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEdit(folder);
                                                    }}
                                                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                                                    title="Edit folder"
                                                >
                                                    <Edit3 size={14} className="text-muted-foreground" />
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openDeleteModal(folder);
                                                    }}
                                                    className="p-1 hover:bg-red-900/20 rounded transition-colors"
                                                    title="Delete folder"
                                                >
                                                    <Trash2 size={14} className="text-red-400" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {/* Files */}
                            {files.map((file) => (
                                <div key={file.id} className="group cursor-pointer">
                                    <div className="relative bg-muted rounded-lg overflow-hidden hover:bg-gray-800 transition-colors border border-border">
                                        {file.file_type === 'image' ? (
                                            <div className="aspect-square">
                                                <img 
                                                    src={MediaService.getFileUrl(file.file_path)} 
                                                    alt={file.alt_text || file.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        // Fallback to icon if image fails to load
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="aspect-square flex items-center justify-center">
                                                {getFileIcon(file.file_type)}
                                            </div>
                                        )}
                                        
                                        <div className="p-3">
                                            <h3 className="font-medium text-foreground text-sm mb-1 truncate" title={file.original_name}>
                                                {file.original_name}
                                            </h3>
                                            <p className="text-xs text-muted-foreground">{MediaService.formatFileSize(file.file_size)}</p>
                                        </div>
                                        
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="flex items-center space-x-1">
                                                {file.is_starred && <Star size={14} className="text-yellow-500 fill-current" />}
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleStar(file.id);
                                                    }}
                                                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                                                    title={file.is_starred ? 'Unstar' : 'Star'}
                                                >
                                                    <Star size={14} className={`text-yellow-400 ${file.is_starred ? 'fill-current' : ''}`} />
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEdit(file);
                                                    }}
                                                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                                                    title="Edit file"
                                                >
                                                    <Edit3 size={14} className="text-muted-foreground" />
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openDeleteModal(file);
                                                    }}
                                                    className="p-1 hover:bg-red-900/20 rounded transition-colors"
                                                    title="Delete file"
                                                >
                                                    <Trash2 size={14} className="text-red-400" />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="absolute top-2 left-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedFiles.includes(file.id)}
                                                onChange={() => toggleFileSelection(file.id)}
                                                className="w-4 h-4 text-primary bg-card border border-border rounded focus:ring-blue-400 focus:ring-2"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {folders.length === 0 && files.length === 0 && (
                            <div className="text-center py-12">
                                <Folder size={48} className="mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium text-foreground mb-2">No files or folders</h3>
                                <p className="text-muted-foreground mb-4">This folder is empty. Upload some files or create a new folder to get started.</p>
                                <div className="flex items-center justify-center space-x-3">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center space-x-2 px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                    >
                                        <Upload size={16} />
                                        <span>Upload Files</span>
                                    </button>
                                    <button
                                        onClick={() => setShowCreateFolderModal(true)}
                                        className="flex items-center space-x-2 px-4 py-2 border border-border text-gray-300 rounded-lg hover:bg-muted transition-colors"
                                    >
                                        <FolderPlus size={16} />
                                        <span>Create Folder</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-3 px-6 font-medium text-foreground">
                                        <input
                                            type="checkbox"
                                            checked={selectedFiles.length === files.length && files.length > 0}
                                            onChange={selectedFiles.length === files.length ? clearSelection : selectAllFiles}
                                            className="w-4 h-4 text-primary bg-card border border-border rounded focus:ring-blue-400 focus:ring-2"
                                        />
                                    </th>
                                    <th className="text-left py-3 px-6 font-medium text-foreground">Name</th>
                                    <th className="text-left py-3 px-6 font-medium text-foreground">Type</th>
                                    <th className="text-left py-3 px-6 font-medium text-foreground">Size</th>
                                    <th className="text-left py-3 px-6 font-medium text-foreground">Modified</th>
                                    <th className="text-right py-3 px-6 font-medium text-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Folders */}
                                {folders.map((folder) => (
                                    <tr 
                                        key={folder.id} 
                                        className="border-b border-border hover:bg-muted cursor-pointer"
                                        onClick={() => navigateToFolder(folder.id, folder.name)}
                                    >
                                        <td className="py-4 px-6">
                                            <div className="w-4 h-4"></div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center space-x-3">
                                                <Folder size={20} className="text-primary" />
                                                <span className="font-medium text-foreground">{folder.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-sm text-muted-foreground">Folder</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-sm text-muted-foreground">{folder.item_count || 0} items</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-sm text-muted-foreground">{formatDate(folder.created_at)}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEdit(folder);
                                                    }}
                                                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-muted-foreground"
                                                    title="Edit folder"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openDeleteModal(folder);
                                                    }}
                                                    className="p-2 hover:bg-red-900/20 rounded-lg transition-colors text-red-400"
                                                    title="Delete folder"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                
                                {/* Files */}
                                {files.map((file) => (
                                    <tr key={file.id} className="border-b border-border hover:bg-muted">
                                        <td className="py-4 px-6">
                                            <input
                                                type="checkbox"
                                                checked={selectedFiles.includes(file.id)}
                                                onChange={() => toggleFileSelection(file.id)}
                                                className="w-4 h-4 text-primary bg-card border border-border rounded focus:ring-blue-400 focus:ring-2"
                                            />
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center space-x-3">
                                                {file.file_type === 'image' ? (
                                                    <img
                                                        src={MediaService.getFileUrl(file.file_path)}
                                                        alt={file.alt_text || file.name}
                                                        className="w-8 h-8 rounded object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    getFileIcon(file.file_type)
                                                )}
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-medium text-foreground">{file.original_name}</span>
                                                        {file.is_starred && <Star size={12} className="text-yellow-500 fill-current" />}
                                                    </div>
                                                    {file.description && (
                                                        <div className="text-xs text-muted-foreground">{file.description}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-sm text-muted-foreground capitalize">{file.file_type}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-sm text-muted-foreground">{MediaService.formatFileSize(file.file_size)}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-sm text-muted-foreground">{formatDate(file.created_at)}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button 
                                                    onClick={() => handleToggleStar(file.id)}
                                                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                                                    title={file.is_starred ? 'Unstar' : 'Star'}
                                                >
                                                    <Star size={16} className={`text-yellow-400 ${file.is_starred ? 'fill-current' : ''}`} />
                                                </button>
                                                <button 
                                                    onClick={() => window.open(MediaService.getFileUrl(file.file_path), '_blank')}
                                                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-muted-foreground"
                                                    title="View file"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleCopyUrl(file.file_path)}
                                                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-muted-foreground"
                                                    title="Copy URL"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        const link = document.createElement('a');
                                                        link.href = MediaService.getFileUrl(file.file_path);
                                                        link.download = file.original_name;
                                                        link.click();
                                                    }}
                                                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-muted-foreground"
                                                    title="Download file"
                                                >
                                                    <Download size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleEdit(file)}
                                                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-muted-foreground"
                                                    title="Edit file"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => openDeleteModal(file)}
                                                    className="p-2 hover:bg-red-900/20 rounded-lg transition-colors text-red-400"
                                                    title="Delete file"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-card/50">
                    <div className="bg-card rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl border border-border">
                        <div className="p-6 border-b border-border">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-foreground">Upload Files</h2>
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-muted-foreground" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div 
                                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const files = e.dataTransfer.files;
                                    if (files.length > 0) {
                                        handleFileUpload(files);
                                    }
                                }}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                <Upload size={48} className="mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium text-foreground mb-2">Drop files here or click to browse</h3>
                                <p className="text-muted-foreground mb-4">Support for images, videos, documents, and more</p>
                                <input 
                                    type="file" 
                                    multiple 
                                    className="hidden" 
                                    id="modal-file-upload"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            handleFileUpload(e.target.files);
                                        }
                                    }}
                                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                                />
                                <label
                                    htmlFor="modal-file-upload"
                                    className="inline-flex items-center px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
                                >
                                    Choose Files
                                </label>
                            </div>

                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Upload to Folder</label>
                                <select 
                                    value={currentFolderId}
                                    onChange={(e) => setCurrentFolderId(e.target.value)}
                                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                                >
                                    <option value="root">Root Directory</option>
                                    {folders.map((folder) => (
                                        <option key={folder.id} value={folder.id}>{folder.name}</option>
                                    ))}
                                </select>
                            </div>

                            {isSaving && (
                                <div className="mt-4 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <RefreshCw size={16} className="animate-spin text-blue-400" />
                                        <span className="text-blue-400">Uploading files...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-border flex items-center justify-end space-x-3">
                            <button
                                onClick={() => setShowUploadModal(false)}
                                disabled={isSaving}
                                className="px-4 py-2 border border-border text-gray-300 rounded-lg hover:bg-muted transition-colors font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Folder Modal */}
            {showCreateFolderModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-card/50">
                    <div className="bg-card rounded-xl w-full max-w-md mx-4 shadow-xl border border-border">
                        <div className="p-6 border-b border-border">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-foreground">Create New Folder</h2>
                                <button
                                    onClick={() => setShowCreateFolderModal(false)}
                                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-muted-foreground" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Folder Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter folder name"
                                    value={folderForm.name}
                                    onChange={(e) => setFolderForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
                                <textarea
                                    placeholder="Enter folder description"
                                    value={folderForm.description}
                                    onChange={(e) => setFolderForm(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Parent Folder</label>
                                <select 
                                    value={currentFolderId}
                                    onChange={(e) => setCurrentFolderId(e.target.value)}
                                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                                >
                                    <option value="root">Root Directory</option>
                                    {folders.map((folder) => (
                                        <option key={folder.id} value={folder.id}>{folder.name}</option>
                                    ))}
                                </select>
                            </div>

                            {isSaving && (
                                <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <RefreshCw size={16} className="animate-spin text-blue-400" />
                                        <span className="text-blue-400">Creating folder...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-border flex items-center justify-end space-x-3">
                            <button
                                onClick={() => setShowCreateFolderModal(false)}
                                disabled={isSaving}
                                className="px-4 py-2 border border-border text-gray-300 rounded-lg hover:bg-muted transition-colors font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleCreateFolder}
                                disabled={isSaving || !folderForm.name.trim()}
                                className="px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                            >
                                {isSaving ? 'Creating...' : 'Create Folder'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Edit Modal */}
            {showEditModal && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-card/50">
                    <div className="bg-card rounded-xl w-full max-w-md mx-4 shadow-xl border border-border">
                        <div className="p-6 border-b border-border">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-foreground">
                                    Edit {'file_type' in selectedItem ? 'File' : 'Folder'}
                                </h2>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-muted-foreground" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {'file_type' in selectedItem ? (
                                // File edit form
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">File Name</label>
                                        <input
                                            type="text"
                                            value={editForm.name || ''}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Alt Text</label>
                                        <input
                                            type="text"
                                            value={editForm.alt_text || ''}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, alt_text: e.target.value }))}
                                            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                        <textarea
                                            value={editForm.description || ''}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="is_public"
                                            checked={editForm.is_public || false}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, is_public: e.target.checked }))}
                                            className="w-4 h-4 text-primary bg-card border border-border rounded focus:ring-blue-400 focus:ring-2"
                                        />
                                        <label htmlFor="is_public" className="text-sm font-medium text-gray-300">
                                            Make file public
                                        </label>
                                    </div>
                                </>
                            ) : (
                                // Folder edit form
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Folder Name</label>
                                        <input
                                            type="text"
                                            value={folderForm.name}
                                            onChange={(e) => setFolderForm(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                        <textarea
                                            value={folderForm.description}
                                            onChange={(e) => setFolderForm(prev => ({ ...prev, description: e.target.value }))}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-card text-foreground"
                                        />
                                    </div>
                                </>
                            )}

                            {isSaving && (
                                <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <RefreshCw size={16} className="animate-spin text-blue-400" />
                                        <span className="text-blue-400">Saving changes...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-border flex items-center justify-end space-x-3">
                            <button
                                onClick={() => setShowEditModal(false)}
                                disabled={isSaving}
                                className="px-4 py-2 border border-border text-gray-300 rounded-lg hover:bg-muted transition-colors font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleUpdate}
                                disabled={isSaving}
                                className="px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-card/50">
                    <div className="bg-card rounded-xl w-full max-w-md mx-4 shadow-xl border border-border">
                        <div className="p-6 border-b border-border">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-foreground">
                                    Delete {'file_type' in selectedItem ? 'File' : 'Folder'}
                                </h2>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-muted-foreground" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <AlertCircle size={24} className="text-red-500" />
                                <div>
                                    <h3 className="text-lg font-medium text-foreground">Are you sure?</h3>
                                    <p className="text-muted-foreground">This action cannot be undone.</p>
                                </div>
                            </div>
                            
                            <p className="text-gray-300 mb-4">
                                You are about to delete <strong>{getItemName(selectedItem)}</strong>.
                                {'file_type' in selectedItem ? 
                                    ' This will permanently remove the file from storage.' :
                                    ' This will also delete all files and subfolders within it.'
                                }
                            </p>

                            {isSaving && (
                                <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <RefreshCw size={16} className="animate-spin text-red-400" />
                                        <span className="text-red-400">Deleting...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-border flex items-center justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isSaving}
                                className="px-4 py-2 border border-border text-gray-300 rounded-lg hover:bg-muted transition-colors font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleDelete}
                                disabled={isSaving}
                                className="px-4 py-2 bg-red-600 text-foreground rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                            >
                                {isSaving ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminMedia;