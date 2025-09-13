import React, { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useDev } from '@/contexts/DevContext';
import { Navigate } from 'react-router-dom';
import { Mail, Send, Users, Eye, Calendar, Plus, Edit, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

const AdminNewsletter = () => {
  const { isAuthenticated } = useAdmin();
  const { isDevelopmentMode, allowDirectAdminAccess } = useDev();
  const [activeTab, setActiveTab] = useState('overview');

  const canAccess = isAuthenticated || (isDevelopmentMode && allowDirectAdminAccess);

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  const stats = [
    { label: 'Total Subscribers', value: '1,247', color: 'text-blue-500', icon: Users },
    { label: 'Newsletters Sent', value: '23', color: 'text-green-500', icon: Send },
    { label: 'Open Rate', value: '68%', color: 'text-purple-500', icon: Eye },
    { label: 'This Month', value: '3', color: 'text-orange-500', icon: Calendar },
  ];

  const newsletters = [
    {
      id: 1,
      subject: 'GDG@PSU September Newsletter',
      status: 'sent',
      sentDate: '2024-09-01',
      recipients: 1247,
      openRate: '72%',
      clickRate: '15%'
    },
    {
      id: 2,
      subject: 'Upcoming Workshop: React Fundamentals',
      status: 'draft',
      createdDate: '2024-09-10',
      recipients: 0,
      openRate: '-',
      clickRate: '-'
    },
    {
      id: 3,
      subject: 'August Event Recap & Photos',
      status: 'sent',
      sentDate: '2024-08-15',
      recipients: 1189,
      openRate: '68%',
      clickRate: '12%'
    }
  ];

  const subscribers = [
    { email: 'john.doe@psu.edu', subscribed: '2024-01-15', status: 'active' },
    { email: 'jane.smith@psu.edu', subscribed: '2024-02-20', status: 'active' },
    { email: 'mike.j@psu.edu', subscribed: '2024-03-10', status: 'active' },
    { email: 'sarah.wilson@psu.edu', subscribed: '2024-04-05', status: 'unsubscribed' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'newsletters', label: 'Newsletters' },
    { id: 'subscribers', label: 'Subscribers' },
    { id: 'templates', label: 'Templates' },
  ];

  return (
    <AdminLayout
      title="Newsletter Management"
      subtitle="Manage newsletters and subscribers"
      icon={Mail}
      actions={
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          <Plus size={16} />
          <span>Create Newsletter</span>
        </button>
      }
    >

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-black rounded-xl shadow-sm border border-gray-800 p-6">
              <div className="flex items-center justify-between mb-2">
                <Icon size={20} className={stat.color} />
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
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
                    <button className="w-full flex items-center space-x-3 p-3 border border-gray-800 rounded-lg hover:bg-gray-900 transition-colors text-white">
                      <Plus size={16} className="text-blue-600" />
                      <span>Create New Newsletter</span>
                    </button>
                    <button className="w-full flex items-center space-x-3 p-3 border border-gray-800 rounded-lg hover:bg-gray-900 transition-colors text-white">
                      <Users size={16} className="text-blue-600" />
                      <span>Export Subscribers</span>
                    </button>
                    <button className="w-full flex items-center space-x-3 p-3 border border-gray-800 rounded-lg hover:bg-gray-900 transition-colors text-white">
                      <Eye size={16} className="text-blue-600" />
                      <span>View Analytics</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'newsletters' && (
            <div className="bg-black rounded-xl shadow-sm border border-gray-800">
              <div className="p-6 border-b border-gray-800">
                <h2 className="font-semibold text-lg text-white">All Newsletters</h2>
              </div>
              
              <div className="divide-y divide-border">
                {newsletters.map((newsletter) => (
                  <div key={newsletter.id} className="p-6 hover:bg-gray-900/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold mb-2 text-white">{newsletter.subject}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            newsletter.status === 'sent' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {newsletter.status}
                          </span>
                          <span>
                            {newsletter.status === 'sent' 
                              ? `Sent ${new Date(newsletter.sentDate).toLocaleDateString()}`
                              : `Created ${new Date(newsletter.createdDate).toLocaleDateString()}`
                            }
                          </span>
                          <span>{newsletter.recipients} recipients</span>
                          {newsletter.status === 'sent' && (
                            <>
                              <span>Open: {newsletter.openRate}</span>
                              <span>Click: {newsletter.clickRate}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button className="p-2 hover:bg-gray-900 rounded-md transition-colors text-gray-400 hover:text-white">
                          <Eye size={16} />
                        </button>
                        <button className="p-2 hover:bg-gray-900 rounded-md transition-colors text-gray-400 hover:text-white">
                          <Edit size={16} />
                        </button>
                        <button className="p-2 hover:bg-red-100 rounded-md transition-colors text-gray-400 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'subscribers' && (
            <div className="bg-black rounded-xl shadow-sm border border-gray-800">
              <div className="p-6 border-b border-gray-800">
                <h2 className="font-semibold text-lg text-white">Subscribers</h2>
              </div>
              
              <div className="divide-y divide-border">
                {subscribers.map((subscriber, index) => (
                  <div key={index} className="p-6 hover:bg-gray-900/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white">{subscriber.email}</div>
                        <div className="text-sm text-gray-400">
                          Subscribed {new Date(subscriber.subscribed).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          subscriber.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {subscriber.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="bg-black rounded-xl shadow-sm border border-gray-800 p-6">
              <div className="text-center py-12">
                <Mail size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="font-semibold text-lg mb-2 text-white">No templates yet</h3>
                <p className="text-gray-400 mb-4">Create your first newsletter template</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-600/90 transition-colors font-medium">
                  Create Template
                </button>
              </div>
            </div>
          )}
      </div>
    </AdminLayout>
  );
};

export default AdminNewsletter;