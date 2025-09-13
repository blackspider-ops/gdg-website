# Role Management Workflow

## Clear Separation of Responsibilities

### 👥 **Member Management**
**Purpose**: Manage community member information and general categorization

**What you can edit:**
- ✅ Name, Email, Phone
- ✅ Academic info (Year, Major)
- ✅ Interests
- ✅ Active status
- ✅ Core team status (promote/demote)
- ✅ Category (for non-core team members only)

**What's restricted:**
- ❌ Category for core team members (shows "Managed in Team")

### 🏆 **Team Management**
**Purpose**: Manage core team roles and public-facing information

**What you can edit:**
- ✅ Team Role (Chapter Lead, Organizer, etc.)
- ✅ Bio and description
- ✅ Profile photo
- ✅ Social links (LinkedIn, GitHub)
- ✅ Display order
- ✅ Email (syncs to Member Management)
- ✅ Name (syncs to Member Management)
- ✅ Active status (syncs to Member Management)

**What's automatic:**
- 🔄 Role changes automatically update member category

## Role → Category Mapping

| Team Role | Member Category |
|-----------|----------------|
| Chapter Lead, Co-Lead | Founder |
| Vice President, Community Manager, Events Coordinator | Organizer |
| Technical Lead, Marketing Lead, Design Lead, Team Lead | Lead |
| Team Member | Active Member |
| Organizer | Organizer |
| Faculty Advisor | Organizer |

## Workflow Examples

### 1. **Adding New Core Team Member**
**Option A: Start with Member Management**
1. Add member with basic info
2. Check "Core Team Member"
3. Go to Team Management to set role and complete profile

**Option B: Start with Team Management**
1. Add team member with role and details
2. Member entry automatically created with mapped category

### 2. **Promoting Existing Member**
1. In Member Management: Toggle "Core Team" status
2. Go to Team Management to set their role and complete profile
3. Role automatically sets their member category

### 3. **Changing Team Roles**
1. In Team Management: Change the role
2. Member category automatically updates
3. All other info stays in sync

### 4. **Managing Member Info**
1. In Member Management: Update personal info, interests, academic details
2. Changes sync to Team Management (except role)
3. Role/category changes only happen in Team Management

## Benefits

✅ **No Conflicts**: Clear ownership of different fields
✅ **No Infinite Loops**: Role changes only happen in one place
✅ **Intuitive Workflow**: Team roles control categories, not vice versa
✅ **Consistent Data**: Automatic sync keeps everything aligned
✅ **Clear UI**: Visual indicators show what's managed where

## Visual Indicators

- **Member Management**: Core team members show "(Managed in Team)" for category
- **Team Management**: Role field shows "(Controls member category)"
- **Form Fields**: Disabled fields show helpful explanations
- **Success Messages**: Clear feedback about what synced where

This workflow eliminates the sync conflicts while maintaining full bidirectional integration!