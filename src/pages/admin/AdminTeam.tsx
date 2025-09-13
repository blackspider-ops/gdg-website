import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useDev } from '@/contexts/DevContext';
import { Navigate } from 'react-router-dom';
import { Users, Search, Filter, Mail, Calendar, UserPlus, Plus, Edit3, Trash2, ExternalLink, Github, Linkedin, Star, Crown, Shield, User, Award, Heart } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { TeamService, type TeamMember } from '@/services/teamService';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

const AdminTeam = () => {
  const { isAuthenticated } = useAdmin();
  const { isDevelopmentMode, allowDirectAdminAccess } = useDev();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamStats, setTeamStats] = useState({
    total: 0,
    active: 0,
    roleDistribution: {} as Record<string, number>
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Lock body scroll when modal is open
  useBodyScrollLock(showAddMemberModal || !!editingMember);

  const canAccess = isAuthenticated || (isDevelopmentMode && allowDirectAdminAccess);

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  // Load team members and stats
  useEffect(() => {
    loadTeamMembers();
    loadTeamStats();
  }, []);



  const loadTeamMembers = async () => {
    setIsLoading(true);
    try {
      const teamData = await TeamService.getAllTeamMembers();
      setTeamMembers(teamData);
    } catch (error) {
      console.error('Error loading team members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamStats = async () => {
    try {
      const stats = await TeamService.getTeamStats();
      setTeamStats(stats);
    } catch (error) {
      console.error('Error loading team stats:', error);
    }
  };

  // Form state
  const [memberForm, setMemberForm] = useState({
    name: '',
    role: '',
    email: '',
    bio: '',
    image_url: '',
    linkedin_url: '',
    github_url: '',
    order_index: 0,
    is_active: true
  });

  // Get unique roles from existing team members
  const existingRoles = Array.from(new Set(teamMembers.map(member => member.role).filter(Boolean)));
  const commonRoles = [
    'Chapter Lead',
    'Co-Lead',
    'Vice President',
    'Technical Lead',
    'Events Coordinator',
    'Marketing Lead',
    'Design Lead',
    'Community Manager',
    'Organizer',
    'Mentor',
    'Faculty Advisor',
    'Secretary',
    'Treasurer',
    'Social Media Manager',
    'Content Creator',
    'Workshop Lead',
    'Project Manager',
    'Research Lead',
    'Partnership Manager',
    'Alumni Relations',
    'Student Liaison',
    'Web Developer',
    'Mobile Developer',
    'Data Scientist',
    'UI/UX Designer',
    'DevOps Engineer',
    'Quality Assurance',
    'Documentation Lead',
    'Community Outreach',
    'Event Photographer',
    'Video Editor',
    'Podcast Host',
    'Newsletter Editor',
    'Volunteer Coordinator',
    'Intern',
    'Advisory Board Member'
  ];
  const allRoles = Array.from(new Set([...commonRoles, ...existingRoles]));

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.bio && member.bio.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    try {
      const created = await TeamService.createTeamMember(memberForm);
      if (created) {
        // Also create corresponding member entry
        const memberCreated = await TeamService.createMemberFromTeamMember(created, memberForm.email);
        
        await loadTeamMembers();
        await loadTeamStats();
        setShowAddMemberModal(false);
        resetForm();
        
        if (memberCreated) {
          if (memberForm.email) {
            setSuccess('Team member added successfully and synced to Member Management!');
          } else {
            setSuccess('Team member added successfully and synced to Member Management with placeholder email!');
          }
        } else {
          setSuccess('Team member added successfully! (Member entry already exists)');
        }
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError('Failed to add team member. Please try again.');
      }
    } catch (error) {
      console.error('Error creating team member:', error);
      setError('An error occurred while adding the team member.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      console.log('Updating team member:', editingMember.id, 'with data:', memberForm);
      const updated = await TeamService.updateTeamMember(editingMember.id, memberForm, false); // Enable sync
      if (updated) {
        console.log('Team member updated successfully:', updated);
        await loadTeamMembers();
        await loadTeamStats();
        setEditingMember(null);
        resetForm();
        setSuccess('Team member updated successfully and synced to Member Management!');
        setTimeout(() => setSuccess(null), 5000);
      } else {
        console.error('Update returned null/false');
        setError('Failed to update team member. Please check the console for details.');
      }
    } catch (error) {
      console.error('Error updating team member:', error);
      setError(`An error occurred while updating the team member: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this team member? This will also remove them from Member Management if they exist there. This action cannot be undone.')) {
      try {
        const success = await TeamService.deleteTeamMember(id);
        if (success) {
          await loadTeamMembers();
          await loadTeamStats();
          setSuccess('Team member deleted successfully and removed from Member Management!');
          setTimeout(() => setSuccess(null), 5000);
        } else {
          setError('Failed to delete team member. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting team member:', error);
        setError('An error occurred while deleting the team member.');
      }
    }
  };

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name,
      role: member.role,
      email: member.email || '',
      bio: member.bio || '',
      image_url: member.image_url || '',
      linkedin_url: member.linkedin_url || '',
      github_url: member.github_url || '',
      order_index: member.order_index,
      is_active: member.is_active
    });
  };

  const resetForm = () => {
    setMemberForm({
      name: '',
      role: '',
      email: '',
      bio: '',
      image_url: '',
      linkedin_url: '',
      github_url: '',
      order_index: teamMembers.length,
      is_active: true
    });
    setError(null);
    setSuccess(null);
  };

  const teamStatsDisplay = [
    { label: 'Total Members', value: teamStats.total.toString(), color: 'text-blue-500' },
    { label: 'Active Members', value: teamStats.active.toString(), color: 'text-green-500' },
    { label: 'Unique Roles', value: Object.keys(teamStats.roleDistribution).length.toString(), color: 'text-purple-500' },
    { label: 'Leadership', value: Object.entries(teamStats.roleDistribution).filter(([role]) => 
      role.toLowerCase().includes('lead') || role.toLowerCase().includes('president')).reduce((sum, [, count]) => sum + count, 0).toString(), color: 'text-orange-500' },
  ];

  return (
    <AdminLayout
      title="Team Management"
      subtitle="Manage team members, roles, and organizational structure"
      icon={Users}
      actions={
        <button 
          onClick={() => {
            resetForm();
            setShowAddMemberModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <UserPlus size={16} />
          <span>Add Team Member</span>
        </button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {teamStatsDisplay.map((stat, index) => (
          <div key={index} className="bg-black rounded-xl p-6 shadow-sm border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <Users size={24} className={stat.color} />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-sm text-gray-400">{stat.label}</div>
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

      {/* Role Distribution */}
      <div className="bg-black rounded-xl p-6 shadow-sm border border-gray-800 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Role Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(teamStats.roleDistribution).map(([role, count]) => (
            <div key={role} className="border border-gray-800 rounded-lg p-4 hover:bg-gray-900 transition-colors">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-white">{role}</h4>
                <span className="text-sm font-medium text-blue-600">{count} member{count !== 1 ? 's' : ''}</span>
              </div>
            </div>
          ))}
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
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Filter size={16} className="text-gray-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
            >
              <option value="all">All Roles</option>
              {allRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-black rounded-xl shadow-sm border border-gray-800">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Team Members ({filteredMembers.length})</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading team members...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-6 text-center">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No team members found</h3>
              <p className="text-gray-400">Try adjusting your search or add your first team member</p>
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div key={member.id} className="p-6 hover:bg-gray-900 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                      {member.image_url ? (
                        <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-100">
                          <span className="text-blue-600 font-semibold text-lg">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                        <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full font-medium">
                          {member.role}
                        </span>
                        {!member.is_active && (
                          <span className="px-2 py-1 text-xs bg-red-600 text-white rounded-full font-medium">
                            Inactive
                          </span>
                        )}
                      </div>
                      
                      {member.bio && (
                        <p className="text-gray-400 mb-2 line-clamp-2">{member.bio}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Order: {member.order_index}</span>
                        <span>Created: {new Date(member.created_at).toLocaleDateString()}</span>
                        {(member.linkedin_url || member.github_url) && (
                          <div className="flex items-center space-x-2">
                            {member.linkedin_url && (
                              <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                <Linkedin size={16} />
                              </a>
                            )}
                            {member.github_url && (
                              <a href={member.github_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-800">
                                <Github size={16} />
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleEditMember(member)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteMember(member.id)}
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

      {/* Add/Edit Team Member Modal */}
      {(showAddMemberModal || editingMember) && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          style={{ 
            overflow: 'hidden',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddMemberModal(false);
              setEditingMember(null);
            }
          }}
          onWheel={(e) => e.preventDefault()}
          onTouchMove={(e) => e.preventDefault()}
          onScroll={(e) => e.preventDefault()}
        >
          <div 
            className="bg-black rounded-xl shadow-xl border border-gray-800 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="flex-shrink-0 p-6 border-b border-gray-800">
              <h2 className="text-xl font-semibold text-white">
                {editingMember ? 'Edit Team Member' : 'Add New Team Member'}
              </h2>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overflow-auto p-6">
              <form onSubmit={editingMember ? handleUpdateMember : handleCreateMember} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={memberForm.name}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Role *
                    <span className="text-xs text-gray-500 ml-2">(Controls member category)</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="roles"
                    value={memberForm.role}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                    placeholder="Enter role (e.g., Chapter Lead, Technical Lead...)"
                  />
                  <datalist id="roles">
                    {allRoles.map(role => (
                      <option key={role} value={role} />
                    ))}
                  </datalist>
                  <p className="text-xs text-gray-500 mt-1">
                    Team role automatically maps to member category in Member Management
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={memberForm.email}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                  placeholder="john.doe@psu.edu (for Member Management sync)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Providing an email will create a corresponding entry in Member Management
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                <textarea
                  rows={3}
                  value={memberForm.bio}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                  placeholder="Brief description of the team member..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Profile Image URL</label>
                <input
                  type="url"
                  value={memberForm.image_url}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, image_url: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                  placeholder="https://example.com/profile.jpg"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">LinkedIn URL</label>
                  <input
                    type="url"
                    value={memberForm.linkedin_url}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, linkedin_url: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">GitHub URL</label>
                  <input
                    type="url"
                    value={memberForm.github_url}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, github_url: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                    placeholder="https://github.com/username"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Display Order</label>
                  <input
                    type="number"
                    min="0"
                    value={memberForm.order_index}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                    placeholder="0"
                  />
                </div>
                
                <div className="flex items-center space-x-3 pt-8">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={memberForm.is_active}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-black border border-gray-700 rounded focus:ring-blue-400 focus:ring-2"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-300">Active Team Member</label>
                </div>
              </div>
              
                <div className="flex space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMemberModal(false);
                      setEditingMember(null);
                      resetForm();
                      setError(null);
                      setSuccess(null);
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
                        {editingMember ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      editingMember ? 'Update Member' : 'Add Member'
                    )}
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

export default AdminTeam;