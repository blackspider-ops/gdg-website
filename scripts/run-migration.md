# Database Migration Instructions

## Running the New Migration

To apply the security and password management features, run this migration:

```bash
# If using Supabase CLI locally
npx supabase db reset

# Or apply just the new migration
npx supabase db push
```

## What This Migration Does

### 1. Password Management Features
- Adds `must_change_password` column to track temporary passwords
- Adds `password_changed_at` column to track password changes
- Adds `temporary_password_expires_at` for future expiration features

### 2. Enhanced Audit System
- Expands admin_actions to include 30+ action types
- Creates security_events table for detailed security logging
- Adds comprehensive audit trail capabilities

### 3. Security Features
- RLS policies for secure data access
- Automatic login event logging
- Comprehensive action tracking

## Troubleshooting

If you get policy conflicts, the migration handles them by:
- Dropping existing policies safely
- Recreating them with proper permissions
- Adding existence checks for all new features

## Verification

After running the migration, verify it worked:

1. Check that new columns exist:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'admin_users' 
AND column_name IN ('must_change_password', 'password_changed_at', 'temporary_password_expires_at');
```

2. Check that security_events table exists:
```sql
SELECT table_name FROM information_schema.tables WHERE table_name = 'security_events';
```

3. Check that expanded actions are available:
```sql
SELECT constraint_name FROM information_schema.table_constraints 
WHERE table_name = 'admin_actions' AND constraint_name = 'admin_actions_action_check';
```

## Next Steps

Once the migration is complete:
1. The temporary password system will be fully functional
2. Comprehensive audit logging will be active
3. Security events will be tracked automatically
4. Team member promotion with temporary passwords will work

## Support

If you encounter any issues:
1. Check the Supabase logs for detailed error messages
2. Ensure you have proper database permissions
3. Try running the migration in parts if needed