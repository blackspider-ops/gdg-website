import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  Users, 
  Calendar,
  Tag,
  Clock,
  Heart,
  MessageCircle,
  Share2,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { BlogService } from '@/services/blogService';

interface BlogAnalyticsData {
  totalPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  avgReadTime: number;
  publishedPosts: number;
  draftPosts: number;
  archivedPosts: number;
  topPosts: Array<{
    id: string;
    title: string;
    views: number;
    likes: number;
    published_at: string;
  }>;
  categoryStats: Array<{
    name: string;
    count: number;
    views: number;
    color: string;
  }>;
  monthlyStats: Array<{
    month: string;
    posts: number;
    views: number;
    likes: number;
  }>;
  recentActivity: Array<{
    type: 'view' | 'like' | 'publish';
    post_title: string;
    timestamp: string;
    count?: number;
  }>;
}

const BlogAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<BlogAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await BlogService.getAnalytics(timeRange);
      setAnalytics(data);
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load analytics data</p>
        <button 
          onClick={loadAnalytics}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, title, value, subtitle, trend }: {
    icon: any;
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: number;
  }) => (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className="flex flex-col items-end">
          <Icon className="h-8 w-8 text-primary" />
          {trend !== undefined && (
            <div className={`flex items-center mt-2 text-xs ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              <TrendingUp className={`h-3 w-3 mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blog Analytics</h1>
          <p className="text-muted-foreground">Track your blog performance and engagement</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 bg-background border border-border rounded-lg text-foreground"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Eye}
          title="Total Views"
          value={analytics.totalViews.toLocaleString()}
          subtitle="All time views"
          trend={12}
        />
        <StatCard
          icon={Heart}
          title="Total Likes"
          value={analytics.totalLikes.toLocaleString()}
          subtitle="All time likes"
          trend={8}
        />
        <StatCard
          icon={BarChart3}
          title="Published Posts"
          value={analytics.publishedPosts}
          subtitle={`${analytics.draftPosts} drafts, ${analytics.archivedPosts} archived`}
        />
        <StatCard
          icon={Clock}
          title="Avg Read Time"
          value={`${analytics.avgReadTime} min`}
          subtitle="Average across all posts"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Performance */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Performance</h3>
          <div className="space-y-4">
            {analytics.monthlyStats.map((month, index) => (
              <div key={month.month} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span className="text-sm font-medium text-foreground">{month.month}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>{month.posts} posts</span>
                  <span>{month.views} views</span>
                  <span>{month.likes} likes</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Category Performance</h3>
          <div className="space-y-4">
            {analytics.categoryStats.map((category) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="text-sm font-medium text-foreground">{category.name}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>{category.count} posts</span>
                  <span>{category.views} views</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Posts */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Top Performing Posts</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Post</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Views</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Likes</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Published</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topPosts.map((post) => {
                const engagementRate = post.views > 0 ? ((post.likes / post.views) * 100).toFixed(1) : '0';
                return (
                  <tr key={post.id} className="border-b border-border/50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{post.title}</div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{post.views.toLocaleString()}</td>
                    <td className="py-3 px-4 text-muted-foreground">{post.likes.toLocaleString()}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(post.published_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        parseFloat(engagementRate) > 5 
                          ? 'bg-green-100 text-green-800' 
                          : parseFloat(engagementRate) > 2
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {engagementRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {analytics.recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 py-2">
              <div className={`p-2 rounded-full ${
                activity.type === 'view' ? 'bg-blue-100 text-blue-600' :
                activity.type === 'like' ? 'bg-red-100 text-red-600' :
                'bg-green-100 text-green-600'
              }`}>
                {activity.type === 'view' && <Eye className="h-4 w-4" />}
                {activity.type === 'like' && <Heart className="h-4 w-4" />}
                {activity.type === 'publish' && <Calendar className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {activity.type === 'view' && `New view on "${activity.post_title}"`}
                  {activity.type === 'like' && `New like on "${activity.post_title}"`}
                  {activity.type === 'publish' && `Published "${activity.post_title}"`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(activity.timestamp).toLocaleString()}
                  {activity.count && ` • ${activity.count} total`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogAnalytics;