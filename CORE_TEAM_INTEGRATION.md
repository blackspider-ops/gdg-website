# Core Team Integration

This document explains the integration between Member Management and Team Management through the Core Team functionality.

## Overview

The Core Team feature bridges the gap between general community members and the organizational team structure by allowing members to be marked as core team members, which automatically creates corresponding entries in the Team Management section.

## How It Works

### 1. Core Team Checkbox
- When adding or editing a member, you can check "Core Team Member"
- This marks the member as `is_core_team: true` in the database
- If checked, it automatically creates a corresponding entry in the Team Management section

### 2. Automatic Team Member Creation
When a member is marked as core team, the system:
- Creates a team member entry with the same name
- Maps the member category to an appropriate team role:
  - `founder` → `Chapter Lead`
  - `organizer` → `Organizer`
  - `lead` → `Team Lead`
  - `active` → `Team Member`
  - `member` → `Team Member`
  - `alumni` → `Alumni`
- Sets a basic bio using their academic information
- Sets order_index to 999 (can be adjusted in Team Management)

### 3. Visual Indicators
- Core team members show a purple "Core Team" badge in the member list
- Core team filter allows filtering by core team status
- Core team toggle button (shield icon) for quick status changes
- Updated stats show core team count

### 4. Database Changes
- Added `is_core_team` boolean column to members table
- Existing members with categories `founder`, `organizer`, or `lead` are automatically marked as core team
- Index added for performance

## Usage Workflow

### For New Members (Member Management → Team Management)
1. Add member through Member Management
2. Check "Core Team Member" if they're part of the organizing team
3. Complete their profile in Team Management for public display

### For New Team Members (Team Management → Member Management)
1. Add team member through Team Management
2. Provide email for proper Member Management sync
3. System automatically creates corresponding member entry marked as core team
4. Member entry uses mapped category based on team role

### For Existing Members
1. Use the shield toggle button to add/remove core team status
2. Or edit the member and check/uncheck the core team checkbox
3. Complete their team profile in Team Management

### Managing Team Display
1. Go to Team Management to add photos, bios, social links
2. Adjust display order for the public team page
3. Update roles as needed

## Bidirectional Sync

### Member → Team Member
- When member is marked as core team
- Creates team member with mapped role
- Uses academic info for basic bio

### Team Member → Member  
- When team member is created
- Creates member with mapped category
- Uses provided email or creates placeholder
- Automatically marked as core team

## Database Scripts

### Migration Script
Run `scripts/add-core-team-column.sql` to add the core team functionality to existing databases.

### Sync Script
Run `scripts/sync-core-team-members.sql` to create team member entries for existing core team members.

## Benefits

1. **Unified Management**: Manage all members in one place while maintaining team structure
2. **Automatic Sync**: No need to manually duplicate information between systems
3. **Flexible Roles**: Members can have different roles in community vs. team contexts
4. **Easy Promotion**: Simple checkbox to promote members to core team
5. **Clear Hierarchy**: Visual distinction between regular and core team members

## Technical Implementation

### Services
- `MembersService.createTeamMemberFromMember()`: Creates team member from member data
- Updated member stats to include core team count
- Enhanced member CRUD operations to handle core team status

### Components
- Enhanced AdminMembers with core team checkbox and toggle
- Added core team filter and visual indicators
- Improved form validation and success messages

### Database
- `members.is_core_team` boolean column
- Automatic role mapping logic
- Performance indexes for filtering