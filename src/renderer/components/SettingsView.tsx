import React, { useState, useEffect } from 'react';
import { AppConfig } from '../../shared/types';
import { X, Save, Database, Brain, Palette, Code, Info, Building2, CheckCircle, XCircle, AlertCircle, RefreshCw, Clock, FileText } from 'lucide-react';
import M365LoginView from './M365LoginView';

interface SettingsViewProps {
  onClose: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onClose }) => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appVersion, setAppVersion] = useState('');
  const [vectorInfo, setVectorInfo] = useState<{count: number, name: string, healthy: boolean} | null>(null);
  const [m365Status, setM365Status] = useState<any>({ isAuthenticated: false });
  const [showM365Login, setShowM365Login] = useState(false);
  const [m365Loading, setM365Loading] = useState(false);
  const [m365SyncStatus, setM365SyncStatus] = useState<any>(null);
  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    loadConfig();
    loadAppVersion();
    loadVectorInfo();
    loadM365Status();
    loadM365SyncStatus();
  }, []);

  const loadConfig = async () => {
    try {
      const appConfig = await window.electronAPI.getAppConfig();
      setConfig(appConfig);
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAppVersion = async () => {
    try {
      const version = await window.electronAPI.getAppVersion();
      setAppVersion(version);
    } catch (error) {
      console.error('Failed to load app version:', error);
    }
  };

  const loadVectorInfo = async () => {
    try {
      const info = await window.electronAPI.getVectorInfo();
      setVectorInfo(info);
    } catch (error) {
      console.error('Failed to load vector info:', error);
    }
  };

  const loadM365Status = async () => {
    try {
      const status = await window.electronAPI.m365GetStatus();
      setM365Status(status);
    } catch (error) {
      console.error('Failed to load M365 status:', error);
    }
  };

  const loadM365SyncStatus = async () => {
    try {
      const status = await window.electronAPI.m365SyncStatus();
      setM365SyncStatus(status);
    } catch (error) {
      console.error('Failed to load M365 sync status:', error);
    }
  };

  const handleM365Connect = () => {
    setShowM365Login(true);
  };

  const handleM365Disconnect = async () => {
    setM365Loading(true);
    try {
      await window.electronAPI.m365Logout();
      await loadM365Status(); // Refresh status
    } catch (error) {
      console.error('Failed to disconnect M365:', error);
    } finally {
      setM365Loading(false);
    }
  };

  const handleM365Refresh = async () => {
    setM365Loading(true);
    try {
      await window.electronAPI.m365RefreshToken();
      await loadM365Status(); // Refresh status
    } catch (error) {
      console.error('Failed to refresh M365 token:', error);
    } finally {
      setM365Loading(false);
    }
  };

  const handleM365LoginSuccess = async () => {
    setShowM365Login(false);
    await loadM365Status(); // Refresh status
    await loadM365SyncStatus(); // Refresh sync status
  };

  const handleM365Sync = async () => {
    setSyncLoading(true);
    try {
      const result = await window.electronAPI.m365SyncStart();
      console.log('Sync completed:', result);
      await loadM365SyncStatus(); // Refresh status
      alert(`Synchronization completed! Processed ${result.itemsProcessed} items (${result.itemsCreated} created, ${result.itemsUpdated} updated)`);
    } catch (error) {
      console.error('Sync failed:', error);
      alert(`Synchronization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleM365IncrementalSync = async () => {
    setSyncLoading(true);
    try {
      const result = await window.electronAPI.m365SyncIncremental();
      console.log('Incremental sync completed:', result);
      await loadM365SyncStatus(); // Refresh status
      alert(`Incremental sync completed! Processed ${result.itemsProcessed} items`);
    } catch (error) {
      console.error('Incremental sync failed:', error);
      alert(`Incremental sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    try {
      await window.electronAPI.setAppConfig(config);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (path: string[], value: any) => {
    if (!config) return;

    const newConfig = { ...config };
    
    // Type-safe deep property update using reduce
    const updateNestedObject = (obj: Record<string, any>, keyPath: string[], newValue: any): Record<string, any> => {
      if (keyPath.length === 1) {
        return { ...obj, [keyPath[0]]: newValue };
      }
      
      const [currentKey, ...remainingPath] = keyPath;
      
      // Ensure the nested object exists
      if (!obj[currentKey] || typeof obj[currentKey] !== 'object') {
        obj[currentKey] = {};
      }
      
      return {
        ...obj,
        [currentKey]: updateNestedObject(obj[currentKey], remainingPath, newValue)
      };
    };
    
    const updatedConfig = updateNestedObject(newConfig, path, value);
    setConfig(updatedConfig as AppConfig);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-red-600">Failed to load settings</p>
          <button onClick={onClose} className="mt-2 btn-secondary">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Settings</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            <Save className="w-4 h-4 mr-1" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Database Settings */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">Database</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SQLite Database Path
                </label>
                <input
                  type="text"
                  value={config.database.sqlitePath}
                  onChange={(e) => updateConfig(['database', 'sqlitePath'], e.target.value)}
                  className="input-field"
                  placeholder="/path/to/devmemory.db"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chroma Vector Database Path
                </label>
                <input
                  type="text"
                  value={config.database.chromaPath}
                  onChange={(e) => updateConfig(['database', 'chromaPath'], e.target.value)}
                  className="input-field"
                  placeholder="/path/to/chroma"
                />
              </div>
            </div>
          </section>

          {/* LLM Settings */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">LLM Configuration</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AWS Region
                </label>
                <select
                  value={config.llm.awsRegion}
                  onChange={(e) => updateConfig(['llm', 'awsRegion'], e.target.value)}
                  className="select-field"
                >
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="eu-west-1">Europe (Ireland)</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bedrock Model ID
                </label>
                <select
                  value={config.llm.bedrockModelId}
                  onChange={(e) => updateConfig(['llm', 'bedrockModelId'], e.target.value)}
                  className="select-field"
                >
                  <option value="anthropic.claude-3-sonnet-20240229-v1:0">Claude 3 Sonnet</option>
                  <option value="anthropic.claude-3-haiku-20240307-v1:0">Claude 3 Haiku</option>
                  <option value="anthropic.claude-v2">Claude 2</option>
                  <option value="meta.llama2-70b-chat-v1">Llama 2 70B</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Embedding Model ID
                </label>
                <select
                  value={config.llm.embeddingModelId}
                  onChange={(e) => updateConfig(['llm', 'embeddingModelId'], e.target.value)}
                  className="select-field"
                >
                  <option value="amazon.titan-embed-text-v1">Amazon Titan Text Embeddings</option>
                  <option value="cohere.embed-english-v3">Cohere Embed English</option>
                </select>
              </div>
            </div>
          </section>

          {/* UI Settings */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">User Interface</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Theme
                </label>
                <select
                  value={config.ui.theme}
                  onChange={(e) => updateConfig(['ui', 'theme'], e.target.value)}
                  className="select-field"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default View
                </label>
                <select
                  value={config.ui.defaultView}
                  onChange={(e) => updateConfig(['ui', 'defaultView'], e.target.value)}
                  className="select-field"
                >
                  <option value="list">Memory List</option>
                  <option value="graph">Knowledge Graph</option>
                  <option value="search">Search</option>
                </select>
              </div>
            </div>
          </section>

          {/* VSCode Integration */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Code className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">VSCode Integration</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="vscode-enabled"
                  checked={config.integration.vscode.enabled}
                  onChange={(e) => updateConfig(['integration', 'vscode', 'enabled'], e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="vscode-enabled" className="text-sm font-medium text-gray-700">
                  Enable VSCode Integration
                </label>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="auto-capture"
                  checked={config.integration.vscode.autoCapture}
                  onChange={(e) => updateConfig(['integration', 'vscode', 'autoCapture'], e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="auto-capture" className="text-sm font-medium text-gray-700">
                  Auto-capture Context
                </label>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="capture-commands"
                  checked={config.integration.vscode.captureCommands}
                  onChange={(e) => updateConfig(['integration', 'vscode', 'captureCommands'], e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="capture-commands" className="text-sm font-medium text-gray-700">
                  Capture Terminal Commands
                </label>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="capture-files"
                  checked={config.integration.vscode.captureFiles}
                  onChange={(e) => updateConfig(['integration', 'vscode', 'captureFiles'], e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="capture-files" className="text-sm font-medium text-gray-700">
                  Capture File Context
                </label>
              </div>
            </div>
          </section>

          {/* M365 Integration */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">Microsoft 365 Integration</h3>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              {m365Status.isAuthenticated ? (
                <>
                  {/* Connected Status */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-gray-900">Connected to Microsoft 365</span>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>

                  {/* Account Information */}
                  <div className="bg-white rounded-md p-3 mb-4">
                    <div className="text-sm text-gray-600 mb-1">Account</div>
                    <div className="font-medium text-gray-900">
                      {m365Status.account?.name || m365Status.account?.username}
                    </div>
                    <div className="text-sm text-gray-500">{m365Status.account?.username}</div>
                    {m365Status.tenantId && (
                      <div className="text-xs text-gray-400 mt-1">
                        Tenant: {m365Status.tenantId.substring(0, 8)}...
                      </div>
                    )}
                  </div>

                  {/* Connection Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-600">Data Access:</span>
                      <span className="ml-2 font-medium text-gray-900">Read-only</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Security:</span>
                      <span className="ml-2 font-medium text-gray-900">Enterprise Policies</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleM365Refresh}
                      disabled={m365Loading}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      {m365Loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Refresh
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleM365Disconnect}
                      disabled={m365Loading}
                      className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-300 disabled:bg-gray-100 text-sm font-medium"
                    >
                      Disconnect
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Not Connected Status */}
                  <div className="text-center py-6">
                    <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h4 className="font-medium text-gray-900 mb-2">Not Connected</h4>
                    <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
                      Connect to Microsoft 365 to enable email intelligence, calendar context, 
                      Teams knowledge, and SharePoint document intelligence.
                    </p>
                    
                    {/* Feature Preview */}
                    <div className="text-left bg-white rounded-md p-3 mb-4">
                      <div className="text-sm font-medium text-gray-900 mb-2">Available Features:</div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>📧 Email knowledge extraction from Outlook</div>
                        <div>📅 Calendar context and meeting intelligence</div>
                        <div>💬 Teams collaboration knowledge mining</div>
                        <div>📄 SharePoint document intelligence</div>
                        <div>👥 Organization chart and people insights</div>
                      </div>
                    </div>

                    <button
                      onClick={handleM365Connect}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium flex items-center justify-center gap-2 mx-auto"
                    >
                      <Building2 className="w-4 h-4" />
                      Connect to Microsoft 365
                    </button>
                  </div>

                  {/* Security Notice */}
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-medium text-blue-900 mb-1">Enterprise Security</div>
                        <div className="text-blue-700">
                          Uses your company's existing credentials. Respects all security policies 
                          including conditional access and MFA. All data processed locally.
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Vector Database Status */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">Vector Database</h3>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  vectorInfo?.healthy 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {vectorInfo?.healthy ? 'Healthy' : 'Unavailable'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Documents:</span>
                  <span className="ml-2 font-medium">{vectorInfo?.count || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Store:</span>
                  <span className="ml-2 font-medium">{vectorInfo?.name || 'Unknown'}</span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Vector database enables semantic search across your memories.
                  {vectorInfo?.healthy 
                    ? ' Working with AWS Bedrock embeddings or local fallback.'
                    : ' Check AWS credentials or restart the application.'
                  }
                </p>
              </div>
            </div>
          </section>

          {/* About */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">About</h3>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">DevMemory</h4>
              <p className="text-sm text-gray-600 mb-2">
                Enterprise Developer Memory Assistant with Vector Search
              </p>
              <p className="text-sm text-gray-500">
                Version: {appVersion || 'Unknown'}
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* M365 Login Modal */}
      {showM365Login && (
        <M365LoginView
          onClose={() => setShowM365Login(false)}
          onSuccess={handleM365LoginSuccess}
        />
      )}
    </div>
  );
};

export default SettingsView;