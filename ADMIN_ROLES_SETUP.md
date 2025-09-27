# Admin Roles Setup

## Current Role Configuration

The admin system now supports three role types:

### 1. Super Admin (`super_admin`)
- **Current User**: `tms7397@psu.edu`
- **Privileges**: Full access to all admin features
- **Capabilities**:
  - All admin dashboard features
  - Blog management (create, edit, approve posts)
  - User management
  - System configuration
  - All other admin functions

### 2. Regular Admin (`admin`)
- **Example User**: `admin@psu.edu`
- **Privileges**: Standard admin access
- **Capabilities**:
  - Most admin dashboard features
  - Blog management
  - Content management

### 3. Blog Editor (`blog_editor`)
- **Example User**: `blog-editor@psu.edu`
- **Privileges**: Limited to blog-related functions
- **Capabilities**:
  - Create and edit blog posts (requires approval)
  - Access to blog editor dashboard
  - Limited media management for blog submissions
  - Posts created by blog editors are set to draft status and require approval

## Access Control Implementation

The system implements proper role-based access control:

- **Blog Management**: Accessible by all three roles (`super_admin`, `admin`, `blog_editor`)
- **Full Admin Dashboard**: Only accessible by `super_admin` and `admin`
- **Blog Editor Dashboard**: Specific interface for `blog_editor` role users
- **Approval Workflow**: Posts created by `blog_editor` require approval from admin/super_admin

## Current Setup

Your main admin user (`tms7397@psu.edu`) has the `super_admin` role, which means you have:
- ✅ Admin privileges
- ✅ Blog editor capabilities
- ✅ Full system access
- ✅ Ability to approve blog posts from other editors

## Test Users

The seed data now includes test users for each role:
- `tms7397@psu.edu` - Super Admin (your main account)
- `admin@psu.edu` - Regular Admin
- `blog-editor@psu.edu` - Blog Editor

All test accounts use the same password hash for development purposes.

## Usage

1. **As Super Admin**: You can access all features including the main admin dashboard at `/admin`
2. **Blog Management**: Access blog features at `/admin/blog`
3. **Role Testing**: Use the different test accounts to see how each role behaves
4. **Blog Editor Experience**: Login as `blog-editor@psu.edu` to see the restricted blog editor interface

The system automatically redirects users to appropriate dashboards based on their role.