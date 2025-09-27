import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Calendar,
  Tag,
  User,
  BarChart3,
  Search,
  Filter,
  Save,
  X,
  Image,
  Globe,
  Clock,
  Heart,
  Upload,
  Download,
  Check,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { BlogService, BlogPost, BlogCategory } from '@/services/blogService';
import { BlogSubmissionService, type BlogSubmission } from '@/services/blogSubmissionService';
import { AuditService } from '@/services/auditService';
import { supabase } from '@/lib/supabase';
import BlogPostModal from '@/components/admin/BlogPostModal';
import CategoryModal from '@/components/admin/CategoryModal';
import BlogAnalytics from '@/components/admin/BlogAnalytics';

const AdminBlog = () => {
  const { isAuthenticated, currentAdmin } = useAdmin();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'posts');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [submissions, setSubmissions] = useState<BlogSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showPostModal, setShowPostModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<BlogSubmission | null>(null);
  const [showChanges, setShowChanges] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [blogStats, setBlogStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    totalCategories: 0
  });

  // Load blog data
  useEffect(() => {
    loadBlogData();
  }, []);

  // Authentication check after all hooks
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Allow both admins and blog editors to access this page
  if (currentAdmin?.role !== 'admin' && currentAdmin?.role !== 'super_admin' && currentAdmin?.role !== 'blog_editor') {
    return <Navigate to="/" replace />;
  }

  const loadBlogData = async () => {
    setIsLoading(true);
    try {
      const [postsData, categoriesData, statsData, submissionsData] = await Promise.all([
        BlogService.getAllPosts(),
        BlogService.getAllCategories(),
        BlogService.getBlogStats(),
        BlogSubmissionService.getAllSubmissions()
      ]);
      
      setPosts(postsData);
      setCategories(categoriesData);
      setBlogStats(statsData);
      setSubmissions(submissionsData);
    } catch (error) {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  }; 
 // Filter posts based on search and filters
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || post.category_id === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleCreatePost = () => {
    setEditingPost(null);
    setShowPostModal(true);
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setShowPostModal(true);
  };

  const handleDeletePost = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      const success = await BlogService.deletePost(id);
      if (success) {
        await loadBlogData();
      }
    }
  };

  const handleApprovePost = async (id: string) => {
    if (window.confirm('Approve and publish this blog post?')) {
      const success = await BlogService.approvePost(id);
      if (success) {
        await loadBlogData();
      }
    }
  };

  const handleRejectPost = async (id: string) => {
    const reason = window.prompt('Reason for rejection (optional):');
    if (reason !== null) { // User didn't cancel
      const success = await BlogService.rejectPost(id, reason);
      if (success) {
        await loadBlogData();
      }
    }
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category: BlogCategory) => {
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      const success = await BlogService.deleteCategory(id);
      if (success) {
        await loadBlogData();
      }
    }
  };

  // Submission handlers
  const handleEditNotes = (submission: BlogSubmission) => {
    setSelectedSubmission(submission);
    setAdminNotes(submission.admin_notes || '');
    setShowSubmissionModal(true);
  };

  const handleSaveNotes = async (id: string) => {
    if (!currentAdmin?.id || !selectedSubmission) return;
    
    try {
      const success = await BlogSubmissionService.updateSubmissionStatus(id, selectedSubmission.status, adminNotes);
      
      if (success) {
        // Log the action in audit trail
        await AuditService.logAction(
          currentAdmin.id,
          'update_blog_submission',
          undefined,
          {
            description: `Updated notes for blog submission: ${selectedSubmission.original_name}`,
            submission_id: id,
            submitter_name: selectedSubmission.submitter_name,
            submitter_email: selectedSubmission.submitter_email,
            admin_notes: adminNotes
          }
        );
        
        await loadBlogData();
        setShowSubmissionModal(false);
        setSelectedSubmission(null);
        setAdminNotes('');
      }
    } catch (error) {
      // Handle error silently
    }
  };

  const handleDeleteSubmission = async (id: string) => {
    if (!currentAdmin?.id) return;
    
    const submission = submissions.find(s => s.id === id);
    if (!submission) return;
    
    if (window.confirm(`Are you sure you want to delete "${submission.original_name}"? This will permanently delete the file and cannot be undone.`)) {
      try {
        const success = await BlogSubmissionService.deleteSubmission(id);
        
        if (success) {
          // Log the action in audit trail
          await AuditService.logAction(
            currentAdmin.id,
            'delete_blog_submission',
            undefined,
            {
              description: `Deleted blog submission: ${submission.original_name}`,
              submission_id: id,
              submitter_name: submission.submitter_name,
              submitter_email: submission.submitter_email,
              file_name: submission.original_name
            }
          );
          
          await loadBlogData();
        }
      } catch (error) {
        // Handle error silently
      }
    }
  };

  const handleDownloadFile = async (submission: BlogSubmission) => {
    if (!currentAdmin?.id) return;
    
    try {
      // Get signed URL for secure download
      const { data, error } = await supabase.storage
        .from('blog-submissions')
        .createSignedUrl(submission.file_path, 3600); // 1 hour expiry

      if (error) throw error;

      // Create download link
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = submission.original_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Log the download action in audit trail
      await AuditService.logAction(
        currentAdmin.id,
        'download_blog_submission',
        undefined,
        {
          description: `Downloaded blog submission: ${submission.original_name}`,
          submission_id: submission.id,
          submitter_name: submission.submitter_name,
          submitter_email: submission.submitter_email,
          file_name: submission.original_name
        }
      );
    } catch (error) {
      // Fallback to public URL
      try {
        const { data } = supabase.storage
          .from('blog-submissions')
          .getPublicUrl(submission.file_path);

        const link = document.createElement('a');
        link.href = data.publicUrl;
        link.download = submission.original_name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackError) {
        // Handle error silently
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500/20 text-green-400';
      case 'draft': return 'bg-yellow-500/20 text-yellow-400';
      case 'archived': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };  return (

    <AdminLayout
      title="Blog Management"
      subtitle="Create and manage blog posts and categories"
      icon={FileText}
      actions={
        <div className="flex items-center space-x-3">
          {/* Back button for blog editors */}
          {currentAdmin?.role === 'blog_editor' && (
            <Link
              to="/admin/blog-editor"
              className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-medium text-muted-foreground"
            >
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </Link>
          )}
          
          {activeTab === 'posts' && (
            <button
              onClick={handleCreatePost}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <Plus size={16} />
              <span>New Post</span>
            </button>
          )}
          {activeTab === 'categories' && (
            <button
              onClick={handleCreateCategory}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <Plus size={16} />
              <span>New Category</span>
            </button>
          )}
        </div>
      }
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Posts</p>
              <p className="text-2xl font-bold text-foreground">{blogStats.totalPosts}</p>
            </div>
            <FileText className="text-primary" size={24} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Published</p>
              <p className="text-2xl font-bold text-green-400">{blogStats.publishedPosts}</p>
            </div>
            <Globe className="text-green-400" size={24} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Drafts</p>
              <p className="text-2xl font-bold text-yellow-400">{blogStats.draftPosts}</p>
            </div>
            <Edit3 className="text-yellow-400" size={24} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Views</p>
              <p className="text-2xl font-bold text-blue-400">{blogStats.totalViews}</p>
            </div>
            <Eye className="text-blue-400" size={24} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Likes</p>
              <p className="text-2xl font-bold text-red-400">{blogStats.totalLikes}</p>
            </div>
            <Heart className="text-red-400" size={24} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Categories</p>
              <p className="text-2xl font-bold text-purple-400">{blogStats.totalCategories}</p>
            </div>
            <Tag className="text-purple-400" size={24} />
          </div>
        </div>
      </div>      
{/* Tabs */}
      <div className="border-b border-border mb-8">
        <nav className="flex space-x-8">
          {[
            { id: 'posts', label: 'Blog Posts', icon: FileText },
            ...(currentAdmin?.role !== 'blog_editor' ? [
              { id: 'categories', label: 'Categories', icon: Tag },
              { id: 'submissions', label: 'Submissions', icon: Upload },
              { id: 'approvals', label: 'Approvals', icon: Clock }
            ] : []),
            { id: 'analytics', label: 'Analytics', icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>          {
/* Posts List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading blog posts...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No blog posts found</h3>
              <p className="text-muted-foreground mb-6">
                {posts.length === 0 ? 'Create your first blog post to get started.' : 'Try adjusting your search or filters.'}
              </p>
              {posts.length === 0 && (
                <button
                  onClick={handleCreatePost}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Create First Post
                </button>
              )}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Title</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Author</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Views</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Likes</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPosts.map((post) => (
                      <tr key={post.id} className="border-t border-border hover:bg-muted/30">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            {post.featured_image_url && (
                              <img
                                src={post.featured_image_url}
                                alt={post.title}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            )}
                            <div>
                              <h4 className="font-medium text-foreground">{post.title}</h4>
                              {post.is_featured && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400 mt-1">
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <User size={16} className="text-muted-foreground" />
                            <span className="text-foreground">{post.author_name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {post.category && (
                            <span 
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs"
                              style={{ 
                                backgroundColor: `${post.category.color}20`, 
                                color: post.category.color 
                              }}
                            >
                              {post.category.name}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusColor(post.status)}`}>
                            {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-1">
                            <Eye size={14} className="text-muted-foreground" />
                            <span className="text-foreground">{post.views_count || 0}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-1">
                            <Heart size={14} className="text-muted-foreground" />
                            <span className="text-foreground">{post.likes_count || 0}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-1">
                            <Calendar size={14} className="text-muted-foreground" />
                            <span className="text-foreground">
                              {post.published_at ? formatDate(post.published_at) : formatDate(post.created_at)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            {/* Blog editors can edit any post, but changes go to approval */}
                            <button
                              onClick={() => handleEditPost(post)}
                              className="p-2 text-muted-foreground hover:text-primary transition-colors"
                              title={currentAdmin?.role === 'blog_editor' ? 'Edit post (requires approval)' : 'Edit post'}
                            >
                              <Edit3 size={16} />
                            </button>
                            
                            {/* Blog editors cannot delete posts */}
                            {currentAdmin?.role !== 'blog_editor' && (
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="p-2 text-muted-foreground hover:text-red-400 transition-colors"
                                title="Delete post"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                            
                            {/* Show approval status for blog editor posts */}
                            {currentAdmin?.role !== 'blog_editor' && post.created_by !== currentAdmin?.id && post.requires_approval && (
                              <span className="px-2 py-1 text-xs bg-yellow-900/20 text-yellow-400 rounded">
                                Needs Approval
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}    
  {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <Tag size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No categories found</h3>
              <p className="text-muted-foreground mb-6">Create your first category to organize your blog posts.</p>
              <button
                onClick={handleCreateCategory}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Create First Category
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <div key={category.id} className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="p-1 text-muted-foreground hover:text-primary transition-colors"
                        title="Edit category"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-1 text-muted-foreground hover:text-red-400 transition-colors"
                        title="Delete category"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-foreground mb-2">{category.name}</h3>
                  {category.description && (
                    <p className="text-muted-foreground text-sm mb-4">{category.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {posts.filter(p => p.category_id === category.id).length} posts
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      category.is_active 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {category.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Blog Analytics</h3>
            <p className="text-muted-foreground mb-6">
              Detailed analytics coming soon! This will include post performance, 
              reader engagement, popular categories, and more insights.
            </p>
            
            <div className="border-t border-border pt-6">
              <h4 className="text-md font-semibold mb-3">Data Management</h4>
              <button
                onClick={async () => {
                  if (window.confirm('This will sync all blog post like counts with the authentic like system. Continue?')) {
                    try {
                      await BlogService.syncLikeCounts();
                      await loadBlogData(); // Refresh the data
                    } catch (error) {
                      // Silently handle sync errors
                    }
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sync Like Counts
              </button>
              <p className="text-xs text-muted-foreground mt-2">
                Synchronizes blog post like counts with the authentic like tracking system.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Tab */}
      {activeTab === 'submissions' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12">
              <Upload size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No submissions yet</h3>
              <p className="text-muted-foreground">Blog submissions will appear here when users submit them through the contact form.</p>
            </div>
          ) : (
            <div className="bg-card rounded-xl shadow-sm border border-border">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Blog Submissions ({submissions.length})</h3>
                <p className="text-sm text-muted-foreground mt-1">Manage files submitted through the contact form</p>
              </div>
              
              <div className="divide-y divide-border">
                {submissions.map((submission) => (
                  <div key={submission.id} className="p-6 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FileText size={20} className="text-primary" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-1">
                            <h4 className="font-medium text-foreground truncate">{submission.original_name}</h4>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                              {formatFileSize(submission.file_size)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>From: {submission.submitter_name}</span>
                            <span>•</span>
                            <span>{submission.submitter_email}</span>
                            <span>•</span>
                            <span>{formatDate(submission.created_at)}</span>
                          </div>
                          
                          {submission.admin_notes && (
                            <div className="mt-2 p-2 bg-blue-900/10 border border-blue-500/20 rounded text-sm">
                              <span className="text-blue-400 font-medium">Notes: </span>
                              <span className="text-foreground">{submission.admin_notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleDownloadFile(submission)}
                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                          title="Download file"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => handleEditNotes(submission)}
                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                          title="Edit notes"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteSubmission(submission.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete submission"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Notes Modal */}
      {showSubmissionModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-xl shadow-xl border border-border p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <FileText size={20} className="text-primary" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">Edit Notes</h3>
                <p className="text-sm text-muted-foreground">{selectedSubmission.original_name}</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Notes (Visible to all team members)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this submission..."
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-card text-foreground"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  These notes help team members collaborate and track the status of submissions.
                </p>
              </div>
              
              <div className="p-3 bg-muted rounded-lg text-sm">
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <span>Submitter:</span>
                  <span className="text-foreground">{selectedSubmission.submitter_name}</span>
                  <span>Email:</span>
                  <span className="text-foreground">{selectedSubmission.submitter_email}</span>
                  <span>Size:</span>
                  <span className="text-foreground">{formatFileSize(selectedSubmission.file_size)}</span>
                  <span>Submitted:</span>
                  <span className="text-foreground">{formatDate(selectedSubmission.created_at)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowSubmissionModal(false);
                  setSelectedSubmission(null);
                  setAdminNotes('');
                }}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveNotes(selectedSubmission.id)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Save size={16} />
                <span>Save Notes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approvals Tab */}
      {activeTab === 'approvals' && currentAdmin?.role !== 'blog_editor' && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Pending Approvals</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Review and approve blog posts from blog editors
              </p>
            </div>
            
            <div className="p-6">
              {posts.filter(post => post.requires_approval && post.approval_status === 'pending').length === 0 ? (
                <div className="text-center py-12">
                  <Check size={48} className="mx-auto text-green-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                  <p className="text-muted-foreground">No blog posts pending approval.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts
                    .filter(post => post.requires_approval && post.approval_status === 'pending')
                    .map((post) => (
                      <div key={post.id} className="border border-border rounded-lg p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-foreground mb-2">{post.title}</h4>
                            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                            
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                              <span>By: {post.author_name}</span>
                              <span>•</span>
                              <span>Created: {new Date(post.created_at).toLocaleDateString()}</span>
                              {post.updated_at !== post.created_at && (
                                <>
                                  <span>•</span>
                                  <span>Modified: {new Date(post.updated_at).toLocaleDateString()}</span>
                                </>
                              )}
                              <span>•</span>
                              <span className="px-2 py-1 bg-yellow-900/20 text-yellow-400 rounded">
                                Pending Approval
                              </span>
                            </div>
                            
                            {/* Show change summary for edited posts */}
                            {post.change_summary && (
                              <div className="mb-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                                <h5 className="text-sm font-medium text-blue-400 mb-2">Changes Made:</h5>
                                <p className="text-sm text-blue-300">{post.change_summary}</p>
                                {post.pending_changes && (
                                  <button
                                    onClick={() => setShowChanges(post.id)}
                                    className="text-xs text-blue-400 hover:text-blue-300 mt-2 underline"
                                  >
                                    View detailed changes
                                  </button>
                                )}
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => handleApprovePost(post.id)}
                                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                              >
                                <Check size={16} />
                                <span>Approve & Publish</span>
                              </button>
                              
                              <button
                                onClick={() => handleEditPost(post)}
                                className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                              >
                                <Edit3 size={16} />
                                <span>Edit</span>
                              </button>
                              
                              <button
                                onClick={() => handleRejectPost(post.id)}
                                className="flex items-center space-x-2 px-4 py-2 border border-red-600 text-red-400 rounded-lg hover:bg-red-600/10 transition-colors"
                              >
                                <X size={16} />
                                <span>Reject</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <BlogAnalytics />
      )}

      {/* Modals would go here - BlogPostModal and CategoryModal components */}
      {showPostModal && (
        <BlogPostModal
          post={editingPost}
          categories={categories}
          onClose={() => setShowPostModal(false)}
          onSave={loadBlogData}
          currentAdmin={currentAdmin}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => setShowCategoryModal(false)}
          onSave={loadBlogData}
        />
      )}

      {/* Change Details Modal */}
      {showChanges && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Detailed Changes</h3>
              <button
                onClick={() => setShowChanges(null)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {(() => {
                const post = posts.find(p => p.id === showChanges);
                if (!post?.pending_changes) return <p>No changes tracked</p>;
                
                try {
                  const changes = JSON.parse(post.pending_changes);
                  return (
                    <div className="space-y-4">
                      {Object.entries(changes).map(([field, change]: [string, any]) => (
                        <div key={field} className="border border-border rounded-lg p-4">
                          <h4 className="font-medium text-foreground mb-2 capitalize">{field.replace('_', ' ')}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-red-400 font-medium mb-1">Before:</p>
                              <div className="p-2 bg-red-900/20 border border-red-800 rounded text-sm">
                                {typeof change.from === 'object' ? JSON.stringify(change.from) : change.from || 'Empty'}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-green-400 font-medium mb-1">After:</p>
                              <div className="p-2 bg-green-900/20 border border-green-800 rounded text-sm">
                                {typeof change.to === 'object' ? JSON.stringify(change.to) : change.to || 'Empty'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                } catch (error) {
                  return <p>Error parsing changes</p>;
                }
              })()}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminBlog;