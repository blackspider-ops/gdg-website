import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useDev } from '@/contexts/DevContext';
import { Navigate } from 'react-router-dom';
import { Users, Search, Filter, Mail, Calendar, MoreHorizontal, UserPlus, Building2, Plus, Edit3, Trash2, ExternalLink, Star, Crown, Shield, User, Award, Heart } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { MembersService, type Member } from '@/services/membersService';

const AdminMembers = () => {
  const { isAuthenticated } = useAdmin();
  const { isDevelopmentMode, allowDirectAdminAccess } = useDev();
  const [members, setMembers] = useState<Member[]>([]);
  const [memberStats, setMemberStats] = useState({
    total: 0,
    active: 0,
    categoryDistribution: {} as Record<string, number>
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const canAccess = isAuthenticated || (isDevelopmentMode && allowDirectAdminAccess);

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  // Member categories with icons and descriptions
  const memberCategories = [
    { id: 'founder', label: 'Founder', icon: Crown, color: 'text-yellow-600', bgColor: 'bg-yellow-100', description: 'Chapter founders and co-founders' },
    { id: 'organizer', label: 'Organizer', icon: Shield, color: 'text-blue-600', bgColor: 'bg-blue-100', description: 'Core team organizers' },
    { id: 'lead', label: 'Team Lead', icon: Award, color: 'text-purple-600', bgColor: 'bg-purple-100', description: 'Team and project leads' },
    { id: 'active', label: 'Active Member', icon: Star, color: 'text-green-600', bgColor: 'bg-green-100', description: 'Regular active participants' },
    { id: 'member', label: 'Member', icon: User, color: 'text-gray-400', bgColor: 'bg-gray-100', description: 'General community members' },
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
      console.error('Error loading members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMemberStats = async () => {
    try {
      const stats = await MembersService.getMemberStats();
      setMemberStats(stats);
    } catch (error) {
      console.error('Error loading member stats:', error);
    }
  };

  // Form state
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: '',
    year: '',
    major: '',
    category: 'member' as Member['category'],
    interests: [] as string[],
    is_active: true
  });

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.major && member.major.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === 'all' || (member.year && member.year.toLowerCase() === filterRole.toLowerCase());
    const matchesCategory = filterCategory === 'all' || member.category === filterCategory;
    return matchesSearch && matchesRole && matchesCategory;
  });

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await MembersService.createMember(newMember);
      if (created) {
        await loadMembers();
        await loadMemberStats();
        setShowAddMemberModal(false);
        setNewMember({
          name: '',
          email: '',
          phone: '',
          year: '',
          major: '',
          category: 'member',
          interests: [],
          is_active: true
        });
      }
    } catch (error) {
      console.error('Error creating member:', error);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        const success = await MembersService.deleteMember(id);
        if (success) {
          await loadMembers();
          await loadMemberStats();
        }
      } catch (error) {
        console.error('Error deleting member:', error);
      }
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return memberCategories.find(cat => cat.id === categoryId) || memberCategories[4]; // Default to 'member'
  };

  const memberStatsDisplay = [
    { label: 'Total Members', value: memberStats.total.toString(), color: 'text-blue-500' },
    { label: 'Active Members', value: (memberStats.categoryDistribution.active || 0).toString(), color: 'text-green-500' },
    { label: 'Team Leads', value: (memberStats.categoryDistribution.lead || 0).toString(), color: 'text-purple-500' },
    { label: 'Organizers', value: (memberStats.categoryDistribution.organizer || 0).toString(), color: 'text-orange-500' },
  ];

  return (
    <AdminLayout
      title="Member Management"
      subtitle="Manage GDG community members"
      icon={Users}
      actions={
        <button 
          onClick={() => setShowAddMemberModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <UserPlus size={16} />
          <span>Add Member</span>
        </button>
      }
    >

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {memberStatsDisplay.map((stat, index) => (
          <div key={index} className="bg-black rounded-xl p-6 shadow-sm border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <Users size={24} className={stat.color} />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-sm text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Member Categories */}
      <div className="bg-black rounded-xl p-6 shadow-sm border border-gray-800 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Member Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {memberCategories.map((category) => {
            const Icon = category.icon;
            const count = memberStats.categoryDistribution[category.id] || 0;
            return (
              <div key={category.id} className="border border-gray-800 rounded-lg p-4 hover:bg-gray-900 transition-colors">
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`w-10 h-10 ${category.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon size={20} className={category.color} />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{category.label}</h4>
                    <p className="text-sm text-gray-400">{count} members</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">{category.description}</p>
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
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder:text-gray-400"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Filter size={16} className="text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white"
            >
              <option value="all">All Categories</option>
              {memberCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white"
            >
              <option value="all">All Years</option>
              <option value="freshman">Freshman</option>
              <option value="sophomore">Sophomore</option>
              <option value="junior">Junior</option>
              <option value="senior">Senior</option>
            </select>
          </div>
        </div>
      </div>

      {/* Members List */}
        <div className="bg-black rounded-xl shadow-sm border border-gray-800">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">Members ({filteredMembers.length})</h2>
          </div>
          
          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-400">Loading members...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="p-6 text-center">
                <Users size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No members found</h3>
                <p className="text-gray-400">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredMembers.map((member) => {
                const categoryInfo = getCategoryInfo(member.category);
                const CategoryIcon = categoryInfo.icon;
                return (
                  <div key={member.id} className="p-6 hover:bg-gray-900/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.bgColor} ${categoryInfo.color}`}>
                              <CategoryIcon size={12} />
                              <span>{categoryInfo.label}</span>
                            </div>
                            {!member.is_active && (
                              <span className="px-2 py-1 text-xs bg-destructive/20 text-red-600 rounded-full font-medium">
                                Inactive
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
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
                              <span key={index} className="px-3 py-1 text-xs bg-gray-900 text-gray-400 rounded-full">
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right text-sm">
                          <div className="text-gray-400">Last active</div>
                          <div className="font-medium text-white">{new Date(member.last_active).toLocaleDateString()}</div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button className="p-2 hover:bg-gray-900 rounded-lg transition-colors text-gray-400 hover:text-white">
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteMember(member.id)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors text-gray-400 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-black rounded-xl w-full max-w-2xl max-h-[90vh] shadow-xl border border-gray-800 flex flex-col">
            <div className="p-6 border-b border-gray-800 flex-shrink-0">
              <h2 className="text-xl font-semibold text-white">Add New Member</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleCreateMember} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Full Name</label>
                  <input
                    type="text"
                    value={newMember.name}
                    onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder:text-gray-400"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Email</label>
                  <input
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder:text-gray-400"
                    placeholder="john.doe@psu.edu"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Phone</label>
                  <input
                    type="tel"
                    value={newMember.phone}
                    onChange={(e) => setNewMember(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder:text-gray-400"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Academic Year</label>
                  <select
                    value={newMember.year}
                    onChange={(e) => setNewMember(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white"
                  >
                    <option value="">Select Year</option>
                    <option value="Freshman">Freshman</option>
                    <option value="Sophomore">Sophomore</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                    <option value="Graduate">Graduate</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Major</label>
                  <input
                    type="text"
                    value={newMember.major}
                    onChange={(e) => setNewMember(prev => ({ ...prev, major: e.target.value }))}
                    className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder:text-gray-400"
                    placeholder="Computer Science"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Member Category</label>
                  <select
                    value={newMember.category}
                    onChange={(e) => setNewMember(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white"
                  >
                    {memberCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
                <div className="flex space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-800 rounded-lg hover:bg-gray-900 transition-colors font-medium text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-600/90 transition-colors font-medium"
                  >
                    Add Member
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

export default AdminMembers;