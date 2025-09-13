# Database Setup Instructions

This guide will help you set up the database with all the necessary tables and seed data.

## Prerequisites

1. Make sure you have Supabase CLI installed
2. Make sure you're connected to your Supabase project

## Steps

### 1. Run Migrations

Run the migrations in order to create all the necessary tables:

```bash
# Run all migrations
supabase db reset

# Or run them individually if needed
supabase db push
```

### 2. Seed the Database

After running migrations, seed the database with initial data:

```bash
# Apply the seed data
supabase db seed
```

### 3. Verify Setup

You can verify the setup by checking the tables in your Supabase dashboard:

- `events` - Sample events with real data
- `team_members` - Team member profiles
- `projects` - Project showcase items
- `sponsors` - Sponsor information
- `members` - Community member data
- `site_settings` - Site configuration
- `navigation_items` - Navigation menu items
- `social_links` - Social media links
- `page_content` - Page content sections
- `footer_content` - Footer sections

### 4. Admin Access

To access the admin panel:

1. **Development Mode**: Enable direct admin access in the dev settings
2. **Production Mode**: Use the admin secret code: `gdg-secret@psu.edu`

## What's Included

The seed data includes:

- **5 sample events** with realistic details
- **5 team members** with roles and social links
- **5 projects** showcasing different technologies
- **6 sponsors** across different tiers
- **8 community members** with various categories
- **Site settings** and configuration
- **Navigation structure**
- **Page content** for home and contact pages

## Customization

After seeding, you can:

1. Update the admin secret code in site settings
2. Modify events, team members, and projects through the admin panel
3. Customize page content and site settings
4. Add your own sponsors and members

## Troubleshooting

If you encounter issues:

1. Check that all migrations ran successfully
2. Verify your Supabase connection
3. Check the Supabase logs for any errors
4. Ensure RLS policies are properly configured

## Next Steps

1. Access the admin dashboard at `/admin`
2. Update the sample data with your real information
3. Configure your site settings
4. Add your team members and events
5. Customize the content to match your chapter