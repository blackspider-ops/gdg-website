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
              Admin Project Guide
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Complete technical documentation for admins - architecture, integrations, deployment, 
            and everything you need to manage this project like a pro ⚡
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Admin-only documentation</span>
          </div>
        </div>

        {/* Quick Overview */}
        <Card className="mb-8 border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-6 w-6 text-primary" />
              What's This All About?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              This is the official website for Google Developer Group at Penn State University. 
              It's built with modern web technologies and packed with features like user management, 
              email newsletters, event handling, and a super cool admin panel. Think of it as the 
              digital home for all things GDG@PSU! 🏠
            </p>
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
                Frontend (What Users See)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Badge variant="secondary" className="p-2 justify-center">React 18</Badge>
                <Badge variant="secondary" className="p-2 justify-center">TypeScript</Badge>
                <Badge variant="secondary" className="p-2 justify-center">Vite</Badge>
                <Badge variant="secondary" className="p-2 justify-center">Tailwind CSS</Badge>
                <Badge variant="secondary" className="p-2 justify-center">Radix UI</Badge>
                <Badge variant="secondary" className="p-2 justify-center">React Router</Badge>
                <Badge variant="secondary" className="p-2 justify-center">Three.js</Badge>
                <Badge variant="secondary" className="p-2 justify-center">GSAP</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-muted-foreground mt-2">
                React for the UI magic, TypeScript for type safety, Tailwind for beautiful styling, 
                and Three.js for those sweet 3D animations you see on the homepage!
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-500" />
                Backend & Database
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Badge variant="outline" className="p-2 justify-center">Supabase</Badge>
                <Badge variant="outline" className="p-2 justify-center">PostgreSQL</Badge>
                <Badge variant="outline" className="p-2 justify-center">Vercel Functions</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-muted-foreground mt-2">
                Supabase handles our database, authentication, and real-time features. 
                It's like Firebase but with PostgreSQL - pretty neat, right?
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Deployment & Services
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Badge variant="destructive" className="p-2 justify-center">Vercel</Badge>
                <Badge variant="destructive" className="p-2 justify-center">Resend</Badge>
                <Badge variant="destructive" className="p-2 justify-center">GitHub</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-muted-foreground mt-2">
                Vercel for lightning-fast deployments, Resend for professional emails, 
                and GitHub for version control. The dream team! 🚀
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
                User Management
              </CardTitle>
              <CardDescription>
                Handle members like a pro
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium">What it does:</h4>
                <ul className="text-sm text-gray-600 dark:text-muted-foreground space-y-1 ml-4">
                  <li>• Member registration and profiles</li>
                  <li>• Role-based access control</li>
                  <li>• Team member management</li>
                  <li>• User activity tracking</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">How it works:</h4>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  Uses Supabase Auth for secure login/signup, with custom user profiles 
                  stored in PostgreSQL. Admins can manage roles and permissions through 
                  the admin panel.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Email System */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-6 w-6 text-green-600" />
                Email System
              </CardTitle>
              <CardDescription>
                Professional emails made easy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium">What it does:</h4>
                <ul className="text-sm text-gray-600 dark:text-muted-foreground space-y-1 ml-4">
                  <li>• Newsletter subscriptions</li>
                  <li>• Event registration emails</li>
                  <li>• Bulk email campaigns</li>
                  <li>• Beautiful HTML templates</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">How it works:</h4>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  Powered by Resend API through Vercel serverless functions. 
                  Templates are built-in with GDG branding, and everything is 
                  GDPR-compliant with unsubscribe links.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Admin Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-purple-600" />
                Admin Panel
              </CardTitle>
              <CardDescription>
                Control center for everything
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium">What it does:</h4>
                <ul className="text-sm text-gray-600 dark:text-muted-foreground space-y-1 ml-4">
                  <li>• Content management</li>
                  <li>• Event creation and editing</li>
                  <li>• Newsletter management</li>
                  <li>• User and team management</li>
                  <li>• Analytics and insights</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">How it works:</h4>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  Protected routes with role-based access. Admins get a full 
                  dashboard with real-time data, content editors, and management tools. 
                  It's like having superpowers! ⚡
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security & Audit */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-red-600" />
                Security & Audit Logs
              </CardTitle>
              <CardDescription>
                Keep everything secure and tracked
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium">What it does:</h4>
                <ul className="text-sm text-gray-600 dark:text-muted-foreground space-y-1 ml-4">
                  <li>• Track all user actions</li>
                  <li>• Security event monitoring</li>
                  <li>• Admin activity logs</li>
                  <li>• Data change history</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">How it works:</h4>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  Every action is logged with timestamps, user info, and details. 
                  Admins can view comprehensive audit trails to ensure everything 
                  is running smoothly and securely.
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

        {/* Admin Management Guide */}
        <Card className="mb-8 border-2 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-orange-600" />
              Admin Management Tasks
            </CardTitle>
            <CardDescription>
              Your daily admin workflow and management tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Content Management</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>Pages:</strong> Edit homepage, about, contact content</li>
                  <li>• <strong>Events:</strong> Create, edit, and manage events</li>
                  <li>• <strong>Team:</strong> Add/remove team members and roles</li>
                  <li>• <strong>Resources:</strong> Manage learning resources and links</li>
                  <li>• <strong>Sponsors:</strong> Update sponsor information and logos</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">User & Communication</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>Users:</strong> Manage member accounts and permissions</li>
                  <li>• <strong>Newsletter:</strong> Send campaigns to subscribers</li>
                  <li>• <strong>Communications:</strong> Bulk email management</li>
                  <li>• <strong>Media:</strong> Upload and organize images/files</li>
                  <li>• <strong>Analytics:</strong> Monitor site usage and engagement</li>
                </ul>
              </div>
            </div>
            
            <Separator />
            
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Security Best Practices
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Always log out when finished with admin tasks</li>
                <li>• Review audit logs regularly for suspicious activity</li>
                <li>• Use strong passwords and enable 2FA if available</li>
                <li>• Be careful when bulk deleting or modifying data</li>
                <li>• Test email campaigns with small groups first</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Technical Setup */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-6 w-6 text-green-600" />
              Development & Deployment
            </CardTitle>
            <CardDescription>
              Technical setup and deployment information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Local Development</h3>
                <div className="bg-muted p-3 rounded-lg text-sm font-mono">
                  <div>git clone [repository]</div>
                  <div>npm install</div>
                  <div>cp .env.example .env.local</div>
                  <div>npm run dev</div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Make sure to set up your environment variables for Supabase and Resend
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Environment Variables</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <code>VITE_SUPABASE_URL</code> - Database connection</li>
                  <li>• <code>VITE_SUPABASE_ANON_KEY</code> - Public API key</li>
                  <li>• <code>RESEND_API_KEY</code> - Email service (server-side)</li>
                  <li>• <code>VITE_FROM_EMAIL</code> - Default sender email</li>
                  <li>• <code>VITE_DOMAIN</code> - Your domain name</li>
                </ul>
              </div>
            </div>
            
            <Separator />
            
            <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Deployment Process</h4>
              <p className="text-sm text-muted-foreground mb-2">
                The site auto-deploys on every push to main branch via Vercel:
              </p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Push code to GitHub main branch</li>
                <li>Vercel automatically builds and deploys</li>
                <li>Environment variables are managed in Vercel dashboard</li>
                <li>Serverless functions handle email and API requests</li>
                <li>Static files are served from global CDN</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-5 w-5 text-red-500" />
            <span className="text-gray-600 dark:text-muted-foreground">
              Built with love by the GDG@PSU team
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Questions? Suggestions? Found a bug? We'd love to hear from you! 
            Reach out through our contact page or GitHub issues.
          </p>
        </div>
      </div>
    </div>
    </AdminLayout>
  );
};

export default AdminGuide;