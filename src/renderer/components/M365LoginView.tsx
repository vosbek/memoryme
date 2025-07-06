import React, { useState, useEffect } from 'react';
import { 
  User, 
  Building2, 
  Shield, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Mail, 
  Calendar, 
  FileText, 
  MessageSquare,
  AlertCircle,
  ExternalLink,
  LogOut
} from 'lucide-react';

interface M365LoginViewProps {
  onClose: () => void;
  onSuccess?: (account: any) => void;
}

interface M365Status {
  isAuthenticated: boolean;
  account?: {
    username: string;
    name?: string;
    tenantId?: string;
  };
  tenantId?: string;
  expiresOn?: Date;
  scopes?: string[];
}

const M365LoginView: React.FC<M365LoginViewProps> = ({ onClose, onSuccess }) => {
  const [status, setStatus] = useState<M365Status>({ isAuthenticated: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [connectionTest, setConnectionTest] = useState<any>(null);

  // Check authentication status on component mount
  useEffect(() => {
    checkAuthStatus();
    initializeM365();
  }, []);

  // Test connection when authenticated
  useEffect(() => {
    if (status.isAuthenticated) {
      testConnection();
    }
  }, [status.isAuthenticated]);

  const initializeM365 = async () => {
    try {
      setIsLoading(true);
      const result = await window.electronAPI.m365Initialize();
      setIsInitialized(result.success);
      
      if (!result.success) {
        setError(result.error || 'Failed to initialize M365 authentication');
      }
    } catch (err) {
      setError('Failed to initialize M365 authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const authStatus = await window.electronAPI.m365GetStatus();
      setStatus(authStatus);
    } catch (err) {
      console.error('Failed to check auth status:', err);
    }
  };

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await window.electronAPI.m365Login();

      if (result.success) {
        await checkAuthStatus(); // Refresh status
        await testConnection(); // Test Graph API connection
        onSuccess?.(result.account);
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      const result = await window.electronAPI.m365TestConnection();
      setConnectionTest(result);
    } catch (err) {
      console.error('Connection test failed:', err);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await window.electronAPI.m365Logout();
      await checkAuthStatus(); // Refresh status
    } catch (err) {
      setError('Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    try {
      setIsLoading(true);
      const success = await window.electronAPI.m365RefreshToken();
      if (success) {
        await checkAuthStatus();
      } else {
        setError('Failed to refresh authentication');
      }
    } catch (err) {
      setError('Failed to refresh authentication');
    } finally {
      setIsLoading(false);
    }
  };

  // Microsoft-style permissions display
  const permissions = [
    { icon: Mail, label: 'Email', description: 'Read your email messages for knowledge extraction' },
    { icon: Calendar, label: 'Calendar', description: 'Read your calendar events and meeting information' },
    { icon: FileText, label: 'Files', description: 'Read your OneDrive and SharePoint documents' },
    { icon: MessageSquare, label: 'Teams', description: 'Read your Teams messages and meeting content' },
    { icon: User, label: 'Profile', description: 'Read your basic profile information' },
    { icon: Building2, label: 'Organization', description: 'Read basic organization information' }
  ];

  if (status.isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Connected to Microsoft 365</h2>
                  <p className="text-sm text-gray-500">DevMemory is ready for enterprise integration</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Account Information */}
          <div className="p-6">
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {status.account?.name || status.account?.username}
                  </p>
                  <p className="text-sm text-gray-500">{status.account?.username}</p>
                  {status.tenantId && (
                    <p className="text-xs text-gray-400">Tenant: {status.tenantId.substring(0, 8)}...</p>
                  )}
                </div>
              </div>
            </div>

            {/* Status Information */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Authentication Status</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Data Access</span>
                <span className="text-sm text-gray-900">Read-only</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Security</span>
                <span className="inline-flex items-center text-sm text-gray-900">
                  <Shield className="w-3 h-3 mr-1 text-green-600" />
                  Enterprise Policies Active
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleRefreshToken}
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 flex items-center justify-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Connect to Microsoft 365</h2>
                <p className="text-sm text-gray-500">Use your company credentials to enable enterprise features</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">DevMemory will be able to:</h3>
            <div className="space-y-3">
              {permissions.map((permission, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <permission.icon className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{permission.label}</p>
                    <p className="text-xs text-gray-500">{permission.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security Notice */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Enterprise Security</p>
                <p className="text-xs text-blue-700">
                  DevMemory respects all your organization's security policies including conditional access, 
                  MFA requirements, and device compliance. All data remains on your device.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleLogin}
              disabled={isLoading || !isInitialized}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center space-x-2 font-medium"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Building2 className="w-5 h-5" />
                  <span>Sign in with Microsoft</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 font-medium"
            >
              Continue without M365
            </button>
          </div>

          {/* Help Link */}
          <div className="mt-4 text-center">
            <button
              onClick={() => window.electronAPI.openExternal?.('docs/AZURE-APP-REGISTRATION.md')}
              className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center space-x-1"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Setup instructions for IT administrators</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default M365LoginView;