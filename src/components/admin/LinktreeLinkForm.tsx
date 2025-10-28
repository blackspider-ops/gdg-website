import { useState } from 'react';
import { X, Link as LinkIcon, ExternalLink, Monitor, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LinktreeLink } from '@/services/linktreeService';
import { getIconComponent } from '@/lib/icons';

interface LinktreeLinkFormProps {
    profileId: string;
    link?: LinktreeLink;
    onSubmit: (data: Omit<LinktreeLink, 'id' | 'created_at' | 'updated_at' | 'click_count'>) => void;
    onCancel: () => void;
}

const LinktreeLinkForm = ({ profileId, link, onSubmit, onCancel }: LinktreeLinkFormProps) => {
    const [formData, setFormData] = useState({
        profile_id: profileId,
        title: link?.title || '',
        url: link?.url || '',
        description: link?.description || '',
        icon_type: link?.icon_type || 'link' as 'link' | 'social' | 'custom',
        icon_value: link?.icon_value || 'link',
        button_style: link?.button_style || 'default' as 'default' | 'outline' | 'filled' | 'minimal',
        button_color: link?.button_color || '#ffffff',
        text_color: link?.text_color || '#000000',
        embed_type: link?.embed_type || 'none' as 'none' | 'google_form' | 'iframe',
        is_active: link?.is_active ?? true,
        sort_order: link?.sort_order || 0
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const iconOptions = [
        { value: 'link', label: 'Link', category: 'general' },
        { value: 'external-link', label: 'External Link', category: 'general' },
        { value: 'mail', label: 'Email', category: 'general' },
        { value: 'phone', label: 'Phone', category: 'general' },
        { value: 'calendar', label: 'Calendar', category: 'general' },
        { value: 'map-pin', label: 'Location', category: 'general' },
        { value: 'shopping-cart', label: 'Shop', category: 'general' },
        { value: 'book-open', label: 'Blog', category: 'general' },
        { value: 'video', label: 'Video', category: 'general' },
        { value: 'music', label: 'Music', category: 'general' },
        { value: 'camera', label: 'Photos', category: 'general' },
        { value: 'users', label: 'Community', category: 'general' },
        { value: 'code', label: 'Code', category: 'general' },
        { value: 'github', label: 'GitHub', category: 'social' },
        { value: 'twitter', label: 'Twitter', category: 'social' },
        { value: 'linkedin', label: 'LinkedIn', category: 'social' },
        { value: 'instagram', label: 'Instagram', category: 'social' },
        { value: 'facebook', label: 'Facebook', category: 'social' },
        { value: 'youtube', label: 'YouTube', category: 'social' },
        { value: 'twitch', label: 'Twitch', category: 'social' },
        { value: 'discord', label: 'Discord', category: 'social' }
    ];

    const buttonStyles = [
        { value: 'default', label: 'Default', preview: 'border border-white/20 bg-white/10' },
        { value: 'outline', label: 'Outline', preview: 'border-2 bg-transparent' },
        { value: 'filled', label: 'Filled', preview: 'border-none' },
        { value: 'minimal', label: 'Minimal', preview: 'border-none bg-transparent' }
    ];

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (!formData.url.trim()) {
            newErrors.url = 'URL is required';
        } else if (!isValidUrl(formData.url)) {
            newErrors.url = 'Please enter a valid URL';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isValidUrl = (url: string) => {
        try {
            // Allow relative URLs (starting with /) or full URLs
            if (url.startsWith('/')) return true;
            new URL(url);
            return true;
        } catch {
            return false;
        }
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

        // Auto-detect embed type when URL changes
        if (field === 'url' && typeof value === 'string') {
            const url = value.toLowerCase();
            if ((url.includes('docs.google.com/forms') || url.includes('forms.gle')) && formData.embed_type === 'none') {
                setFormData(prev => ({ ...prev, embed_type: 'google_form' }));
            }
        }
    };

    const IconPreview = ({ iconValue }: { iconValue: string }) => {
        const IconComponent = getIconComponent(iconValue);
        return <IconComponent className="w-5 h-5" />;
    };

    const getButtonPreviewStyle = () => {
        const baseStyle = {
            backgroundColor: formData.button_style === 'filled' ? formData.button_color : 'transparent',
            color: formData.text_color,
            borderColor: formData.button_color,
        };

        switch (formData.button_style) {
            case 'outline':
                return {
                    ...baseStyle,
                    border: `2px solid ${formData.button_color}`,
                    backgroundColor: 'transparent'
                };
            case 'filled':
                return {
                    ...baseStyle,
                    border: 'none'
                };
            case 'minimal':
                return {
                    ...baseStyle,
                    border: 'none',
                    backgroundColor: 'transparent'
                };
            default:
                return {
                    ...baseStyle,
                    border: `1px solid ${formData.button_color}`,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                };
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50"
            onClick={onCancel}
        >
            <div 
                className="bg-card rounded-lg sm:rounded-xl shadow-xl border border-border w-full max-w-2xl max-h-[95vh] sm:max-h-[80vh] overflow-hidden flex flex-col animate-fade-in"
                onClick={(e) => e.stopPropagation()}
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
            >
                {/* Fixed Header */}
                <div className="flex-shrink-0 p-4 sm:p-6 border-b border-border">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                            {link ? 'Edit Link' : 'Create New Link'}
                        </h2>
                        <Button variant="ghost" size="sm" onClick={onCancel}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Link Information</h3>

                                <div>
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        placeholder="My Awesome Link"
                                        className={errors.title ? 'border-red-500' : ''}
                                    />
                                    {errors.title && (
                                        <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="url">URL *</Label>
                                    <Input
                                        id="url"
                                        value={formData.url}
                                        onChange={(e) => handleInputChange('url', e.target.value)}
                                        placeholder="https://example.com or /internal-page"
                                        className={errors.url ? 'border-red-500' : ''}
                                    />
                                    {errors.url && (
                                        <p className="text-sm text-red-500 mt-1">{errors.url}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        placeholder="Brief description of this link..."
                                        rows={2}
                                    />
                                </div>

                                {/* Embed Options */}
                                <div>
                                    <Label>Embed Behavior</Label>
                                    <div className="space-y-2 mt-2">
                                        {[
                                            {
                                                value: 'none',
                                                label: 'Open in new tab',
                                                description: 'Default behavior - opens link in new browser tab',
                                                icon: ExternalLink
                                            },
                                            {
                                                value: 'iframe',
                                                label: 'Embed in modal',
                                                description: 'Opens content in an embedded modal on your page',
                                                icon: Monitor
                                            },
                                            {
                                                value: 'google_form',
                                                label: 'Google Form (optimized)',
                                                description: 'Optimized embedding for Google Forms with mobile support',
                                                icon: FileText
                                            }
                                        ].map((option) => {
                                            const IconComponent = option.icon;
                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    className={`w-full p-3 sm:p-4 rounded-lg border-2 text-left hover:bg-muted active:bg-muted transition-colors touch-manipulation ${
                                                        formData.embed_type === option.value 
                                                            ? 'border-primary bg-primary/10' 
                                                            : 'border-border'
                                                    }`}
                                                    onClick={() => handleInputChange('embed_type', option.value)}
                                                >
                                                    <div className="flex items-start space-x-3">
                                                        <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 text-muted-foreground flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-sm sm:text-base">{option.label}</div>
                                                            <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                                                {option.description}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Icon Selection */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Icon</h3>

                                <div>
                                    <Label>Icon Type</Label>
                                    <Select
                                        value={formData.icon_type}
                                        onValueChange={(value) => handleInputChange('icon_type', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="link">General</SelectItem>
                                            <SelectItem value="social">Social Media</SelectItem>
                                            <SelectItem value="custom">Custom</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Icon</Label>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
                                        {iconOptions
                                            .filter(icon =>
                                                formData.icon_type === 'link' ? icon.category === 'general' :
                                                    formData.icon_type === 'social' ? icon.category === 'social' :
                                                        true
                                            )
                                            .map((icon) => (
                                                <button
                                                    key={icon.value}
                                                    type="button"
                                                    className={`p-3 rounded border-2 flex items-center justify-center hover:bg-muted transition-colors ${formData.icon_value === icon.value ? 'border-primary bg-primary/10' : 'border-border'
                                                        }`}
                                                    onClick={() => handleInputChange('icon_value', icon.value)}
                                                    title={icon.label}
                                                >
                                                    <IconPreview iconValue={icon.value} />
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            </div>

                            {/* Button Style */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Button Style</h3>

                                <div>
                                    <Label>Style</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                        {buttonStyles.map((style) => (
                                            <button
                                                key={style.value}
                                                type="button"
                                                className={`p-3 rounded border-2 text-left hover:bg-muted transition-colors ${formData.button_style === style.value ? 'border-primary bg-primary/10' : 'border-border'
                                                    }`}
                                                onClick={() => handleInputChange('button_style', style.value)}
                                            >
                                                <div className="font-medium">{style.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Color Presets */}
                                <div>
                                    <Label>Color Presets</Label>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2 mb-4">
                                        {[
                                            { name: 'Blue', button: '#3b82f6', text: '#ffffff' },
                                            { name: 'Green', button: '#10b981', text: '#ffffff' },
                                            { name: 'Purple', button: '#8b5cf6', text: '#ffffff' },
                                            { name: 'Red', button: '#ef4444', text: '#ffffff' },
                                            { name: 'Orange', button: '#f97316', text: '#ffffff' },
                                            { name: 'Pink', button: '#ec4899', text: '#ffffff' },
                                            { name: 'Indigo', button: '#6366f1', text: '#ffffff' },
                                            { name: 'Teal', button: '#14b8a6', text: '#ffffff' },
                                            { name: 'Yellow', button: '#eab308', text: '#000000' },
                                            { name: 'Gray', button: '#6b7280', text: '#ffffff' },
                                            { name: 'Black', button: '#000000', text: '#ffffff' },
                                            { name: 'White', button: '#ffffff', text: '#000000' },
                                        ].map((preset) => (
                                            <button
                                                key={preset.name}
                                                type="button"
                                                className="w-full h-10 rounded border-2 border-transparent hover:border-primary transition-colors"
                                                style={{ backgroundColor: preset.button, color: preset.text }}
                                                onClick={() => {
                                                    handleInputChange('button_color', preset.button);
                                                    handleInputChange('text_color', preset.text);
                                                }}
                                                title={preset.name}
                                            >
                                                <span className="text-xs font-medium">Aa</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="button_color">Button Color</Label>
                                        <div className="flex space-x-2">
                                            <Input
                                                type="color"
                                                value={formData.button_color}
                                                onChange={(e) => handleInputChange('button_color', e.target.value)}
                                                className="w-16 h-10 p-1"
                                            />
                                            <Input
                                                value={formData.button_color}
                                                onChange={(e) => handleInputChange('button_color', e.target.value)}
                                                placeholder="#ffffff"
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="text_color">Text Color</Label>
                                        <div className="flex space-x-2">
                                            <Input
                                                type="color"
                                                value={formData.text_color}
                                                onChange={(e) => handleInputChange('text_color', e.target.value)}
                                                className="w-16 h-10 p-1"
                                            />
                                            <Input
                                                value={formData.text_color}
                                                onChange={(e) => handleInputChange('text_color', e.target.value)}
                                                placeholder="#000000"
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Preview */}
                                <div>
                                    <Label>Preview</Label>
                                    <div className="mt-2 p-4 bg-gray-900 rounded-lg">
                                        <button
                                            type="button"
                                            className="w-full p-4 rounded-lg flex items-center justify-start transition-all duration-200"
                                            style={getButtonPreviewStyle()}
                                        >
                                            <div className="flex items-center w-full">
                                                <div className="flex-shrink-0 mr-3">
                                                    <IconPreview iconValue={formData.icon_value} />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <div className="font-semibold">
                                                        {formData.title || 'Link Title'}
                                                    </div>
                                                    {formData.description && (
                                                        <div className="text-sm opacity-80">
                                                            {formData.description}
                                                        </div>
                                                    )}
                                                </div>
                                                <ExternalLink className="w-4 h-4 opacity-60 ml-3" />
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Settings */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Settings</h3>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="is_active">Active</Label>
                                        <p className="text-sm text-muted-foreground">
                                            When active, this link will be visible on the profile
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
                            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                                    Cancel
                                </Button>
                                <Button type="submit" className="w-full sm:w-auto">
                                    {link ? 'Update Link' : 'Create Link'}
                                </Button>
                            </div>
                        </form>
                </div>
            </div>
        </div>
    );
};

export default LinktreeLinkForm;