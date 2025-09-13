import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useDev } from '@/contexts/DevContext';
import { Navigate } from 'react-router-dom';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { Building2, Plus, Edit3, Trash2, ExternalLink, Mail, User, Search, Filter } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { SponsorsService, type Sponsor } from '@/services/sponsorsService';

const AdminSponsors = () => {
  const { isAuthenticated } = useAdmin();
  const { isDevelopmentMode, allowDirectAdminAccess } = useDev();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [sponsorStats, setSponsorStats] = useState({
    total: 0,
    active: 0,
    tierDistribution: {} as Record<string, number>
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddSponsorModal, setShowAddSponsorModal] = useState(false);
  const [showEditSponsorModal, setShowEditSponsorModal] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Lock body scroll when modal is open
  useBodyScrollLock(showAddSponsorModal || showEditSponsorModal);

  const canAccess = isAuthenticated || (isDevelopmentMode && allowDirectAdminAccess);

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  // Load sponsors and stats
  useEffect(() => {
    loadSponsors();
    loadSponsorStats();
  }, []);

  const loadSponsors = async () => {
    setIsLoading(true);
    try {
      const sponsorsData = await SponsorsService.getAllSponsors();
      setSponsors(sponsorsData);
    } catch (error) {
      console.error('Error loading sponsors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSponsorStats = async () => {
    try {
      const stats = await SponsorsService.getSponsorStats();
      setSponsorStats(stats);
    } catch (error) {
      console.error('Error loading sponsor stats:', error);
    }
  };

  // Form state
  const [newSponsor, setNewSponsor] = useState({
    name: '',
    tier: 'bronze' as Sponsor['tier'],
    logo_url: '',
    website_url: '',
    order_index: 0,
    is_active: true
  });

  const filteredSponsors = sponsors.filter(sponsor => {
    const matchesSearch = sponsor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sponsor.website_url && sponsor.website_url.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTier = filterTier === 'all' || sponsor.tier.toLowerCase() === filterTier.toLowerCase();
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && sponsor.is_active) ||
      (filterStatus === 'inactive' && !sponsor.is_active);
    return matchesSearch && matchesTier && matchesStatus;
  });

  const handleCreateSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const created = await SponsorsService.createSponsor(newSponsor);
      if (created) {
        await loadSponsors();
        await loadSponsorStats();
        setShowAddSponsorModal(false);
        resetForm();
        setSuccess('Sponsor added successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to create sponsor. Please try again.');
      }
    } catch (error) {
      console.error('Error creating sponsor:', error);
      setError('An error occurred while creating the sponsor.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditSponsor = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setNewSponsor({
      name: sponsor.name,
      tier: sponsor.tier,
      logo_url: sponsor.logo_url || '',
      website_url: sponsor.website_url || '',
      order_index: sponsor.order_index,
      is_active: sponsor.is_active
    });
    setShowEditSponsorModal(true);
  };

  const handleUpdateSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSponsor) return;

    setIsSaving(true);
    setError(null);

    try {
      const updated = await SponsorsService.updateSponsor(editingSponsor.id, newSponsor);
      if (updated) {
        await loadSponsors();
        await loadSponsorStats();
        setShowEditSponsorModal(false);
        setEditingSponsor(null);
        resetForm();
        setSuccess('Sponsor updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to update sponsor. Please try again.');
      }
    } catch (error) {
      console.error('Error updating sponsor:', error);
      setError('An error occurred while updating the sponsor.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setNewSponsor({
      name: '',
      tier: 'bronze',
      logo_url: '',
      website_url: '',
      order_index: 0,
      is_active: true
    });
    setError(null);
    setSuccess(null);
  };

  const handleDeleteSponsor = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this sponsor? This action cannot be undone.')) {
      setError(null);

      try {
        const success = await SponsorsService.deleteSponsor(id);
        if (success) {
          await loadSponsors();
          await loadSponsorStats();
          setSuccess('Sponsor deleted successfully!');
          setTimeout(() => setSuccess(null), 3000);
        } else {
          setError('Failed to delete sponsor. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting sponsor:', error);
        setError('An error occurred while deleting the sponsor.');
      }
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 'bg-gray-100 text-gray-800 border-gray-700';
      case 'Gold': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Silver': return 'bg-gray-900 text-gray-300 border-gray-800';
      case 'Bronze': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-700';
    }
  };

  const sponsorStatsDisplay = [
    { label: 'Total Sponsors', value: sponsorStats.total.toString(), color: 'text-blue-500' },
    { label: 'Active Sponsors', value: sponsorStats.active.toString(), color: 'text-green-500' },
    { label: 'Platinum Tier', value: (sponsorStats.tierDistribution.platinum || 0).toString(), color: 'text-gray-500' },
    { label: 'Gold Tier', value: (sponsorStats.tierDistribution.gold || 0).toString(), color: 'text-yellow-500' },
  ];

  return (
    <AdminLayout
      title="Sponsor Management"
      subtitle="Manage corporate sponsors and partnerships"
      icon={Building2}
      actions={
        <button
          onClick={() => {
            resetForm();
            setShowAddSponsorModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Plus size={16} />
          <span>Add Sponsor</span>
        </button>
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
        {sponsorStatsDisplay.map((stat, index) => (
          <div key={index} className="bg-black rounded-xl p-6 shadow-sm border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <Building2 size={24} className={stat.color} />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-sm text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Sponsorship Tiers Overview */}
      <div className="bg-black rounded-xl p-6 shadow-sm border border-gray-800 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Sponsorship Tiers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {['platinum', 'gold', 'silver', 'bronze'].map((tier) => {
            const count = sponsorStats.tierDistribution[tier] || 0;

            return (
              <div key={tier} className="border border-gray-800 rounded-lg p-4 hover:bg-gray-900 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-3 py-1 text-sm rounded-full font-medium border ${getTierColor(tier.charAt(0).toUpperCase() + tier.slice(1))}`}>
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </span>
                  <span className="text-sm font-medium text-white">{count} sponsors</span>
                </div>
                <p className="text-xs text-gray-500">Active tier sponsors</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-black rounded-xl p-6 shadow-sm border border-gray-800 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search sponsors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Filter size={16} className="text-gray-400" />
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white"
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
              className="px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sponsors List */}
      <div className="bg-black rounded-xl shadow-sm border border-gray-800">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Sponsors ({filteredSponsors.length})</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading sponsors...</p>
            </div>
          ) : filteredSponsors.length === 0 ? (
            <div className="p-6 text-center">
              <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No sponsors found</h3>
              <p className="text-gray-400">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredSponsors.map((sponsor) => (
              <div key={sponsor.id} className="p-6 hover:bg-gray-900 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {sponsor.logo_url ? (
                        <img src={sponsor.logo_url} alt={sponsor.name} className="w-12 h-12 object-contain" />
                      ) : (
                        <Building2 size={24} className="text-gray-400" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-lg font-semibold text-white">{sponsor.name}</h3>
                        <span className={`px-3 py-1 text-xs rounded-full font-medium border ${getTierColor(sponsor.tier.charAt(0).toUpperCase() + sponsor.tier.slice(1))}`}>
                          {sponsor.tier.charAt(0).toUpperCase() + sponsor.tier.slice(1)}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${sponsor.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                          }`}>
                          {sponsor.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        {sponsor.website_url && (
                          <div className="flex items-center space-x-1">
                            <ExternalLink size={14} />
                            <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                              Website
                            </a>
                          </div>
                        )}
                        <span>Order: {sponsor.order_index}</span>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-400 mt-2">
                        <span>Created: {new Date(sponsor.created_at).toLocaleDateString()}</span>
                        <span>Updated: {new Date(sponsor.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditSponsor(sponsor)}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                      title="Edit sponsor"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteSponsor(sponsor.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Sponsor Modal */}
      {showAddSponsorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-black rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl border border-gray-800">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-semibold text-white">Add New Sponsor</h2>
            </div>

            <form onSubmit={handleCreateSponsor} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                  <input
                    type="text"
                    required
                    value={newSponsor.name}
                    onChange={(e) => setNewSponsor(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                    placeholder="Google"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sponsorship Tier</label>
                  <select
                    value={newSponsor.tier}
                    onChange={(e) => setNewSponsor(prev => ({ ...prev, tier: e.target.value as Sponsor['tier'] }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                  >
                    <option value="bronze">Bronze</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                    <option value="platinum">Platinum</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Website URL</label>
                  <input
                    type="url"
                    value={newSponsor.website_url}
                    onChange={(e) => setNewSponsor(prev => ({ ...prev, website_url: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                    placeholder="https://google.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Logo URL</label>
                  <input
                    type="url"
                    value={newSponsor.logo_url}
                    onChange={(e) => setNewSponsor(prev => ({ ...prev, logo_url: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                    placeholder="https://logo.clearbit.com/google.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Order Index</label>
                  <input
                    type="number"
                    value={newSponsor.order_index}
                    onChange={(e) => setNewSponsor(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-8">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={newSponsor.is_active}
                    onChange={(e) => setNewSponsor(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 text-green-600 bg-black border border-gray-700 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-300">Active Sponsor</label>
                </div>
              </div>

              <div className="flex space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSponsorModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 border border-gray-700 rounded-lg hover:bg-gray-900 transition-colors font-medium text-gray-300"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    'Add Sponsor'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Sponsor Modal */}
      {showEditSponsorModal && editingSponsor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-black rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl border border-gray-800">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-semibold text-white">Edit Sponsor</h2>
              <p className="text-sm text-gray-400 mt-1">Update {editingSponsor.name} information</p>
            </div>

            <form onSubmit={handleUpdateSponsor} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                  <input
                    type="text"
                    required
                    value={newSponsor.name}
                    onChange={(e) => setNewSponsor(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                    placeholder="Google"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sponsorship Tier</label>
                  <select
                    value={newSponsor.tier}
                    onChange={(e) => setNewSponsor(prev => ({ ...prev, tier: e.target.value as Sponsor['tier'] }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                  >
                    <option value="bronze">Bronze</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                    <option value="platinum">Platinum</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Website URL</label>
                  <input
                    type="url"
                    value={newSponsor.website_url}
                    onChange={(e) => setNewSponsor(prev => ({ ...prev, website_url: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                    placeholder="https://google.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Logo URL</label>
                  <input
                    type="url"
                    value={newSponsor.logo_url}
                    onChange={(e) => setNewSponsor(prev => ({ ...prev, logo_url: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                    placeholder="https://logo.clearbit.com/google.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Order Index</label>
                  <input
                    type="number"
                    value={newSponsor.order_index}
                    onChange={(e) => setNewSponsor(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-8">
                  <input
                    type="checkbox"
                    id="edit_is_active"
                    checked={newSponsor.is_active}
                    onChange={(e) => setNewSponsor(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 text-green-600 bg-black border border-gray-700 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <label htmlFor="edit_is_active" className="text-sm font-medium text-gray-300">Active Sponsor</label>
                </div>
              </div>

              <div className="flex space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditSponsorModal(false);
                    setEditingSponsor(null);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 border border-gray-700 rounded-lg hover:bg-gray-900 transition-colors font-medium text-gray-300"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    'Update Sponsor'
                  )}
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