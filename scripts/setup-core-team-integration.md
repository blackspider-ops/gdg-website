# Core Team Integration Setup Guide

This guide walks you through setting up the bidirectional sync between Member Management and Team Management.

## Prerequisites

- Members table exists
- Team_members table exists
- Both admin pages are functional

## Setup Steps

### 1. Add Core Team Column to Members Table

```bash
# Run this script to add is_core_team column
psql -d your_database -f scripts/add-core-team-column.sql
```

This script:
- Adds `is_core_team` boolean column to members table
- Sets existing founders, organizers, and leads as core team members
- Creates performance index
- Shows verification results

### 2. Add Email Column to Team Members Table (Optional but Recommended)

```bash
# Run this script to add email column for better sync
psql -d your_database -f scripts/add-email-to-team-members.sql
```

This script:
- Adds `email` varchar column to team_members table
- Creates performance index
- Shows table structure verification

### 3. Sync Existing Core Team Members

```bash
# Run this script to create team member entries for existing core team members
psql -d your_database -f scripts/sync-core-team-members.sql
```

This script:
- Creates team member entries for existing core team members
- Maps member categories to appropriate team roles
- Prevents duplicate entries
- Shows sync results

## Verification

After running the scripts, verify the setup:

1. **Check Members Table**:
   ```sql
   SELECT category, is_core_team, COUNT(*) 
   FROM members 
   GROUP BY category, is_core_team 
   ORDER BY category;
   ```

2. **Check Team Members Table**:
   ```sql
   SELECT role, COUNT(*) 
   FROM team_members 
   GROUP BY role 
   ORDER BY role;
   ```

3. **Check Sync Status**:
   ```sql
   SELECT 
       m.name as member_name,
       m.category,
       m.is_core_team,
       tm.name as team_name,
       tm.role
   FROM members m
   LEFT JOIN team_members tm ON LOWER(m.name) = LOWER(tm.name)
   WHERE m.is_core_team = TRUE;
   ```

## Usage After Setup

### Adding New Core Team Members

**Option A: Start with Member Management**
1. Add member in Member Management
2. Check "Core Team Member" checkbox
3. System automatically creates team member entry
4. Complete team profile in Team Management

**Option B: Start with Team Management**
1. Add team member in Team Management
2. Provide email for proper sync
3. System automatically creates member entry (marked as core team)
4. Edit member details in Member Management if needed

### Managing Existing Members

- Use the shield toggle button in Member Management to promote/demote core team status
- Changes automatically sync between both systems
- Visual indicators show core team status

## Troubleshooting

### Common Issues

1. **Duplicate Names**: If you have members with the same name, the sync might skip creation. Check manually and adjust as needed.

2. **Missing Emails**: Team members without emails will get placeholder emails. Update them in Member Management for proper contact info.

3. **Role Mapping**: The system maps roles automatically, but you can adjust them manually in either system.

### Manual Fixes

If sync gets out of sync, you can manually:

1. **Find Unsynced Members**:
   ```sql
   SELECT m.* FROM members m
   LEFT JOIN team_members tm ON LOWER(m.name) = LOWER(tm.name)
   WHERE m.is_core_team = TRUE AND tm.id IS NULL;
   ```

2. **Find Unsynced Team Members**:
   ```sql
   SELECT tm.* FROM team_members tm
   LEFT JOIN members m ON LOWER(tm.name) = LOWER(m.name)
   WHERE m.id IS NULL;
   ```

## Features Enabled

After setup, you'll have:

- ✅ Bidirectional sync between Member and Team Management
- ✅ Visual core team indicators and filters
- ✅ Automatic role/category mapping
- ✅ Duplicate prevention
- ✅ Quick toggle buttons for core team status
- ✅ Enhanced stats showing core team counts
- ✅ Success/error feedback for all operations