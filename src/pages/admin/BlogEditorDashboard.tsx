import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Navigate, Link } from 'react-router-dom';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { 
  PenTool, 
  FileText, 
  Users, 
  LogOut,
  RefreshCw,
  Activity,
  Eye,
  Heart,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { BlogService, BlogCategory, BlogPost } from '@/services/blogService';
import BlogPostModal from '@/components/admin/BlogPostModal';

const BlogEditorDashboard = () => {
  const { isAuthenticated, currentAdmin, logout } = useAdmin();
  const [blogStats, setBlogStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    pendingApproval: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [requests, setRequests] = useState<BlogPost[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requestFilter, setRequestFilter] = useState<'pending' | 'rejected' | 'completed' | 'all'>('pending');

  useEffect(() => {
    loadBlogStats();
    loadRequests();
  }, [requestFilter]);

  // Authentication check after all hooks
  if (!isAuthenticated || currentAdmin?.role !== 'blog_editor') {
    return <Navigate to="/" replace />;
  }

  const loadBlogStats = async () => {
    setIsLoading(true);
    try {
      const [stats, categoriesData] = await Promise.all([
        BlogService.getBlogStats(),
        BlogService.getCategories()
      ]);
      
      setBlogStats({
        ...stats,
        pendingApproval: stats.draftPosts // For now, treat drafts as pending approval
      });
      
      setCategories(categoriesData);
    } catch (error) {
      setBlogStats({
        totalPosts: 0,
        publishedPosts: 0,
        draftPosts: 0,
        totalViews: 0,
        totalLikes: 0,
        pendingApproval: 0
      });
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRequests = async () => {
    if (!currentAdmin?.email) return;
    
    setLoadingRequests(true);
    try {
      const requestsData = await BlogService.getRequestsByEditor(currentAdmin.email, requestFilter);
      setRequests(requestsData);
    } catch (error) {
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const refreshData = () => {
    loadBlogStats();
    loadRequests();
  };

  const stats = [
    { label: 'Total Posts', value: blogStats.totalPosts.toString(), icon: FileText, color: 'text-blue-500' },
    { label: 'Published', value: blogStats.publishedPosts.toString(), icon: Eye, color: 'text-green-500' },
    { label: 'Drafts', value: blogStats.draftPosts.toString(), icon: Clock, color: 'text-orange-500' },
    { label: 'Total Views', value: blogStats.totalViews.toString(), icon: Eye, color: 'text-purple-500' },
    { label: 'Total Likes', value: blogStats.totalLikes.toString(), icon: Heart, color: 'text-pink-500' },
  ];

  const quickActions = [
    { label: 'Manage Blog Posts', icon: FileText, href: '/admin/blog', type: 'link' },
    { label: 'Create New Post', icon: PenTool, action: () => setShowCreateModal(true), type: 'action' },
    { label: 'Blog Submissions', icon: FileText, href: '/admin/blog-media', type: 'link' },
    { label: 'My Profile', icon: Users, href: '/admin/profile', type: 'link' },
  ];

  return (
    <AdminPageWrapper pageName="Blog Editor Dashboard" pageTitle="Blog Editor">
      <div className="min-h-screen bg-background pt-20">
        <div className="editorial-grid py-8">
          {/* Header */}
          <div className="col-span-12 flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <PenTool size={20} className="text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">Blog Editor Dashboard</h1>
                <p className="text-muted-foreground text-sm">
                  Welcome, {currentAdmin.email}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={refreshData}
                disabled={isLoading || loadingRequests}
                className="flex items-center space-x-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50"
              >
                <RefreshCw size={16} className={isLoading || loadingRequests ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
              
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-6">
                  <div className="animate-pulse">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-6 h-6 bg-gray-200 rounded"></div>
                      <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    </div>
                    <div className="w-16 h-8 bg-gray-200 rounded mb-1"></div>
                    <div className="w-24 h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))
            ) : (
              stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Icon size={24} className={stat.color} />
                      <Activity size={16} className="text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold mb-1 text-foreground">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Actions */}
          <div className="col-span-12">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="font-display text-lg font-semibold mb-6 text-foreground">Quick Actions</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  
                  if (action.type === 'action') {
                    return (
                      <button
                        key={index}
                        onClick={action.action}
                        className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors group text-left"
                      >
                        <Icon size={20} className="text-primary group-hover:text-primary/80" />
                        <span className="font-medium text-foreground">{action.label}</span>
                      </button>
                    );
                  }
                  
                  return (
                    <Link
                      key={index}
                      to={action.href}
                      className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors group"
                    >
                      <Icon size={20} className="text-primary group-hover:text-primary/80" />
                      <span className="font-medium text-foreground">{action.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Notice about approval process */}
              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                <h3 className="font-medium text-blue-400 mb-2">Blog Approval Process</h3>
                <p className="text-sm text-blue-300">
                  All blog posts created or edited by blog editors require approval from an admin before being published. 
                  Your drafts will be reviewed and published by the admin team.
                </p>
              </div>
            </div>
          </div>

          {/* Requests Section */}
          <div className="col-span-12 mt-8">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <h2 className="font-display text-lg font-semibold text-foreground flex items-center space-x-2">
                    <AlertCircle size={20} className="text-orange-500" />
                    <span>My Requests</span>
                    {requests.length > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                        {requests.length}
                      </span>
                    )}
                  </h2>
                  
                  {/* Filter Dropdown */}
                  <select
                    value={requestFilter}
                    onChange={(e) => setRequestFilter(e.target.value as 'pending' | 'rejected' | 'completed' | 'all')}
                    className="px-3 py-1 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed</option>
                    <option value="all">All Requests</option>
                  </select>
                </div>
                
                <button
                  onClick={loadRequests}
                  disabled={loadingRequests}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={16} className={loadingRequests ? 'animate-spin' : ''} />
                </button>
              </div>

              {loadingRequests ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex-1">
                          <div className="w-48 h-5 bg-gray-200 rounded mb-2"></div>
                          <div className="w-32 h-4 bg-gray-200 rounded mb-1"></div>
                          <div className="w-24 h-3 bg-gray-200 rounded"></div>
                        </div>
                        <div className="w-20 h-6 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                  <h3 className="font-medium text-foreground mb-2">
                    {requestFilter === 'pending' ? 'No Pending Requests' : 
                     requestFilter === 'rejected' ? 'No Rejected Requests' :
                     requestFilter === 'completed' ? 'No Completed Requests' : 'No Requests'}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {requestFilter === 'pending' 
                      ? 'All your blog posts are up to date. Create a new post to get started!'
                      : requestFilter === 'rejected'
                      ? 'No rejected requests. Great job on your submissions!'
                      : requestFilter === 'completed'
                      ? 'No completed requests yet. Submit some posts for approval!'
                      : 'No requests found. Create a new post to get started!'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((post) => {
                    const getStatusInfo = (status: string, postStatus: string) => {
                      switch (status) {
                        case 'pending':
                          return {
                            icon: Clock,
                            color: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
                            label: 'Pending Review'
                          };
                        case 'rejected':
                          return {
                            icon: XCircle,
                            color: 'text-red-500 bg-red-500/10 border-red-500/20',
                            label: 'Rejected'
                          };
                        case 'approved':
                          return {
                            icon: CheckCircle,
                            color: 'text-green-500 bg-green-500/10 border-green-500/20',
                            label: postStatus === 'published' ? 'Published' : 'Approved'
                          };
                        default:
                          return {
                            icon: AlertCircle,
                            color: 'text-gray-500 bg-gray-500/10 border-gray-500/20',
                            label: 'Unknown'
                          };
                      }
                    };

                    const statusInfo = getStatusInfo(post.approval_status || 'pending', post.status);
                    const StatusIcon = statusInfo.icon;

                    return (
                      <div key={post.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-medium text-foreground truncate">{post.title}</h3>
                              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full border text-xs font-medium ${statusInfo.color}`}>
                                <StatusIcon size={12} />
                                <span>{statusInfo.label}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                              <div className="flex items-center space-x-1">
                                <Calendar size={14} />
                                <span>Created {new Date(post.created_at).toLocaleDateString()}</span>
                              </div>
                              {post.approval_status === 'approved' && post.published_at && (
                                <div className="flex items-center space-x-1">
                                  <CheckCircle size={14} />
                                  <span>Published {new Date(post.published_at).toLocaleDateString()}</span>
                                </div>
                              )}
                              {post.category && (
                                <div className="flex items-center space-x-1">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: post.category.color }}
                                  ></div>
                                  <span>{post.category.name}</span>
                                </div>
                              )}
                            </div>

                            {post.change_summary && (
                              <div className="text-sm text-muted-foreground mb-2">
                                <span className="font-medium">Changes:</span> {post.change_summary}
                              </div>
                            )}

                            {post.approval_status === 'approved' && post.status === 'published' && (
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                                <div className="flex items-center space-x-1">
                                  <Eye size={14} />
                                  <span>{post.views_count || 0} views</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Heart size={14} />
                                  <span>{post.likes_count || 0} likes</span>
                                </div>
                              </div>
                            )}

                            {post.approval_status === 'rejected' && post.rejection_reason && (
                              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <div className="flex items-start space-x-2">
                                  <XCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="font-medium text-red-400 text-sm mb-1">Rejection Reason:</p>
                                    <p className="text-red-300 text-sm">{post.rejection_reason}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            <Link
                              to={`/admin/blog`}
                              className="text-sm text-primary hover:text-primary/80 transition-colors"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <BlogPostModal
          post={null}
          categories={categories}
          onClose={() => setShowCreateModal(false)}
          onSave={() => {
            setShowCreateModal(false);
            // Refresh stats and requests after creating post
            refreshData();
          }}
          currentAdmin={currentAdmin}
        />
      )}
    </AdminPageWrapper>
  );
};

export default BlogEditorDashboard;