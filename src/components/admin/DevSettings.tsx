import React from 'react';
import { useDev } from '@/contexts/DevContext';
import { Settings, Shield, ShieldOff } from 'lucide-react';

const DevSettings = () => {
  const { isDevelopmentMode, allowDirectAdminAccess, setAllowDirectAdminAccess } = useDev();

  if (!isDevelopmentMode) {
    return null; // Don't show in production
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Settings size={20} className="text-yellow-600" />
        <h3 className="font-semibold text-yellow-800">Development Settings</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-yellow-800">Direct Admin Access</div>
            <div className="text-sm text-yellow-600">
              Allow accessing admin pages without authentication (development only)
            </div>
          </div>
          <button
            onClick={() => setAllowDirectAdminAccess(!allowDirectAdminAccess)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
              allowDirectAdminAccess
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-red-100 text-red-800 hover:bg-red-200'
            }`}
          >
            {allowDirectAdminAccess ? (
              <>
                <ShieldOff size={16} />
                <span>Enabled</span>
              </>
            ) : (
              <>
                <Shield size={16} />
                <span>Disabled</span>
              </>
            )}
          </button>
        </div>

        <div className="text-xs text-yellow-600 bg-yellow-100 p-3 rounded">
          <strong>Note:</strong> These settings are only available in development mode and will be 
          automatically disabled in production builds.
        </div>
      </div>
    </div>
  );
};

export default DevSettings;