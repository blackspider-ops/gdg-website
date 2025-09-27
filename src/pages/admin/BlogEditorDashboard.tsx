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
  Clock
} from 'lucide-react';
import { BlogService } from '@/services/blogService';

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

  // Authentication check
  if (!isAuthenticated || currentAdmin?.role !== 'blog_editor') {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    loadBlogStats();
  }, []);

  const loadBlogStats = async () => {
    setIsLoading(true);
    try {
      const stats = await BlogService.getBlogStats();
      setBlogStats({
        ...stats,
        pendingApproval: stats.draftPosts // For now, treat drafts as pending approval
      });
    } catch (error) {
      setBlogStats({
        totalPosts: 0,
        publishedPosts: 0,
        draftPosts: 0,
        totalViews: 0,
        totalLikes: 0,
        pendingApproval: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stats = [
    { label: 'Total Posts', value: blogStats.totalPosts.toString(), icon: FileText, color: 'text-blue-500' },
    { label: 'Published', value: blogStats.publishedPosts.toString(), icon: Eye, color: 'text-green-500' },
    { label: 'Drafts', value: blogStats.draftPosts.toString(), icon: Clock, color: 'text-orange-500' },
    { label: 'Total Views', value: blogStats.totalViews.toString(), icon: Eye, color: 'text-purple-500' },
    { label: 'Total Likes', value: blogStats.totalLikes.toString(), icon: Heart, color: 'text-pink-500' },
  ];

  const quickActions = [
    { label: 'Manage Blog Posts', icon: FileText, href: '/admin/blog' },
    { label: 'Create New Post', icon: PenTool, href: '/admin/blog?action=create' },
    { label: 'Blog Submissions', icon: FileText, href: '/admin/blog-media' },
    { label: 'My Profile', icon: Users, href: '/admin/profile' },
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
                onClick={loadBlogStats}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50"
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
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
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Blog Approval Process</h3>
                <p className="text-sm text-blue-700">
                  All blog posts created or edited by blog editors require approval from an admin before being published. 
                  Your drafts will be reviewed and published by the admin team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminPageWrapper>
  );
};

export default BlogEditorDashboard;