export interface Memory {
  id: string;
  title: string;
  content: string;
  type: MemoryType;
  tags: string[];
  metadata: MemoryMetadata;
  createdAt: Date;
  updatedAt: Date;
  embedding?: number[];
}

export enum MemoryType {
  CODE_SNIPPET = 'code_snippet',
  DOCUMENTATION = 'documentation',
  MEETING_NOTES = 'meeting_notes',
  DECISION = 'decision',
  API_CALL = 'api_call',
  DEBUG_SESSION = 'debug_session',
  PROJECT_CONTEXT = 'project_context',
  KUBERNETES_RESOURCE = 'kubernetes_resource',
  COMMAND = 'command',
  LINK = 'link',
  NOTE = 'note'
}

export interface MemoryMetadata {
  source?: string;
  project?: string;
  repository?: string;
  filePath?: string;
  language?: string;
  framework?: string;
  command?: string;
  exitCode?: number;
  duration?: number;
  author?: string;
  url?: string;
  kubernetesNamespace?: string;
  kubernetesKind?: string;
  [key: string]: any;
}

export interface SearchResult {
  memory: Memory;
  score: number;
  highlights?: string[];
}

export interface SearchQuery {
  query: string;
  type?: MemoryType;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
  offset?: number;
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: MemoryType;
  properties: Record<string, any>;
}

export interface KnowledgeGraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
}

export interface DatabaseConfig {
  sqlitePath: string;
  chromaPath: string;
}

export interface LLMConfig {
  awsRegion: string;
  bedrockModelId: string;
  embeddingModelId: string;
}

export interface AppConfig {
  database: DatabaseConfig;
  llm: LLMConfig;
  ui: {
    theme: 'light' | 'dark' | 'system';
    defaultView: 'list' | 'graph' | 'search';
  };
  integration: {
    vscode: {
      enabled: boolean;
      autoCapture: boolean;
      captureCommands: boolean;
      captureFiles: boolean;
    };
  };
}

export interface VSCodeContext {
  activeFile?: string;
  openFiles?: string[];
  gitRepository?: string;
  gitBranch?: string;
  workspaceFolder?: string;
  recentCommands?: string[];
}