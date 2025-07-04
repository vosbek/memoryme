import React, { useState, useEffect } from 'react';
import { AppConfig } from '../../shared/types';
import { X, Save, Database, Brain, Palette, Code, Info } from 'lucide-react';

interface SettingsViewProps {
  onClose: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onClose }) => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appVersion, setAppVersion] = useState('');
  const [vectorInfo, setVectorInfo] = useState<{count: number, name: string, healthy: boolean} | null>(null);

  useEffect(() => {
    loadConfig();
    loadAppVersion();
    loadVectorInfo();
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
    let current: any = newConfig;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
    setConfig(newConfig);
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
    </div>
  );
};

export default SettingsView;