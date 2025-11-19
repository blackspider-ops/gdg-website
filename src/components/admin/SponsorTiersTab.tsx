import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Award } from 'lucide-react';
import { SponsorContentService, type SponsorshipTier } from '@/services/sponsorContentService';

const SponsorTiersTab = () => {
  const [tiers, setTiers] = useState<SponsorshipTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTier, setEditingTier] = useState<SponsorshipTier | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    tier_name: '',
    tier_level: 'bronze' as 'platinum' | 'gold' | 'silver' | 'bronze',
    amount: '',
    color_gradient: 'bg-gradient-to-r from-orange-400 to-orange-600',
    benefits: [''],
    order_index: 0,
    is_active: true
  });

  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    setIsLoading(true);
    const data = await SponsorContentService.getAllTiers();
    setTiers(data);
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      tier_name: '',
      tier_level: 'bronze',
      amount: '',
      color_gradient: 'bg-gradient-to-r from-orange-400 to-orange-600',
      benefits: [''],
      order_index: 0,
      is_active: true
    });
    setEditingTier(null);
    setError(null);
  };

  const handleEdit = (tier: SponsorshipTier) => {
    setEditingTier(tier);
    setFormData({
      tier_name: tier.tier_name,
      tier_level: tier.tier_level,
      amount: tier.amount,
      color_gradient: tier.color_gradient,
      benefits: tier.benefits.length > 0 ? tier.benefits : [''],
      order_index: tier.order_index,
      is_active: tier.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const benefits = formData.benefits.filter(b => b.trim() !== '');
    
    if (benefits.length === 0) {
      setError('Please add at least one benefit');
      setIsSaving(false);
      return;
    }

    const tierData = {
      tier_name: formData.tier_name,
      tier_level: formData.tier_level,
      amount: formData.amount,
      color_gradient: formData.color_gradient,
      benefits: benefits,
      order_index: formData.order_index,
      is_active: formData.is_active
    };

    try {
      if (editingTier) {
        const result = await SponsorContentService.updateTier(editingTier.id, tierData);
        if (result) {
          setSuccess('Tier updated successfully!');
        } else {
          setError('Failed to update tier');
          setIsSaving(false);
          return;
        }
      } else {
        const result = await SponsorContentService.createTier(tierData);
        if (result) {
          setSuccess('Tier created successfully!');
        } else {
          setError('Failed to create tier');
          setIsSaving(false);
          return;
        }
      }
      
      setShowModal(false);
      resetForm();
      
      // Small delay to ensure database has committed the changes
      setTimeout(async () => {
        await loadTiers();
      }, 100);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to save tier');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const tierToDelete = tiers.find(t => t.id === id);
    if (!tierToDelete) return;
    
    if (window.confirm(`Are you sure you want to delete the ${tierToDelete.tier_name} tier? Any sponsors in this tier will be moved to the next lower tier.`)) {
      const success = await SponsorContentService.deleteTier(id, tierToDelete.tier_level);
      if (success) {
        setSuccess('Tier deleted successfully and sponsors moved!');
        await loadTiers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to delete tier');
      }
    }
  };

  const addBenefit = () => {
    setFormData(prev => ({ ...prev, benefits: [...prev.benefits, ''] }));
  };

  const updateBenefit = (index: number, value: string) => {
    const newBenefits = [...formData.benefits];
    newBenefits[index] = value;
    setFormData(prev => ({ ...prev, benefits: newBenefits }));
  };

  const removeBenefit = (index: number) => {
    setFormData(prev => ({ ...prev, benefits: prev.benefits.filter((_, i) => i !== index) }));
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-900/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Sponsorship Tiers</h3>
          <p className="text-sm text-muted-foreground">Manage tier levels, pricing, and benefits</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          <span>Add Tier</span>
        </button>
      </div>

      {/* Tiers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-2 text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : tiers.length === 0 ? (
          <div className="col-span-2 text-center py-8">
            <p className="text-muted-foreground">No tiers found. Add your first tier!</p>
          </div>
        ) : (
          tiers.map((tier) => (
            <div key={tier.id} className="bg-card border border-border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 ${tier.color_gradient} rounded-lg flex items-center justify-center`}>
                    <Award className="text-foreground" size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{tier.tier_name}</h4>
                    <p className="text-sm text-primary font-bold">{tier.amount}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(tier)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(tier.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                {tier.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="w-1 h-1 bg-primary rounded-full mr-2 mt-2"></span>
                    {benefit}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>Order: {tier.order_index}</span>
                <span className={tier.is_active ? 'text-green-500' : 'text-red-500'}>
                  {tier.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => {
            setShowModal(false);
            resetForm();
          }}
        >
          <div 
            className="bg-card rounded-xl shadow-xl border border-border w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="flex-shrink-0 p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                {editingTier ? 'Edit Tier' : 'Add New Tier'}
              </h2>
            </div>

            {/* Scrollable Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tier Name</label>
                <input
                  type="text"
                  required
                  value={formData.tier_name}
                  onChange={(e) => {
                    const name = e.target.value;
                    // Auto-generate tier_level from name (lowercase, no spaces)
                    const level = name.toLowerCase().replace(/\s+/g, '_');
                    setFormData(prev => ({ ...prev, tier_name: name, tier_level: level as any }));
                  }}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground bg-card"
                  placeholder="Platinum"
                />
                <p className="text-xs text-muted-foreground mt-1">The display name for this sponsorship tier</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                  <input
                    type="text"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground bg-card"
                    placeholder="$5,000+"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Display Order (Priority)</label>
                  <input
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground bg-card"
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Lower numbers appear first (0 = highest priority)</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Color Gradient (Tailwind class)</label>
                <input
                  type="text"
                  required
                  value={formData.color_gradient}
                  onChange={(e) => setFormData(prev => ({ ...prev, color_gradient: e.target.value }))}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground bg-card"
                  placeholder="bg-gradient-to-r from-gray-300 to-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Benefits</label>
                <div className="space-y-2">
                  {formData.benefits.map((benefit, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="text"
                        value={benefit}
                        onChange={(e) => updateBenefit(index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground bg-card"
                        placeholder="Enter benefit"
                      />
                      {formData.benefits.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBenefit(index)}
                          className="px-3 py-2 border border-border rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addBenefit}
                    className="text-sm text-primary hover:underline"
                  >
                    + Add Benefit
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="tier_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 text-primary bg-card border border-border rounded focus:ring-primary focus:ring-2"
                />
                <label htmlFor="tier_active" className="text-sm font-medium text-gray-300">Active Tier</label>
              </div>

              </div>
            </form>

            {/* Fixed Footer */}
            <div className="flex-shrink-0 p-6 border-t border-border bg-card">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors font-medium text-gray-300"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    editingTier ? 'Update Tier' : 'Create Tier'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SponsorTiersTab;
