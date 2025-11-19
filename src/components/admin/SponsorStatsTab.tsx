import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, TrendingUp } from 'lucide-react';
import { SponsorContentService, type ImpactStat } from '@/services/sponsorContentService';

const SponsorStatsTab = () => {
  const [stats, setStats] = useState<ImpactStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStat, setEditingStat] = useState<ImpactStat | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    stat_label: '',
    stat_value: '',
    stat_description: '',
    icon_name: 'users',
    order_index: 0,
    is_active: true
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    const data = await SponsorContentService.getAllStats();
    setStats(data);
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      stat_label: '',
      stat_value: '',
      stat_description: '',
      icon_name: 'users',
      order_index: 0,
      is_active: true
    });
    setEditingStat(null);
    setError(null);
  };

  const handleEdit = (stat: ImpactStat) => {
    setEditingStat(stat);
    setFormData({
      stat_label: stat.stat_label,
      stat_value: stat.stat_value,
      stat_description: stat.stat_description,
      icon_name: stat.icon_name,
      order_index: stat.order_index,
      is_active: stat.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const statData = {
      stat_label: formData.stat_label,
      stat_value: formData.stat_value,
      stat_description: formData.stat_description,
      icon_name: formData.icon_name,
      order_index: formData.order_index,
      is_active: formData.is_active
    };

    try {
      if (editingStat) {
        const result = await SponsorContentService.updateStat(editingStat.id, statData);
        if (result) {
          setSuccess('Stat updated successfully!');
        } else {
          setError('Failed to update stat');
          setIsSaving(false);
          return;
        }
      } else {
        const result = await SponsorContentService.createStat(statData);
        if (result) {
          setSuccess('Stat created successfully!');
        } else {
          setError('Failed to create stat');
          setIsSaving(false);
          return;
        }
      }
      
      setShowModal(false);
      resetForm();
      
      // Small delay to ensure database has committed the changes
      setTimeout(async () => {
        await loadStats();
      }, 100);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to save stat');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this stat?')) {
      const success = await SponsorContentService.deleteStat(id);
      if (success) {
        setSuccess('Stat deleted successfully!');
        await loadStats();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to delete stat');
      }
    }
  };

  const iconOptions = [
    { value: 'users', label: 'Users' },
    { value: 'calendar', label: 'Calendar' },
    { value: 'award', label: 'Award' },
    { value: 'heart', label: 'Heart' }
  ];

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
          <h3 className="text-lg font-semibold text-foreground">Impact Statistics</h3>
          <p className="text-sm text-muted-foreground">Manage community impact metrics displayed on the sponsors page</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          <span>Add Stat</span>
        </button>
      </div>

      {/* Stats List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : stats.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">No stats found. Add your first stat!</p>
          </div>
        ) : (
          stats.map((stat) => (
            <div key={stat.id} className="bg-card border border-border rounded-lg p-6 text-center">
              <div className="flex justify-end space-x-1 mb-4">
                <button
                  onClick={() => handleEdit(stat)}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(stat.id)}
                  className="p-1 hover:bg-red-50 rounded transition-colors text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="w-16 h-16 bg-primary/10 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="text-primary" size={24} />
              </div>
              <div className="text-3xl font-bold text-primary mb-2">{stat.stat_value}</div>
              <p className="text-sm text-muted-foreground">{stat.stat_description}</p>
              <div className="mt-4 text-xs text-muted-foreground">
                <span>Order: {stat.order_index}</span>
                <span className={`ml-2 ${stat.is_active ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.is_active ? 'Active' : 'Inactive'}
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
            className="bg-card rounded-xl shadow-xl border border-border w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="flex-shrink-0 p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                {editingStat ? 'Edit Stat' : 'Add New Stat'}
              </h2>
            </div>

            {/* Scrollable Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Stat Label (Internal)</label>
                <input
                  type="text"
                  required
                  value={formData.stat_label}
                  onChange={(e) => setFormData(prev => ({ ...prev, stat_label: e.target.value }))}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground bg-card"
                  placeholder="Active Members"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Stat Value</label>
                <input
                  type="text"
                  required
                  value={formData.stat_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, stat_value: e.target.value }))}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground bg-card"
                  placeholder="500+"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description (Public)</label>
                <input
                  type="text"
                  required
                  value={formData.stat_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, stat_description: e.target.value }))}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground bg-card"
                  placeholder="Active Members"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
                  <select
                    value={formData.icon_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon_name: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground bg-card"
                  >
                    {iconOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Order Index</label>
                  <input
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground bg-card"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="stat_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 text-primary bg-card border border-border rounded focus:ring-primary focus:ring-2"
                />
                <label htmlFor="stat_active" className="text-sm font-medium text-gray-300">Active Stat</label>
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
                    editingStat ? 'Update Stat' : 'Create Stat'
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

export default SponsorStatsTab;
