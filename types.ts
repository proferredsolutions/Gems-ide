
export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  isDirty?: boolean;
}

export enum AiTask {
    GenerateCode = 'Generate Code',
    ExplainCode = 'Explain Code',
    RefactorCode = 'Refactor Code',
    GenerateTests = 'Generate Tests',
    Chat = 'AI Chat',
    FormatPython = 'Format Python',
    DebugAnalyze = 'Debug Analyze',
}

export type AiTaskType = AiTask;

export interface GitCommit {
  id: string;
  message: string;
  timestamp: number;
  author: string;
  filesChanged?: {
    path: string;
    content: string;
  }[];
}

export interface GitState {
  isInitialized: boolean;
  currentBranch: string;
  commits: GitCommit[];
  stagedFiles: string[]; // file IDs
  remoteUrl?: string;
  githubUser?: {
    login: string;
    avatar_url: string;
  };
}

export interface McpTool {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  source: string;
}

export interface Extension {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  isEnabled: boolean;
  category: 'Theme' | 'Language' | 'Tool' | 'Linter';
}

export type DebuggerStatus = 'inactive' | 'starting' | 'paused' | 'running' | 'finishing';

export interface Breakpoint {
  fileId: string;
  line: number;
  isEnabled: boolean;
}

export interface IdeSettings {
  autoCompletion: boolean;
  aiGhostText: boolean;
  autoCloseBrackets: boolean;
  formatOnSave: boolean;
  fontSize: number;
  theme: 'dark' | 'light' | 'amoled';
  fontFamily: string;
  enableShortcuts: boolean;
  keyMap: 'vscode' | 'classic';
  zoom: number;
}

export interface DebugState {
  status: DebuggerStatus;
  currentLine: number | null;
  callStack: { name: string; line: number; fileId: string }[];
  variables: Record<string, any>;
  breakpoints: Breakpoint[];
}
