import { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Navigate, Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, BarChart3, GripVertical, ExternalLink, ArrowLeft, LinkIcon } from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

import { linktreeService, LinktreeProfile, LinktreeLink } from '@/services/linktreeService';
import LinktreeProfileForm from '@/components/admin/LinktreeProfileForm';
import LinktreeLinkForm from '@/components/admin/LinktreeLinkForm';
import LinktreeAnalytics from '@/components/admin/LinktreeAnalytics';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const AdminLinktree = () => {
  const { isAuthenticated } = useAdmin();
  const [profiles, setProfiles] = useState<LinktreeProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<LinktreeProfile | null>(null);
  const [links, setLinks] = useState<LinktreeLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<LinktreeProfile | null>(null);
  const [editingLink, setEditingLink] = useState<LinktreeLink | null>(null);

  // Lock body scroll when any modal is open
  useBodyScrollLock(showProfileForm || showLinkForm || !!editingProfile || !!editingLink);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const data = await linktreeService.getAllProfiles();
        setProfiles(data);
        if (data.length > 0 && !selectedProfile) {
          setSelectedProfile(data[0]);
        }
      } catch (error) {
        // Silently handle errors
        toast.error('Failed to fetch profiles');
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  useEffect(() => {
    if (selectedProfile) {
      fetchLinks(selectedProfile.id);
    }
  }, [selectedProfile]);

  const fetchProfiles = async () => {
    try {
      const data = await linktreeService.getAllProfiles();
      setProfiles(data);
      if (data.length > 0 && !selectedProfile) {
        setSelectedProfile(data[0]);
      }
    } catch (error) {
      // Silently handle errors
      toast.error('Failed to fetch profiles');
    } finally {
      setLoading(false);
    }
  };

  const fetchLinks = async (profileId: string) => {
    try {
      const data = await linktreeService.getProfileLinks(profileId);
      setLinks(data);
    } catch (error) {
      // Silently handle errors
      toast.error('Failed to fetch links');
    }
  };

  const handleCreateProfile = async (profileData: Omit<LinktreeProfile, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newProfile = await linktreeService.createProfile(profileData);
      if (newProfile) {
        await fetchProfiles();
        setSelectedProfile(newProfile);
        setShowProfileForm(false);
        toast.success('Profile created successfully');
      }
    } catch (error) {
      // Silently handle errors
      toast.error('Failed to create profile');
    }
  };

  const handleUpdateProfile = async (id: string, updates: Partial<LinktreeProfile>) => {
    try {
      const updatedProfile = await linktreeService.updateProfile(id, updates);
      if (updatedProfile) {
        await fetchProfiles();
        setSelectedProfile(updatedProfile);
        setEditingProfile(null);
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      // Silently handle errors
      toast.error('Failed to update profile');
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!confirm('Are you sure you want to delete this profile? This will also delete all associated links.')) {
      return;
    }

    try {
      const success = await linktreeService.deleteProfile(id);
      
      if (success) {
        await fetchProfiles();
        if (selectedProfile?.id === id) {
          setSelectedProfile(profiles.length > 1 ? profiles.find(p => p.id !== id) || null : null);
        }
        toast.success('Profile deleted successfully');
      } else {
        toast.error('Failed to delete profile - check console for details');
      }
    } catch (error) {
      toast.error(`Failed to delete profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCreateLink = async (linkData: Omit<LinktreeLink, 'id' | 'created_at' | 'updated_at' | 'click_count'>) => {
    try {
      const newLink = await linktreeService.createLink(linkData);
      if (newLink && selectedProfile) {
        await fetchLinks(selectedProfile.id);
        setShowLinkForm(false);
        toast.success('Link created successfully');
      }
    } catch (error) {
      // Silently handle errors
      toast.error('Failed to create link');
    }
  };

  const handleUpdateLink = async (id: string, updates: Partial<LinktreeLink>) => {
    try {
      const updatedLink = await linktreeService.updateLink(id, updates);
      if (updatedLink && selectedProfile) {
        await fetchLinks(selectedProfile.id);
        setEditingLink(null);
        toast.success('Link updated successfully');
      }
    } catch (error) {
      // Silently handle errors
      toast.error('Failed to update link');
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!confirm('Are you sure you want to delete this link?')) {
      return;
    }

    try {
      const success = await linktreeService.deleteLink(id);
      if (success && selectedProfile) {
        await fetchLinks(selectedProfile.id);
        toast.success('Link deleted successfully');
      }
    } catch (error) {
      // Silently handle errors
      toast.error('Failed to delete link');
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination || !selectedProfile) return;

    const items = Array.from(links);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLinks(items);

    const linkIds = items.map(item => item.id);
    const success = await linktreeService.reorderLinks(selectedProfile.id, linkIds);
    
    if (!success) {
      toast.error('Failed to reorder links');
      await fetchLinks(selectedProfile.id); // Revert on failure
    } else {
      toast.success('Links reordered successfully');
    }
  };

  const getLinktreeUrl = (username: string) => {
    return `${window.location.origin}/l/${username}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          {/* Back Button */}
          <div className="mb-4">
            <Link
              to="/admin"
              className="inline-flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="text-sm font-medium">Back to Admin Dashboard</span>
            </Link>
          </div>

          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <LinkIcon size={24} className="text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Linktree Management</h1>
                <p className="text-muted-foreground mt-1">Manage custom linktree profiles and links</p>
              </div>
            </div>
            
            <Button onClick={() => setShowProfileForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Profile
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Profile Selector */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Profiles</CardTitle>
            <CardDescription>Select a profile to manage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedProfile?.id === profile.id
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-muted'
                }`}
                onClick={() => setSelectedProfile(profile)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{profile.display_name}</p>
                    <p className="text-sm text-muted-foreground">@{profile.username}</p>
                  </div>
                  <Badge variant={profile.is_active ? 'default' : 'secondary'}>
                    {profile.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {selectedProfile ? (
            <Tabs defaultValue="links" className="space-y-6">
              <TabsList>
                <TabsTrigger value="links">Links</TabsTrigger>
                <TabsTrigger value="profile">Profile Settings</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="links" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Links for {selectedProfile.display_name}</CardTitle>
                        <CardDescription>
                          <a 
                            href={getLinktreeUrl(selectedProfile.username)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center"
                          >
                            {getLinktreeUrl(selectedProfile.username)}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </CardDescription>
                      </div>
                      <Button onClick={() => setShowLinkForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Link
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="links">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                            {links.map((link, index) => (
                              <Draggable key={link.id} draggableId={link.id} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className="flex items-center space-x-3 p-3 border rounded-lg bg-card"
                                  >
                                    <div {...provided.dragHandleProps}>
                                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="font-medium">{link.title}</p>
                                          <p className="text-sm text-muted-foreground">{link.url}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <Badge variant="outline">
                                            <Eye className="w-3 h-3 mr-1" />
                                            {link.click_count}
                                            {!link.show_click_count && (
                                              <span className="ml-1 text-xs opacity-60">(hidden)</span>
                                            )}
                                          </Badge>
                                          <Badge variant={link.is_active ? 'default' : 'secondary'}>
                                            {link.is_active ? 'Active' : 'Inactive'}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex space-x-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingLink(link)}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteLink(link.id)}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>

                    {links.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No links created yet.</p>
                        <Button 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => setShowLinkForm(true)}
                        >
                          Create your first link
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Profile Settings</CardTitle>
                        <CardDescription>Customize your linktree profile</CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setEditingProfile(selectedProfile)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteProfile(selectedProfile.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Display Name</label>
                        <p className="text-lg">{selectedProfile.display_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Username</label>
                        <p className="text-lg">@{selectedProfile.username}</p>
                      </div>
                      {selectedProfile.bio && (
                        <div>
                          <label className="text-sm font-medium">Bio</label>
                          <p className="text-muted-foreground">{selectedProfile.bio}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium">Theme</label>
                        <p className="capitalize">{selectedProfile.theme}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Background</label>
                        <p className="capitalize">{selectedProfile.background_type}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Status</label>
                        <Badge variant={selectedProfile.is_active ? 'default' : 'secondary'}>
                          {selectedProfile.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics">
                <LinktreeAnalytics profileId={selectedProfile.id} />
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">No profiles available</p>
                  <Button onClick={() => setShowProfileForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create your first profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Forms */}
      {showProfileForm && (
        <LinktreeProfileForm
          onSubmit={handleCreateProfile}
          onCancel={() => setShowProfileForm(false)}
        />
      )}

      {editingProfile && (
        <LinktreeProfileForm
          profile={editingProfile}
          onSubmit={(data) => handleUpdateProfile(editingProfile.id, data)}
          onCancel={() => setEditingProfile(null)}
        />
      )}

      {showLinkForm && selectedProfile && (
        <LinktreeLinkForm
          profileId={selectedProfile.id}
          onSubmit={handleCreateLink}
          onCancel={() => setShowLinkForm(false)}
        />
      )}

      {editingLink && (
        <LinktreeLinkForm
          profileId={editingLink.profile_id}
          link={editingLink}
          onSubmit={(data) => handleUpdateLink(editingLink.id, data)}
          onCancel={() => setEditingLink(null)}
        />
      )}
        </div>
      </div>
    </div>
  );
};

export default AdminLinktree;