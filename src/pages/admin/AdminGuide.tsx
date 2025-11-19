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
              enterprise-grade community management platform with 39 database tables, advanced 
              communications systems, and comprehensive analytics. From member onboarding to event 
              management, blog publishing to social media integration, everything is designed to 
              scale with our growing community. This is the most advanced GDG platform ever built! 🌟
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
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <Globe className="h-5 w-5 text-blue-500" />
                Frontend Stack (User Interface)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Badge variant="secondary" className="p-2 justify-center">React 18</Badge>
                <Badge variant="secondary" className="p-2 justify-center">TypeScript</Badge>
                <Badge variant="secondary" className="p-2 justify-center">Vite 7</Badge>
                <Badge variant="secondary" className="p-2 justify-center">Tailwind CSS</Badge>
                <Badge variant="secondary" className="p-2 justify-center">Radix UI</Badge>
                <Badge variant="secondary" className="p-2 justify-center">React Router</Badge>
                <Badge variant="secondary" className="p-2 justify-center">Three.js</Badge>
                <Badge variant="secondary" className="p-2 justify-center">Framer Motion</Badge>
                <Badge variant="secondary" className="p-2 justify-center">TanStack Query</Badge>
                <Badge variant="secondary" className="p-2 justify-center">React Hook Form</Badge>
                <Badge variant="secondary" className="p-2 justify-center">React Markdown</Badge>
                <Badge variant="secondary" className="p-2 justify-center">Lenis Scroll</Badge>
                <Badge variant="secondary" className="p-2 justify-center">Next Themes</Badge>
                <Badge variant="secondary" className="p-2 justify-center">GSAP</Badge>
                <Badge variant="secondary" className="p-2 justify-center">Drag & Drop</Badge>
                <Badge variant="secondary" className="p-2 justify-center">Recharts</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-muted-foreground mt-2">
                Modern React ecosystem with TypeScript for type safety, Tailwind for rapid styling, 
                Three.js for 3D graphics, and Framer Motion for smooth animations. React Query handles 
                data fetching with intelligent caching, while Radix UI provides accessible components.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-purple-800 dark:text-purple-200">
                <Database className="h-5 w-5 text-purple-500" />
                Backend & Database Infrastructure
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Badge variant="outline" className="p-2 justify-center">Supabase</Badge>
                <Badge variant="outline" className="p-2 justify-center">PostgreSQL</Badge>
                <Badge variant="outline" className="p-2 justify-center">Row Level Security</Badge>
                <Badge variant="outline" className="p-2 justify-center">Real-time</Badge>
                <Badge variant="outline" className="p-2 justify-center">Edge Functions</Badge>
                <Badge variant="outline" className="p-2 justify-center">File Storage</Badge>
                <Badge variant="outline" className="p-2 justify-center">Authentication</Badge>
                <Badge variant="outline" className="p-2 justify-center">Migrations</Badge>
                <Badge variant="outline" className="p-2 justify-center">Triggers</Badge>
                <Badge variant="outline" className="p-2 justify-center">Functions</Badge>
                <Badge variant="outline" className="p-2 justify-center">Audit Logging</Badge>
                <Badge variant="outline" className="p-2 justify-center">Analytics</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-muted-foreground mt-2">
                Supabase provides a complete backend-as-a-service with PostgreSQL database, 
                real-time subscriptions, authentication, file storage, and <strong>9 custom Edge Functions</strong> 
                for advanced server-side processing. Row Level Security ensures data protection at the database level.
              </p>
              <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                <h4 className="font-medium text-sm mb-2 text-purple-700 dark:text-purple-300">9 Supabase Edge Functions:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div>• Email processing & delivery</div>
                  <div>• Newsletter campaign management</div>
                  <div>• Contact form handling</div>
                  <div>• Blog notification system</div>
                  <div>• Member registration workflows</div>
                  <div>• Event registration processing</div>
                  <div>• Analytics data aggregation</div>
                  <div>• Security event monitoring</div>
                  <div>• Automated task management</div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
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
                <strong>Resend API</strong> handles professional email delivery with advanced tracking and deliverability. 
                GitHub manages version control with automated CI/CD pipelines. PWA features enable offline functionality.
              </p>
              <div className="mt-3 grid md:grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <h4 className="font-medium text-sm mb-2 text-green-700 dark:text-green-300">Resend Email Service:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Professional email delivery with 99.9% uptime</li>
                    <li>• Advanced analytics and engagement tracking</li>
                    <li>• Automated bounce and spam handling</li>
                    <li>• Custom domain authentication (DKIM/SPF)</li>
                  </ul>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <h4 className="font-medium text-sm mb-2 text-blue-700 dark:text-blue-300">Vercel Cron Job:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Automated Supabase project keep-alive</li>
                    <li>• Prevents database hibernation</li>
                    <li>• Ensures 24/7 platform availability</li>
                    <li>• Scheduled maintenance tasks</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Features Showcase */}
        <Card className="mb-8 border-2 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-green-600" />
              Latest Features & Enhancements (2025 Update)
            </CardTitle>
            <CardDescription>
              Recently added features that make this platform even more powerful - all up to date!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-green-700 dark:text-green-300">🆕 Major New Features</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <strong>Communications Hub:</strong> Internal messaging, task management, and team announcements</li>
                  <li>• <strong>Advanced Blog System:</strong> Categories, comments, likes, and engagement tracking</li>
                  <li>• <strong>Linktree Integration:</strong> Complete social media link management with click analytics</li>
                  <li>• <strong>Media Management:</strong> Professional file organization with drag-and-drop uploads</li>
                  <li>• <strong>Member Management:</strong> Full member lifecycle with categories and engagement tracking</li>
                  <li>• <strong>Project Showcase:</strong> Interactive project gallery with tech stacks and star ratings</li>
                  <li>• <strong>Enhanced Security:</strong> Comprehensive audit logging and security event monitoring</li>
                  <li>• <strong>Advanced Analytics:</strong> Real-time insights, performance metrics, and engagement data</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-blue-700 dark:text-blue-300">⚡ Performance & UX Upgrades</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <strong>Real-time Updates:</strong> Live data synchronization across all admin panels</li>
                  <li>• <strong>Drag & Drop:</strong> Intuitive file uploads and content organization</li>
                  <li>• <strong>Smart Caching:</strong> Optimized loading with intelligent cache invalidation</li>
                  <li>• <strong>Mobile-First Design:</strong> Perfect admin experience on all devices</li>
                  <li>• <strong>Dark/Light Themes:</strong> System-aware theme switching with preferences</li>
                  <li>• <strong>Progressive Web App:</strong> Offline functionality and app-like experience</li>
                  <li>• <strong>Advanced Search:</strong> Powerful search across all content types</li>
                  <li>• <strong>Bulk Operations:</strong> Efficient mass updates and content management</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-800 dark:text-green-200">
                <Rocket className="h-4 w-4 text-primary" />
                What's Coming Next
              </h4>
              <p className="text-sm text-muted-foreground">
                We're constantly improving! Upcoming features include advanced email automation, 
                AI-powered content suggestions, enhanced member engagement tools, and deeper 
                integration with Google Developer tools. Stay tuned for more exciting updates!
              </p>
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

          {/* Communications Hub */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-6 w-6 text-blue-600" />
                Communications Hub & Team Management
              </CardTitle>
              <CardDescription>
                Complete internal communication and task management system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium">Core Communication Features:</h4>
                <ul className="text-sm text-gray-600 dark:text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>Team Announcements:</strong> Priority-based announcements with read tracking</li>
                  <li>• <strong>Internal Messaging:</strong> Direct messaging between admin team members</li>
                  <li>• <strong>Task Management:</strong> Assign, track, and manage team tasks with due dates</li>
                  <li>• <strong>Task Comments:</strong> Collaborative discussion on tasks with status updates</li>
                  <li>• <strong>Notification System:</strong> Real-time alerts for new messages and tasks</li>
                  <li>• <strong>Priority Management:</strong> High, medium, low priority levels for all communications</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Advanced Workflow Features:</h4>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  Automated task status tracking, overdue task alerts, bulk communication tools, 
                  and comprehensive activity feeds. Perfect for coordinating team activities, 
                  managing event planning, and ensuring nothing falls through the cracks.
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
                  <li>• <strong>Security Events:</strong> Real-time monitoring of login attempts and access</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Comprehensive Audit System:</h4>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  Complete audit trail of all system activities including user actions, 
                  data modifications, security events, and admin operations. Advanced logging 
                  with timestamps, IP tracking, and detailed action metadata for compliance and debugging.
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

        {/* Complete Database Schema */}
        <Card className="mb-8 border-2 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6 text-purple-600" />
              Complete Database Schema (2025 Update)
            </CardTitle>
            <CardDescription>
              Complete overview of all 39 database tables - the most comprehensive GDG platform ever built
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-lg">
              <h4 className="font-semibold mb-1 flex items-center gap-2 text-purple-800 dark:text-purple-200">
                <Database className="h-4 w-4 text-purple-600" />
                Complete Database: 39 Tables
              </h4>
              <p className="text-sm text-muted-foreground">
                Our comprehensive database schema includes 39 tables covering every aspect of the platform - 
                from content management to analytics, security to communications.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-blue-700 dark:text-blue-300">Core Content (13 tables)</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>events:</strong> Event management with registration</li>
                  <li>• <strong>event_attendance:</strong> Attendance tracking</li>
                  <li>• <strong>team_members:</strong> Core team profiles</li>
                  <li>• <strong>projects:</strong> Project showcase</li>
                  <li>• <strong>project_members:</strong> Project team assignments</li>
                  <li>• <strong>project_stars:</strong> Project rating system</li>
                  <li>• <strong>sponsors:</strong> Sponsor relationships</li>
                  <li>• <strong>resources:</strong> Learning materials</li>
                  <li>• <strong>members:</strong> Community member profiles</li>
                  <li>• <strong>site_content:</strong> Dynamic page content</li>
                  <li>• <strong>site_settings:</strong> Global configuration</li>
                  <li>• <strong>page_content:</strong> Static page management</li>
                  <li>• <strong>footer_content:</strong> Footer customization</li>
                </ul>
                
                <h3 className="font-semibold text-lg text-green-700 dark:text-green-300 mt-6">Blog System (5 tables)</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>blog_posts:</strong> Article content and metadata</li>
                  <li>• <strong>blog_categories:</strong> Content categorization</li>
                  <li>• <strong>blog_comments:</strong> Reader discussions</li>
                  <li>• <strong>blog_likes:</strong> Engagement tracking</li>
                  <li>• <strong>blog_submissions:</strong> Community submissions</li>
                  <li>• <strong>blog_submission_comments:</strong> Submission feedback</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-purple-700 dark:text-purple-300">Communications (6 tables)</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>announcements:</strong> Team announcements</li>
                  <li>• <strong>announcement_reads:</strong> Read tracking</li>
                  <li>• <strong>communication_tasks:</strong> Task management</li>
                  <li>• <strong>task_comments:</strong> Task discussions</li>
                  <li>• <strong>internal_messages:</strong> Direct messaging</li>
                  <li>• <strong>navigation_items:</strong> Menu management</li>
                </ul>
                
                <h3 className="font-semibold text-lg text-orange-700 dark:text-orange-300 mt-6">Linktree System (3 tables)</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>linktree_profiles:</strong> Social link profiles</li>
                  <li>• <strong>linktree_links:</strong> Individual links</li>
                  <li>• <strong>linktree_analytics:</strong> Click tracking</li>
                </ul>
                
                <h3 className="font-semibold text-lg text-cyan-700 dark:text-cyan-300 mt-6">Media Management (4 tables)</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>media_files:</strong> File management</li>
                  <li>• <strong>media_folders:</strong> Organization structure</li>
                  <li>• <strong>media_usage:</strong> Usage tracking</li>
                  <li>• <strong>social_links:</strong> Social media links</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-red-700 dark:text-red-300">Email System (8 tables)</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>newsletter_subscribers:</strong> Subscription management</li>
                  <li>• <strong>newsletter_campaigns:</strong> Campaign tracking</li>
                  <li>• <strong>newsletter_campaign_analytics:</strong> Performance metrics</li>
                  <li>• <strong>newsletter_email_logs:</strong> Delivery logs</li>
                  <li>• <strong>newsletter_templates:</strong> Email templates</li>
                </ul>
                
                <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-300 mt-6">Security & Admin (3 tables)</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>admin_users:</strong> Admin accounts</li>
                  <li>• <strong>admin_actions:</strong> Audit logging</li>
                  <li>• <strong>security_events:</strong> Security monitoring</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg">
                <h4 className="font-semibold mb-2 text-green-700 dark:text-green-300">Database Statistics</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Total Tables:</strong> 39 comprehensive tables</li>
                  <li>• <strong>Relationships:</strong> Complex foreign key relationships</li>
                  <li>• <strong>Indexes:</strong> Optimized for performance</li>
                  <li>• <strong>Security:</strong> RLS enabled on all tables</li>
                  <li>• <strong>Real-time:</strong> Live updates across all modules</li>
                </ul>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">Advanced Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Triggers:</strong> Automated data processing</li>
                  <li>• <strong>Functions:</strong> Custom database functions</li>
                  <li>• <strong>Views:</strong> Optimized data access</li>
                  <li>• <strong>Migrations:</strong> Version-controlled schema</li>
                  <li>• <strong>Backups:</strong> Automated daily backups</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-lg">
              <h4 className="font-semibold mb-2 text-indigo-800 dark:text-indigo-200">Advanced Database Features</h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>
                  <h5 className="font-medium mb-1">Security</h5>
                  <ul className="space-y-1">
                    <li>• Row Level Security (RLS) on all tables</li>
                    <li>• Role-based access control</li>
                    <li>• Encrypted sensitive data</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Performance</h5>
                  <ul className="space-y-1">
                    <li>• Optimized indexes for fast queries</li>
                    <li>• Real-time subscriptions</li>
                    <li>• Automated triggers and functions</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Maintenance</h5>
                  <ul className="space-y-1">
                    <li>• Automated backups and migrations</li>
                    <li>• Version-controlled schema changes</li>
                    <li>• Comprehensive logging and monitoring</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Architecture Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-6 w-6 text-indigo-600" />
              How Everything Connects (System Architecture)
            </CardTitle>
            <CardDescription>
              The big picture of our modern, scalable architecture
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-lg">
                <h3 className="font-semibold mb-3 text-blue-800 dark:text-blue-200">Frontend → Backend Flow</h3>
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <p><strong>1. User Interaction:</strong> User interacts with React frontend (admin panel or public site)</p>
                  <p><strong>2. API Call:</strong> Frontend makes authenticated request to Supabase or Vercel function</p>
                  <p><strong>3. Processing:</strong> Backend processes request, validates permissions, updates database</p>
                  <p><strong>4. Response:</strong> Data flows back to frontend with real-time updates</p>
                  <p><strong>5. Real-time Sync:</strong> Supabase pushes live updates to all connected clients instantly</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-lg">
                <h3 className="font-semibold mb-3 text-green-800 dark:text-green-200">Advanced Email System Flow (Resend + Edge Functions)</h3>
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <p><strong>1. Trigger:</strong> Newsletter signup, event registration, or admin campaign creation</p>
                  <p><strong>2. Edge Function:</strong> One of 9 Supabase Edge Functions processes the email request</p>
                  <p><strong>3. Template:</strong> Dynamic HTML email generation with personalization and branding</p>
                  <p><strong>4. Resend API:</strong> Professional email delivery with DKIM authentication and tracking</p>
                  <p><strong>5. Analytics:</strong> Real-time tracking of opens, clicks, bounces, and engagement metrics</p>
                  <p><strong>6. Database:</strong> All email events logged to newsletter_email_logs table for audit</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-lg">
                <h3 className="font-semibold mb-3 text-purple-800 dark:text-purple-200">Modern Deployment Pipeline + Automation</h3>
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <p><strong>1. Code Push:</strong> Developer pushes code to GitHub with automated testing</p>
                  <p><strong>2. Auto Deploy:</strong> Vercel detects changes and triggers build process</p>
                  <p><strong>3. Build:</strong> Vite builds optimized React app with code splitting and compression</p>
                  <p><strong>4. Deploy:</strong> Static files + serverless functions deployed to global edge network</p>
                  <p><strong>5. Live:</strong> New version available worldwide with zero downtime</p>
                  <p><strong>6. Cron Job:</strong> Vercel cron keeps Supabase project active 24/7 (prevents hibernation)</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-lg">
                <h3 className="font-semibold mb-3 text-orange-800 dark:text-orange-200">Real-time Communication Flow</h3>
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <p><strong>1. Admin Action:</strong> Admin creates announcement, task, or sends message</p>
                  <p><strong>2. Database Update:</strong> Supabase updates relevant tables with RLS validation</p>
                  <p><strong>3. Real-time Push:</strong> All connected admin clients receive instant updates</p>
                  <p><strong>4. UI Update:</strong> Frontend automatically updates without page refresh</p>
                  <p><strong>5. Notification:</strong> System generates appropriate notifications and alerts</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Panel Modules */}
        <Card className="mb-8 border-2 border-cyan-200 dark:border-cyan-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-cyan-600" />
              Complete Admin Panel Modules (2025)
            </CardTitle>
            <CardDescription>
              Every admin panel module and its capabilities - your complete toolkit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-blue-700 dark:text-blue-300">📊 Core Management</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>/admin/dashboard:</strong> Real-time analytics and system overview</li>
                  <li>• <strong>/admin/members:</strong> Complete member management with categories</li>
                  <li>• <strong>/admin/events:</strong> Event lifecycle management with registration</li>
                  <li>• <strong>/admin/team:</strong> Core team member profiles and roles</li>
                  <li>• <strong>/admin/projects:</strong> Project showcase with tech stacks</li>
                  <li>• <strong>/admin/sponsors:</strong> Sponsor relationship management</li>
                  <li>• <strong>/admin/resources:</strong> Learning materials curation</li>
                </ul>
                
                <h3 className="font-semibold text-lg text-green-700 dark:text-green-300">📝 Content & Publishing</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>/admin/blog:</strong> Blog post creation and management</li>
                  <li>• <strong>/admin/blog/editor:</strong> Advanced markdown editor with preview</li>
                  <li>• <strong>/admin/blog/media:</strong> Blog-specific media management</li>
                  <li>• <strong>/admin/media:</strong> Global media library and file organization</li>
                  <li>• <strong>/admin/settings:</strong> Site content and configuration</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-purple-700 dark:text-purple-300">💬 Communications</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>/admin/communications:</strong> Internal team communication hub</li>
                  <li>• <strong>/admin/newsletter:</strong> Email campaign management</li>
                  <li>• <strong>/admin/linktree:</strong> Social media link management</li>
                </ul>
                
                <h3 className="font-semibold text-lg text-red-700 dark:text-red-300">🔒 Security & Admin</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>/admin/users:</strong> Admin user account management</li>
                  <li>• <strong>/admin/profile:</strong> Personal admin profile settings</li>
                  <li>• <strong>/admin/guide:</strong> This comprehensive documentation</li>
                </ul>
                
                <h3 className="font-semibold text-lg text-orange-700 dark:text-orange-300">📈 Analytics & Insights</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>Blog Analytics:</strong> Content performance and engagement</li>
                  <li>• <strong>Linktree Analytics:</strong> Social media click tracking</li>
                  <li>• <strong>Email Analytics:</strong> Campaign performance metrics</li>
                  <li>• <strong>Security Dashboard:</strong> Audit logs and security events</li>
                  <li>• <strong>Member Analytics:</strong> Community engagement insights</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-cyan-800 dark:text-cyan-200">
                <Zap className="h-4 w-4 text-primary" />
                Quick Navigation Tips
              </h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <h5 className="font-medium mb-1">Keyboard Shortcuts</h5>
                  <ul className="space-y-1">
                    <li>• Use browser back/forward for quick navigation</li>
                    <li>• Bookmark frequently used admin pages</li>
                    <li>• Use Ctrl/Cmd + F to search within pages</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Mobile Admin</h5>
                  <ul className="space-y-1">
                    <li>• Fully responsive design works on all devices</li>
                    <li>• Touch-friendly interface for tablets</li>
                    <li>• Quick actions available on mobile</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role-Based Access Control - NEW SECTION */}
        <Card className="mb-8 border-2 border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-red-600" />
              Role-Based Access Control & Permissions (2025 Update)
            </CardTitle>
            <CardDescription>
              Understanding admin roles, permissions, and access levels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 p-6 rounded-lg">
              <h3 className="font-semibold mb-4 text-red-800 dark:text-red-200">Admin Role Hierarchy</h3>
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-l-4 border-red-600">
                  <h4 className="font-semibold text-red-700 dark:text-red-300 mb-2">🔴 Super Admin (Full Access)</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Complete control over all platform features and settings. Only super admins should have this level of access.
                  </p>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="font-medium mb-1">Full Access To:</p>
                      <ul className="text-muted-foreground space-y-1 ml-4">
                        <li>• Site & Content Management</li>
                        <li>• Manage Events (create, edit, delete)</li>
                        <li>• Team Management (add/remove members)</li>
                        <li>• Manage Sponsors</li>
                        <li>• Admin User Management</li>
                        <li>• Site Status & Maintenance Mode</li>
                        <li>• All Member Editing Capabilities</li>
                        <li>• Communications Hub (in Business section)</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Special Privileges:</p>
                      <ul className="text-muted-foreground space-y-1 ml-4">
                        <li>• Approve team member profiles</li>
                        <li>• Create and manage admin accounts</li>
                        <li>• Access audit logs and security</li>
                        <li>• Configure system-wide settings</li>
                        <li>• Manage role assignments</li>
                        <li>• Emergency site controls</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-l-4 border-blue-600">
                  <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">🔵 Regular Admin (Limited Access)</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Day-to-day operations and content management. Cannot modify critical settings or team structure.
                  </p>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="font-medium mb-1 text-green-600">✅ Can Access:</p>
                      <ul className="text-muted-foreground space-y-1 ml-4">
                        <li>• Manage Projects</li>
                        <li>• View Members (read-only)</li>
                        <li>• Resources Management</li>
                        <li>• Newsletter Campaigns</li>
                        <li>• Blog Management</li>
                        <li>• Linktree Management</li>
                        <li>• Media Library</li>
                        <li>• Communications Hub (prominent)</li>
                        <li>• My Profile (create team profile)</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium mb-1 text-red-600">❌ Cannot Access:</p>
                      <ul className="text-muted-foreground space-y-1 ml-4">
                        <li>• Site & Content pages</li>
                        <li>• Manage Events</li>
                        <li>• Team Management</li>
                        <li>• Manage Sponsors</li>
                        <li>• Admin Users</li>
                        <li>• Site Status controls</li>
                        <li>• Edit/delete members</li>
                        <li>• Approve team profiles</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-l-4 border-green-600">
                  <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">🟢 Blog Editor (Content Only)</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Specialized role for content creators. All blog posts require admin approval before publishing.
                  </p>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="font-medium mb-1 text-green-600">✅ Can Access:</p>
                      <ul className="text-muted-foreground space-y-1 ml-4">
                        <li>• Blog Post Creation & Editing</li>
                        <li>• Blog Media Management</li>
                        <li>• Comment Moderation</li>
                        <li>• Communications Hub (prominent)</li>
                        <li>• My Profile</li>
                        <li>• View own submission status</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium mb-1">⚠️ Restrictions:</p>
                      <ul className="text-muted-foreground space-y-1 ml-4">
                        <li>• Cannot publish directly (needs approval)</li>
                        <li>• Cannot send emails</li>
                        <li>• No access to other admin modules</li>
                        <li>• Cannot create team profiles</li>
                        <li>• Limited to blog-related tasks</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">🎯 Dashboard Differences by Role</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-red-700 dark:text-red-300">Super Admin Dashboard</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• All quick actions visible</li>
                    <li>• Communications Hub in Business section</li>
                    <li>• Admin Management section</li>
                    <li>• Site Status controls</li>
                    <li>• Full statistics access</li>
                  </ul>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">Regular Admin Dashboard</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Limited quick actions</li>
                    <li>• Communications Hub prominent at top</li>
                    <li>• No admin management section</li>
                    <li>• No site status controls</li>
                    <li>• Relevant statistics only</li>
                  </ul>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-green-700 dark:text-green-300">Blog Editor Dashboard</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Blog-focused actions only</li>
                    <li>• Communications Hub prominent at top</li>
                    <li>• Request status tracking</li>
                    <li>• Blog statistics only</li>
                    <li>• Approval workflow info</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            <div className="bg-yellow-50 dark:bg-yellow-950/30 p-6 rounded-lg">
              <h3 className="font-semibold mb-4 text-yellow-800 dark:text-yellow-200">⚠️ Important Security Notes</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-700 dark:text-yellow-300">Team Profile Approval Process</p>
                    <p>When regular admins or blog editors create their team profile in "My Profile", it's saved as inactive (not public). Only super admins can activate profiles through Team Management, making them visible on the public team page.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-700 dark:text-yellow-300">Member Management Restrictions</p>
                    <p>Regular admins can view all members but cannot edit, delete, or change member categories. This prevents accidental data loss and maintains data integrity. Only super admins have full member editing capabilities.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-700 dark:text-yellow-300">Communications Hub Prominence</p>
                    <p>For regular admins and blog editors, the Communications Hub is displayed prominently at the top of their dashboard to ensure they never miss important messages, tasks, or announcements. Super admins see it in the Business Management section.</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comprehensive Admin Management Guide */}
        <Card className="mb-8 border-2 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="h-6 w-6 text-orange-600" />
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
                  <li>• <strong>Blog System:</strong> Create, edit, and publish articles with categories</li>
                  <li>• <strong>Blog Analytics:</strong> Track views, likes, and engagement metrics</li>
                  <li>• <strong>Page Content:</strong> Update homepage, about, contact pages dynamically</li>
                  <li>• <strong>Events:</strong> Full event lifecycle with registration tracking</li>
                  <li>• <strong>Team Profiles:</strong> Manage core team member information and roles</li>
                  <li>• <strong>Project Showcase:</strong> Feature projects with tech stacks and star ratings</li>
                  <li>• <strong>Resources:</strong> Curate learning materials and external links</li>
                  <li>• <strong>Sponsors:</strong> Maintain sponsor relationships with tier management</li>
                  <li>• <strong>Media Library:</strong> Professional file organization with drag-and-drop</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-green-700 dark:text-green-300">👥 Community & Communication</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>Member Management:</strong> Complete member lifecycle with categories</li>
                  <li>• <strong>Newsletter Campaigns:</strong> Design and send professional email campaigns</li>
                  <li>• <strong>Communications Hub:</strong> Internal team messaging and announcements</li>
                  <li>• <strong>Task Management:</strong> Assign and track team tasks with due dates</li>
                  <li>• <strong>Bulk Communications:</strong> Targeted messaging to member segments</li>
                  <li>• <strong>Event Notifications:</strong> Automated event reminders and updates</li>
                  <li>• <strong>Contact Inquiries:</strong> Respond to website contact forms</li>
                  <li>• <strong>Linktree Management:</strong> Social media links with click analytics</li>
                  <li>• <strong>Engagement Tracking:</strong> Monitor community activity and participation</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-purple-700 dark:text-purple-300">📊 Analytics & Administration</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>Real-time Dashboard:</strong> Live statistics and KPIs across all modules</li>
                  <li>• <strong>Email Analytics:</strong> Campaign performance with open/click rates</li>
                  <li>• <strong>Blog Analytics:</strong> Content performance and reader engagement</li>
                  <li>• <strong>Linktree Analytics:</strong> Social media click tracking and insights</li>
                  <li>• <strong>Member Analytics:</strong> User engagement and participation metrics</li>
                  <li>• <strong>Comprehensive Audit Logs:</strong> Detailed system activity tracking</li>
                  <li>• <strong>Security Monitoring:</strong> Login attempts and security events</li>
                  <li>• <strong>Performance Metrics:</strong> Site speed and user experience data</li>
                  <li>• <strong>Admin Management:</strong> User accounts, roles, and permissions</li>
                </ul>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-800 dark:text-blue-200">
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
                  Daily Admin Checklist (Updated 2025)
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Check dashboard for new member registrations and activity</li>
                  <li>• Review communications hub for new messages and announcements</li>
                  <li>• Update task statuses and respond to team task comments</li>
                  <li>• Review and respond to contact form submissions</li>
                  <li>• Monitor email campaign performance and engagement metrics</li>
                  <li>• Check blog analytics and respond to new comments</li>
                  <li>• Review Linktree click analytics and update social links</li>
                  <li>• Update event information and monitor registration status</li>
                  <li>• Review comprehensive audit logs for any unusual activity</li>
                  <li>• Check system performance, security events, and error reports</li>
                  <li>• Update project showcase and member engagement data</li>
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
                <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">🛠️ Local Development Setup</h3>
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
                <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">⚙️ Environment Configuration</h3>
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
                      <li>• <code>RESEND_API_KEY</code> - Resend email service API key (required)</li>
                      <li>• <code>SUPABASE_SERVICE_ROLE_KEY</code> - Admin API key for edge functions</li>
                      <li>• <code>DATABASE_URL</code> - Direct database connection string</li>
                      <li>• <code>CRON_SECRET</code> - Vercel cron job authentication</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">🔧 Advanced Infrastructure Services</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-green-700 dark:text-green-300">Resend Email Service</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 99.9% delivery rate with DKIM/SPF</li>
                    <li>• Real-time analytics and tracking</li>
                    <li>• Automated bounce handling</li>
                    <li>• Custom domain authentication</li>
                    <li>• Professional email templates</li>
                  </ul>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-purple-700 dark:text-purple-300">9 Supabase Edge Functions</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Email processing & delivery</li>
                    <li>• Newsletter campaign management</li>
                    <li>• Contact form handling</li>
                    <li>• Blog notifications</li>
                    <li>• Member registration workflows</li>
                    <li>• Event processing</li>
                    <li>• Analytics aggregation</li>
                    <li>• Security monitoring</li>
                    <li>• Task automation</li>
                  </ul>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">Vercel Automation</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Automated deployments</li>
                    <li>• Global CDN distribution</li>
                    <li>• Serverless functions</li>
                    <li>• <strong>Cron job:</strong> Keeps Supabase active 24/7</li>
                    <li>• Performance monitoring</li>
                    <li>• Zero-downtime deployments</li>
                  </ul>
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
                  <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Migration Commands</h4>
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
                  <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Database Features</h4>
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
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
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
            <strong>Updated January 2025</strong> with all the latest features and improvements.
          </p>
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span>🚀 Always improving</span>
            <span>🔒 Security first</span>
            <span>📱 Mobile optimized</span>
            <span>⚡ Performance focused</span>
            <span>🌍 Globally accessible</span>
            <span>📊 Analytics driven</span>
          </div>
          
          <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Guide Version:</strong> 2025.1 | 
              <strong> Last Updated:</strong> January 2025 | 
              <strong> Database:</strong> 39 tables | 
              <strong> Edge Functions:</strong> 9 functions | 
              <strong> Email Service:</strong> Resend API | 
              <strong> Status:</strong> ✅ Fully up to date
            </p>
          </div>
        </div>
      </div>
    </div>
    </AdminLayout>
  );
};

export default AdminGuide;