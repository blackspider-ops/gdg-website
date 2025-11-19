# GDG@PSU Website 🚀

## Project Overview

The official website for Google Developer Groups at Penn State University - a modern, feature-rich platform built with cutting-edge web technologies. This isn't just a website; it's a complete digital ecosystem for managing a tech community!

## ✨ Key Features

- **🎨 Modern UI/UX**: Beautiful, responsive design with dark/light themes
- **👥 Member Management**: Complete user registration, profiles, and role-based access
- **📧 Email System**: Professional newsletters, event notifications, and bulk communications
- **📅 Event Management**: Create, manage, and track events with registration systems
- **🔐 Admin Panel**: Comprehensive dashboard for content and user management
- **📱 Linktree Integration**: Custom social media link management
- **📝 Blog System**: Full-featured blog with markdown support and engagement tracking
- **📊 Analytics**: Real-time insights and performance monitoring
- **🔒 Security**: Audit logging, secure authentication, and data protection
- **⚡ Performance**: Optimized loading, caching, and real-time updates

## 🛠️ Quick Setup

**Prerequisites**: Node.js 18+ and npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Set up the database
supabase db reset

# Start development server
npm run dev
```

**🎯 Admin Access**: Use the secret code `gdg-secret@psu.edu` in the newsletter signup to unlock admin features!

## 🔧 Alternative Development Methods

**Edit directly in GitHub**
- Navigate to files and click the "Edit" button (pencil icon)
- Make changes and commit directly through the web interface

**Use GitHub Codespaces**
- Click "Code" → "Codespaces" → "New codespace"
- Full development environment in your browser
- All dependencies pre-installed and ready to go

## 🏗️ Technology Stack

### Frontend Powerhouse
- **⚛️ React 18** - Modern UI library with hooks and concurrent features
- **🔷 TypeScript** - Type-safe development with excellent DX
- **⚡ Vite** - Lightning-fast build tool and dev server
- **🎨 Tailwind CSS** - Utility-first styling with custom design system
- **🧩 Radix UI** - Accessible, unstyled component primitives
- **🎭 Framer Motion** - Smooth animations and transitions
- **🌐 Three.js** - 3D graphics and interactive scenes
- **📱 React Router** - Client-side routing with lazy loading

### Backend & Database
- **🗄️ Supabase** - Complete backend-as-a-service platform
- **🐘 PostgreSQL** - Robust relational database with advanced features
- **🔐 Row Level Security** - Database-level security policies
- **⚡ Real-time Subscriptions** - Live data updates across clients
- **🔑 Authentication** - Secure user management and sessions

### Services & Integrations
- **📧 Resend** - Professional email delivery service
- **☁️ Vercel** - Edge deployment with serverless functions
- **📊 Vercel Analytics** - Performance monitoring and insights
- **🔍 React Query** - Powerful data fetching and caching
- **📝 React Hook Form** - Performant form handling with validation

## 🚀 Deployment

### Automatic Deployment (Recommended)
This project auto-deploys to Vercel on every push to the main branch:

1. **Push to GitHub** - Code changes trigger automatic builds
2. **Vercel Build** - Optimized production build with Vite
3. **Global CDN** - Static assets served worldwide
4. **Serverless Functions** - Email and API endpoints deployed automatically

### Manual Deployment
For other hosting services:

```sh
# Build for production
npm run build

