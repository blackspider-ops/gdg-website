import React from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Globe } from 'lucide-react';
import SiteStatusManager from '@/components/admin/SiteStatusManager';

const AdminSiteStatus = () => {
  const { isAuthenticated } = useAdmin();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          {/* Back Button */}
          <div className="mb-4">
            <Link
              to="/admin"
              className="inline-flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="text-sm font-medium">Back to Admin Dashboard</span>
            </Link>
          </div>

          {/* Page Header */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Globe size={24} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Site Status Management</h1>
              <p className="text-muted-foreground mt-1">Control site availability and maintenance mode</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <SiteStatusManager />
      </div>
    </div>
  );
};

export default AdminSiteStatus;