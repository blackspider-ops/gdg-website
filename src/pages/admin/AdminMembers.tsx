import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Navigate } from 'react-router-dom';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { Users, Search, Filter, Mail, Calendar, MoreHorizontal, UserPlus, Building2, Plus, Edit3, Trash2, ExternalLink, Star, Crown, Shield, User, Award, Heart, X, Save, Eye, EyeOff } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { MembersService, type Member } from '@/services/membersService';

const AdminMembers = () => {
  const { isAuthenticated, currentAdmin } = useAdmin();
  const isSuperAdmin = currentAdmin?.role === 'super_admin';
  const [members, setMembers] = useState<Member[]>([]);
  const [memberStats, setMemberStats] = useState({
    total: 0,
    active: 0,
    categoryDistribution: {} as Record<string, number>
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterCoreTeam, setFilterCoreTeam] = useState('all');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [togglingMemberId, setTogglingMemberId] = useState<string | null>(null);
  const [changingCategoryId, setChangingCategoryId] = useState<string | null>(null);
  const [togglingCoreTeamId, setTogglingCoreTeamId] = useState<string | null>(null);

  // Lock body scroll when modal is open
  useBodyScrollLock(showAddMemberModal || !!editingMember);

  

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Member categories with icons and descriptions
  const memberCategories = [
    { id: 'founder', label: 'Founder', icon: Crown, color: 'text-yellow-600', bgColor: 'bg-yellow-100', description: 'Chapter founders and co-founders' },
    { id: 'organizer', label: 'Organizer', icon: Shield, color: 'text-primary', bgColor: 'bg-blue-100', description: 'Core team organizers' },
    { id: 'lead', label: 'Team Lead', icon: Award, color: 'text-purple-600', bgColor: 'bg-purple-100', description: 'Team and project leads' },
    { id: 'active', label: 'Active Member', icon: Star, color: 'text-green-600', bgColor: 'bg-green-100', description: 'Regular active participants' },
    { id: 'member', label: 'Member', icon: User, color: 'text-muted-foreground', bgColor: 'bg-gray-100', description: 'General community members' },
    { id: 'alumni', label: 'Alumni', icon: Heart, color: 'text-red-600', bgColor: 'bg-red-100', description: 'Former members and graduates' }
  ];

  // Load members and stats
  useEffect(() => {
    loadMembers();
    loadMemberStats();
  }, []);

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const membersData = await MembersService.getAllMembers();
      setMembers(membersData);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const loadMemberStats = async () => {
    try {
      const stats = await MembersService.getMemberStats();
      setMemberStats(stats);
    } catch (error) {
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      year: '',
      major: '',
      category: 'member',
      interests: [],
      is_active: true,
      is_core_team: false
    });
    setInterestInput('');
    setError(null);
    setSuccess(null);
  };

  const addInterest = () => {
    if (interestInput.trim() && !formData.interests.includes(interestInput.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, interestInput.trim()]
      }));
      setInterestInput('');
    }
  };

  const removeInterest = (index: number) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index)
    }));
  };

  // Unified form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    year: '',
    major: '',
    category: 'member' as Member['category'],
    interests: [] as string[],
    is_active: true,
    is_core_team: false
  });

  // Interest input helper
  const [interestInput, setInterestInput] = useState('');

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.major && member.major.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === 'all' || (member.year && member.year.toLowerCase() === filterRole.toLowerCase());
    const matchesCategory = filterCategory === 'all' || member.category === filterCategory;
    const matchesCoreTeam = filterCoreTeam === 'all' || 
                           (filterCoreTeam === 'core' && member.is_core_team) ||
                           (filterCoreTeam === 'regular' && !member.is_core_team);
    return matchesSearch && matchesRole && matchesCategory && matchesCoreTeam;
  });

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    try {
      const created = await MembersService.createMember(formData);
      if (created) {
        // If marked as core team, also create team member entry
        if (formData.is_core_team) {
          const teamCreated = await MembersService.createTeamMemberFromMember(created);
          if (teamCreated) {
            setSuccess('Member added successfully and added to core team!');
          } else {
            setSuccess('Member added successfully, but failed to add to core team. You can add them manually in Team Management.');
          }
        } else {
          setSuccess('Member added successfully!');
        }
        
        await loadMembers();
        await loadMemberStats();
        setShowAddMemberModal(false);
        resetForm();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError('Failed to add member. Please try again.');
      }
    } catch (error) {
      setError('An error occurred while adding the member.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditMember = (member: Member) => {
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      year: member.year || '',
      major: member.major || '',
      category: member.category,
      interests: member.interests || [],
      is_active: member.is_active,
      is_core_team: member.is_core_team || false
    });
    setEditingMember(member);
    setError(null);
    setSuccess(null);
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    
    setIsSaving(true);
    setError(null);

    try {
      const updated = await MembersService.updateMember(editingMember.id, formData);
      if (updated) {
        // Handle core team status changes and sync
        if (formData.is_core_team && !editingMember.is_core_team) {
          // Member promoted to core team
          const teamCreated = await MembersService.createTeamMemberFromMember(updated);
          if (teamCreated) {
            setSuccess('Member updated and added to core team! Changes synced to Team Management.');
          } else {
            setSuccess('Member updated successfully, but failed to add to core team. You can add them manually in Team Management.');
          }
        } else if (updated.is_core_team) {
          // Core team member updated - changes should sync automatically
          setSuccess('Member updated successfully! Changes synced to Team Management.');
        } else {
          setSuccess('Member updated successfully!');
        }
        
        await loadMembers();
        await loadMemberStats();
        setEditingMember(null);
        resetForm();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError('Failed to update member. Please try again.');
      }
    } catch (error) {
      setError('An error occurred while updating the member.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (member: Member) => {
    setTogglingMemberId(member.id);
    
    // Optimistic update
    const optimisticMembers = members.map(m => 
      m.id === member.id 
        ? { ...m, is_active: !m.is_active }
        : m
    );
    setMembers(optimisticMembers);

    try {
      const updated = await MembersService.updateMember(member.id, {
        is_active: !member.is_active
      });
      if (updated) {
        const serverMembers = members.map(m => 
          m.id === member.id ? updated : m
        );
        setMembers(serverMembers);
        await loadMemberStats();
        setSuccess(`Member ${member.is_active ? 'deactivated' : 'activated'} successfully!`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setMembers(members);
        setError('Failed to update member status.');
      }
    } catch (error) {
      setMembers(members);
      setError('Failed to update member status.');
    } finally {
      setTogglingMemberId(null);
    }
  };

  const handleCategoryChange = async (member: Member, newCategory: Member['category']) => {
    if (member.category === newCategory) return;
    
    setChangingCategoryId(member.id);
    
    // Optimistic update
    const optimisticMembers = members.map(m => 
      m.id === member.id 
        ? { ...m, category: newCategory }
        : m
    );
    setMembers(optimisticMembers);

    try {
      const updated = await MembersService.updateMember(member.id, {
        category: newCategory
      });
      if (updated) {
        const serverMembers = members.map(m => 
          m.id === member.id ? updated : m
        );
        setMembers(serverMembers);
        await loadMemberStats();
        const oldCategoryInfo = getCategoryInfo(member.category);
        const newCategoryInfo = getCategoryInfo(newCategory);
        setSuccess(`Member category changed from ${oldCategoryInfo.label} to ${newCategoryInfo.label}!`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setMembers(members);
        setError('Failed to update member category.');
      }
    } catch (error) {
      setMembers(members);
      setError('Failed to update member category.');
    } finally {
      setChangingCategoryId(null);
    }
  };

  const handleToggleCoreTeam = async (member: Member) => {
    setTogglingCoreTeamId(member.id);
    
    // Optimistic update
    const optimisticMembers = members.map(m => 
      m.id === member.id 
        ? { ...m, is_core_team: !m.is_core_team }
        : m
    );
    setMembers(optimisticMembers);

    try {
      const updated = await MembersService.updateMember(member.id, {
        is_core_team: !member.is_core_team
      });
      if (updated) {
        // If adding to core team, create team member entry
        if (!member.is_core_team && updated.is_core_team) {
          const teamCreated = await MembersService.createTeamMemberFromMember(updated);
          if (teamCreated) {
            setSuccess('Member added to core team and team management!');
          } else {
            setSuccess('Member marked as core team, but failed to add to team management. You can add them manually.');
          }
        } else {
          setSuccess(`Member ${member.is_core_team ? 'removed from' : 'added to'} core team!`);
        }
        
        const serverMembers = members.map(m => 
          m.id === member.id ? updated : m
        );
        setMembers(serverMembers);
        await loadMemberStats();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setMembers(members);
        setError('Failed to update core team status.');
      }
    } catch (error) {
      setMembers(members);
      setError('Failed to update core team status.');
    } finally {
      setTogglingCoreTeamId(null);
    }
  };

  const handleSyncToTeam = async (member: Member) => {
    try {
      const synced = await MembersService.syncMemberToTeamMember(member);
      if (synced) {
        setSuccess(`${member.name} synced to Team Management successfully!`);
      } else {
        setError(`Failed to sync ${member.name} to Team Management. They may not exist in Team Management yet.`);
      }
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
    } catch (error) {
      setError('An error occurred while syncing to Team Management.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleDeleteMember = async (id: string) => {
    // Find the member to check if they're core team
    const member = members.find(m => m.id === id);
    const isCore = member?.is_core_team;
    
    const confirmMessage = isCore 
      ? 'Are you sure you want to delete this member? This will also remove them from Team Management. This action cannot be undone.'
      : 'Are you sure you want to delete this member? This action cannot be undone.';
    
    if (window.confirm(confirmMessage)) {
      try {
        const success = await MembersService.deleteMember(id);
        if (success) {
          await loadMembers();
          await loadMemberStats();
          if (isCore) {
            setSuccess('Member deleted successfully and removed from Team Management!');
          } else {
            setSuccess('Member deleted successfully!');
          }
          setTimeout(() => setSuccess(null), 5000);
        } else {
          setError('Failed to delete member. Please try again.');
        }
      } catch (error) {
        setError('An error occurred while deleting the member.');
      }
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return memberCategories.find(cat => cat.id === categoryId) || memberCategories[4]; // Default to 'member'
  };

  const memberStatsDisplay = [
    { label: 'Total Members', value: memberStats.total.toString(), color: 'text-blue-500' },
    { label: 'Active Members', value: memberStats.active.toString(), color: 'text-green-500' },
    { label: 'Core Team', value: (memberStats.coreTeam || 0).toString(), color: 'text-purple-500' },
    { label: 'Organizers', value: (memberStats.categoryDistribution.organizer || 0).toString(), color: 'text-orange-500' },
  ];

  return (
    <AdminLayout
      title="Member Management"
      subtitle="Manage GDG community members"
      icon={Users}
      actions={
        isSuperAdmin ? (
          <button 
            onClick={() => setShowAddMemberModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <UserPlus size={16} />
            <span>Add Member</span>
          </button>
        ) : null
      }
    >

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {memberStatsDisplay.map((stat, index) => (
          <div key={index} className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <Users size={24} className={stat.color} />
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

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

      {/* Member Categories */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Member Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {memberCategories.map((category) => {
            const Icon = category.icon;
            const count = memberStats.categoryDistribution[category.id] || 0;
            return (
              <div key={category.id} className="border border-border rounded-lg p-4 hover:bg-muted transition-colors">
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`w-10 h-10 ${category.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon size={20} className={category.color} />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{category.label}</h4>
                    <p className="text-sm text-muted-foreground">{count} members</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{category.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Filter size={16} className="text-muted-foreground" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground"
            >
              <option value="all">All Categories</option>
              {memberCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground"
            >
              <option value="all">All Years</option>
              <option value="freshman">Freshman</option>
              <option value="sophomore">Sophomore</option>
              <option value="junior">Junior</option>
              <option value="senior">Senior</option>
            </select>
            <select
              value={filterCoreTeam}
              onChange={(e) => setFilterCoreTeam(e.target.value)}
              className="px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground"
            >
              <option value="all">All Members</option>
              <option value="core">Core Team</option>
              <option value="regular">Regular Members</option>
            </select>
          </div>
        </div>
      </div>

      {/* Members List */}
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">Members ({filteredMembers.length})</h2>
          </div>
          
          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading members...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="p-6 text-center">
                <Users size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No members found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredMembers.map((member) => {
                const categoryInfo = getCategoryInfo(member.category);
                const CategoryIcon = categoryInfo.icon;
                return (
                  <div key={member.id} className="p-6 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="text-lg font-semibold text-foreground">{member.name}</h3>
                            <div className="relative">
                              {changingCategoryId === member.id ? (
                                <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                                  <span>Updating...</span>
                                </div>
                              ) : member.is_core_team ? (
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.bgColor} ${categoryInfo.color} opacity-75`}>
                                  <span>{categoryInfo.label}</span>
                                  <span className="ml-1 text-xs opacity-60">(Managed in Team)</span>
                                </div>
                              ) : isSuperAdmin ? (
                                <select
                                  value={member.category}
                                  onChange={(e) => handleCategoryChange(member, e.target.value as Member['category'])}
                                  className={`appearance-none bg-transparent border-none text-xs font-medium rounded-full px-2 py-1 pr-6 focus:outline-none focus:ring-2 focus:ring-blue-400 ${categoryInfo.bgColor} ${categoryInfo.color}`}
                                  style={{ 
                                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                    backgroundPosition: 'right 0.25rem center',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundSize: '1rem 1rem'
                                  }}
                                >
                                  {memberCategories.map(cat => (
                                    <option key={cat.id} value={cat.id} className="bg-card text-foreground">
                                      {cat.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.bgColor} ${categoryInfo.color}`}>
                                  {categoryInfo.label}
                                </div>
                              )}
                            </div>
                            {!member.is_active && (
                              <span className="px-2 py-1 text-xs bg-destructive/20 text-red-600 rounded-full font-medium">
                                Inactive
                              </span>
                            )}
                            {member.is_core_team && (
                              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full font-medium">
                                Core Team
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center space-x-1">
                              <Mail size={14} />
                              <span>{member.email}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar size={14} />
                              <span>Joined {new Date(member.join_date).toLocaleDateString()}</span>
                            </div>
                            {member.year && member.major && (
                              <span>{member.year} • {member.major}</span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-3">
                            {member.interests.map((interest, index) => (
                              <span key={index} className="px-3 py-1 text-xs bg-muted text-muted-foreground rounded-full">
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right text-sm">
                          <div className="text-muted-foreground">Last active</div>
                          <div className="font-medium text-foreground">{new Date(member.last_active).toLocaleDateString()}</div>
                        </div>
                        
                        {isSuperAdmin && (
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleToggleActive(member)}
                              disabled={togglingMemberId === member.id}
                              className={`p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                member.is_active ? 'text-green-400 hover:text-green-300' : 'text-muted-foreground hover:text-muted-foreground'
                              }`}
                              title={member.is_active ? 'Deactivate member' : 'Activate member'}
                            >
                              {togglingMemberId === member.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                              ) : member.is_active ? (
                                <Eye size={16} />
                              ) : (
                                <EyeOff size={16} />
                              )}
                            </button>
                            <button 
                              onClick={() => handleToggleCoreTeam(member)}
                              disabled={togglingCoreTeamId === member.id}
                              className={`p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                member.is_core_team ? 'text-purple-400 hover:text-purple-300' : 'text-muted-foreground hover:text-purple-400'
                              }`}
                              title={member.is_core_team ? 'Remove from core team' : 'Add to core team'}
                            >
                              {togglingCoreTeamId === member.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                              ) : (
                                <Shield size={16} />
                              )}
                            </button>
                            <button 
                              onClick={() => handleEditMember(member)}
                              className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-muted-foreground hover:text-blue-400"
                              title="Edit member"
                            >
                              <Edit3 size={16} />
                            </button>
                            {member.is_core_team && (
                              <button 
                                onClick={() => handleSyncToTeam(member)}
                                className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-muted-foreground hover:text-blue-400"
                                title="Sync to Team Management"
                              >
                                <ExternalLink size={16} />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteMember(member.id)}
                              className="p-2 hover:bg-red-900/50 rounded-lg transition-colors text-muted-foreground hover:text-red-400"
                              title="Delete member"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      {/* Add/Edit Member Modal */}
      {(showAddMemberModal || editingMember) && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-card/50"
          style={{ 
            overflow: 'hidden',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
          onWheel={(e) => e.preventDefault()}
          onTouchMove={(e) => e.preventDefault()}
          onScroll={(e) => e.preventDefault()}
        >
          <div 
            className="bg-card rounded-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl border border-border"
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">
                  {editingMember ? 'Edit Member' : 'Add New Member'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setEditingMember(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <form onSubmit={editingMember ? handleUpdateMember : handleCreateMember} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                      placeholder="john.doe@psu.edu"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Member Category
                      {formData.is_core_team && (
                        <span className="text-xs text-muted-foreground ml-2">(Role managed in Team Management)</span>
                      )}
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as Member['category'] }))}
                      disabled={formData.is_core_team}
                      className={`w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card ${
                        formData.is_core_team ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {memberCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                    {formData.is_core_team && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Core team member roles are managed in Team Management for consistency
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Academic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Academic Year</label>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                    >
                      <option value="">Select Year</option>
                      <option value="Freshman">Freshman</option>
                      <option value="Sophomore">Sophomore</option>
                      <option value="Junior">Junior</option>
                      <option value="Senior">Senior</option>
                      <option value="Graduate">Graduate</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Major</label>
                    <input
                      type="text"
                      value={formData.major}
                      onChange={(e) => setFormData(prev => ({ ...prev, major: e.target.value }))}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                      placeholder="Computer Science"
                    />
                  </div>
                </div>
              </div>

              {/* Interests */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Interests</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Add Interest</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                      className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                      placeholder="e.g., Machine Learning, Web Development"
                    />
                    <button
                      type="button"
                      onClick={addInterest}
                      className="px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.interests.map((interest, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm flex items-center gap-2">
                        {interest}
                        <button
                          type="button"
                          onClick={() => removeInterest(index)}
                          className="text-muted-foreground hover:text-red-400"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Member Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="w-4 h-4 text-primary bg-card border-border rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-300">
                      Active Member
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="is_core_team"
                      checked={formData.is_core_team}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_core_team: e.target.checked }))}
                      className="w-4 h-4 text-purple-600 bg-card border-border rounded focus:ring-purple-500 focus:ring-2"
                    />
                    <label htmlFor="is_core_team" className="text-sm font-medium text-gray-300">
                      Core Team Member
                    </label>
                    <span className="text-xs text-muted-foreground">
                      (Will also create entry in Team Management)
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="flex space-x-3 pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setEditingMember(null);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors font-medium text-gray-300"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingMember ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      {editingMember ? 'Update Member' : 'Add Member'}
                    </>
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

export default AdminMembers;