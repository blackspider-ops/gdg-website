import { useState } from 'react';
import { X, Upload, Palette, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LinktreeProfile } from '@/services/linktreeService';

interface LinktreeProfileFormProps {
  profile?: LinktreeProfile;
  onSubmit: (data: Omit<LinktreeProfile, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

const LinktreeProfileForm = ({ profile, onSubmit, onCancel }: LinktreeProfileFormProps) => {
  const [formData, setFormData] = useState({
    username: profile?.username || '',
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    avatar_url: profile?.avatar_url || '',
    background_type: profile?.background_type || 'color' as 'color' | 'gradient' | 'image',
    background_value: profile?.background_value || '#1a1a1a',
    theme: profile?.theme || 'dark' as 'light' | 'dark' | 'auto',
    is_active: profile?.is_active ?? true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, hyphens, and underscores';
    }

    if (!formData.display_name.trim()) {
      newErrors.display_name = 'Display name is required';
    }

    if (formData.background_type === 'image' && !formData.background_value.trim()) {
      newErrors.background_value = 'Background image URL is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const gradientPresets = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
  ];

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onCancel}
    >
      <div 
        className="bg-card rounded-xl shadow-xl border border-border w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="flex-shrink-0 p-6 border-b border-border">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-foreground">
              {profile ? 'Edit Profile' : 'Create New Profile'}
            </h2>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      placeholder="my-profile"
                      className={errors.username ? 'border-red-500' : ''}
                    />
                    {errors.username && (
                      <p className="text-sm text-red-500 mt-1">{errors.username}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="display_name">Display Name *</Label>
                    <Input
                      id="display_name"
                      value={formData.display_name}
                      onChange={(e) => handleInputChange('display_name', e.target.value)}
                      placeholder="My Profile"
                      className={errors.display_name ? 'border-red-500' : ''}
                    />
                    {errors.display_name && (
                      <p className="text-sm text-red-500 mt-1">{errors.display_name}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell people about yourself..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="avatar_url">Avatar URL</Label>
                  <Input
                    id="avatar_url"
                    value={formData.avatar_url}
                    onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>

              {/* Appearance */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Appearance</h3>
                
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={formData.theme} onValueChange={(value) => handleInputChange('theme', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Background Type</Label>
                  <Select 
                    value={formData.background_type} 
                    onValueChange={(value) => handleInputChange('background_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="color">Solid Color</SelectItem>
                      <SelectItem value="gradient">Gradient</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.background_type === 'color' && (
                  <div>
                    <Label htmlFor="background_color">Background Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="color"
                        value={formData.background_value}
                        onChange={(e) => handleInputChange('background_value', e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={formData.background_value}
                        onChange={(e) => handleInputChange('background_value', e.target.value)}
                        placeholder="#1a1a1a"
                        className="flex-1"
                      />
                    </div>
                  </div>
                )}

                {formData.background_type === 'gradient' && (
                  <div>
                    <Label>Background Gradient</Label>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {gradientPresets.map((gradient, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full h-8 rounded border-2 border-transparent hover:border-primary"
                          style={{ background: gradient }}
                          onClick={() => handleInputChange('background_value', gradient)}
                        />
                      ))}
                    </div>
                    <Input
                      value={formData.background_value}
                      onChange={(e) => handleInputChange('background_value', e.target.value)}
                      placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    />
                  </div>
                )}

                {formData.background_type === 'image' && (
                  <div>
                    <Label htmlFor="background_image">Background Image URL</Label>
                    <Input
                      id="background_image"
                      value={formData.background_value}
                      onChange={(e) => handleInputChange('background_value', e.target.value)}
                      placeholder="https://example.com/background.jpg"
                      className={errors.background_value ? 'border-red-500' : ''}
                    />
                    {errors.background_value && (
                      <p className="text-sm text-red-500 mt-1">{errors.background_value}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Settings</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_active">Active</Label>
                    <p className="text-sm text-muted-foreground">
                      When active, this profile will be publicly accessible
                    </p>
                  </div>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button type="submit">
                  {profile ? 'Update Profile' : 'Create Profile'}
                </Button>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default LinktreeProfileForm;