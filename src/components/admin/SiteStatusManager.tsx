import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Globe, AlertTriangle, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { SiteStatusService, SiteStatus } from '@/services/siteStatusService';
import { toast } from 'sonner';

const SiteStatusManager = () => {
  const [status, setStatus] = useState<SiteStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    is_live: true,
    redirect_url: 'https://www.gdgpsu.dev/l/applicationcabn',
    message: 'Site is currently under maintenance. Please check back soon!'
  });

  useEffect(() => {
    loadSiteStatus();
  }, []);

  const loadSiteStatus = async () => {
    try {
      setLoading(true);
      const data = await SiteStatusService.getSiteStatus();
      
      if (data) {
        setStatus(data);
        setFormData({
          is_live: data.is_live,
          redirect_url: data.redirect_url || 'https://www.gdgpsu.dev/l/applicationcabn',
          message: data.message || 'Site is currently under maintenance. Please check back soon!'
        });
      }
    } catch (error) {
      console.error('Error loading site status:', error);
      toast.error('Failed to load site status');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const result = await SiteStatusService.updateSiteStatus(formData);
      
      if (result) {
        setStatus(result);
        toast.success('Site status updated successfully');
      } else {
        throw new Error('Failed to update site status');
      }
    } catch (error) {
      console.error('Error updating site status:', error);
      toast.error('Failed to update site status');
    } finally {
      setSaving(false);
    }
  };

  const handleTestRedirect = () => {
    if (formData.redirect_url) {
      window.open(formData.redirect_url, '_blank');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status Alert */}
      <Alert className={formData.is_live ? 'border-green-500/50 bg-green-500/10' : 'border-orange-500/50 bg-orange-500/10'}>
        <div className="flex items-center gap-2">
          {formData.is_live ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          )}
          <AlertDescription className="font-medium">
            Site Status: {formData.is_live ? 'Live & Accessible' : 'Maintenance Mode Active'}
          </AlertDescription>
        </div>
      </Alert>

      {/* Site Status Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Site Status Management
          </CardTitle>
          <CardDescription>
            Control whether the site is live or in maintenance mode. When in maintenance mode, 
            all non-linktree and non-admin pages will redirect to the specified URL.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Site Live Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="is-live" className="text-base font-medium">
                Site is Live
              </Label>
              <p className="text-sm text-muted-foreground">
                When disabled, visitors will be redirected to the maintenance page
              </p>
            </div>
            <Switch
              id="is-live"
              checked={formData.is_live}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, is_live: checked }))
              }
            />
          </div>

          {/* Redirect URL */}
          <div className="space-y-2">
            <Label htmlFor="redirect-url">Redirect URL</Label>
            <div className="flex gap-2">
              <Input
                id="redirect-url"
                value={formData.redirect_url}
                onChange={(e) => 
                  setFormData(prev => ({ ...prev, redirect_url: e.target.value }))
                }
                placeholder="https://www.gdgpsu.dev/l/applicationcabn"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleTestRedirect}
                title="Test redirect URL"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              URL where users will be redirected when the site is in maintenance mode
            </p>
          </div>

          {/* Maintenance Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Maintenance Message (Optional)</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => 
                setFormData(prev => ({ ...prev, message: e.target.value }))
              }
              placeholder="Site is currently under maintenance. Please check back soon!"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Message to display (currently not used in redirect, but stored for future use)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
            <Button variant="outline" onClick={loadSiteStatus}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
            <p>When <strong>Site is Live</strong> is enabled, all pages work normally</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
            <p>When disabled, visitors to any page (except linktree and admin) are redirected to the specified URL</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <p>Linktree pages (/l/*) and admin pages (/admin/*) are never redirected</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p>Changes take effect immediately across the entire site</p>
          </div>
        </CardContent>
      </Card>

      {/* Current Status Info */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className={status.is_live ? 'text-green-500' : 'text-orange-500'}>
                {status.is_live ? 'Live' : 'Maintenance Mode'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Redirect URL:</span>
              <span className="font-mono text-xs">{status.redirect_url}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated:</span>
              <span>{new Date(status.updated_at).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SiteStatusManager;