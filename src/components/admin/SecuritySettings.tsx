import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Shield, 
  Clock, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Save, 
  CheckCircle,
  XCircle,
  Settings,
  Lock,
  Smartphone,
  Globe
} from 'lucide-react';
import { SecurityService } from '@/services/securityService';

interface SecuritySettingsProps {
  currentAdmin?: any;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({ currentAdmin }) => {
  const [activeSection, setActiveSection] = useState<'password' | 'sessions' | 'access' | 'advanced'>('password');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordValidation, setPasswordValidation] = useState<{
    isValid: boolean;
    errors: string[];
  }>({ isValid: false, errors: [] });

  // Security policy settings
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 24,
    autoLogout: true,
    rememberLogin: 7,
    maxFailedAttempts: 5,
    lockoutDuration: 15,
    ipRestrictions: false,
    twoFactorAuth: false,
    passwordExpiration: 90
  });

  useEffect(() => {
    // Validate password in real-time
    if (passwordForm.newPassword) {
      const validation = SecurityService.validatePassword(passwordForm.newPassword);
      setPasswordValidation(validation);
    } else {
      setPasswordValidation({ isValid: false, errors: [] });
    }
  }, [passwordForm.newPassword]);

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all password fields' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (!passwordValidation.isValid) {
      setMessage({ type: 'error', text: 'Password does not meet security requirements' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      // In a real implementation, this would call the backend
      // For now, we'll simulate the password change
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      // Log security event
      if (currentAdmin?.id) {
        await SecurityService.logSecurityEvent('password_change', currentAdmin.id);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update password. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingsUpdate = async (setting: string, value: any) => {
    setSecuritySettings(prev => ({ ...prev, [setting]: value }));
    
    // In a real implementation, this would save to the backend
    setMessage({ type: 'success', text: 'Security settings updated' });
  };

  const securityPolicy = SecurityService.getSecurityPolicy();

  const sections = [
    { id: 'password', label: 'Password Security', icon: Key },
    { id: 'sessions', label: 'Session Management', icon: Clock },
    { id: 'access', label: 'Access Control', icon: Shield },
    { id: 'advanced', label: 'Advanced Security', icon: Settings }
  ];

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="border-b border-gray-800">
        <nav className="flex space-x-8">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeSection === section.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'
                }`}
              >
                <Icon size={16} />
                <span>{section.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-900/20 text-green-400 border border-green-500/30' 
            : 'bg-red-900/20 text-red-400 border border-red-500/30'
        }`}>
          {message.text}
        </div>
      )}

      {/* Password Security Section */}
      {activeSection === 'password' && (
        <div className="space-y-6">
          <div className="bg-black rounded-xl shadow-sm border border-gray-800 p-6">
            <h3 className="font-semibold text-lg mb-6 text-white">Change Password</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Current Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-4 py-3 pr-12 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 text-white bg-black ${
                      passwordForm.newPassword && !passwordValidation.isValid
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-700 focus:ring-blue-400 focus:border-blue-400'
                    }`}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {passwordForm.newPassword && passwordValidation.errors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {passwordValidation.errors.map((error, index) => (
                      <p key={index} className="text-xs text-red-400 flex items-center space-x-1">
                        <XCircle size={12} />
                        <span>{error}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 text-white bg-black ${
                      passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-700 focus:ring-blue-400 focus:border-blue-400'
                    }`}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                  <p className="text-xs text-red-400 mt-1 flex items-center space-x-1">
                    <XCircle size={12} />
                    <span>Passwords do not match</span>
                  </p>
                )}
              </div>
              
              <button
                onClick={handlePasswordChange}
                disabled={isSaving || !passwordValidation.isValid || passwordForm.newPassword !== passwordForm.confirmPassword}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                <Save size={16} />
                <span>{isSaving ? 'Updating...' : 'Update Password'}</span>
              </button>
            </div>
          </div>

          {/* Password Policy Display */}
          <div className="bg-black rounded-xl shadow-sm border border-gray-800 p-6">
            <h3 className="font-semibold text-lg mb-6 text-white">Password Requirements</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle size={16} className="text-green-600" />
                <span className="text-gray-300">Minimum {securityPolicy.passwordPolicy.minLength} characters</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle size={16} className="text-green-600" />
                <span className="text-gray-300">At least one special character</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle size={16} className="text-green-600" />
                <span className="text-gray-300">At least one number</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle size={16} className="text-green-600" />
                <span className="text-gray-300">At least one uppercase letter</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Management Section */}
      {activeSection === 'sessions' && (
        <div className="space-y-6">
          <div className="bg-black rounded-xl shadow-sm border border-gray-800 p-6">
            <h3 className="font-semibold text-lg mb-6 text-white">Session Settings</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Session Timeout</div>
                  <div className="text-sm text-gray-400">Automatically log out after inactivity</div>
                </div>
                <select
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => handleSettingsUpdate('sessionTimeout', parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-700 rounded-lg bg-black text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value={1}>1 hour</option>
                  <option value={8}>8 hours</option>
                  <option value={24}>24 hours</option>
                  <option value={72}>3 days</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Auto-logout on Inactivity</div>
                  <div className="text-sm text-gray-400">Log out when browser is inactive</div>
                </div>
                <input
                  type="checkbox"
                  checked={securitySettings.autoLogout}
                  onChange={(e) => handleSettingsUpdate('autoLogout', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-black border border-gray-700 rounded focus:ring-blue-400 focus:ring-2"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Remember Login Duration</div>
                  <div className="text-sm text-gray-400">How long to remember login credentials</div>
                </div>
                <select
                  value={securitySettings.rememberLogin}
                  onChange={(e) => handleSettingsUpdate('rememberLogin', parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-700 rounded-lg bg-black text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value={1}>1 day</option>
                  <option value={7}>7 days</option>
                  <option value={30}>30 days</option>
                  <option value={0}>Never</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Access Control Section */}
      {activeSection === 'access' && (
        <div className="space-y-6">
          <div className="bg-black rounded-xl shadow-sm border border-gray-800 p-6">
            <h3 className="font-semibold text-lg mb-6 text-white">Access Control Settings</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Failed Login Attempts Limit</div>
                  <div className="text-sm text-gray-400">Lock account after this many failed attempts</div>
                </div>
                <select
                  value={securitySettings.maxFailedAttempts}
                  onChange={(e) => handleSettingsUpdate('maxFailedAttempts', parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-700 rounded-lg bg-black text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value={3}>3 attempts</option>
                  <option value={5}>5 attempts</option>
                  <option value={10}>10 attempts</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Account Lockout Duration</div>
                  <div className="text-sm text-gray-400">How long to lock account after failed attempts</div>
                </div>
                <select
                  value={securitySettings.lockoutDuration}
                  onChange={(e) => handleSettingsUpdate('lockoutDuration', parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-700 rounded-lg bg-black text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value={5}>5 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">IP-based Restrictions</div>
                  <div className="text-sm text-gray-400">Restrict access to specific IP addresses</div>
                </div>
                <input
                  type="checkbox"
                  checked={securitySettings.ipRestrictions}
                  onChange={(e) => handleSettingsUpdate('ipRestrictions', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-black border border-gray-700 rounded focus:ring-blue-400 focus:ring-2"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Security Section */}
      {activeSection === 'advanced' && (
        <div className="space-y-6">
          <div className="bg-black rounded-xl shadow-sm border border-gray-800 p-6">
            <h3 className="font-semibold text-lg mb-6 text-white">Advanced Security Features</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Smartphone size={20} className="text-blue-600" />
                  <div>
                    <div className="font-medium text-white">Two-Factor Authentication</div>
                    <div className="text-sm text-gray-400">Add an extra layer of security to your account</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-400">Coming Soon</span>
                  <input
                    type="checkbox"
                    checked={securitySettings.twoFactorAuth}
                    disabled
                    className="w-4 h-4 text-blue-600 bg-black border border-gray-700 rounded focus:ring-blue-400 focus:ring-2 opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Globe size={20} className="text-green-600" />
                  <div>
                    <div className="font-medium text-white">IP Whitelisting</div>
                    <div className="text-sm text-gray-400">Only allow access from specific IP addresses</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-400">Coming Soon</span>
                  <input
                    type="checkbox"
                    disabled
                    className="w-4 h-4 text-blue-600 bg-black border border-gray-700 rounded focus:ring-blue-400 focus:ring-2 opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle size={20} className="text-yellow-600" />
                  <div>
                    <div className="font-medium text-white">Security Monitoring</div>
                    <div className="text-sm text-gray-400">Real-time monitoring of suspicious activities</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-green-400">Active</span>
                  <CheckCircle size={16} className="text-green-600" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Password Expiration</div>
                  <div className="text-sm text-gray-400">Force password changes after this period</div>
                </div>
                <select
                  value={securitySettings.passwordExpiration}
                  onChange={(e) => handleSettingsUpdate('passwordExpiration', parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-700 rounded-lg bg-black text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                  <option value={0}>Never</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecuritySettings;