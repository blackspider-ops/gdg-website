import React, { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useDev } from '@/contexts/DevContext';
import { Navigate } from 'react-router-dom';
import { Building2, Plus, Edit3, Trash2, ExternalLink, Mail, User, Search, Filter } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

const AdminSponsors = () => {
  const { isAuthenticated } = useAdmin();
  const { isDevelopmentMode, allowDirectAdminAccess } = useDev();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddSponsorModal, setShowAddSponsorModal] = useState(false);

  const canAccess = isAuthenticated || (isDevelopmentMode && allowDirectAdminAccess);

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  // Sponsors data
  const sponsors = [
    {
      id: 1,
      name: 'Google',
      tier: 'Platinum',
      logo: 'https://logo.clearbit.com/google.com',
      website: 'https://google.com',
      contactEmail: 'partnerships@google.com',
      contactPerson: 'Alex Johnson',
      sponsorshipAmount: '$10,000',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      benefits: ['Logo on website', 'Event speaking slots', 'Recruitment access'],
      status: 'active'
    },
    {
      id: 2,
      name: 'Microsoft',
      tier: 'Gold',
      logo: 'https://logo.clearbit.com/microsoft.com',
      website: 'https://microsoft.com',
      contactEmail: 'university@microsoft.com',
      contactPerson: 'Sarah Chen',
      sponsorshipAmount: '$5,000',
      startDate: '2024-02-01',
      endDate: '2024-12-31',
      benefits: ['Logo on materials', 'Workshop opportunities'],
      status: 'active'
    },
    {
      id: 3,
      name: 'Amazon',
      tier: 'Silver',
      logo: 'https://logo.clearbit.com/amazon.com',
      website: 'https://amazon.com',
      contactEmail: 'students@amazon.com',
      contactPerson: 'David Park',
      sponsorshipAmount: '$2,500',
      startDate: '2024-03-01',
      endDate: '2024-12-31',
      benefits: ['Event participation', 'Swag provision'],
      status: 'pending'
    },
    {
      id: 4,
      name: 'Meta',
      tier: 'Gold',
      logo: 'https://logo.clearbit.com/meta.com',
      website: 'https://meta.com',
      contactEmail: 'university@meta.com',
      contactPerson: 'Lisa Wang',
      sponsorshipAmount: '$7,500',
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      benefits: ['Logo placement', 'Hackathon support', 'Mentorship program'],
      status: 'active'
    },
    {
      id: 5,
      name: 'Apple',
      tier: 'Bronze',
      logo: 'https://logo.clearbit.com/apple.com',
      website: 'https://apple.com',
      contactEmail: 'education@apple.com',
      contactPerson: 'John Smith',
      sponsorshipAmount: '$1,500',
      startDate: '2024-06-01',
      endDate: '2024-12-31',
      benefits: ['Swag provision', 'Student discounts'],
      status: 'active'
    }
  ];

  // Form state
  const [newSponsor, setNewSponsor] = useState({
    name: '',
    tier: 'Bronze',
    website: '',
    contactEmail: '',
    contactPerson: '',
    sponsorshipAmount: '',
    startDate: '',
    endDate: '',
    benefits: []
  });

  const filteredSponsors = sponsors.filter(sponsor => {
    const matchesSearch = sponsor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sponsor.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sponsor.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = filterTier === 'all' || sponsor.tier.toLowerCase() === filterTier.toLowerCase();
    const matchesStatus = filterStatus === 'all' || sponsor.status === filterStatus;
    return matchesSearch && matchesTier && matchesStatus;
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'Gold': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Silver': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'Bronze': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const sponsorStats = [
    { label: 'Total Sponsors', value: sponsors.length.toString(), color: 'text-blue-500' },
    { label: 'Active Sponsors', value: sponsors.filter(s => s.status === 'active').length.toString(), color: 'text-green-500' },
    { label: 'Platinum Tier', value: sponsors.filter(s => s.tier === 'Platinum').length.toString(), color: 'text-gray-500' },
    { label: 'Total Value', value: '$26,500', color: 'text-purple-500' },
  ];

  return (
    <AdminLayout
      title="Sponsor Management"
      subtitle="Manage corporate sponsors and partnerships"
      icon={Building2}
      actions={
        <button 
          onClick={() => setShowAddSponsorModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Plus size={16} />
          <span>Add Sponsor</span>
        </button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {sponsorStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <Building2 size={24} className={stat.color} />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Sponsorship Tiers Overview */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sponsorship Tiers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {['Platinum', 'Gold', 'Silver', 'Bronze'].map((tier) => {
            const count = sponsors.filter(s => s.tier === tier).length;
            const totalValue = sponsors
              .filter(s => s.tier === tier)
              .reduce((sum, s) => sum + parseInt(s.sponsorshipAmount.replace(/[$,]/g, '')), 0);
            
            return (
              <div key={tier} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-3 py-1 text-sm rounded-full font-medium border ${getTierColor(tier)}`}>
                    {tier}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{count} sponsors</span>
                </div>
                <p className="text-xs text-gray-500">Total: ${totalValue.toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search sponsors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Filter size={16} className="text-gray-400" />
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="all">All Tiers</option>
              <option value="platinum">Platinum</option>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="bronze">Bronze</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sponsors List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Sponsors ({filteredSponsors.length})</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredSponsors.map((sponsor) => (
            <div key={sponsor.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {sponsor.logo ? (
                      <img src={sponsor.logo} alt={sponsor.name} className="w-12 h-12 object-contain" />
                    ) : (
                      <Building2 size={24} className="text-gray-400" />
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{sponsor.name}</h3>
                      <span className={`px-3 py-1 text-xs rounded-full font-medium border ${getTierColor(sponsor.tier)}`}>
                        {sponsor.tier}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        sponsor.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : sponsor.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {sponsor.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <div className="flex items-center space-x-1">
                        <Mail size={14} />
                        <span>{sponsor.contactEmail}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User size={14} />
                        <span>{sponsor.contactPerson}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ExternalLink size={14} />
                        <a href={sponsor.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                          Website
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                      <span className="font-medium">{sponsor.sponsorshipAmount}</span>
                      <span>{new Date(sponsor.startDate).toLocaleDateString()} - {new Date(sponsor.endDate).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-3">
                      {sponsor.benefits.map((benefit, index) => (
                        <span key={index} className="px-3 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900">
                    <Edit3 size={16} />
                  </button>
                  <button className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-600 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Sponsor Modal */}
      {showAddSponsorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New Sponsor</h2>
            </div>
            
            <form className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={newSponsor.name}
                    onChange={(e) => setNewSponsor(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Google"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sponsorship Tier</label>
                  <select
                    value={newSponsor.tier}
                    onChange={(e) => setNewSponsor(prev => ({ ...prev, tier: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="Bronze">Bronze</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Platinum">Platinum</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    value={newSponsor.website}
                    onChange={(e) => setNewSponsor(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="https://google.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sponsorship Amount</label>
                  <input
                    type="text"
                    value={newSponsor.sponsorshipAmount}
                    onChange={(e) => setNewSponsor(prev => ({ ...prev, sponsorshipAmount: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="$5,000"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                  <input
                    type="text"
                    value={newSponsor.contactPerson}
                    onChange={(e) => setNewSponsor(prev => ({ ...prev, contactPerson: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Alex Johnson"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                  <input
                    type="email"
                    value={newSponsor.contactEmail}
                    onChange={(e) => setNewSponsor(prev => ({ ...prev, contactEmail: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="partnerships@google.com"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={newSponsor.startDate}
                    onChange={(e) => setNewSponsor(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={newSponsor.endDate}
                    onChange={(e) => setNewSponsor(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAddSponsorModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Add Sponsor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminSponsors;