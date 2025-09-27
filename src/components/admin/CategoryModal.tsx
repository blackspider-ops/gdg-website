import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Palette } from 'lucide-react';
import { BlogService, BlogCategory } from '@/services/blogService';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface CategoryModalProps {
  category: BlogCategory | null;
  onClose: () => void;
  onSave: () => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  category,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#3B82F6',
    is_active: true,
    order_index: 0
  });
  
  const [isSaving, setIsSaving] = useState(false);
  
  // Refs for focus management
  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  // Lock body scroll when modal is open
  useBodyScrollLock(true);

  const colorOptions = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280'  // Gray
  ];

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        color: category.color,
        is_active: category.is_active,
        order_index: category.order_index
      });
    }
  }, [category]);

  // Handle focus management and keyboard events
  useEffect(() => {
    // Focus the first input after a short delay
    const focusTimer = setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
    }, 100);

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleEscape);
      clearTimeout(focusTimer);
    };
  }, [onClose]);

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: category ? prev.slug : BlogService.generateSlug(name)
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      let success = false;
      if (category) {
        success = await BlogService.updateCategory(category.id, formData);
      } else {
        const newCategory = await BlogService.createCategory(formData);
        success = !!newCategory;
      }

      if (success) {
        onSave();
        onClose();
      }
    } catch (error) {
      // Silently handle save errors
    } finally {
      setIsSaving(false);
    }
  };

  return (
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
          onClose();
        }
      }}
      onWheel={(e) => e.preventDefault()}
      onTouchMove={(e) => e.preventDefault()}
      onScroll={(e) => e.preventDefault()}
    >
      <div 
        ref={modalRef}
        className="bg-card border border-border rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {category ? 'Edit Category' : 'Create New Category'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-auto p-6">
          <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Name *</label>
            <input
              ref={nameInputRef}
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="Category name..."
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">URL Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="url-friendly-slug"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="Brief description of this category..."
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Color</label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color 
                      ? 'border-foreground scale-110' 
                      : 'border-border hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              className="mt-2 w-full h-10 bg-background border border-border rounded-lg"
            />
          </div>

          {/* Order Index */}
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Display Order</label>
            <input
              type="number"
              value={formData.order_index}
              onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              min="0"
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-foreground">Active</label>
              <p className="text-xs text-muted-foreground">Show this category on the public blog</p>
            </div>
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-4 h-4 text-primary bg-background border border-border rounded focus:ring-2 focus:ring-primary"
            />
          </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 flex items-center justify-end space-x-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
          >
            <Save size={16} />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;