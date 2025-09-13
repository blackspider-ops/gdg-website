# Resources Management System

## Overview

The Resources Management System provides a complete solution for managing learning resources, study jams, cloud credits, documentation, and session recordings. It includes both frontend display and admin management capabilities with real-time synchronization.

## Features

### Frontend Features
- **Study Jams**: Interactive learning sessions with materials and progress tracking
- **Cloud Credits**: Free tier and credit offerings with requirements and application links
- **Documentation**: Curated documentation and tutorials with tagging
- **Session Recordings**: Video recordings with view tracking and metadata
- **View Tracking**: Automatic view count increment when resources are accessed
- **Responsive Design**: Mobile-friendly interface with smooth interactions

### Admin Features
- **Full CRUD Operations**: Create, read, update, and delete resources
- **Advanced Filtering**: Filter by type, status, and search across multiple fields
- **Bulk Operations**: Reorder resources, toggle active status
- **Rich Form Interface**: Comprehensive forms with array management for tags, materials, and requirements
- **Real-time Updates**: Live synchronization across all admin interfaces
- **Statistics Dashboard**: Resource counts and type distribution
- **Status Management**: Control resource availability and visibility

## Database Schema

### Resources Table
```sql
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT CHECK (type IN ('study_jam', 'cloud_credit', 'documentation', 'recording')) NOT NULL,
    category TEXT,
    url TEXT,
    duration TEXT,
    level TEXT CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
    status TEXT CHECK (status IN ('Available', 'Coming Soon', 'Archived')) DEFAULT 'Available',
    provider TEXT,
    amount TEXT,
    requirements TEXT[] DEFAULT '{}',
    materials TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    speaker TEXT,
    views INTEGER DEFAULT 0,
    icon TEXT,
    color TEXT,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Key Fields Explained
- **type**: Resource category (study_jam, cloud_credit, documentation, recording)
- **status**: Availability status (Available, Coming Soon, Archived)
- **level**: Difficulty level for learning resources
- **requirements**: Array of prerequisites or requirements
- **materials**: Array of included materials (slides, code, etc.)
- **tags**: Array of searchable tags
- **views**: View count for analytics
- **is_active**: Controls frontend visibility
- **order_index**: Display order

## Setup Instructions

### 1. Database Setup
Run the setup script to create the table and sample data:
```bash
# Using Supabase CLI
supabase db push

# Or run the SQL directly
psql -f scripts/ensure-resources-table.sql
```

### 2. Verify Setup
Check that everything is working:
```bash
psql -f scripts/verify-resources-system.sql
```

### 3. Access Admin Panel
1. Navigate to `/admin` in your application
2. Go to the "Resources" section
3. Start managing your resources

## Usage Guide

### Adding Resources

#### Study Jams
- Set type to "study_jam"
- Add materials like "Slides", "Code Samples", "Recordings"
- Set duration (e.g., "8 weeks")
- Choose appropriate level
- Add category (e.g., "Android", "Cloud", "ML")

#### Cloud Credits
- Set type to "cloud_credit"
- Add provider (e.g., "Google Cloud", "Firebase")
- Set amount (e.g., "$300", "Free")
- Add requirements array
- Include application URL

#### Documentation
- Set type to "documentation"
- Add relevant tags for searchability
- Include direct link to documentation
- Categorize appropriately

#### Session Recordings
- Set type to "recording"
- Add speaker name
- Set duration
- Include video URL
- Add metadata like recording date

### Managing Resources

#### Filtering and Search
- Use the search bar to find resources by title, description, category, or speaker
- Filter by type (Study Jams, Cloud Credits, Documentation, Recordings)
- Filter by status (Available, Coming Soon, Archived)

#### Bulk Operations
- Toggle active/inactive status with the eye icon
- Reorder resources using up/down arrows
- Edit resources with the edit icon
- Delete resources with the trash icon

#### Form Features
- **Array Management**: Add/remove items from requirements, materials, and tags
- **Real-time Validation**: Form validation with error messages
- **Auto-save**: Changes are saved immediately
- **Rich Editing**: Comprehensive form with all resource fields

## API Reference

### ResourcesService Methods

```typescript
// Get all active resources
ResourcesService.getResources(): Promise<Resource[]>

// Get resources by type
ResourcesService.getResourcesByType(type: string): Promise<Resource[]>

// Create new resource
ResourcesService.createResource(resource: Partial<Resource>): Promise<Resource | null>

// Update existing resource
ResourcesService.updateResource(id: string, updates: Partial<Resource>): Promise<Resource | null>

// Delete resource
ResourcesService.deleteResource(id: string): Promise<boolean>

// Increment view count
ResourcesService.incrementViews(id: string): Promise<boolean>

// Toggle active status
ResourcesService.toggleActive(id: string): Promise<Resource | null>

// Get statistics
ResourcesService.getResourceStats(): Promise<ResourceStats>
```

## Frontend Integration

### Using Resources in Components
```typescript
import { useContent } from '@/contexts/ContentContext';

const MyComponent = () => {
  const { resources, isLoading } = useContent();
  
  // Filter by type
  const studyJams = resources.filter(r => r.type === 'study_jam');
  
  // Handle resource click with view tracking
  const handleResourceClick = async (resourceId: string, url?: string) => {
    await ResourcesService.incrementViews(resourceId);
    if (url) {
      window.open(url, '_blank');
    }
  };
  
  return (
    <div>
      {studyJams.map(jam => (
        <div key={jam.id} onClick={() => handleResourceClick(jam.id, jam.url)}>
          <h3>{jam.title}</h3>
          <p>{jam.description}</p>
        </div>
      ))}
    </div>
  );
};
```

### Real-time Updates
The system automatically updates when resources change through:
- Supabase real-time subscriptions
- ContentContext integration
- Automatic re-fetching on mutations

## Security

### Row Level Security (RLS)
- Public users can only read active resources
- Authenticated users (admins) have full access
- Policies automatically enforce access control

### Data Validation
- Type constraints on enums (type, level, status)
- Required field validation
- URL format validation
- Array field sanitization

## Performance Optimizations

### Database Indexes
- Type-based filtering
- Category searches
- Status filtering
- Active resource queries
- Order-based sorting

### Frontend Optimizations
- Lazy loading of resources
- Efficient filtering and search
- Optimistic updates
- Real-time synchronization

## Troubleshooting

### Common Issues

1. **Resources not showing**: Check `is_active` status
2. **View counts not incrementing**: Verify increment function exists
3. **Admin access denied**: Check authentication and RLS policies
4. **Real-time updates not working**: Verify Supabase subscriptions

### Debug Commands
```sql
-- Check table exists
SELECT * FROM information_schema.tables WHERE table_name = 'resources';

-- Check sample data
SELECT type, COUNT(*) FROM resources GROUP BY type;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'resources';

-- Test increment function
SELECT increment_resource_views('your-resource-id-here');
```

## Migration Guide

If upgrading from an older version:

1. Run the ensure script: `scripts/ensure-resources-table.sql`
2. Verify with: `scripts/verify-resources-system.sql`
3. Update any custom code to use new API methods
4. Test admin interface functionality

## Contributing

When adding new features:
1. Update the database schema if needed
2. Add corresponding service methods
3. Update admin interface
4. Add frontend integration
5. Update this documentation

## Support

For issues or questions:
1. Check the verification script output
2. Review the troubleshooting section
3. Check Supabase logs for errors
4. Verify RLS policies and permissions