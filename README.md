# GDG@PSU Website

## Project info

Official website for Google Developer Groups at Penn State University.

## How can I edit this code?

**Use your preferred IDE**

Clone this repo and push changes to update the website.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Step 5: Set up the database (see scripts/setup-database.md for details)
supabase db reset

# Step 6: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- **Frontend**: Vite, TypeScript, React, shadcn-ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL database, Authentication, Real-time subscriptions)
- **Admin Panel**: Full-featured admin dashboard for content management
- **Services**: Dedicated service classes for Events, Members, Projects, Sponsors, and Content management

## How can I deploy this project?

This project can be deployed to any static hosting service like Netlify, Vercel, or GitHub Pages.

Build the project with:
```sh
npm run build
```

Then deploy the `dist` folder to your hosting service.

## Admin Panel Features

The admin panel provides comprehensive management capabilities:

### Content Management
- **Events**: Create, edit, and manage chapter events with real-time updates
- **Members**: Manage community members with categories (founder, organizer, lead, active, member, alumni)
- **Projects**: Showcase chapter projects with tech stacks and links
- **Sponsors**: Manage sponsor relationships with tier-based organization
- **Site Content**: Dynamic content management for all pages

### Real-time Features
- Live data synchronization across all admin pages
- Real-time statistics and analytics
- Instant content updates without page refresh

### Access Control
- Development mode for easy testing
- Production admin authentication
- Role-based permissions (admin, super_admin)

### Database Integration
- Full Supabase integration with PostgreSQL
- Row Level Security (RLS) policies
- Real-time subscriptions for live updates
- Comprehensive migration system

## Getting Started with Admin Panel

1. **Development Mode**: Enable direct admin access in dev settings for testing
2. **Production Mode**: Use the admin secret code to gain access
3. **Database Setup**: Follow `scripts/setup-database.md` for initial setup
4. **Content Management**: Access `/admin` to manage all site content

## Database Schema

The project includes comprehensive database tables:
- `events` - Event management
- `team_members` - Team member profiles  
- `projects` - Project showcase
- `sponsors` - Sponsor management
- `members` - Community member tracking
- `site_settings` - Site configuration
- `page_content` - Dynamic page content
- `navigation_items` - Menu management
- `social_links` - Social media links
- `footer_content` - Footer sections
- `admin_users` - Admin user management
- `admin_actions` - Audit trail
