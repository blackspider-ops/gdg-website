import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Code, 
  Database, 
  Mail, 
  Shield, 
  Users, 
  Settings, 
  Globe, 
  Zap,
  BookOpen,
  Coffee,
  Heart,
  Rocket
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdmin } from '@/contexts/AdminContext';

const AdminGuide = () => {
  const { currentAdmin, isLoading, isAuthenticated } = useAdmin();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !currentAdmin) {
    return <div>Access denied. Please log in as an admin.</div>;
  }

  return (
    <AdminLayout 
      title="Project Guide" 
      subtitle="Complete technical documentation and admin guide"
      icon={BookOpen}
    >
      <div className="bg-background">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Complete Admin Guide
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
            Your comprehensive guide to managing the GDG@PSU website - from content management 
            to advanced features, deployment, and everything in between. Master every aspect 
            of this powerful platform! 🚀
          </p>
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Admin-only documentation</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Updated with latest features</span>
            </div>
          </div>
        </div>

        {/* Quick Overview */}
        <Card className="mb-8 border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-6 w-6 text-primary" />
              Platform Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Welcome to the GDG@PSU digital ecosystem! This isn't just a website - it's a complete 
              community management platform built with enterprise-grade technologies. From member 
              onboarding to event management, email campaigns to content publishing, everything is 
              designed to scale with our growing community. 🌟
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Community Hub</h4>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Central platform for all GDG@PSU activities, events, and member interactions
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
                <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">Admin Control</h4>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Powerful admin panel with real-time analytics and comprehensive management tools
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">Modern Tech</h4>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  Built with React, TypeScript, Supabase, and deployed on Vercel for maximum performance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tech Stack */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-6 w-6 text-green-600" />
              Tech Stack (The Cool Stuff We Use)
            </CardTitle>
            <CardDescription>
              Modern, fast, and developer-friendly technologies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                Frontend Stack (User Interface)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Badge variant="secondary" className="p-2 justify-center">React 18</Badge>
                <Badge variant="secondary" className="p-2 justify-center">TypeScript</Badge>
                <Badge variant="secondary" className="p-2 justify-center">Vite</Badge>
                <Badge variant="secondary" className="p-2 justify-center">Tailwind CSS</Badge>
                <Badge variant="secondary" className="p-2 justify-center">Radix UI</Badge>
                <Badge variant="secondary" className="p-2 justify-center">React Router</Badge>
                <Badge variant="secondary" className="p-2 justify-center">Three.js</Badge>
                <Badge variant="secondary" className="p-2 justify-center">Framer Motion</Badge>
                <Badge variant="secondary" className="p-2 justify-center">React Query</Badge>
                <Badge variant="secondary" className="p-2 justify-center">React Hook Form</Badge>
                <Badge variant="secondary" className="p-2 justify-center">Lenis Scroll</Badge>
                <Badge variant="secondary" className="p-2 justify-center">Next Themes</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-muted-foreground mt-2">
                Modern React ecosystem with TypeScript for type safety, Tailwind for rapid styling, 
                Three.js for 3D graphics, and Framer Motion for smooth animations. React Query handles 
                data fetching with intelligent caching, while Radix UI provides accessible components.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-500" />
                Backend & Database Infrastructure
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Badge variant="outline" className="p-2 justify-center">Supabase</Badge>
                <Badge variant="outline" className="p-2 justify-center">PostgreSQL</Badge>
                <Badge variant="outline" className="p-2 justify-center">Row Level Security</Badge>
                <Badge variant="outline" className="p-2 justify-center">Real-time</Badge>
                <Badge variant="outline" className="p-2 justify-center">Edge Functions</Badge>
                <Badge variant="outline" className="p-2 justify-center">Storage</Badge>
                <Badge variant="outline" className="p-2 justify-center">Auth</Badge>
                <Badge variant="outline" className="p-2 justify-center">Migrations</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-muted-foreground mt-2">
                Supabase provides a complete backend-as-a-service with PostgreSQL database, 
                real-time subscriptions, authentication, file storage, and edge functions. 
                Row Level Security ensures data protection at the database level.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Deployment & External Services
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Badge variant="destructive" className="p-2 justify-center">Vercel</Badge>
                <Badge variant="destructive" className="p-2 justify-center">Resend</Badge>
                <Badge variant="destructive" className="p-2 justify-center">GitHub</Badge>
                <Badge variant="destructive" className="p-2 justify-center">CDN</Badge>
                <Badge variant="destructive" className="p-2 justify-center">Analytics</Badge>
                <Badge variant="destructive" className="p-2 justify-center">Speed Insights</Badge>
                <Badge variant="destructive" className="p-2 justify-center">Serverless</Badge>
                <Badge variant="destructive" className="p-2 justify-center">PWA</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-muted-foreground mt-2">
                Vercel provides edge deployment with global CDN, serverless functions, and analytics. 
                Resend handles professional email delivery with tracking. GitHub manages version control 
                with automated CI/CD pipelines. PWA features enable offline functionality.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* New Features Showcase */}
        <Card className="mb-8 border-2 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-green-600" />
              Latest Features & Enhancements
            </CardTitle>
            <CardDescription>
              Recently added features that make this platform even more powerful
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-green-700 dark:text-green-300">🆕 New Additions</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <strong>Blog System:</strong> Full markdown editor with syntax highlighting</li>
                  <li>• <strong>Linktree Integration:</strong> Custom social media link management</li>
                  <li>• <strong>Media Library:</strong> Organized file and image management</li>
                  <li>• <strong>Advanced Analytics:</strong> Real-time insights and performance metrics</li>
                  <li>• <strong>PWA Support:</strong> Offline functionality and app-like experience</li>
                  <li>• <strong>Dark/Light Themes:</strong> Seamless theme switching</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-blue-700 dark:text-blue-300">⚡ Performance Upgrades</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <strong>Code Splitting:</strong> Lazy loading for faster page loads</li>
                  <li>• <strong>Image Optimization:</strong> Automatic compression and WebP support</li>
                  <li>• <strong>Caching Strategy:</strong> Service worker for offline functionality</li>
                  <li>• <strong>Database Optimization:</strong> Efficient queries with proper indexing</li>
                  <li>• <strong>Real-time Updates:</strong> Live data synchronization</li>
                  <li>• <strong>Error Boundaries:</strong> Graceful error handling</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Breakdown */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* User Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                Member & User Management
              </CardTitle>
              <CardDescription>
                Complete member lifecycle management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium">Core Features:</h4>
                <ul className="text-sm text-gray-600 dark:text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>Registration System:</strong> Streamlined onboarding with email verification</li>
                  <li>• <strong>Member Categories:</strong> Founder, organizer, lead, active, member, alumni</li>
                  <li>• <strong>Profile Management:</strong> Detailed member profiles with interests and skills</li>
                  <li>• <strong>Activity Tracking:</strong> Engagement metrics and participation history</li>
                  <li>• <strong>Team Integration:</strong> Link members to core team positions</li>
                  <li>• <strong>Bulk Operations:</strong> Mass updates and communications</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Admin Capabilities:</h4>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  Full CRUD operations on member data, role assignments, activity monitoring, 
                  and automated email workflows. Real-time member statistics and engagement 
                  analytics help track community growth and participation.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Email System */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-6 w-6 text-green-600" />
                Advanced Email System
              </CardTitle>
              <CardDescription>
                Enterprise-grade email marketing and communications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium">Email Types & Features:</h4>
                <ul className="text-sm text-gray-600 dark:text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>Newsletter Campaigns:</strong> Rich HTML emails with tracking</li>
                  <li>• <strong>Event Notifications:</strong> Registration confirmations and reminders</li>
                  <li>• <strong>Bulk Communications:</strong> Targeted messaging to member segments</li>
                  <li>• <strong>Automated Workflows:</strong> Welcome series and follow-ups</li>
                  <li>• <strong>Contact Form Handling:</strong> Professional inquiry responses</li>
                  <li>• <strong>Confirmation Emails:</strong> Double opt-in for GDPR compliance</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Analytics & Tracking:</h4>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  Comprehensive email analytics including open rates, click tracking, bounce rates, 
                  and engagement metrics. A/B testing capabilities for subject lines and content. 
                  Automated unsubscribe handling and list hygiene management.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Admin Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-purple-600" />
                Comprehensive Admin Dashboard
              </CardTitle>
              <CardDescription>
                Mission control for your entire platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium">Dashboard Modules:</h4>
                <ul className="text-sm text-gray-600 dark:text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>Analytics Hub:</strong> Real-time statistics and performance metrics</li>
                  <li>• <strong>Content Editor:</strong> Rich text editor for all page content</li>
                  <li>• <strong>Event Manager:</strong> Complete event lifecycle management</li>
                  <li>• <strong>Member Portal:</strong> User management and engagement tracking</li>
                  <li>• <strong>Communication Center:</strong> Email campaigns and newsletters</li>
                  <li>• <strong>Media Library:</strong> File organization and image management</li>
                  <li>• <strong>Blog Publisher:</strong> Markdown editor with preview</li>
                  <li>• <strong>Linktree Manager:</strong> Social media link organization</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Advanced Features:</h4>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  Role-based access control, real-time data synchronization, bulk operations, 
                  automated workflows, comprehensive audit logging, and mobile-responsive design. 
                  Everything you need to manage a thriving tech community! 🚀
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security & Audit */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-red-600" />
                Enterprise Security & Compliance
              </CardTitle>
              <CardDescription>
                Multi-layered security with comprehensive audit trails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium">Security Features:</h4>
                <ul className="text-sm text-gray-600 dark:text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>Row Level Security:</strong> Database-level access control</li>
                  <li>• <strong>Authentication:</strong> Secure login with session management</li>
                  <li>• <strong>Role-based Access:</strong> Granular permission system</li>
                  <li>• <strong>Data Encryption:</strong> End-to-end encryption for sensitive data</li>
                  <li>• <strong>GDPR Compliance:</strong> Privacy controls and data protection</li>
                  <li>• <strong>Rate Limiting:</strong> API protection against abuse</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Audit & Monitoring:</h4>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  Complete audit trail of all system activities including user actions, 
                  data modifications, security events, and admin operations. Real-time 
                  monitoring with alerts for suspicious activities and automated security responses.
                </p>
              </div>
            </CardContent>
          </Card>
          {/* Blog System */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-indigo-600" />
                Blog & Content Publishing
              </CardTitle>
              <CardDescription>
                Full-featured blog with markdown support
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium">Publishing Features:</h4>
                <ul className="text-sm text-gray-600 dark:text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>Markdown Editor:</strong> Rich text editing with live preview</li>
                  <li>• <strong>Syntax Highlighting:</strong> Code blocks with language support</li>
                  <li>• <strong>Image Management:</strong> Drag-and-drop image uploads</li>
                  <li>• <strong>SEO Optimization:</strong> Meta tags and social sharing</li>
                  <li>• <strong>Draft System:</strong> Save and publish workflow</li>
                  <li>• <strong>Engagement Tracking:</strong> Likes, views, and comments</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Content Strategy:</h4>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  Perfect for sharing tutorials, event recaps, member spotlights, and 
                  technical articles. Built-in analytics help track content performance 
                  and reader engagement to optimize your content strategy.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Linktree Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-6 w-6 text-orange-600" />
                Linktree & Social Management
              </CardTitle>
              <CardDescription>
                Centralized social media link management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium">Link Management:</h4>
                <ul className="text-sm text-gray-600 dark:text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>Custom Profiles:</strong> Branded link pages for different purposes</li>
                  <li>• <strong>Click Tracking:</strong> Detailed analytics for each link</li>
                  <li>• <strong>Dynamic Updates:</strong> Real-time link management</li>
                  <li>• <strong>Social Integration:</strong> All major social platforms</li>
                  <li>• <strong>QR Code Generation:</strong> Easy sharing for events</li>
                  <li>• <strong>Mobile Optimization:</strong> Perfect mobile experience</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Use Cases:</h4>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  Create custom link pages for events, workshops, recruitment drives, 
                  or general social media presence. Track engagement and optimize 
                  your social media strategy with detailed analytics.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Architecture Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6 text-indigo-600" />
              How Everything Connects
            </CardTitle>
            <CardDescription>
              The big picture of our architecture
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-lg">
                <h3 className="font-semibold mb-3">Frontend → Backend Flow</h3>
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <p><strong>1. User Interaction:</strong> User clicks something on the React frontend</p>
                  <p><strong>2. API Call:</strong> Frontend makes a request to Supabase or Vercel function</p>
                  <p><strong>3. Processing:</strong> Backend processes the request, updates database</p>
                  <p><strong>4. Response:</strong> Data flows back to frontend, UI updates</p>
                  <p><strong>5. Real-time:</strong> Supabase pushes live updates to all connected clients</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-lg">
                <h3 className="font-semibold mb-3">Email System Flow</h3>
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <p><strong>1. Trigger:</strong> User subscribes, event registration, or admin sends newsletter</p>
                  <p><strong>2. Function:</strong> Vercel serverless function receives the request</p>
                  <p><strong>3. Template:</strong> Function generates beautiful HTML email with data</p>
                  <p><strong>4. Send:</strong> Resend API delivers the email professionally</p>
                  <p><strong>5. Track:</strong> System logs the action for audit purposes</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-lg">
                <h3 className="font-semibold mb-3">Deployment Pipeline</h3>
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <p><strong>1. Code Push:</strong> Developer pushes code to GitHub</p>
                  <p><strong>2. Auto Deploy:</strong> Vercel automatically detects changes</p>
                  <p><strong>3. Build:</strong> Vite builds the React app with optimizations</p>
                  <p><strong>4. Deploy:</strong> Static files + serverless functions go live</p>
                  <p><strong>5. Live:</strong> New version is instantly available worldwide</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comprehensive Admin Management Guide */}
        <Card className="mb-8 border-2 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-orange-600" />
              Complete Admin Workflow Guide
            </CardTitle>
            <CardDescription>
              Master every aspect of platform management with detailed workflows
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-blue-700 dark:text-blue-300">📝 Content & Publishing</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>Blog Posts:</strong> Create, edit, and publish articles</li>
                  <li>• <strong>Page Content:</strong> Update homepage, about, contact pages</li>
                  <li>• <strong>Events:</strong> Full event lifecycle management</li>
                  <li>• <strong>Team Profiles:</strong> Manage core team member information</li>
                  <li>• <strong>Resources:</strong> Curate learning materials and links</li>
                  <li>• <strong>Sponsors:</strong> Maintain sponsor relationships and tiers</li>
                  <li>• <strong>Media Library:</strong> Organize images and files</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-green-700 dark:text-green-300">👥 Community & Communication</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>Member Management:</strong> User accounts and role assignments</li>
                  <li>• <strong>Newsletter Campaigns:</strong> Design and send email campaigns</li>
                  <li>• <strong>Bulk Communications:</strong> Targeted messaging to segments</li>
                  <li>• <strong>Event Notifications:</strong> Automated event reminders</li>
                  <li>• <strong>Contact Inquiries:</strong> Respond to website contact forms</li>
                  <li>• <strong>Social Media:</strong> Manage Linktree and social links</li>
                  <li>• <strong>Engagement Tracking:</strong> Monitor community activity</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-purple-700 dark:text-purple-300">📊 Analytics & Administration</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>Dashboard Monitoring:</strong> Real-time statistics and KPIs</li>
                  <li>• <strong>Email Analytics:</strong> Campaign performance and engagement</li>
                  <li>• <strong>User Activity:</strong> Member engagement and participation</li>
                  <li>• <strong>Audit Logs:</strong> Review system activities and changes</li>
                  <li>• <strong>Security Events:</strong> Monitor login attempts and access</li>
                  <li>• <strong>Performance Metrics:</strong> Site speed and user experience</li>
                  <li>• <strong>Admin Users:</strong> Manage admin accounts and permissions</li>
                </ul>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Security Best Practices
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Always log out when finished with admin tasks</li>
                  <li>• Review audit logs regularly for suspicious activity</li>
                  <li>• Use strong, unique passwords for admin accounts</li>
                  <li>• Be cautious with bulk operations and data deletion</li>
                  <li>• Test email campaigns with small groups first</li>
                  <li>• Regularly backup important data and configurations</li>
                  <li>• Monitor failed login attempts and security events</li>
                </ul>
              </div>
              <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Coffee className="h-4 w-4 text-green-600" />
                  Daily Admin Checklist
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Check dashboard for new member registrations</li>
                  <li>• Review and respond to contact form submissions</li>
                  <li>• Monitor email campaign performance and engagement</li>
                  <li>• Update event information and registration status</li>
                  <li>• Review audit logs for any unusual activity</li>
                  <li>• Check system performance and error reports</li>
                  <li>• Update social media links and announcements</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comprehensive Technical Guide */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-6 w-6 text-green-600" />
              Complete Technical Setup & Deployment Guide
            </CardTitle>
            <CardDescription>
              Everything you need to know about development, deployment, and maintenance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold mb-2">🛠️ Local Development Setup</h3>
                <div className="bg-muted p-4 rounded-lg text-sm font-mono space-y-1">
                  <div className="text-green-600"># Clone the repository</div>
                  <div>git clone [repository-url]</div>
                  <div>cd gdg-website</div>
                  <div className="text-green-600 mt-2"># Install dependencies</div>
                  <div>npm install</div>
                  <div className="text-green-600 mt-2"># Setup environment</div>
                  <div>cp .env.example .env.local</div>
                  <div className="text-green-600 mt-2"># Initialize database</div>
                  <div>supabase db reset</div>
                  <div className="text-green-600 mt-2"># Start development server</div>
                  <div>npm run dev</div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Requires Node.js 18+, npm, and Supabase CLI for full functionality
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold mb-2">⚙️ Environment Configuration</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Frontend Variables</h4>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-2">
                      <li>• <code>VITE_SUPABASE_URL</code> - Supabase project URL</li>
                      <li>• <code>VITE_SUPABASE_ANON_KEY</code> - Public API key</li>
                      <li>• <code>VITE_FROM_EMAIL</code> - Default sender email</li>
                      <li>• <code>VITE_DOMAIN</code> - Your domain name</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Server-side Variables</h4>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-2">
                      <li>• <code>RESEND_API_KEY</code> - Email service API key</li>
                      <li>• <code>SUPABASE_SERVICE_ROLE_KEY</code> - Admin API key</li>
                      <li>• <code>DATABASE_URL</code> - Direct database connection</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">🚀 Deployment & CI/CD Pipeline</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">1. Code Push</h4>
                  <p className="text-sm text-muted-foreground">
                    Push changes to GitHub main branch triggers automatic deployment
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-green-700 dark:text-green-300">2. Build Process</h4>
                  <p className="text-sm text-muted-foreground">
                    Vercel builds with Vite, optimizes assets, and deploys serverless functions
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-purple-700 dark:text-purple-300">3. Global Deploy</h4>
                  <p className="text-sm text-muted-foreground">
                    Static files served via global CDN with edge functions worldwide
                  </p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">🗄️ Database Management</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Migration Commands</h4>
                  <div className="bg-muted p-3 rounded-lg text-sm font-mono space-y-1">
                    <div className="text-green-600"># Reset database with all migrations</div>
                    <div>supabase db reset</div>
                    <div className="text-green-600 mt-2"># Create new migration</div>
                    <div>supabase db diff -f new_feature</div>
                    <div className="text-green-600 mt-2"># Push schema changes</div>
                    <div>supabase db push</div>
                    <div className="text-green-600 mt-2"># Generate TypeScript types</div>
                    <div>supabase gen types typescript</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Database Features</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>Row Level Security:</strong> Database-level access control</li>
                    <li>• <strong>Real-time Subscriptions:</strong> Live data updates</li>
                    <li>• <strong>Automated Backups:</strong> Daily database snapshots</li>
                    <li>• <strong>Migration System:</strong> Version-controlled schema changes</li>
                    <li>• <strong>Seed Data:</strong> Sample data for development</li>
                    <li>• <strong>Performance Monitoring:</strong> Query optimization insights</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="bg-yellow-50 dark:bg-yellow-950/30 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-600" />
                Performance & Monitoring
              </h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <h5 className="font-medium mb-1">Built-in Monitoring</h5>
                  <ul className="space-y-1">
                    <li>• Vercel Analytics for performance insights</li>
                    <li>• Speed Insights for Core Web Vitals</li>
                    <li>• Real-time error tracking and alerts</li>
                    <li>• Database performance monitoring</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Optimization Features</h5>
                  <ul className="space-y-1">
                    <li>• Automatic image optimization and WebP conversion</li>
                    <li>• Code splitting and lazy loading</li>
                    <li>• Service worker for offline functionality</li>
                    <li>• CDN caching with intelligent invalidation</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support & Resources */}
        <Card className="mb-8 border-2 border-indigo-200 dark:border-indigo-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-red-500" />
              Support & Resources
            </CardTitle>
            <CardDescription>
              Get help, contribute, and stay connected with the community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-blue-700 dark:text-blue-300">📞 Get Help</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>Admin Support:</strong> Contact current admin team</li>
                  <li>• <strong>Technical Issues:</strong> Create GitHub issues</li>
                  <li>• <strong>Feature Requests:</strong> Submit enhancement proposals</li>
                  <li>• <strong>Documentation:</strong> Check README and wiki</li>
                  <li>• <strong>Community Discord:</strong> Ask questions in dev channel</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-green-700 dark:text-green-300">🤝 Contribute</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>Bug Reports:</strong> Help improve platform stability</li>
                  <li>• <strong>Code Contributions:</strong> Submit pull requests</li>
                  <li>• <strong>Design Feedback:</strong> Suggest UI/UX improvements</li>
                  <li>• <strong>Documentation:</strong> Help improve guides and docs</li>
                  <li>• <strong>Testing:</strong> Beta test new features</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-purple-700 dark:text-purple-300">🔗 Quick Links</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>GitHub Repository:</strong> Source code and issues</li>
                  <li>• <strong>Vercel Dashboard:</strong> Deployment and analytics</li>
                  <li>• <strong>Supabase Console:</strong> Database management</li>
                  <li>• <strong>Resend Dashboard:</strong> Email delivery metrics</li>
                  <li>• <strong>Admin Panel:</strong> Platform management interface</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8 border-t border-border">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-5 w-5 text-red-500" />
            <span className="text-gray-600 dark:text-muted-foreground font-medium">
              Built with passion by the GDG@PSU team
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            This comprehensive platform represents countless hours of development, testing, 
            and refinement. We're proud to provide a world-class experience for our community!
          </p>
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span>🚀 Always improving</span>
            <span>🔒 Security first</span>
            <span>📱 Mobile optimized</span>
            <span>⚡ Performance focused</span>
            <span>🌍 Globally accessible</span>
          </div>
        </div>
      </div>
    </div>
    </AdminLayout>
  );
};

export default AdminGuide;