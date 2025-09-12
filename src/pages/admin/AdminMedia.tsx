import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useDev } from '@/contexts/DevContext';
import { Navigate } from 'react-router-dom';
import {
  FolderOpen,
  Upload,
  Search,
  Filter,
  Grid3X3,
  List,
  Download,
  Trash2,
  Edit3,
  Eye,
  Copy,
  Image,
  FileText,
  Video,
  Music,
  Archive,
  Plus,
  FolderPlus,
  Star,
  Clock,
  User,
  HardDrive
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

const AdminMedia = () => {
  const { isAuthenticated, currentAdmin } = useAdmin();
  const { isDevelopmentMode, allowDirectAdminAccess } = useDev();
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedFolder, setSelectedFolder] = useState('root');
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);

  const canAccess = isAuthenticated || (isDevelopmentMode && allowDirectAdminAccess);

  // Force scroll to top when component mounts
  useEffect(() => {
    // Multiple approaches to ensure scroll to top works
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // Also try Lenis if available
      const lenis = (window as any).lenis;
      if (lenis && lenis.scrollTo) {
        lenis.scrollTo(0, { immediate: true });
      }
    };
    
    scrollToTop();
    // Also try after a short delay
    setTimeout(scrollToTop, 50);
    setTimeout(scrollToTop, 150);
  }, []);

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  // Mock data
  const folders = [
    { id: 1, name: 'Event Photos', parent: 'root', itemCount: 45, createdAt: '2024-08-15' },
    { id: 2, name: 'Sponsor Logos', parent: 'root', itemCount: 12, createdAt: '2024-07-20' },
    { id: 3, name: 'Member Photos', parent: 'root', itemCount: 28, createdAt: '2024-06-10' },
    { id: 4, name: 'Website Assets', parent: 'root', itemCount: 18, createdAt: '2024-05-25' },
    { id: 5, name: 'Documents', parent: 'root', itemCount: 33, createdAt: '2024-04-12' },
    { id: 6, name: 'Hackathon 2024', parent: 1, itemCount: 25, createdAt: '2024-08-01' },
    { id: 7, name: 'Workshop Photos', parent: 1, itemCount: 20, createdAt: '2024-07-15' }
  ];

  const files = [
    {
      id: 1,
      name: 'hackathon-banner-2024.jpg',
      type: 'image',
      size: '2.4 MB',
      folder: 1,
      uploadedBy: 'John Doe',
      uploadedAt: '2024-09-10T14:30:00Z',
      url: '/api/media/hackathon-banner-2024.jpg',
      thumbnail: '/api/media/thumbs/hackathon-banner-2024.jpg',
      isStarred: true,
      dimensions: '1920x1080'
    },
    {
      id: 2,
      name: 'microsoft-logo.png',
      type: 'image',
      size: '156 KB',
      folder: 2,
      uploadedBy: 'Jane Smith',
      uploadedAt: '2024-09-09T10:15:00Z',
      url: '/api/media/microsoft-logo.png',
      thumbnail: '/api/media/thumbs/microsoft-logo.png',
      isStarred: false,
      dimensions: '512x512'
    },
    {
      id: 3,
      name: 'member-handbook.pdf',
      type: 'document',
      size: '1.8 MB',
      folder: 5,
      uploadedBy: 'Mike Johnson',
      uploadedAt: '2024-09-08T16:45:00Z',
      url: '/api/media/member-handbook.pdf',
      isStarred: true
    },
    {
      id: 4,
      name: 'intro-video.mp4',
      type: 'video',
      size: '45.2 MB',
      folder: 4,
      uploadedBy: 'Sarah Wilson',
      uploadedAt: '2024-09-07T11:20:00Z',
      url: '/api/media/intro-video.mp4',
      thumbnail: '/api/media/thumbs/intro-video.jpg',
      isStarred: false,
      duration: '3:24'
    },
    {
      id: 5,
      name: 'team-photo-2024.jpg',
      type: 'image',
      size: '3.1 MB',
      folder: 3,
      uploadedBy: 'John Doe',
      uploadedAt: '2024-09-06T09:30:00Z',
      url: '/api/media/team-photo-2024.jpg',
      thumbnail: '/api/media/thumbs/team-photo-2024.jpg',
      isStarred: true,
      dimensions: '2048x1536'
    }
  ];

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image size={20} className="text-blue-500" />;
      case 'video': return <Video size={20} className="text-purple-500" />;
      case 'audio': return <Music size={20} className="text-green-500" />;
      case 'document': return <FileText size={20} className="text-red-500" />;
      case 'archive': return <Archive size={20} className="text-yellow-500" />;
      default: return <FileText size={20} className="text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (size: string) => {
    return size;
  };

  const currentFolderFiles = files.filter(file =>
    selectedFolder === 'root' ? true : file.folder === parseInt(selectedFolder)
  );

  const currentFolderSubfolders = folders.filter(folder =>
    selectedFolder === 'root' ? folder.parent === 'root' : folder.parent === parseInt(selectedFolder)
  );

  const mediaStats = [
    { label: 'Total Files', value: files.length.toString(), color: 'text-blue-500' },
    { label: 'Total Folders', value: folders.length.toString(), color: 'text-green-500' },
    { label: 'Storage Used', value: '156.8 MB', color: 'text-orange-500' },
    { label: 'Starred Items', value: files.filter(f => f.isStarred).length.toString(), color: 'text-yellow-500' },
  ];

  return (
    <AdminLayout
      title="Media Library"
      subtitle="Manage files, images, and documents"
      icon={FolderOpen}
      actions={
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateFolderModal(true)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <FolderPlus size={16} />
            <span>New Folder</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Upload size={16} />
            <span>Upload Files</span>
          </button>
        </div>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {mediaStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <HardDrive size={24} className={stat.color} />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search files and folders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

            <div className="flex items-center space-x-3">
              <Filter size={16} className="text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="all">All Files</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="document">Documents</option>
                <option value="starred">Starred</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      {selectedFolder !== 'root' && (
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <button
              onClick={() => setSelectedFolder('root')}
              className="hover:text-blue-600 transition-colors"
            >
              Root
            </button>
            <span>/</span>
            <span className="text-gray-900 font-medium">
              {folders.find(f => f.id === parseInt(selectedFolder))?.name}
            </span>
          </nav>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {viewMode === 'grid' ? (
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Folders */}
              {currentFolderSubfolders.map((folder) => (
                <div
                  key={`folder-${folder.id}`}
                  onClick={() => setSelectedFolder(folder.id.toString())}
                  className="group cursor-pointer p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col items-center text-center">
                    <FolderOpen size={32} className="text-blue-500 mb-2 group-hover:text-blue-600" />
                    <h3 className="font-medium text-gray-900 text-sm mb-1 truncate w-full">{folder.name}</h3>
                    <p className="text-xs text-gray-500">{folder.itemCount} items</p>
                  </div>
                </div>
              ))}

              {/* Files */}
              {currentFolderFiles.map((file) => (
                <div
                  key={`file-${file.id}`}
                  className="group relative p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col items-center text-center">
                    {file.type === 'image' ? (
                      <div className="w-16 h-16 mb-2 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={file.thumbnail}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 mb-2 rounded-lg bg-gray-100 flex items-center justify-center">
                        {getFileIcon(file.type)}
                      </div>
                    )}

                    <h3 className="font-medium text-gray-900 text-sm mb-1 truncate w-full">{file.name}</h3>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>

                    {file.isStarred && (
                      <Star size={12} className="absolute top-2 right-2 text-yellow-500 fill-current" />
                    )}
                  </div>

                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <button className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors">
                      <Eye size={16} className="text-gray-600" />
                    </button>
                    <button className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors">
                      <Download size={16} className="text-gray-600" />
                    </button>
                    <button className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors">
                      <Copy size={16} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {/* Table Header */}
            <div className="p-6 bg-gray-50">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                <div className="col-span-1">
                  <input type="checkbox" className="rounded border-gray-300" />
                </div>
                <div className="col-span-4">Name</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Size</div>
                <div className="col-span-2">Modified</div>
                <div className="col-span-1">Actions</div>
              </div>
            </div>

            {/* Folders */}
            {currentFolderSubfolders.map((folder) => (
              <div key={`folder-${folder.id}`} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-1">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </div>
                  <div className="col-span-4">
                    <div
                      onClick={() => setSelectedFolder(folder.id.toString())}
                      className="flex items-center space-x-3 cursor-pointer hover:text-blue-600"
                    >
                      <FolderOpen size={20} className="text-blue-500" />
                      <span className="font-medium text-gray-900">{folder.name}</span>
                    </div>
                  </div>
                  <div className="col-span-2 text-sm text-gray-600">Folder</div>
                  <div className="col-span-2 text-sm text-gray-600">{folder.itemCount} items</div>
                  <div className="col-span-2 text-sm text-gray-600">{formatDate(folder.createdAt)}</div>
                  <div className="col-span-1">
                    <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                      <Edit3 size={16} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Files */}
            {currentFolderFiles.map((file) => (
              <div key={`file-${file.id}`} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-1">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </div>
                  <div className="col-span-4">
                    <div className="flex items-center space-x-3">
                      {file.type === 'image' && file.thumbnail ? (
                        <img
                          src={file.thumbnail}
                          alt={file.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                      ) : (
                        getFileIcon(file.type)
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{file.name}</span>
                          {file.isStarred && <Star size={12} className="text-yellow-500 fill-current" />}
                        </div>
                        {file.dimensions && (
                          <div className="text-xs text-gray-500">{file.dimensions}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 text-sm text-gray-600 capitalize">{file.type}</div>
                  <div className="col-span-2 text-sm text-gray-600">{formatFileSize(file.size)}</div>
                  <div className="col-span-2 text-sm text-gray-600">{formatDate(file.uploadedAt)}</div>
                  <div className="col-span-1">
                    <div className="flex items-center space-x-1">
                      <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                        <Eye size={16} className="text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                        <Download size={16} className="text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-red-50 rounded transition-colors">
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Upload Files</h2>
            </div>

            <div className="p-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Drop files here or click to browse</h3>
                <p className="text-gray-600 mb-4">Support for images, videos, documents, and more</p>
                <input type="file" multiple className="hidden" id="file-upload" />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Choose Files
                </label>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload to Folder</label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900">
                  <option value="root">Root Directory</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Upload Files
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4 shadow-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create New Folder</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Folder Name</label>
                <input
                  type="text"
                  placeholder="Enter folder name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Parent Folder</label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900">
                  <option value="root">Root Directory</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowCreateFolderModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminMedia;