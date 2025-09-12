# GDG@PSU Supabase Database

This folder contains all database schemas, migrations, and seed data for the GDG@PSU website.

## 📁 Folder Structure

```
supabase/
├── schemas/           # Complete database schemas
│   ├── initial-schema.sql    # Main tables and structure
│   ├── rls-policies.sql      # Row Level Security policies
│   └── triggers.sql          # Database triggers
├── migrations/        # Database migrations
│   └── 001_add_password_auth.sql
├── seeds/            # Initial data
│   └── initial-data.sql
└── README.md         # This file
```

## 🚀 Setup Instructions

### For New Database (Fresh Install)

Run these files in order in your Supabase SQL Editor:

1. **`schemas/initial-schema.sql`** - Creates all tables and indexes
2. **`schemas/rls-policies.sql`** - Sets up security policies  
3. **`schemas/triggers.sql`** - Adds automatic triggers
4. **`seeds/comprehensive-data.sql`** - Populates with sample data for all sections

### For Quick Setup (Recommended)

Just run **`seeds/comprehensive-data.sql`** - it includes everything you need!

### For Existing Database (Updates)

Run migration files in order:

1. **`migrations/001_add_password_auth.sql`** - Adds password authentication

## 📋 Database Tables

### Core Tables
- **`admin_users`** - Admin authentication and management
- **`site_content`** - Dynamic website content
- **`events`** - Event management
- **`team_members`** - Team member profiles
- **`projects`** - Project showcase
- **`sponsors`** - Sponsor management
- **`newsletter_subscribers`** - Newsletter subscriptions
- **`admin_actions`** - Admin activity logging

### Key Features
- ✅ **UUID primary keys** for all tables
- ✅ **Automatic timestamps** (created_at, updated_at)
- ✅ **Row Level Security (RLS)** enabled
- ✅ **Indexes** for performance optimization
- ✅ **Foreign key constraints** for data integrity
- ✅ **Check constraints** for data validation

## 🔐 Security

### Row Level Security (RLS)
- **Public read access** for website content
- **Admin-only access** for management operations
- **Secure policies** to prevent unauthorized access

### Admin System
- **Password hashing** with bcrypt
- **Role-based permissions** (Super Admin, Admin)
- **Activity logging** for audit trails
- **Account activation/deactivation**

## 🔧 Default Credentials

**Admin Email**: `admin@gdgpsu.com` (change this in `seeds/initial-data.sql`)  
**Default Password**: `admin123` (CHANGE IMMEDIATELY!)

## 📝 Making Changes

### Adding New Tables
1. Add table definition to `schemas/initial-schema.sql`
2. Add RLS policies to `schemas/rls-policies.sql`
3. Add triggers if needed to `schemas/triggers.sql`
4. Create migration file in `migrations/`

### Updating Existing Tables
1. Create new migration file: `migrations/XXX_description.sql`
2. Use `ALTER TABLE` statements with `IF NOT EXISTS` checks
3. Update relevant schema files for new installations

## 🧪 Testing

After running the setup:

1. **Check tables exist**: Go to Supabase Table Editor
2. **Verify RLS policies**: Check Authentication > Policies
3. **Test admin login**: Use the website admin panel
4. **Verify triggers**: Update a record and check timestamps

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)