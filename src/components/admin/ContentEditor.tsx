import React, { useState } from 'react';
import { Save, Edit3, Eye, EyeOff } from 'lucide-react';
import { ContentService } from '@/services/contentService';
import { useAdmin } from '@/contexts/AdminContext';

interface ContentEditorProps {
  title: string;
  content: any;
  onSave: (content: any) => Promise<boolean>;
  schema?: any; // JSON schema for validation
}

const ContentEditor: React.FC<ContentEditorProps> = ({ title, content, onSave, schema }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(JSON.stringify(content, null, 2));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Parse JSON
      const parsedContent = JSON.parse(editedContent);
      
      // Save content
      const success = await onSave(parsedContent);
      
      if (success) {
        setIsEditing(false);
      } else {
        setError('Failed to save content');
      }
    } catch (err) {
      setError('Invalid JSON format');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(JSON.stringify(content, null, 2));
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">{title}</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="p-2 hover:bg-muted rounded-md transition-colors"
            title={showPreview ? 'Hide Preview' : 'Show Preview'}
          >
            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Edit3 size={16} />
              <span>Edit</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="px-3 py-2 border border-border rounded-md hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Save size={16} />
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {/* Editor */}
        <div>
          <label className="block text-sm font-medium mb-2">Content (JSON)</label>
          {isEditing ? (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-64 px-3 py-2 bg-background border border-input rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter JSON content..."
            />
          ) : (
            <pre className="w-full h-64 px-3 py-2 bg-muted border border-border rounded-md text-sm font-mono overflow-auto">
              {JSON.stringify(content, null, 2)}
            </pre>
          )}
        </div>

        {/* Preview */}
        {showPreview && (
          <div>
            <label className="block text-sm font-medium mb-2">Preview</label>
            <div className="p-4 bg-muted border border-border rounded-md">
              <ContentPreview content={content} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Simple content preview component
const ContentPreview: React.FC<{ content: any }> = ({ content }) => {
  if (!content) return <p className="text-muted-foreground">No content</p>;

  if (typeof content === 'string') {
    return <p>{content}</p>;
  }

  if (content.title) {
    return (
      <div>
        <h4 className="font-semibold mb-2">{content.title}</h4>
        {content.subtitle && <p className="text-muted-foreground mb-2">{content.subtitle}</p>}
        {content.description && <p>{content.description}</p>}
        {content.cta_text && (
          <button className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md">
            {content.cta_text}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {Object.entries(content).map(([key, value]) => (
        <div key={key}>
          <strong>{key}:</strong> {JSON.stringify(value)}
        </div>
      ))}
    </div>
  );
};

export default ContentEditor;