import { useState, useEffect } from 'react';
import { BarChart3, Eye, MousePointer, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { linktreeService, LinktreeAnalytics as AnalyticsData, LinktreeLink } from '@/services/linktreeService';
import { format, subDays, startOfDay, endOfDay, startOfWeek } from 'date-fns';

interface LinktreeAnalyticsProps {
  profileId: string;
}

const LinktreeAnalytics = ({ profileId }: LinktreeAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [links, setLinks] = useState<LinktreeLink[]>([]);
  const [timeRange, setTimeRange] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [profileId, timeRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsData, linksData] = await Promise.all([
        linktreeService.getAnalytics(profileId, parseInt(timeRange)),
        linktreeService.getProfileLinks(profileId)
      ]);
      
      setAnalytics(analyticsData);
      setLinks(linksData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const totalViews = analytics.filter(a => !a.link_id).length;
    const totalClicks = analytics.filter(a => a.link_id).length;
    const uniqueVisitors = new Set(analytics.map(a => a.visitor_ip)).size;
    
    // Calculate daily stats for this week only (last 7 days)
    const weeklyStats = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayAnalytics = analytics.filter(a => {
        const clickDate = new Date(a.clicked_at);
        return clickDate >= dayStart && clickDate <= dayEnd;
      });
      
      weeklyStats.push({
        date: format(date, 'EEE, MMM dd'), // Show day of week + date
        views: dayAnalytics.filter(a => !a.link_id).length,
        clicks: dayAnalytics.filter(a => a.link_id).length
      });
    }

    return {
      totalViews,
      totalClicks,
      uniqueVisitors,
      weeklyStats
    };
  };

  const getLinkStats = () => {
    return links.map(link => {
      const linkClicks = analytics.filter(a => a.link_id === link.id);
      const uniqueClickers = new Set(linkClicks.map(a => a.visitor_ip)).size;
      
      return {
        ...link,
        clicks: linkClicks.length,
        uniqueClickers,
        clickRate: analytics.length > 0 ? (linkClicks.length / analytics.length * 100) : 0
      };
    }).sort((a, b) => b.clicks - a.clicks);
  };

  const getTopReferrers = () => {
    const referrers = analytics
      .filter(a => a.referrer && a.referrer !== '')
      .reduce((acc, a) => {
        const referrer = new URL(a.referrer || '').hostname || 'Direct';
        acc[referrer] = (acc[referrer] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(referrers)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([referrer, count]) => ({ referrer, count }));
  };

  const stats = getStats();
  const linkStats = getLinkStats();
  const topReferrers = getTopReferrers();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews}</div>
            <p className="text-xs text-muted-foreground">
              {stats.uniqueVisitors} unique visitors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Link Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalViews > 0 ? ((stats.totalClicks / stats.totalViews) * 100).toFixed(1) : 0}% click rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalViews > 0 ? ((stats.totalClicks / stats.totalViews) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average engagement rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>This Week's Activity</CardTitle>
          <CardDescription>Daily views and clicks for the past 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.weeklyStats.map((day, index) => {
              const maxViews = Math.max(...stats.weeklyStats.map(d => d.views), 1);
              const maxClicks = Math.max(...stats.weeklyStats.map(d => d.clicks), 1);
              
              return (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-24 text-sm text-muted-foreground font-medium">
                    {day.date}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="text-sm flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                        Views: <span className="font-semibold ml-1">{day.views}</span>
                      </div>
                      <div className="text-sm flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        Clicks: <span className="font-semibold ml-1">{day.clicks}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <div 
                        className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.max((day.views / maxViews) * 100, 3)}%` 
                        }}
                      />
                      <div 
                        className="bg-green-500 h-3 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.max((day.clicks / maxClicks) * 100, 3)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {stats.weeklyStats.every(day => day.views === 0 && day.clicks === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No activity recorded this week</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Link Performance</CardTitle>
          <CardDescription>Click statistics for each link</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {linkStats.map((link) => (
              <div key={link.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{link.title}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {link.url}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-lg font-bold">{link.clicks}</div>
                    <div className="text-xs text-muted-foreground">Clicks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{link.uniqueClickers}</div>
                    <div className="text-xs text-muted-foreground">Unique</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{link.clickRate.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">Rate</div>
                  </div>
                  <Badge variant={link.is_active ? 'default' : 'secondary'}>
                    {link.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            ))}
            
            {linkStats.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No links available for analysis
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Referrers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Referrers</CardTitle>
          <CardDescription>Where your traffic is coming from</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topReferrers.map((referrer, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="font-medium">{referrer.referrer}</div>
                <Badge variant="outline">{referrer.count} visits</Badge>
              </div>
            ))}
            
            {topReferrers.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No referrer data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LinktreeAnalytics;