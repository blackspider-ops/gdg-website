import React, { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Navigate } from 'react-router-dom';
import { Settings, User, Shield, Bell, Database, Palette, Save, Key, Eye, EyeOff, AlertTriangle, Mail, Slack, Github, Webhook, Monitor, Sun, Moon, Zap, Volume2, VolumeX } from 'lucide-react';
import { ContentService } from '@/services/contentService';
import AdminLayout from '@/components/admin/AdminLayout';

const AdminSettings = () => {
  const { isAuthenticated, currentAdmin } = useAdmin();
  const [activeTab, setActiveTab] = useState('general');

  

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const [settings, setSettings] = useState({
    siteName: 'GDG@PSU',
    siteDescription: 'Google Developer Group at Penn State University',
    contactEmail: 'contact@gdgpsu.org',
    meetingTime: 'Thursdays at 7:00 PM',
    meetingLocation: 'Thomas Building 100',
    enableRegistrations: true,
    enableNewsletter: true,
    enableNotifications: true,
    maintenanceMode: false,
    theme: 'system'
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    newMemberAlerts: true,
    eventReminders: true,
    systemAlerts: true,
    weeklyDigest: false,
    soundEnabled: true,
    desktopNotifications: true
  });

  // Integration settings
  const [integrationSettings, setIntegrationSettings] = useState({
    slackWebhook: '',
    discordWebhook: '',
    githubToken: '',
    googleAnalyticsId: '',
    mailchimpApiKey: '',
    zapierWebhook: ''
  });

  // Appearance settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'system',
    primaryColor: '#3B82F6',
    fontSize: 'medium',
    compactMode: false,
    showAnimations: true,
    highContrast: false
  });

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Database },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  const handleSave = () => {
    // Settings save functionality
  };

  return (
    <AdminLayout
      title="Settings"
      subtitle="Manage your admin preferences and site configuration"
      icon={Settings}
      actions={
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Save size={16} />
          <span>Save Changes</span>
        </button>
      }
    >
      {/* Tabs */}
      <div className="border-b border-border mb-8">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-primary'
                    : 'border-transparent text-muted-foreground hover:text-gray-300 hover:border-border'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <h3 className="font-semibold text-lg mb-6 text-foreground">Site Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Site Name</label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Contact Email</label>
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium mb-2 text-gray-300">Site Description</label>
                <textarea
                  rows={3}
                  value={settings.siteDescription}
                  onChange={(e) => setSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Meeting Time</label>
                  <input
                    type="text"
                    value={settings.meetingTime}
                    onChange={(e) => setSettings(prev => ({ ...prev, meetingTime: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Meeting Location</label>
                  <input
                    type="text"
                    value={settings.meetingLocation}
                    onChange={(e) => setSettings(prev => ({ ...prev, meetingLocation: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground"
                  />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <h3 className="font-semibold text-lg mb-6 text-foreground">Site Features</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Event Registrations</div>
                    <div className="text-sm text-muted-foreground">Allow users to register for events</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableRegistrations}
                    onChange={(e) => setSettings(prev => ({ ...prev, enableRegistrations: e.target.checked }))}
                    className="w-4 h-4 text-primary bg-card border border-border rounded focus:ring-blue-400 focus:ring-2"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Newsletter Signup</div>
                    <div className="text-sm text-muted-foreground">Enable newsletter subscription</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableNewsletter}
                    onChange={(e) => setSettings(prev => ({ ...prev, enableNewsletter: e.target.checked }))}
                    className="w-4 h-4 text-primary bg-card border border-border rounded focus:ring-blue-400 focus:ring-2"
                  />
                </div>
                
                <div className="flex items-center justify-between">

                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Maintenance Mode</div>
                    <div className="text-sm text-muted-foreground">Put site in maintenance mode</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                    className="w-4 h-4 text-primary bg-card border border-border rounded focus:ring-blue-400 focus:ring-2"
                  />
                </div>
              </div>
            </div>

                    className="w-4 h-4 text-primary bg-card border border-border rounded focus:ring-blue-400 focus:ring-2"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">New Member Alerts</div>
                    <div className="text-sm text-muted-foreground">Get notified when new members join</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.newMemberAlerts}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, newMemberAlerts: e.target.checked }))}
                    className="w-4 h-4 text-primary bg-card border border-border rounded focus:ring-blue-400 focus:ring-2"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Event Reminders</div>
                    <div className="text-sm text-muted-foreground">Reminders for upcoming events</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.eventReminders}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, eventReminders: e.target.checked }))}
                    className="w-4 h-4 text-primary bg-card border border-border rounded focus:ring-blue-400 focus:ring-2"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">System Alerts</div>
                    <div className="text-sm text-muted-foreground">Important system notifications</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.systemAlerts}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, systemAlerts: e.target.checked }))}
                    className="w-4 h-4 text-primary bg-card border border-border rounded focus:ring-blue-400 focus:ring-2"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Weekly Digest</div>
                    <div className="text-sm text-muted-foreground">Weekly summary of activities</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.weeklyDigest}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, weeklyDigest: e.target.checked }))}
                    className="w-4 h-4 text-primary bg-card border border-border rounded focus:ring-blue-400 focus:ring-2"
                  />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <h3 className="font-semibold text-lg mb-6 text-foreground">Browser Notifications</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Desktop Notifications</div>
                    <div className="text-sm text-muted-foreground">Show browser notifications</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.desktopNotifications}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, desktopNotifications: e.target.checked }))}
                    className="w-4 h-4 text-primary bg-card border border-border rounded focus:ring-blue-400 focus:ring-2"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Sound Notifications</div>
                    <div className="text-sm text-muted-foreground">Play sound for notifications</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.soundEnabled}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                    className="w-4 h-4 text-primary bg-card border border-border rounded focus:ring-blue-400 focus:ring-2"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <h3 className="font-semibold text-lg mb-6 text-foreground">Communication Integrations</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="flex items-center space-x-3 mb-2">
                    <Slack size={20} className="text-purple-600" />
                    <span className="text-sm font-medium text-gray-300">Slack Webhook URL</span>
                  </label>
                  <input
                    type="url"
                    value={integrationSettings.slackWebhook}
                    onChange={(e) => setIntegrationSettings(prev => ({ ...prev, slackWebhook: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground"
                    placeholder="https://hooks.slack.com/services/..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">Send notifications to your Slack workspace</p>
                </div>

                <div>
                  <label className="flex items-center space-x-3 mb-2">
                    <Webhook size={20} className="text-indigo-600" />
                    <span className="text-sm font-medium text-gray-300">Discord Webhook URL</span>
                  </label>
                  <input
                    type="url"
                    value={integrationSettings.discordWebhook}
                    onChange={(e) => setIntegrationSettings(prev => ({ ...prev, discordWebhook: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground"
                    placeholder="https://discord.com/api/webhooks/..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">Send notifications to your Discord server</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <h3 className="font-semibold text-lg mb-6 text-foreground">Development Integrations</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="flex items-center space-x-3 mb-2">
                    <Github size={20} className="text-foreground" />
                    <span className="text-sm font-medium text-gray-300">GitHub Personal Access Token</span>
                  </label>
                  <input
                    type="password"
                    value={integrationSettings.githubToken}
                    onChange={(e) => setIntegrationSettings(prev => ({ ...prev, githubToken: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Connect to GitHub for project management</p>
                </div>

                <div>
                  <label className="flex items-center space-x-3 mb-2">
                    <Zap size={20} className="text-orange-600" />
                    <span className="text-sm font-medium text-gray-300">Zapier Webhook URL</span>
                  </label>
                  <input
                    type="url"
                    value={integrationSettings.zapierWebhook}
                    onChange={(e) => setIntegrationSettings(prev => ({ ...prev, zapierWebhook: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground"
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">Automate workflows with Zapier</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <h3 className="font-semibold text-lg mb-6 text-foreground">Analytics & Marketing</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="flex items-center space-x-3 mb-2">
                    <Monitor size={20} className="text-primary" />
                    <span className="text-sm font-medium text-gray-300">Google Analytics ID</span>
                  </label>
                  <input
                    type="text"
                    value={integrationSettings.googleAnalyticsId}
                    onChange={(e) => setIntegrationSettings(prev => ({ ...prev, googleAnalyticsId: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground"
                    placeholder="G-XXXXXXXXXX"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Track website analytics with Google Analytics</p>
                </div>

                <div>
                  <label className="flex items-center space-x-3 mb-2">
                    <Mail size={20} className="text-yellow-600" />
                    <span className="text-sm font-medium text-gray-300">Mailchimp API Key</span>
                  </label>
                  <input
                    type="password"
                    value={integrationSettings.mailchimpApiKey}
                    onChange={(e) => setIntegrationSettings(prev => ({ ...prev, mailchimpApiKey: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground"
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-us1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Sync newsletter subscribers with Mailchimp</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <h3 className="font-semibold text-lg mb-6 text-foreground">Theme Settings</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-300">Color Theme</label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'light', label: 'Light', icon: Sun },
                      { id: 'dark', label: 'Dark', icon: Moon },
                      { id: 'system', label: 'System', icon: Monitor }
                    ].map((theme) => {
                      const Icon = theme.icon;
                      return (
                        <button
                          key={theme.id}
                          onClick={() => setAppearanceSettings(prev => ({ ...prev, theme: theme.id }))}
                          className={`flex flex-col items-center p-4 border-2 rounded-lg transition-colors ${
                            appearanceSettings.theme === theme.id
                              ? 'border-blue-600 bg-muted text-blue-700'
                              : 'border-border hover:border-border text-muted-foreground'
                          }`}
                        >
                          <Icon size={24} className="mb-2" />
                          <span className="text-sm font-medium">{theme.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-300">Primary Color</label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="color"
                      value={appearanceSettings.primaryColor}
                      onChange={(e) => setAppearanceSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-12 h-12 border border-border rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={appearanceSettings.primaryColor}
                      onChange={(e) => setAppearanceSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="flex-1 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground"
                      placeholder="#3B82F6"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Choose the primary color for the admin interface</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-300">Font Size</label>
                  <select
                    value={appearanceSettings.fontSize}
                    onChange={(e) => setAppearanceSettings(prev => ({ ...prev, fontSize: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <h3 className="font-semibold text-lg mb-6 text-foreground">Interface Options</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Compact Mode</div>
                    <div className="text-sm text-muted-foreground">Reduce spacing and padding for more content</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={appearanceSettings.compactMode}
                    onChange={(e) => setAppearanceSettings(prev => ({ ...prev, compactMode: e.target.checked }))}
                    className="w-4 h-4 text-primary bg-card border border-border rounded focus:ring-blue-400 focus:ring-2"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Show Animations</div>
                    <div className="text-sm text-muted-foreground">Enable smooth transitions and animations</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={appearanceSettings.showAnimations}
                    onChange={(e) => setAppearanceSettings(prev => ({ ...prev, showAnimations: e.target.checked }))}
                    className="w-4 h-4 text-primary bg-card border border-border rounded focus:ring-blue-400 focus:ring-2"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">High Contrast</div>
                    <div className="text-sm text-muted-foreground">Increase contrast for better accessibility</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={appearanceSettings.highContrast}
                    onChange={(e) => setAppearanceSettings(prev => ({ ...prev, highContrast: e.target.checked }))}
                    className="w-4 h-4 text-primary bg-card border border-border rounded focus:ring-blue-400 focus:ring-2"
                  />
                </div>
              </div>
            </div>

            <div className="bg-muted border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Palette size={20} className="text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">Preview Changes</h4>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    Appearance changes will be applied immediately. You can always reset to default settings if needed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

// Admin Secret Code Settings Component
const AdminSecretCodeSettings = ({ currentAdmin }: { currentAdmin: any }) => {
  const [secretCode, setSecretCode] = useState('');
  const [currentSecretCode, setCurrentSecretCode] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load current secret code on mount
  React.useEffect(() => {
    const loadSecretCode = async () => {
      try {
        const code = await ContentService.getAdminSecretCode();
        setCurrentSecretCode(code);
        setSecretCode(code);
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to load current secret code' });
      }
    };
    loadSecretCode();
  }, []);

  // Validate email format for secret code
  const validateSecretCode = (code: string): string | null => {
    if (!code.trim()) {
      return 'Secret code cannot be empty';
    }

    if (!code.includes('@')) {
      return 'Secret code must contain an @ symbol';
    }

    if (!code.endsWith('.com')) {
      return 'Secret code must end with .com';
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(code)) {
      return 'Secret code must be in valid email format';
    }

    return null;
  };

  const handleSaveSecretCode = async () => {
    const validationError = validateSecretCode(secretCode);
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }

    if (secretCode === currentSecretCode) {
      setMessage({ type: 'error', text: 'New secret code must be different from current code' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const success = await ContentService.updateAdminSecretCode(secretCode, currentAdmin?.id);
      
      if (success) {
        setCurrentSecretCode(secretCode);
        setIsEditing(false);
        setMessage({ type: 'success', text: 'Admin secret code updated successfully' });
        
        // Log the action if we have admin service
        if (currentAdmin?.id) {
          // We could add this to AdminService if needed
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to update secret code. Please try again.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while updating the secret code' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSecretCode(currentSecretCode);
    setIsEditing(false);
    setMessage(null);
    setValidationError(null);
  };

  // Handle input change with real-time validation
  const handleSecretCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCode = e.target.value;
    setSecretCode(newCode);
    
    // Clear previous messages
    setMessage(null);
    
    // Real-time validation
    if (newCode.trim()) {
      const error = validateSecretCode(newCode);
      setValidationError(error);
    } else {
      setValidationError(null);
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Key size={20} className="text-primary" />
        <h3 className="font-semibold text-lg text-foreground">Admin Access Secret Code</h3>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-300 mb-1">Important Security Information</h4>
            <p className="text-sm text-yellow-200 leading-relaxed">
              This secret code can be entered in the newsletter signup field to access the admin login popup. 
              Keep this code secure and change it regularly. Anyone with this code can attempt to access the admin panel.
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-6 ${
          message.type === 'success' 
            ? 'bg-green-900/20 text-green-400 border border-green-500/30' 
            : 'bg-red-900/20 text-red-400 border border-red-500/30'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Current Secret Code</label>
          <div className="relative">
            <input
              type={showCode ? 'text' : 'password'}
              value={isEditing ? secretCode : currentSecretCode}
              onChange={isEditing ? handleSecretCodeChange : undefined}
              disabled={!isEditing}
              className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                isEditing 
                  ? validationError 
                    ? 'border-red-300 bg-card focus:ring-red-500 focus:border-red-500 text-foreground' 
                    : 'border-border bg-card focus:ring-blue-400 focus:border-blue-400 text-foreground'
                  : 'border-border bg-muted text-muted-foreground'
              }`}
              placeholder="Enter new secret code (e.g., admin-secret@example.com)"
            />
            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition-colors"
            >
              {showCode ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {isEditing && validationError ? (
            <p className="text-xs text-red-400 mt-1 flex items-center space-x-1">
              <AlertTriangle size={12} />
              <span>{validationError}</span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              Must be in email format with @ symbol and end with .com (e.g., admin-secret@example.com)
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            <strong>How it works:</strong> Enter this code in the newsletter signup field on the website footer to trigger the admin login popup.
          </div>
          
          <div className="flex items-center space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-border text-gray-300 rounded-lg hover:bg-muted transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSecretCode}
                  disabled={isSaving || !secretCode.trim() || !!validationError}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                >
                  <Save size={16} />
                  <span>{isSaving ? 'Saving...' : 'Save Code'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                <Key size={16} />
                <span>Change Code</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;