# Deploy the dist/ folder to your hosting service
# Supports: Netlify, Vercel, GitHub Pages, AWS S3, etc.
```

### Environment Setup
Configure these environment variables in your hosting platform:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase public API key
- `RESEND_API_KEY` - Email service API key (server-side only)
- `VITE_FROM_EMAIL` - Default sender email address

## 🎛️ Admin Panel Features

### 📊 Dashboard & Analytics
- **Real-time Statistics** - Live member count, event attendance, email metrics
- **Performance Insights** - Page views, user engagement, system health
- **Activity Feed** - Recent actions and system events
- **Quick Actions** - One-click access to common tasks

### 👥 User & Member Management
- **Member Profiles** - Complete member database with categories and roles
- **User Registration** - Streamlined onboarding with email verification
- **Role Management** - Founder, organizer, lead, active, member, alumni categories
- **Activity Tracking** - Member engagement and participation history

### 📅 Event Management
- **Event Creation** - Rich editor with image uploads and detailed descriptions
- **Registration Systems** - Internal forms, external links, or hybrid approaches
- **Attendance Tracking** - Monitor registrations and actual attendance
- **Email Notifications** - Automated event reminders and updates

### 📧 Communication Hub
- **Newsletter Campaigns** - Beautiful HTML emails with tracking
- **Bulk Communications** - Targeted messaging to specific member groups
- **Email Templates** - Pre-designed templates for common communications
- **Delivery Analytics** - Open rates, click tracking, and engagement metrics

### 📝 Content Management
- **Blog System** - Full markdown editor with syntax highlighting
- **Page Content** - Dynamic content for all website pages
- **Media Library** - Organized file and image management
- **SEO Optimization** - Meta tags, descriptions, and social sharing

### 🔗 Linktree Management
- **Social Links** - Centralized social media link management
- **Click Tracking** - Monitor link performance and engagement
- **Custom Branding** - Branded link pages with GDG styling
- **Analytics Dashboard** - Detailed click and visitor statistics

### 🔒 Security & Audit
- **Audit Logging** - Complete action history with timestamps
- **Security Events** - Login attempts, permission changes, data modifications
- **Access Control** - Role-based permissions and secure authentication
- **Data Protection** - GDPR compliance and privacy controls

## 🎯 Getting Started with Admin

1. **🔑 Access**: Use secret code `gdg-secret@psu.edu` in newsletter signup
2. **🗄️ Database**: Run `supabase db reset` for initial setup
3. **⚙️ Configuration**: Set environment variables in `.env.local`
4. **🚀 Launch**: Navigate to `/admin` to start managing content

## 📁 Project Architecture

```
gdg-website/
├── 🌐 api/                     # Vercel serverless functions
│   ├── keep-alive.mjs          # Health check endpoint
│   └── send-email.mjs          # Email delivery service
├── 📦 public/                  # Static assets & PWA files
│   ├── favicon.png             # Site favicon
│   ├── sw.js                   # Service worker for caching
│   └── robots.txt              # SEO configuration
├── ⚛️ src/
│   ├── 🧩 components/          # Reusable React components
│   │   ├── admin/              # Admin panel components
│   │   └── ui/                 # Design system components
│   ├── 🎯 contexts/            # React context providers
│   ├── 🪝 hooks/               # Custom React hooks
│   ├── 📚 lib/                 # Utility functions & configs
│   ├── 📄 pages/               # Route components
│   │   └── admin/              # Admin panel pages
│   └── 🔧 services/            # API service classes
├── 🗄️ supabase/
│   ├── ⚡ functions/           # Edge functions for email
│   ├── 🔄 migrations/          # Database schema changes
│   ├── 📋 schemas/             # Database structure
│   ├── 🛠️ scripts/            # Setup and maintenance scripts
│   └── 🌱 seeds/              # Sample data for development
├── ⚙️ Configuration Files
│   ├── package.json            # Dependencies & scripts
│   ├── tailwind.config.ts      # Styling configuration
│   ├── tsconfig.json           # TypeScript settings
│   ├── vite.config.ts          # Build configuration
│   └── vercel.json             # Deployment settings
```

## 🗄️ Database Schema

### Core Tables
- **`events`** - Event management with registration tracking
- **`members`** - Community member profiles and engagement
- **`team_members`** - Core team member information
- **`projects`** - Project showcase with tech stacks
- **`sponsors`** - Sponsor relationships and tiers

### Content Management
- **`blog_posts`** - Blog articles with markdown support
- **`blog_likes`** - User engagement tracking
- **`page_content`** - Dynamic page content
- **`site_settings`** - Global site configuration
- **`media_files`** - File and image management

### Communication System
- **`newsletter_subscribers`** - Email subscription management
- **`newsletter_campaigns`** - Email campaign tracking
- **`communications`** - Bulk email management
- **`resources`** - Learning resources and links

### Admin & Security
- **`admin_users`** - Admin user management
- **`admin_actions`** - Comprehensive audit logging
- **`security_events`** - Security monitoring and alerts

### Linktree Integration
- **`linktree_profiles`** - Social media link management
- **`linktree_links`** - Individual link tracking
- **`linktree_clicks`** - Click analytics and insights

## 🔧 Development Scripts

```sh
# Development
npm run dev          # Start development server
npm run build        # Production build
npm run build:dev    # Development build
npm run preview      # Preview production build
npm run lint         # Code linting

# Database
supabase db reset    # Reset database with migrations
supabase db push     # Push schema changes
supabase gen types   # Generate TypeScript types
```

## 🆕 Latest Features & Updates

### 🎨 Enhanced User Experience
- **Dark/Light Theme Toggle** - Seamless theme switching with system preference detection
- **Responsive Design** - Mobile-first approach with perfect tablet and desktop layouts
- **Loading States** - Skeleton loaders and smooth transitions for better perceived performance
- **Error Boundaries** - Graceful error handling with user-friendly messages

### 📊 Advanced Analytics
- **Real-time Dashboards** - Live statistics and engagement metrics
- **Performance Monitoring** - Page load times, user interactions, and system health
- **Email Analytics** - Open rates, click tracking, and campaign performance
- **User Behavior Tracking** - Member engagement patterns and content preferences

### 🔐 Enterprise-Grade Security
- **Multi-layer Authentication** - Secure admin access with role-based permissions
- **Audit Logging** - Complete action history with detailed timestamps
- **Data Encryption** - End-to-end encryption for sensitive information
- **GDPR Compliance** - Privacy controls and data protection measures

### 🚀 Performance Optimizations
- **Code Splitting** - Lazy loading for faster initial page loads
- **Image Optimization** - Automatic image compression and format selection
- **Caching Strategy** - Service worker implementation for offline functionality
- **Database Optimization** - Efficient queries with proper indexing

### 📱 Progressive Web App (PWA)
- **Offline Support** - Core functionality available without internet
- **Push Notifications** - Event reminders and important updates
- **App-like Experience** - Install on mobile devices and desktop
- **Background Sync** - Data synchronization when connection is restored

## 🤝 Contributing

We welcome contributions from the GDG@PSU community! Here's how you can help:

1. **🐛 Report Bugs** - Use GitHub issues to report problems
2. **💡 Suggest Features** - Share ideas for new functionality
3. **🔧 Submit PRs** - Fix bugs or implement new features
4. **📖 Improve Docs** - Help make documentation clearer
5. **🎨 Design Feedback** - Suggest UI/UX improvements

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and test thoroughly
4. Commit with descriptive messages (`git commit -m 'Add amazing feature'`)
5. Push to your branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request with detailed description

## 📞 Support & Contact

- **🌐 Website**: [gdg.psu.edu](https://gdg.psu.edu)
- **📧 Email**: [gdg@psu.edu](mailto:gdg@psu.edu)
- **💬 Discord**: Join our community server
- **📱 Social**: Follow us on all platforms via our Linktree

---

<div align="center">

**Built with ❤️ by the GDG@PSU Team**

*Empowering the next generation of developers at Penn State University*

</div>
