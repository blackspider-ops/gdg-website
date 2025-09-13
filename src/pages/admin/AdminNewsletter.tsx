import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useDev } from '@/contexts/DevContext';
import { Navigate } from 'react-router-dom';
import { Mail, Send, Users, Eye, Calendar, Plus, Edit, Trash2, Download, RefreshCw, FileText } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { NewsletterService, type NewsletterSubscriber, type NewsletterCampaign, type NewsletterTemplate } from '@/services/newsletterService';
import { useNewsletterScheduler } from '@/hooks/useNewsletterScheduler';

const AdminNewsletter = () => {
  const { isAuthenticated } = useAdmin();
  const { isDevelopmentMode, allowDirectAdminAccess } = useDev();
  const [activeTab, setActiveTab] = useState('overview');
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    recent: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<NewsletterCampaign | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<NewsletterTemplate | null>(null);
  
  // Form states
  const [campaignForm, setCampaignForm] = useState({
    subject: '',
    content: '',
    html_content: '',
    status: 'draft' as 'draft' | 'scheduled' | 'send_now',
    scheduled_at: ''
  });
  
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    content: '',
    html_content: ''
  });

  const canAccess = isAuthenticated || (isDevelopmentMode && allowDirectAdminAccess);

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  // Load data on component mount
  useEffect(() => {
    loadNewsletterData();
  }, []);

  // Enable automatic newsletter scheduling
  const { forceCheck } = useNewsletterScheduler(true);

  const loadNewsletterData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [subscribersData, statsData, campaignsData] = await Promise.all([
        NewsletterService.getAllSubscribers(),
        NewsletterService.getSubscriberStats(),
        NewsletterService.getCampaigns()
      ]);
      
      // Load templates separately to avoid TypeScript issues
      // Temporarily disabled until TypeScript cache refreshes
      const templatesData: NewsletterTemplate[] = [];
      
      setSubscribers(subscribersData);
      setStats(statsData);
      setCampaigns(campaignsData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading newsletter data:', error);
      setError('Failed to load newsletter data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const statsDisplay = [
    { label: 'Total Subscribers', value: stats.total.toString(), color: 'text-blue-500', icon: Users },
    { label: 'Active Subscribers', value: stats.active.toString(), color: 'text-green-500', icon: Users },
    { label: 'Recent (30 days)', value: stats.recent.toString(), color: 'text-purple-500', icon: Calendar },
    { label: 'Unsubscribed', value: (stats.total - stats.active).toString(), color: 'text-orange-500', icon: Eye },
  ];

  const handleExportSubscribers = async () => {
    try {
      const allSubscribers = await NewsletterService.getAllSubscribers();
      const csvContent = [
        'Email,Name,Subscribed Date,Status,Confirmed Date',
        ...allSubscribers.map(sub => 
          `${sub.email},${sub.name || ''},${sub.subscribed_at},${sub.is_active ? 'active' : 'inactive'},${sub.confirmed_at || ''}`
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      setSuccess('Subscribers exported successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error exporting subscribers:', error);
      setError('Failed to export subscribers. Please try again.');
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      // Prepare campaign data - convert send_now to draft for database
      const campaignData = {
        subject: campaignForm.subject,
        content: campaignForm.content,
        html_content: campaignForm.html_content,
        status: (campaignForm.status === 'send_now' ? 'draft' : campaignForm.status) as 'draft' | 'scheduled',
        scheduled_at: campaignForm.status === 'scheduled' ? campaignForm.scheduled_at : undefined
      };

      const created = await NewsletterService.createCampaign(campaignData);
      if (created) {
        // If user chose "send now", immediately send the campaign
        if (campaignForm.status === 'send_now') {
          setSuccess('Campaign created! Sending newsletter...');
          const sent = await NewsletterService.sendCampaign(created.id);
          if (sent) {
            setSuccess('Newsletter sent successfully to all subscribers!');
          } else {
            setError('Campaign created but failed to send. You can try sending it manually from the campaigns list.');
          }
        } else if (campaignForm.status === 'scheduled') {
          setSuccess(`Campaign scheduled successfully for ${new Date(campaignForm.scheduled_at).toLocaleString()}!`);
        } else {
          setSuccess('Newsletter campaign created successfully!');
        }
        
        await loadNewsletterData();
        setShowCreateModal(false);
        resetCampaignForm();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError('Failed to create campaign. Please try again.');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      setError('An error occurred while creating the campaign.');
    }
  };

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;
    
    setError(null);
    
    try {
      // Prepare update data - convert send_now to draft for database
      const updateData = {
        subject: campaignForm.subject,
        content: campaignForm.content,
        html_content: campaignForm.html_content,
        status: (campaignForm.status === 'send_now' ? 'draft' : campaignForm.status) as 'draft' | 'scheduled',
        scheduled_at: campaignForm.status === 'scheduled' ? campaignForm.scheduled_at : undefined
      };

      const updated = await NewsletterService.updateCampaign(editingCampaign.id, updateData);
      if (updated) {
        // If user chose "send now", immediately send the campaign
        if (campaignForm.status === 'send_now') {
          setSuccess('Campaign updated! Sending newsletter...');
          const sent = await NewsletterService.sendCampaign(editingCampaign.id);
          if (sent) {
            setSuccess('Newsletter sent successfully to all subscribers!');
          } else {
            setError('Campaign updated but failed to send. You can try sending it manually.');
          }
        } else {
          setSuccess('Campaign updated successfully!');
        }

        await loadNewsletterData();
        setEditingCampaign(null);
        resetCampaignForm();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to update campaign. Please try again.');
      }
    } catch (error) {
      console.error('Error updating campaign:', error);
      setError('An error occurred while updating the campaign.');
    }
  };

  const handleSendCampaign = async (id: string) => {
    if (window.confirm('Are you sure you want to send this newsletter to all subscribers? This action cannot be undone.')) {
      setError(null);
      
      try {
        const sent = await NewsletterService.sendCampaign(id);
        if (sent) {
          await loadNewsletterData();
          setSuccess('Newsletter sent successfully!');
          setTimeout(() => setSuccess(null), 3000);
        } else {
          setError('Failed to send newsletter. Please try again.');
        }
      } catch (error) {
        console.error('Error sending campaign:', error);
        setError('An error occurred while sending the newsletter.');
      }
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      try {
        const deleted = await NewsletterService.deleteCampaign(id);
        if (deleted) {
          await loadNewsletterData();
          setSuccess('Campaign deleted successfully!');
          setTimeout(() => setSuccess(null), 3000);
        } else {
          setError('Failed to delete campaign. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting campaign:', error);
        setError('An error occurred while deleting the campaign.');
      }
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      // Temporarily disabled until TypeScript cache refreshes
      const created = null; // await NewsletterService.createTemplate({
      //   ...templateForm,
      //   is_active: true
      // });
      if (created) {
        await loadNewsletterData();
        setShowTemplateModal(false);
        resetTemplateForm();
        setSuccess('Template created successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to create template. Please try again.');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      setError('An error occurred while creating the template.');
    }
  };

  const resetCampaignForm = () => {
    setCampaignForm({
      subject: '',
      content: '',
      html_content: '',
      status: 'draft',
      scheduled_at: ''
    });
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      content: '',
      html_content: ''
    });
  };

  const handleEditCampaign = (campaign: NewsletterCampaign) => {
    setEditingCampaign(campaign);
    setCampaignForm({
      subject: campaign.subject,
      content: campaign.content,
      html_content: campaign.html_content || '',
      status: (campaign.status === 'sent' || campaign.status === 'sending' || campaign.status === 'failed') 
        ? 'draft' 
        : campaign.status as 'draft' | 'scheduled',
      scheduled_at: campaign.scheduled_at ? campaign.scheduled_at.split('T')[0] : ''
    });
    setShowCreateModal(true);
  };

  const handleUseTemplate = (template: NewsletterTemplate) => {
    setCampaignForm(prev => ({
      ...prev,
      content: template.content,
      html_content: template.html_content || ''
    }));
    setShowCreateModal(true);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'newsletters', label: 'Newsletters' },
    { id: 'subscribers', label: 'Subscribers' },
    // { id: 'templates', label: 'Templates' }, // Temporarily disabled
  ];

  return (
    <AdminLayout
      title="Newsletter Management"
      subtitle="Manage newsletters and subscribers"
      icon={Mail}
      actions={
        <div className="flex items-center space-x-3">
          <button 
            onClick={loadNewsletterData}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-700 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button 
            onClick={handleExportSubscribers}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-700 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
          <button 
            onClick={async () => {
              setSuccess('Checking for scheduled campaigns...');
              await forceCheck();
              await loadNewsletterData();
              setSuccess('Scheduled campaigns processed!');
              setTimeout(() => setSuccess(null), 3000);
            }}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-700 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
            title="Check and process scheduled campaigns now"
          >
            <Calendar size={16} />
            <span>Process Scheduled</span>
          </button>
          <button 
            onClick={async () => {
              const email = prompt('Enter your email to send a test newsletter:');
              if (email) {
                setSuccess('Sending test email...');
                try {
                  const { ResendService } = await import('@/services/resendService');
                  const success = await ResendService.sendTestEmail(email);
                  if (success) {
                    setSuccess(`✅ Test email sent successfully to ${email}! Check your inbox.`);
                  } else {
                    setError('❌ Failed to send test email. Check console for details.');
                  }
                } catch (error) {
                  console.error('Test email error:', error);
                  setError('❌ Error sending test email. Check your Resend API key.');
                }
                setTimeout(() => {
                  setSuccess(null);
                  setError(null);
                }, 5000);
              }
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            title="Send a test email to verify Resend configuration"
          >
            <Mail size={16} />
            <span>Test Email</span>
          </button>
          <button 
            onClick={() => {
              resetCampaignForm();
              setEditingCampaign(null);
              setShowCreateModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={16} />
            <span>Create Newsletter</span>
          </button>
        </div>
      }
    >

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-900/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {statsDisplay.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-black rounded-xl shadow-sm border border-gray-800 p-6">
              <div className="flex items-center justify-between mb-2">
                <Icon size={20} className={stat.color} />
              </div>
              <div className="text-2xl font-bold text-white">
                {isLoading ? (
                  <div className="animate-pulse bg-gray-700 h-8 w-16 rounded"></div>
                ) : (
                  stat.value
                )}
              </div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800 mb-8">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="bg-black rounded-xl shadow-sm border border-gray-800 p-6">
                  <h3 className="font-semibold text-lg mb-4 text-white">Recent Activity</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <div className="text-sm font-medium text-white">Newsletter sent successfully</div>
                        <div className="text-xs text-gray-400">September Newsletter • 2 hours ago</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-gray-9000 rounded-full mt-2"></div>
                      <div>
                        <div className="text-sm font-medium text-white">23 new subscribers</div>
                        <div className="text-xs text-gray-400">This week</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div>
                        <div className="text-sm font-medium text-white">Template created</div>
                        <div className="text-xs text-gray-400">Event Announcement • 1 day ago</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-black rounded-xl shadow-sm border border-gray-800 p-6">
                  <h3 className="font-semibold text-lg mb-4 text-white">Quick Actions</h3>
                  <div className="space-y-3">
                    <button 
                      onClick={() => {
                        resetCampaignForm();
                        setEditingCampaign(null);
                        setShowCreateModal(true);
                      }}
                      className="w-full flex items-center space-x-3 p-3 border border-gray-800 rounded-lg hover:bg-gray-900 transition-colors text-white"
                    >
                      <Plus size={16} className="text-blue-600" />
                      <span>Create New Newsletter</span>
                    </button>
                    <button 
                      onClick={handleExportSubscribers}
                      className="w-full flex items-center space-x-3 p-3 border border-gray-800 rounded-lg hover:bg-gray-900 transition-colors text-white"
                    >
                      <Download size={16} className="text-blue-600" />
                      <span>Export Subscribers</span>
                    </button>

                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'newsletters' && (
            <div className="bg-black rounded-xl shadow-sm border border-gray-800">
              <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-lg text-white">Newsletter Campaigns ({campaigns.length})</h2>
                  <p className="text-sm text-gray-400 mt-1">Create and manage newsletter campaigns</p>
                </div>
                <button 
                  onClick={() => {
                    resetCampaignForm();
                    setEditingCampaign(null);
                    setShowCreateModal(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Plus size={16} />
                  <span>New Campaign</span>
                </button>
              </div>
              
              {isLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading campaigns...</p>
                </div>
              ) : campaigns.length === 0 ? (
                <div className="p-12 text-center">
                  <Mail size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="font-semibold text-lg mb-2 text-white">No campaigns yet</h3>
                  <p className="text-gray-400 mb-4">Create your first newsletter campaign to get started</p>
                  <button 
                    onClick={() => {
                      resetCampaignForm();
                      setEditingCampaign(null);
                      setShowCreateModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Create Campaign
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="p-6 hover:bg-gray-900/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-white">{campaign.subject}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              campaign.status === 'sent' ? 'bg-green-600 text-white' :
                              campaign.status === 'sending' ? 'bg-yellow-600 text-white' :
                              campaign.status === 'failed' ? 'bg-red-600 text-white' :
                              campaign.status === 'scheduled' ? 'bg-blue-600 text-white' :
                              'bg-gray-600 text-white'
                            }`}>
                              {campaign.status}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                            {campaign.scheduled_at && campaign.status === 'scheduled' && (
                              <span className="text-blue-400">
                                Scheduled: {new Date(campaign.scheduled_at).toLocaleString()}
                              </span>
                            )}
                            {campaign.sent_at && (
                              <span>Sent: {new Date(campaign.sent_at).toLocaleDateString()}</span>
                            )}
                            <span>Recipients: {campaign.recipient_count}</span>
                            {campaign.status === 'sent' && (
                              <>
                                <span>Opens: {campaign.open_count}</span>
                                <span>Clicks: {campaign.click_count}</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                            <button 
                              onClick={() => handleEditCampaign(campaign)}
                              className="p-2 hover:bg-gray-800 rounded-md transition-colors text-gray-400 hover:text-white"
                              title="Edit campaign"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                          
                          {campaign.status === 'draft' && (
                            <button 
                              onClick={() => handleSendCampaign(campaign.id)}
                              className="p-2 hover:bg-green-800 rounded-md transition-colors text-gray-400 hover:text-green-400"
                              title="Send now"
                            >
                              <Send size={16} />
                            </button>
                          )}
                          
                          {campaign.status === 'scheduled' && (
                            <button 
                              onClick={() => handleSendCampaign(campaign.id)}
                              className="p-2 hover:bg-yellow-800 rounded-md transition-colors text-gray-400 hover:text-yellow-400"
                              title="Send immediately (override schedule)"
                            >
                              <Send size={16} />
                            </button>
                          )}
                          
                          {campaign.status !== 'sent' && (
                            <button 
                              onClick={() => handleDeleteCampaign(campaign.id)}
                              className="p-2 hover:bg-red-800 rounded-md transition-colors text-gray-400 hover:text-red-400"
                              title="Delete campaign"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'subscribers' && (
            <div className="bg-black rounded-xl shadow-sm border border-gray-800">
              <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-lg text-white">Subscribers ({subscribers.length})</h2>
                  <p className="text-sm text-gray-400 mt-1">Manage newsletter subscribers</p>
                </div>
                <button 
                  onClick={handleExportSubscribers}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-700 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
                >
                  <Download size={16} />
                  <span>Export CSV</span>
                </button>
              </div>
              
              {isLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading subscribers...</p>
                </div>
              ) : subscribers.length === 0 ? (
                <div className="p-12 text-center">
                  <Users size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="font-semibold text-lg mb-2 text-white">No subscribers yet</h3>
                  <p className="text-gray-400">Newsletter subscribers will appear here once people sign up</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {subscribers.map((subscriber) => (
                    <div key={subscriber.id} className="p-6 hover:bg-gray-900/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <div className="font-medium text-white">{subscriber.email}</div>
                            {subscriber.name && (
                              <div className="text-sm text-gray-400">({subscriber.name})</div>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>Subscribed: {new Date(subscriber.subscribed_at).toLocaleDateString()}</span>
                            {subscriber.confirmed_at && (
                              <span>Confirmed: {new Date(subscriber.confirmed_at).toLocaleDateString()}</span>
                            )}
                            {!subscriber.confirmed_at && subscriber.is_active && (
                              <span className="text-yellow-400">Pending confirmation</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            subscriber.is_active 
                              ? subscriber.confirmed_at 
                                ? 'bg-green-600 text-white' 
                                : 'bg-yellow-600 text-white'
                              : 'bg-red-600 text-white'
                          }`}>
                            {subscriber.is_active 
                              ? subscriber.confirmed_at 
                                ? 'Active' 
                                : 'Pending'
                              : 'Unsubscribed'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="bg-black rounded-xl shadow-sm border border-gray-800">
              <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-lg text-white">Newsletter Templates ({templates.length})</h2>
                  <p className="text-sm text-gray-400 mt-1">Reusable templates for newsletter campaigns</p>
                </div>
                <button 
                  onClick={() => {
                    resetTemplateForm();
                    setEditingTemplate(null);
                    setShowTemplateModal(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Plus size={16} />
                  <span>New Template</span>
                </button>
              </div>
              
              {isLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading templates...</p>
                </div>
              ) : templates.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="font-semibold text-lg mb-2 text-white">No templates yet</h3>
                  <p className="text-gray-400 mb-4">Create your first newsletter template</p>
                  <button 
                    onClick={() => {
                      resetTemplateForm();
                      setEditingTemplate(null);
                      setShowTemplateModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Create Template
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  {templates.map((template) => (
                    <div key={template.id} className="border border-gray-800 rounded-lg p-4 hover:bg-gray-900/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">{template.name}</h3>
                          {template.description && (
                            <p className="text-sm text-gray-400 mb-2">{template.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 mb-3">
                        Created: {new Date(template.created_at).toLocaleDateString()}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleUseTemplate(template)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          Use Template
                        </button>
                        <button 
                          onClick={() => {
                            setEditingTemplate(template);
                            setTemplateForm({
                              name: template.name,
                              description: template.description || '',
                              content: template.content,
                              html_content: template.html_content || ''
                            });
                            setShowTemplateModal(true);
                          }}
                          className="p-2 hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-white"
                        >
                          <Edit size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
      </div>

      {/* Create/Edit Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-black rounded-xl shadow-xl border border-gray-800 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex-shrink-0 p-6 border-b border-gray-800">
              <h2 className="text-xl font-semibold text-white">
                {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={editingCampaign ? handleUpdateCampaign : handleCreateCampaign} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Subject *</label>
                  <input
                    type="text"
                    required
                    value={campaignForm.subject}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                    placeholder="Newsletter subject line"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Content *</label>
                  <textarea
                    rows={10}
                    required
                    value={campaignForm.content}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                    placeholder="Newsletter content (plain text)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">HTML Content (Optional)</label>
                  <textarea
                    rows={8}
                    value={campaignForm.html_content}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, html_content: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                    placeholder="HTML version of the newsletter (optional)"
                  />
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Delivery Options</label>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="deliveryOption"
                          value="draft"
                          checked={campaignForm.status === 'draft'}
                          onChange={(e) => setCampaignForm(prev => ({ ...prev, status: 'draft', scheduled_at: '' }))}
                          className="w-4 h-4 text-blue-600 bg-black border border-gray-700 focus:ring-blue-400 focus:ring-2"
                        />
                        <div>
                          <div className="text-white font-medium">Save as Draft</div>
                          <div className="text-sm text-gray-400">Save for later editing and manual sending</div>
                        </div>
                      </label>
                      
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="deliveryOption"
                          value="send_now"
                          checked={campaignForm.status === 'send_now'}
                          onChange={(e) => setCampaignForm(prev => ({ ...prev, status: 'send_now', scheduled_at: '' }))}
                          className="w-4 h-4 text-blue-600 bg-black border border-gray-700 focus:ring-blue-400 focus:ring-2"
                        />
                        <div>
                          <div className="text-white font-medium">Send Immediately</div>
                          <div className="text-sm text-gray-400">Send to all subscribers right away</div>
                        </div>
                      </label>
                      
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="deliveryOption"
                          value="scheduled"
                          checked={campaignForm.status === 'scheduled'}
                          onChange={(e) => setCampaignForm(prev => ({ ...prev, status: 'scheduled' }))}
                          className="w-4 h-4 text-blue-600 bg-black border border-gray-700 focus:ring-blue-400 focus:ring-2"
                        />
                        <div>
                          <div className="text-white font-medium">Schedule for Later</div>
                          <div className="text-sm text-gray-400">Automatically send at a specific date and time</div>
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  {campaignForm.status === 'scheduled' && (
                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-4">Schedule Settings</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                          <input
                            type="date"
                            required={campaignForm.status === 'scheduled'}
                            value={campaignForm.scheduled_at ? campaignForm.scheduled_at.split('T')[0] : ''}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => {
                              const currentTime = campaignForm.scheduled_at ? campaignForm.scheduled_at.split('T')[1] : '09:00';
                              setCampaignForm(prev => ({ 
                                ...prev, 
                                scheduled_at: e.target.value ? `${e.target.value}T${currentTime}` : ''
                              }));
                            }}
                            className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
                          <input
                            type="time"
                            required={campaignForm.status === 'scheduled'}
                            value={campaignForm.scheduled_at ? campaignForm.scheduled_at.split('T')[1]?.substring(0, 5) : '09:00'}
                            onChange={(e) => {
                              const currentDate = campaignForm.scheduled_at ? campaignForm.scheduled_at.split('T')[0] : new Date().toISOString().split('T')[0];
                              setCampaignForm(prev => ({ 
                                ...prev, 
                                scheduled_at: `${currentDate}T${e.target.value}:00`
                              }));
                            }}
                            className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                          />
                        </div>
                      </div>
                      
                      {campaignForm.scheduled_at && (
                        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                          <div className="text-sm text-blue-400">
                            <strong>Scheduled for:</strong> {new Date(campaignForm.scheduled_at).toLocaleString()}
                          </div>
                          <div className="text-xs text-blue-300 mt-1">
                            The newsletter will be automatically sent to all active subscribers at this time.
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingCampaign(null);
                      resetCampaignForm();
                    }}
                    className="flex-1 px-6 py-3 border border-gray-700 rounded-lg hover:bg-gray-900 transition-colors font-medium text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-black rounded-xl shadow-xl border border-gray-800 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex-shrink-0 p-6 border-b border-gray-800">
              <h2 className="text-xl font-semibold text-white">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleCreateTemplate} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Template Name *</label>
                  <input
                    type="text"
                    required
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                    placeholder="Template name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <input
                    type="text"
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                    placeholder="Brief description of the template"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Content *</label>
                  <textarea
                    rows={10}
                    required
                    value={templateForm.content}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                    placeholder="Template content (use [PLACEHOLDER] for dynamic content)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">HTML Content (Optional)</label>
                  <textarea
                    rows={8}
                    value={templateForm.html_content}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, html_content: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                    placeholder="HTML version of the template"
                  />
                </div>
                
                <div className="flex space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTemplateModal(false);
                      setEditingTemplate(null);
                      resetTemplateForm();
                    }}
                    className="flex-1 px-6 py-3 border border-gray-700 rounded-lg hover:bg-gray-900 transition-colors font-medium text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminNewsletter;