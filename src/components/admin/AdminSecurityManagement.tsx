import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Clock, 
  AlertTriangle, 
  Key, 
  Eye, 
  EyeOff,
  Save,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { SecurityService, type SecurityMetrics } from '@/services/securityService';
import { ContentService } from '@/services/contentService';

interface AdminSecurityManagementProps {
  currentAdmin?: any;
}

const AdminSecurityManagement: React.FC<AdminSecurityManagementProps> = ({ currentAdmin }) => {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    activeSessionsCount: 0,
    recentLoginsCount: 0,
    securityAlertsCount: 0,
    failedLoginAttempts: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Secret code management state
  const [secretCode, setSecretCode] = useState('');
  const [currentSecretCode, setCurrentSecretCode] = useState('');
  const [isEditingSecret, setIsEditingSecret] = useState(false);
  const [isSavingSecret, setIsSavingSecret] = useState(false);
  const [showSecretCode, setShowSecretCode] = useState(false);
  const [secretMessage, setSecretMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [secretValidationError, setSecretValidationError] = useState<string | null>(null);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setIsLoading(true);
    try {
      const [securityMetrics] = await Promise.all([
        SecurityService.getSecurityMetrics()
      ]);
      
      setMetrics(securityMetrics);
      
      // Load current secret code
      await loadSecretCode();
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const loadSecretCode = async () => {
    try {
      const code = await ContentService.getAdminSecretCode();
      setCurrentSecretCode(code);
      setSecretCode(code);
    } catch (error) {
      setSecretMessage({ type: 'error', text: 'Failed to load current secret code' });
    }
  };

  // Validate email format for secret code
  const validateSecretCode = (code: string): string | null => {
    if (!code.trim()) {
      return 'Secret code cannot be empty';
    }

    if (!code.includes('@')) {
      return 'Secret code must contain an @ symbol';
    }

    if (!code.endsWith('.edu') && !code.endsWith('.com')) {
      return 'Secret code must end with .edu or .com';
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(code)) {
      return 'Secret code must be in valid email format';
    }

    return null;
  };

  const handleSaveSecretCode = async () => {
    const validationError = validateSecretCode(secretCode);
    if (validationError) {
      setSecretMessage({ type: 'error', text: validationError });
      return;
    }

    if (secretCode === currentSecretCode) {
      setSecretMessage({ type: 'error', text: 'New secret code must be different from current code' });
      return;
    }

    setIsSavingSecret(true);
    setSecretMessage(null);

    try {
      const success = await ContentService.updateAdminSecretCode(secretCode, currentAdmin?.id);
      
      if (success) {
        setCurrentSecretCode(secretCode);
        setIsEditingSecret(false);
        setSecretMessage({ type: 'success', text: 'Admin secret code updated successfully' });
        
        // Log the action
        if (currentAdmin?.id) {
          await SecurityService.logSecurityEvent('password_change', currentAdmin.id, {
            action: 'secret_code_change',
            old_code: currentSecretCode.substring(0, 3) + '***',
            new_code: secretCode.substring(0, 3) + '***'
          });
        }
      } else {
        setSecretMessage({ type: 'error', text: 'Failed to update secret code. Please try again.' });
      }
    } catch (error) {
      setSecretMessage({ type: 'error', text: 'An error occurred while updating the secret code' });
    } finally {
      setIsSavingSecret(false);
    }
  };

  const handleCancelSecretEdit = () => {
    setSecretCode(currentSecretCode);
    setIsEditingSecret(false);
    setSecretMessage(null);
    setSecretValidationError(null);
  };

  // Handle input change with real-time validation
  const handleSecretCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCode = e.target.value;
    setSecretCode(newCode);
    
    // Clear previous messages
    setSecretMessage(null);
    
    // Real-time validation
    if (newCode.trim()) {
      const error = validateSecretCode(newCode);
      setSecretValidationError(error);
    } else {
      setSecretValidationError(null);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-muted-foreground mt-2">Loading security dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="bg-black rounded-xl shadow-sm border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-primary-foreground mb-6">Security Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <Shield size={20} className="text-green-600" />
              <span className="font-medium text-primary-foreground">Active Sessions</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{metrics.activeSessionsCount}</div>
            <div className="text-sm text-muted-foreground">Currently active</div>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <Clock size={20} className="text-primary" />
              <span className="font-medium text-primary-foreground">Recent Logins</span>
            </div>
            <div className="text-2xl font-bold text-primary">{metrics.recentLoginsCount}</div>
            <div className="text-sm text-muted-foreground">Last 24 hours</div>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <AlertTriangle size={20} className={metrics.securityAlertsCount > 0 ? "text-red-600" : "text-yellow-600"} />
              <span className="font-medium text-primary-foreground">Security Alerts</span>
            </div>
            <div className={`text-2xl font-bold ${metrics.securityAlertsCount > 0 ? "text-red-600" : "text-yellow-600"}`}>
              {metrics.securityAlertsCount}
            </div>
            <div className="text-sm text-muted-foreground">
              {metrics.securityAlertsCount > 0 ? "Issues detected" : "All clear"}
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <XCircle size={20} className="text-red-600" />
              <span className="font-medium text-primary-foreground">Failed Attempts</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{metrics.failedLoginAttempts}</div>
            <div className="text-sm text-muted-foreground">Recent failures</div>
          </div>
        </div>
      </div>

      {/* Admin Secret Code Management */}
      <div className="bg-black rounded-xl shadow-sm border border-gray-800 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Key size={20} className="text-primary" />
          <h3 className="font-semibold text-lg text-primary-foreground">Admin Access Secret Code</h3>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-300 mb-1">Important Security Information</h4>
              <p className="text-sm text-yellow-200 leading-relaxed">
                This secret code can be entered in the newsletter signup field to access the admin login popup. 
                Keep this code secure and change it regularly. Anyone with this code can attempt to access the admin panel.
              </p>
            </div>
          </div>
        </div>

        {secretMessage && (
          <div className={`p-4 rounded-lg mb-6 ${
            secretMessage.type === 'success' 
              ? 'bg-green-900/20 text-green-400 border border-green-500/30' 
              : 'bg-red-900/20 text-red-400 border border-red-500/30'
          }`}>
            {secretMessage.text}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Current Secret Code</label>
            <div className="relative">
              <input
                type={showSecretCode ? 'text' : 'password'}
                value={isEditingSecret ? secretCode : currentSecretCode}
                onChange={isEditingSecret ? handleSecretCodeChange : undefined}
                disabled={!isEditingSecret}
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  isEditingSecret 
                    ? secretValidationError 
                      ? 'border-red-300 bg-black focus:ring-red-500 focus:border-red-500 text-primary-foreground' 
                      : 'border-gray-700 bg-black focus:ring-blue-400 focus:border-blue-400 text-primary-foreground'
                    : 'border-gray-700 bg-gray-900 text-muted-foreground'
                }`}
                placeholder="Enter new secret code (e.g., gdg-secret@psu.edu)"
              />
              <button
                type="button"
                onClick={() => setShowSecretCode(!showSecretCode)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-gray-300 transition-colors"
              >
                {showSecretCode ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {isEditingSecret && secretValidationError ? (
              <p className="text-xs text-red-400 mt-1 flex items-center space-x-1">
                <AlertTriangle size={12} />
                <span>{secretValidationError}</span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Must be in email format with @ symbol and end with .edu or .com (e.g., gdg-secret@psu.edu)
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              <strong>How it works:</strong> Enter this code in the newsletter signup field on the website footer to trigger the admin login popup.
            </div>
            
            <div className="flex items-center space-x-3">
              {isEditingSecret ? (
                <>
                  <button
                    onClick={handleCancelSecretEdit}
                    className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-900 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSecretCode}
                    disabled={isSavingSecret || !secretCode.trim() || !!secretValidationError}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                  >
                    <Save size={16} />
                    <span>{isSavingSecret ? 'Saving...' : 'Save Code'}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditingSecret(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  <Key size={16} />
                  <span>Change Secret Code</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Security Policy Status */}
      <div className="bg-black rounded-xl shadow-sm border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-primary-foreground mb-6">Security Policy Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Password Policy */}
          <div className="border border-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-primary-foreground mb-4 flex items-center space-x-2">
              <Key size={16} />
              <span>Password Policy</span>
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Minimum length</span>
                <div className="flex items-center space-x-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-primary-foreground font-medium">8 chars</span>
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
                <span className="text-primary-foreground font-medium">90 days</span>
              </div>
            </div>
          </div>

          {/* Session Settings */}
          <div className="border border-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-primary-foreground mb-4 flex items-center space-x-2">
              <Clock size={16} />
              <span>Session Settings</span>
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Session timeout</span>
                <span className="text-primary-foreground font-medium">24h</span>
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
                <span className="text-primary-foreground font-medium">7 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Recommendations */}
      <div className="bg-blue-900/20 border border-primary/30 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Info size={24} className="text-blue-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-300 mb-3">Security Recommendations</h3>
            <div className="space-y-2 text-sm text-blue-200">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>Change the admin secret code monthly for enhanced security</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>Use a unique email format that's not easily guessable</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>Monitor admin access logs weekly for suspicious activity</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>Keep admin passwords strong and update them regularly</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSecurityManagement;