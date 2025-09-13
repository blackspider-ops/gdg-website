import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Clock, 
  AlertTriangle, 
  Key, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { SecurityService, type SecurityMetrics } from '@/services/securityService';

interface SecurityDashboardProps {
  currentAdminId?: string;
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ currentAdminId }) => {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    activeSessionsCount: 0,
    recentLoginsCount: 0,
    securityAlertsCount: 0,
    failedLoginAttempts: 0
  });
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSecurityData();
  }, [currentAdminId]);

  const loadSecurityData = async () => {
    setIsLoading(true);
    try {
      const [securityMetrics, securityRecommendations] = await Promise.all([
        SecurityService.getSecurityMetrics(),
        SecurityService.getSecurityRecommendations(currentAdminId)
      ]);
      
      setMetrics(securityMetrics);
      setRecommendations(securityRecommendations);
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const securityPolicy = SecurityService.getSecurityPolicy();

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-400 mt-2">Loading security dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="bg-black rounded-xl shadow-sm border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Security Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <Shield size={20} className="text-green-600" />
              <span className="font-medium text-white">Active Sessions</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{metrics.activeSessionsCount}</div>
            <div className="text-sm text-gray-400">Currently active</div>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <Clock size={20} className="text-blue-600" />
              <span className="font-medium text-white">Recent Logins</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{metrics.recentLoginsCount}</div>
            <div className="text-sm text-gray-400">Last 24 hours</div>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <AlertTriangle size={20} className={metrics.securityAlertsCount > 0 ? "text-red-600" : "text-yellow-600"} />
              <span className="font-medium text-white">Security Alerts</span>
            </div>
            <div className={`text-2xl font-bold ${metrics.securityAlertsCount > 0 ? "text-red-600" : "text-yellow-600"}`}>
              {metrics.securityAlertsCount}
            </div>
            <div className="text-sm text-gray-400">
              {metrics.securityAlertsCount > 0 ? "Issues detected" : "All clear"}
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <XCircle size={20} className="text-red-600" />
              <span className="font-medium text-white">Failed Attempts</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{metrics.failedLoginAttempts}</div>
            <div className="text-sm text-gray-400">Recent failures</div>
          </div>
        </div>
      </div>

      {/* Security Policy Status */}
      <div className="bg-black rounded-xl shadow-sm border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Security Policy Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Password Policy */}
          <div className="border border-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-white mb-4 flex items-center space-x-2">
              <Key size={16} />
              <span>Password Policy</span>
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Minimum length</span>
                <div className="flex items-center space-x-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-white font-medium">{securityPolicy.passwordPolicy.minLength} chars</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Special characters</span>
                <div className="flex items-center space-x-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-green-600 font-medium">Required</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Password expiration</span>
                <span className="text-white font-medium">{securityPolicy.passwordPolicy.expirationDays} days</span>
              </div>
            </div>
          </div>

          {/* Session Settings */}
          <div className="border border-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-white mb-4 flex items-center space-x-2">
              <Clock size={16} />
              <span>Session Settings</span>
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Session timeout</span>
                <span className="text-white font-medium">{securityPolicy.sessionSettings.timeoutHours}h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Auto-logout</span>
                <div className="flex items-center space-x-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-green-600 font-medium">Enabled</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Remember login</span>
                <span className="text-white font-medium">{securityPolicy.sessionSettings.rememberLoginDays} days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Recommendations */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Info size={24} className="text-blue-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-300 mb-3">Security Recommendations</h3>
            <div className="space-y-2 text-sm text-blue-200">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>{recommendation}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-black rounded-xl shadow-sm border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Quick Security Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center space-x-3 p-4 border border-gray-700 rounded-lg hover:bg-gray-900 transition-colors text-left">
            <Key size={20} className="text-blue-600" />
            <div>
              <div className="font-medium text-white">Change Password</div>
              <div className="text-sm text-gray-400">Update your password</div>
            </div>
          </button>
          
          <button className="flex items-center space-x-3 p-4 border border-gray-700 rounded-lg hover:bg-gray-900 transition-colors text-left">
            <Shield size={20} className="text-green-600" />
            <div>
              <div className="font-medium text-white">Review Sessions</div>
              <div className="text-sm text-gray-400">Check active logins</div>
            </div>
          </button>
          
          <button className="flex items-center space-x-3 p-4 border border-gray-700 rounded-lg hover:bg-gray-900 transition-colors text-left">
            <Clock size={20} className="text-purple-600" />
            <div>
              <div className="font-medium text-white">Audit Logs</div>
              <div className="text-sm text-gray-400">View recent activity</div>
            </div>
          </button>
          
          <button className="flex items-center space-x-3 p-4 border border-gray-700 rounded-lg hover:bg-gray-900 transition-colors text-left">
            <AlertTriangle size={20} className="text-yellow-600" />
            <div>
              <div className="font-medium text-white">Security Scan</div>
              <div className="text-sm text-gray-400">Check for issues</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;