import React, { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useDev } from '@/contexts/DevContext';
import { Navigate } from 'react-router-dom';
import { Users, Search, Filter, Mail, Calendar, MoreHorizontal, UserPlus, Building2, Plus, Edit3, Trash2, ExternalLink, Star, Crown, Shield, User, Award, Heart } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

const AdminMembers = () => {
  const { isAuthenticated } = useAdmin();
  const { isDevelopmentMode, allowDirectAdminAccess } = useDev();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

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
    { id: 'member', label: 'Member', icon: User, color: 'text-gray-600', bgColor: 'bg-gray-100', description: 'General community members' },
    { id: 'alumni', label: 'Alumni', icon: Heart, color: 'text-red-600', bgColor: 'bg-red-100', description: 'Former members and graduates' }
  ];

  // Mock data - replace with real data from your backend
  const members = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@psu.edu',
      role: 'organizer',
      category: 'organizer',
      joinDate: '2024-01-15',
      lastActive: '2024-09-10',
      interests: ['Web Development', 'Machine Learning'],
      avatar: null,
      phone: '+1 (555) 123-4567',
      year: 'Senior',
      major: 'Computer Science'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@psu.edu',
      role: 'lead',
      category: 'lead',
      joinDate: '2024-02-20',
      lastActive: '2024-09-11',
      interests: ['Android Development', 'UI/UX Design'],
      avatar: null,
      phone: '+1 (555) 234-5678',
      year: 'Junior',
      major: 'Information Sciences'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike.j@psu.edu',
      role: 'active',
      category: 'active',
      joinDate: '2024-03-10',
      lastActive: '2024-09-09',
      interests: ['Cloud Computing', 'DevOps'],
      avatar: null,
      phone: '+1 (555) 345-6789',
      year: 'Sophomore',
      major: 'Computer Engineering'
    },
    {
      id: 4,
      name: 'Sarah Wilson',
      email: 'sarah.w@psu.edu',
      role: 'member',
      category: 'member',
      joinDate: '2024-04-05',
      lastActive: '2024-09-08',
      interests: ['Data Science', 'AI'],
      avatar: null,
      phone: '+1 (555) 456-7890',
      year: 'Freshman',
      major: 'Data Science'
    }
  ];

  // Form state
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: '',
    year: '',
    major: '',
    category: 'member',
    interests: []
  });

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.major.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || member.role.toLowerCase() === filterRole.toLowerCase();
    const matchesCategory = filterCategory === 'all' || member.category === filterCategory;
    return matchesSearch && matchesRole && matchesCategory;
  });

  const getCategoryInfo = (categoryId: string) => {
    return memberCategories.find(cat => cat.id === categoryId) || memberCategories[4]; // Default to 'member'
  };

  const memberStats = [
    { label: 'Total Members', value: members.length.toString(), color: 'text-blue-500' },
    { label: 'Active Members', value: members.filter(m => m.category === 'active').length.toString(), color: 'text-green-500' },
    { label: 'Team Leads', value: members.filter(m => m.category === 'lead').length.toString(), color: 'text-purple-500' },
    { label: 'Organizers', value: members.filter(m => m.category === 'organizer').length.toString(), color: 'text-orange-500' },
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
        {memberStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <Users size={24} className={stat.color} />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Member Categories */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {memberCategories.map((category) => {
            const Icon = category.icon;
            const count = members.filter(m => m.category === category.id).length;
            return (
              <div key={category.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`w-10 h-10 ${category.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon size={20} className={category.color} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{category.label}</h4>
                    <p className="text-sm text-gray-600">{count} members</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">{category.description}</p>
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
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Filter size={16} className="text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="all">All Categories</option>
              {memberCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Members ({filteredMembers.length})</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredMembers.map((member) => {
              const categoryInfo = getCategoryInfo(member.category);
              const CategoryIcon = categoryInfo.icon;
              return (
                <div key={member.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.bgColor} ${categoryInfo.color}`}>
                            <CategoryIcon size={12} />
                            <span>{categoryInfo.label}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <div className="flex items-center space-x-1">
                            <Mail size={14} />
                            <span>{member.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar size={14} />
                            <span>Joined {new Date(member.joinDate).toLocaleDateString()}</span>
                          </div>
                          <span>{member.year} • {member.major}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-3">
                          {member.interests.map((interest, index) => (
                            <span key={index} className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right text-sm">
                        <div className="text-gray-500">Last active</div>
                        <div className="font-medium text-gray-900">{new Date(member.lastActive).toLocaleDateString()}</div>
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
                </div>
              );
            })}
          </div>
        </div>
      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New Member</h2>
            </div>
            
            <form className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={newMember.name}
                    onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="john.doe@psu.edu"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={newMember.phone}
                    onChange={(e) => setNewMember(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
                  <select
                    value={newMember.year}
                    onChange={(e) => setNewMember(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Major</label>
                  <input
                    type="text"
                    value={newMember.major}
                    onChange={(e) => setNewMember(prev => ({ ...prev, major: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Computer Science"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Member Category</label>
                  <select
                    value={newMember.category}
                    onChange={(e) => setNewMember(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Add Member
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