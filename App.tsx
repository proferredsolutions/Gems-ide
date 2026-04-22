
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { FileExplorer } from './components/FileExplorer';
import { Editor } from './components/Editor';
import { Terminal } from './components/Terminal';
import { AiPanel } from './components/AiPanel';
import { CommandPalette } from './components/CommandPalette';
import { FileNode, AiTask, AiTaskType, GitState, GitCommit, DebugState, Breakpoint, IdeSettings, TerminalTab } from './types';
import { INITIAL_FILES } from './constants';
import { runAiTask } from './services/geminiService';
import { GitPanel } from './components/GitPanel';
import { DebugPanel } from './components/DebugPanel';
import { LivePreview } from './components/LivePreview';
import { McpPanel } from './components/McpPanel';
import { ExtensionsPanel } from './components/ExtensionsPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { BlueprintPanel } from './components/BlueprintPanel';
import { Icon } from './components/Icon';

const App: React.FC = () => {
  const [files, setFiles] = useState<FileNode[]>(INITIAL_FILES);
  const [openFileIds, setOpenFileIds] = useState<string[]>(['1']);
  const [activeFileId, setActiveFileId] = useState<string>('1');
  const [fileContents, setFileContents] = useState<Record<string, string>>({
    '1': `import React from 'react';

const App = () => {
  return (
    <div>
      <h1>Hello, Gemini IDE!</h1>
      <p>Start by exploring the AI features on the right.</p>
    </div>
  );
};

export default App;
`,
    '2': `body {
  font-family: sans-serif;
  background-color: #f0f0f0;
}`,
    '4': `{
  "name": "gemini-ide",
  "version": "1.0.0"
}`,
    '6': `console.log("Utility script running.");`
  });
  const [terminalOutput, setTerminalOutput] = useState<string[]>(['Welcome to Gemini IDE. Type "help" for a list of commands.']);
  const [programOutput, setProgramOutput] = useState<string[]>([]);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [problems, setProblems] = useState<{line: number; message: string; file: string}[]>([]);

  const [activeTerminalTab, setActiveTerminalTab] = useState<TerminalTab>('terminal');
  const [isLoading, setIsLoading] = useState(false);
  const [activeAiTask, setActiveAiTask] = useState<AiTaskType>(AiTask.GenerateCode);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isExplorerVisible, setIsExplorerVisible] = useState(true);
  const [activeSidePanel, setActiveSidePanel] = useState<'ai' | 'git' | 'debug' | 'live' | 'mcp' | 'extensions' | 'settings' | 'blueprint'>('ai');
  const [settings, setSettings] = useState<IdeSettings>({
    autoCompletion: true,
    aiGhostText: true,
    autoCloseBrackets: true,
    formatOnSave: true,
    fontSize: 14,
    theme: 'dark',
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    enableShortcuts: true,
    keyMap: 'vscode',
    zoom: 100
  });
  const [gitState, setGitState] = useState<GitState>({
    isInitialized: false,
    currentBranch: 'main',
    commits: [],
    stagedFiles: [],
  });
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [debugState, setDebugState] = useState<DebugState>({
    status: 'inactive',
    currentLine: null,
    callStack: [],
    variables: {},
    breakpoints: []
  });

  const findFile = useCallback((nodes: FileNode[], id: string): FileNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findFile(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const activeFile = useMemo(() => findFile(files, activeFileId), [files, activeFileId, findFile]);
  const openFiles = React.useMemo(() => openFileIds.map(id => findFile(files, id)).filter(Boolean) as FileNode[], [openFileIds, files, findFile]);

  const handleProblemsChange = useCallback((newProblems: {line: number; message: string}[]) => {
    const fileName = findFile(files, activeFileId)?.name || 'unknown';
    setProblems(prev => {
      const currentEnriched = newProblems.map(p => ({ ...p, file: fileName }));
      if (JSON.stringify(prev) === JSON.stringify(currentEnriched)) return prev;
      return currentEnriched;
    });
  }, [files, activeFileId, findFile]);

  const handleFileSelect = useCallback((fileId: string) => {
    setOpenFileIds(prev => {
      if (!prev.includes(fileId)) {
        return [...prev, fileId];
      }
      return prev;
    });
    setActiveFileId(fileId);
  }, []);

  const handleCloseFile = useCallback((fileId: string) => {
    setOpenFileIds(prev => {
      const newOpenFileIds = prev.filter(id => id !== fileId);
      if (activeFileId === fileId) {
        setActiveFileId(newOpenFileIds.length > 0 ? newOpenFileIds[newOpenFileIds.length - 1] : '');
      }
      return newOpenFileIds;
    });
  }, [activeFileId]);

  const updateFileDirtyStatus = useCallback((fileId: string, isDirty: boolean) => {
    const updateNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === fileId) {
          return { ...node, isDirty };
        }
        if (node.children) {
          return { ...node, children: updateNodes(node.children) };
        }
        return node;
      });
    };
    setFiles(prev => updateNodes(prev));
  }, []);

  const handleSaveFile = useCallback((fileId: string) => {
    const file = findFile(files, fileId);
    if (file) {
      updateFileDirtyStatus(fileId, false);
      addToTerminal(`Saved file: ${file.name}`);
    }
  }, [files, findFile, updateFileDirtyStatus]);

  const handleDownloadFile = useCallback((fileId: string) => {
    const file = findFile(files, fileId);
    const content = fileContents[fileId];
    if (file && content !== undefined) {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToTerminal(`Downloaded file: ${file.name}`);
    }
  }, [files, findFile, fileContents]);

  // Git Handlers
  const handleGitInitialize = () => {
    setGitState(prev => ({ ...prev, isInitialized: true }));
    addToTerminal('Initialized empty Git repository in /project');
  };

  const handleGitCommit = (message: string) => {
    const changedFilesContent = gitState.stagedFiles.map(id => {
      const file = findFile(files, id);
      return file ? {
        path: file.name,
        content: fileContents[id] || ''
      } : null;
    }).filter(Boolean) as { path: string; content: string }[];

    const newCommit: GitCommit = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      timestamp: Date.now(),
      author: 'Gemini User',
      filesChanged: changedFilesContent
    };
    
    setGitState(prev => ({
      ...prev,
      commits: [newCommit, ...prev.commits],
      stagedFiles: [],
    }));
    addToTerminal(`Committed: ${message} (${newCommit.id})`);
  };

  const handleGitPush = () => {
    addToTerminal('Pushing changes to remote origin/main...');
    setTimeout(() => {
      addToTerminal('Successfully pushed to remote!');
    }, 1500);
  };

  const handleGitPull = () => {
    addToTerminal('Pulling changes from remote origin/main...');
    setTimeout(() => {
      addToTerminal('Already up to date.');
    }, 1000);
  };

  const handleStageFile = (fileId: string) => {
    setGitState(prev => ({
      ...prev,
      stagedFiles: [...prev.stagedFiles, fileId],
    }));
  };

  const handleUnstageFile = (fileId: string) => {
    setGitState(prev => ({
      ...prev,
      stagedFiles: prev.stagedFiles.filter(id => id !== fileId),
    }));
  };

  const handleConnectGitHub = async () => {
    try {
      const response = await fetch('/api/auth/github/url');
      const { url } = await response.json();
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(url, 'github_oauth', `width=${width},height=${height},left=${left},top=${top}`);
    } catch (error) {
      console.error('Failed to get GitHub auth URL:', error);
      addToTerminal('Error: Failed to connect to GitHub.');
    }
  };

  const handlePublishToGitHub = () => {
    addToTerminal('Publishing repository to GitHub...');
    setTimeout(() => {
      addToTerminal('Successfully published to GitHub: https://github.com/gemini-user/my-project');
    }, 2000);
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        setGitState(prev => ({
          ...prev,
          githubUser: event.data.user
        }));
        addToTerminal(`Successfully connected to GitHub as ${event.data.user.login}`);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleRunCode = useCallback((fileId: string) => {
    const file = findFile(files, fileId);
    if (file) {
      if (file.name.endsWith('.html') || file.name.endsWith('.css')) {
        setActiveSidePanel('live');
        addToTerminal(`Opening Web Preview for ${file.name}...`);
      } else if (file.name.endsWith('.py')) {
        setActiveTerminalTab('output');
        setProgramOutput(prev => [...prev, `[Running ${file.name}...]`, `Python simulation: Executing ${file.name}...`]);
        setTimeout(() => {
          setProgramOutput(prev => [...prev, '>>> Hello from Python simulation!', '>>> Process finished with exit code 0']);
        }, 800);
      } else {
        addToTerminal(`Running ${file.name}...`);
        setTimeout(() => {
          addToTerminal('Execution complete. Output: [Success]');
        }, 800);
      }
    }
  }, [files, findFile]);

  const handleDebugCode = useCallback((fileId: string) => {
    const file = findFile(files, fileId);
    if (file) {
      setActiveSidePanel('debug');
      setActiveTerminalTab('debug');
      setIsDebugOpen(true);
      setDebugState(prev => ({
        ...prev,
        status: 'starting',
        currentLine: null,
        callStack: [],
        variables: {}
      }));
      setDebugLogs(prev => [...prev, `Attaching to process ${Math.floor(Math.random() * 10000)}`, `Debugging ${file.name}...`]);
    }
  }, [files, findFile]);

  const handleToggleBreakpoint = useCallback((fileId: string, line: number) => {
    setDebugState(prev => {
      const exists = prev.breakpoints.find(bp => bp.fileId === fileId && bp.line === line);
      if (exists) {
        return {
          ...prev,
          breakpoints: prev.breakpoints.filter(bp => !(bp.fileId === fileId && bp.line === line))
        };
      } else {
        return {
          ...prev,
          breakpoints: [...prev.breakpoints, { fileId, line, isEnabled: true }]
        };
      }
    });
  }, []);

  const handleDebugStep = useCallback(async (type: 'stepOver' | 'stepInto' | 'continue') => {
    setDebugLogs(prev => [...prev, `Debugger action: ${type}`]);
    if (debugState.status === 'inactive') return;
    
    setIsLoading(true);
    try {
      const currentCode = fileContents[activeFileId] || '';
      const prompt = `Current status: ${type}. 
      Current line: ${debugState.currentLine}. 
      Breakpoints: ${JSON.stringify(debugState.breakpoints.filter(b => b.fileId === activeFileId))}. 
      Variables: ${JSON.stringify(debugState.variables)}.
      Provide the NEXT debugging state in JSON: { "status": "paused", "currentLine": number, "callStack": [{name, line, fileId}], "variables": {key: val} }.
      If the execution ends, set status to "inactive".`;

      const response = await runAiTask(AiTask.DebugAnalyze, prompt, currentCode);
      const jsonStart = response.indexOf('{');
      const jsonEnd = response.lastIndexOf('}') + 1;
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const newState = JSON.parse(response.substring(jsonStart, jsonEnd));
        setDebugState(prev => ({
          ...prev,
          ...newState
        }));
      }
    } catch (error) {
      console.error('Debug step failed:', error);
      addToTerminal('Debug error: Failed to compute next step.');
    } finally {
      setIsLoading(false);
    }
  }, [debugState, fileContents, activeFileId]);

  const handleStopDebug = useCallback(() => {
    setDebugState(prev => ({ ...prev, status: 'inactive', currentLine: null }));
    addToTerminal('Debugging session stopped.');
  }, []);

  const handleImportFiles = (fileList: FileList) => {
    Array.from(fileList).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const newId = `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const newNode: FileNode = {
          id: newId,
          name: file.name,
          type: 'file',
          isDirty: false
        };

        // Add to src folder if it exists, otherwise root
        setFiles(prev => {
          const newFiles = [...prev];
          const srcFolder = newFiles.find(f => f.name === 'src' && f.type === 'folder');
          if (srcFolder && srcFolder.children) {
            srcFolder.children.push(newNode);
          } else {
            newFiles.push(newNode);
          }
          return newFiles;
        });

        setFileContents(prev => ({ ...prev, [newId]: content }));
        addToTerminal(`Imported file: ${file.name}`);
      };
      reader.readAsText(file);
    });
  };

  const handleNewFile = () => {
    const fileName = prompt('Enter file name (e.g., index.js):');
    if (!fileName) return;

    const newId = `file-${Date.now()}`;
    const newNode: FileNode = {
      id: newId,
      name: fileName,
      type: 'file',
      isDirty: false
    };

    setFiles(prev => {
      const newFiles = [...prev];
      const srcFolder = newFiles.find(f => f.name === 'src' && f.type === 'folder');
      if (srcFolder && srcFolder.children) {
        srcFolder.children.push(newNode);
      } else {
        newFiles.push(newNode);
      }
      return newFiles;
    });

    setFileContents(prev => ({ ...prev, [newId]: '' }));
    handleFileSelect(newId);
    addToTerminal(`Created file: ${fileName}`);
  };

  const handleNewFolder = () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    const newId = `folder-${Date.now()}`;
    const newNode: FileNode = {
      id: newId,
      name: folderName,
      type: 'folder',
      children: []
    };

    setFiles(prev => [...prev, newNode]);
    addToTerminal(`Created folder: ${folderName}`);
  };

  const handleRenameFile = useCallback((fileId: string, newName: string) => {
    const updateNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === fileId) {
          return { ...node, name: newName };
        }
        if (node.children) {
          return { ...node, children: updateNodes(node.children) };
        }
        return node;
      });
    };
    setFiles(prev => updateNodes(prev));
    addToTerminal(`Renamed to: ${newName}`);
  }, []);

  const handleDeleteFile = useCallback((fileId: string) => {
    const deleteFromNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes.filter(node => node.id !== fileId).map(node => {
        if (node.children) {
          return { ...node, children: deleteFromNodes(node.children) };
        }
        return node;
      });
    };
    
    const file = findFile(files, fileId);
    if (!file) return;

    if (!confirm(`Are you sure you want to delete ${file.name}?`)) return;

    setFiles(prev => deleteFromNodes(prev));
    handleCloseFile(fileId);
    addToTerminal(`Deleted: ${file.name}`);
  }, [files, findFile, handleCloseFile]);

  const handleContentChange = useCallback((fileId: string, content: string) => {
    setFileContents(prev => ({ ...prev, [fileId]: content }));
    updateFileDirtyStatus(fileId, true);
  }, [updateFileDirtyStatus]);

  const handleAiTask = async (task: AiTaskType, prompt: string) => {
    if (!activeFileId && task !== AiTask.GenerateCode) {
      addToTerminal('Error: No active file selected. Please open a file to perform this action.');
      return;
    }
    setIsLoading(true);
    addToTerminal(`Running AI task: ${task}...`);

    const currentCode = fileContents[activeFileId] || '';

    try {
      const result = await runAiTask(task, prompt, currentCode);
      
      if (task === AiTask.GenerateCode || task === AiTask.RefactorCode || task === AiTask.GenerateTests) {
         if (activeFileId) {
           handleContentChange(activeFileId, result);
           addToTerminal(`Success: Code in '${activeFile?.name}' updated.`);
         } else {
           // Create a new file for generated code if none are open
           const newFileId = Date.now().toString();
           const newFileName = "generated-code.js";
           const newFile: FileNode = { id: newFileId, name: newFileName, type: 'file' };
           setFiles(prev => [...prev, newFile]);
           setFileContents(prev => ({ ...prev, [newFileId]: result }));
           setOpenFileIds(prev => [...prev, newFileId]);
           setActiveFileId(newFileId);
           addToTerminal(`Success: Generated code and created '${newFileName}'.`);
         }
      } else {
         addToTerminal(`AI Response:\n${result}`);
      }
    } catch (error) {
      console.error('AI Task Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      addToTerminal(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaletteTaskSelect = (task: AiTaskType) => {
    setActiveAiTask(task);
    
    // For tasks that don't require a specific prompt, run them immediately if a file is active
    if ([AiTask.ExplainCode, AiTask.RefactorCode, AiTask.GenerateTests].includes(task)) {
      if (activeFileId) {
        handleAiTask(task, "");
      } else {
        addToTerminal("Error: Select a file first to run this task.");
      }
    }
    // For tasks that require prompt (Chat, Generate), the state update will focus the panel
  };
  
  const addToTerminal = (message: string) => {
    setTerminalOutput(prev => [...prev, message]);
  };

  const handleClearTerminal = (tab: TerminalTab) => {
    if (tab === 'terminal') setTerminalOutput([]);
    if (tab === 'output') setProgramOutput([]);
    if (tab === 'debug') setDebugLogs([]);
    if (tab === 'problems') setProblems([]);
  };

  const handleTerminalCommand = (cmd: string) => {
    const parts = cmd.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    setTerminalOutput(prev => [...prev, `${cmd}`]);

    switch (command) {
      case 'help':
        addToTerminal('Available commands: ls, mkdir, touch, cd, clear, help, python, echo, git, date');
        break;
      case 'ls':
        const fileList = files.map(f => f.name).join('  ');
        addToTerminal(fileList || '(empty directory)');
        break;
      case 'clear':
        setTerminalOutput([]);
        break;
      case 'date':
        addToTerminal(new Date().toString());
        break;
      case 'echo':
        addToTerminal(args.join(' '));
        break;
      case 'mkdir':
        if (!args[0]) {
          addToTerminal('Usage: mkdir <directory_name>');
        } else {
          const newFolder: FileNode = { id: Math.random().toString(36).substr(2, 9), name: args[0], type: 'folder', children: [] };
          setFiles(prev => [...prev, newFolder]);
          addToTerminal(`Created directory: ${args[0]}`);
        }
        break;
      case 'touch':
        if (!args[0]) {
          addToTerminal('Usage: touch <filename>');
        } else {
          const newFileId = Math.random().toString(36).substr(2, 9);
          const newFile: FileNode = { id: newFileId, name: args[0], type: 'file' };
          setFiles(prev => [...prev, newFile]);
          setFileContents(prev => ({ ...prev, [newFileId]: '' }));
          addToTerminal(`Created file: ${args[0]}`);
        }
        break;
      case 'python':
        if (!args[0]) {
          addToTerminal('Entering Python REPL... (Simulation)');
          setActiveTerminalTab('output');
          setProgramOutput(prev => [...prev, 'Python 3.11.0 (main, Oct 24 2022, 18:26:48) [GCC 11.2.0] on linux', 'Type "help", "copyright", "credits" or "license" for more information.']);
        } else {
          const targetFile = files.find(f => f.name === args[0]);
          if (targetFile && targetFile.type === 'file') {
            setActiveTerminalTab('output');
            setProgramOutput(prev => [...prev, `[Running ${args[0]}...]`]);
            handleRunCode(targetFile.id);
          } else {
            addToTerminal(`python: error: can't open file '${args[0]}': [Errno 2] No such file or directory`);
          }
        }
        break;
      case 'git':
        if (args[0] === 'init') {
          handleGitInitialize();
        } else if (args[0] === 'commit') {
          handleGitCommit(args.slice(1).join(' ') || 'Manual commit');
        } else {
          addToTerminal(`git: ${args[0]} is not a git command. See 'git --help'.`);
        }
        break;
      default:
        addToTerminal(`bash: ${command}: command not found`);
    }
  };


  // Keyboard shortcuts implementation
  useEffect(() => {
    if (!settings.enableShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (settings.keyMap === 'vscode') {
        // VS Code style
        
        // Save: Ctrl+S
        if (cmdOrCtrl && e.key.toLowerCase() === 's') {
          e.preventDefault();
          if (activeFileId) handleSaveFile(activeFileId);
        }

        // Search/Palette: Ctrl+P or Ctrl+Shift+P
        if (cmdOrCtrl && e.key.toLowerCase() === 'p') {
          e.preventDefault();
          setIsCommandPaletteOpen(true);
        }

        // Toggle Sidebar: Ctrl+B
        if (cmdOrCtrl && e.key.toLowerCase() === 'b') {
          e.preventDefault();
          setIsExplorerVisible(prev => !prev);
        }

        // Focus Explorer: Ctrl+Shift+E
        if (cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'e') {
          e.preventDefault();
          setIsExplorerVisible(true);
        }

        // Close Tab: Ctrl+W
        if (cmdOrCtrl && e.key.toLowerCase() === 'w') {
          e.preventDefault();
          if (activeFileId) handleCloseFile(activeFileId);
        }

        // Focus AI: Ctrl+Shift+C (Chat)
        if (cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'c') {
          e.preventDefault();
          setActiveSidePanel('ai');
        }

        // Focus Source Control: Ctrl+Shift+G
        if (cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'g') {
          e.preventDefault();
          setActiveSidePanel('git');
        }

        // Focus Debug: Ctrl+Shift+D
        if (cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'd') {
          e.preventDefault();
          setActiveSidePanel('debug');
        }

        // Focus Settings: Ctrl+,
        if (cmdOrCtrl && e.key === ',') {
          e.preventDefault();
          setActiveSidePanel('settings');
        }

        // Debugging
        if (e.key === 'F5') {
          e.preventDefault();
          if (activeFileId) handleDebugCode(activeFileId);
        }
        if (e.shiftKey && e.key === 'F5') {
          e.preventDefault();
          handleStopDebug();
        }
        if (e.key === 'F10') {
          e.preventDefault();
          handleDebugStep('stepOver');
        }
        if (e.key === 'F11') {
          e.preventDefault();
          handleDebugStep('stepInto');
        }
      } else {
        // Classic mode / Others
        if (cmdOrCtrl && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          setIsCommandPaletteOpen(prev => !prev);
        }
        if (cmdOrCtrl && e.key.toLowerCase() === 's') {
          e.preventDefault();
          if (activeFileId) handleSaveFile(activeFileId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    settings.enableShortcuts, 
    settings.keyMap, 
    activeFileId, 
    handleSaveFile, 
    handleCloseFile, 
    handleDebugCode, 
    handleStopDebug, 
    handleDebugStep
  ]);

  return (
    <div className={`h-screen w-screen overflow-auto transition-colors duration-500 scrollbar-thin scrollbar-thumb-sky-500/20 scrollbar-track-transparent ${
      settings.theme === 'light' ? 'bg-slate-50 text-slate-900' : 
      settings.theme === 'amoled' ? 'bg-black text-slate-100' : 
      'bg-slate-900 text-slate-100'
    }`}>
      <div 
        className="flex flex-col min-w-[1024px] h-full lg:min-w-full"
        style={{ 
          zoom: `${settings.zoom}%`,
          height: '100%' 
        }}
      >
        <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)}
        files={files}
        activeFileId={activeFileId}
        onFileSelect={handleFileSelect}
        onAiTaskSelect={handlePaletteTaskSelect}
        onSave={handleSaveFile}
        onGitInit={handleGitInitialize}
        onGitPush={handleGitPush}
        onGitPull={handleGitPull}
      />

      {/* Header */}
      <header className={`border-b h-10 flex items-center px-4 justify-between text-sm shadow-md z-20 transition-colors duration-300 ${
        settings.theme === 'light' ? 'bg-white border-slate-200' : 
        settings.theme === 'amoled' ? 'bg-black border-white/5' : 
        'bg-slate-950 border-slate-700'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-sky-500 rounded flex items-center justify-center">
            <Icon name="ai" className="w-4 h-4 text-white" />
          </div>
          <span className={`font-bold tracking-tight transition-colors duration-300 ${
            settings.theme === 'light' ? 'text-slate-800' : 'text-slate-100'
          }`}>Gemini <span className="text-sky-400">IDE</span></span>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-slate-500 text-[10px] hidden md:flex items-center space-x-3">
             <div className="flex items-center space-x-1">
               <kbd className={`px-1 rounded font-mono transition-colors duration-300 ${
                 settings.theme === 'light' ? 'bg-slate-100 border-slate-300 text-slate-600' : 'bg-slate-800 border-slate-700 text-slate-300'
               }`}>⌘K</kbd>
               <span>Commands</span>
             </div>
             <div className="flex items-center space-x-1">
               <kbd className={`px-1 rounded font-mono transition-colors duration-300 ${
                 settings.theme === 'light' ? 'bg-slate-100 border-slate-300 text-slate-600' : 'bg-slate-800 border-slate-700 text-slate-300'
               }`}>⌃Space</kbd>
               <span>AI Assist</span>
             </div>
          </div>
          <button 
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
              } else {
                document.exitFullscreen();
              }
            }}
            className="p-1 px-2 hover:bg-slate-800 rounded text-slate-500 hover:text-white transition-all flex items-center"
            title="Toggle Presentation Mode"
          >
            <Icon name="maximise" className="w-3.5 h-3.5 mr-1.5" />
            <span className="text-[10px] hidden sm:inline uppercase font-bold tracking-widest">Presentation</span>
          </button>

          <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border transition-colors duration-300 ${
            settings.theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-700'
          }`}>
             {gitState.githubUser ? (
               <img src={gitState.githubUser.avatar_url} alt="Profile" className="w-full h-full object-cover" />
             ) : (
               <Icon name="ai" className="w-4 h-4 text-slate-600" />
             )}
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow flex overflow-hidden">
        {/* Activity Bar */}
        <div className={`w-12 border-r flex flex-col items-center py-4 space-y-4 shadow-xl z-20 transition-colors duration-300 ${
          settings.theme === 'light' ? 'bg-slate-100 border-slate-200' : 
          settings.theme === 'amoled' ? 'bg-black border-white/5' : 
          'bg-slate-950 border-slate-800'
        }`}>
          <button 
            onClick={() => {
              if (activeSidePanel === 'ai' && isExplorerVisible) {
                setIsExplorerVisible(false); // Maybe VS code toggles whole sidebar
              }
              setActiveSidePanel('ai');
            }}
            className={`p-2.5 rounded-xl transition-all duration-200 ${activeSidePanel === 'ai' ? 'bg-sky-500/10 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.1)]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
            title="AI Assistant"
          >
            <Icon name="ai" className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveSidePanel('git')}
            className={`p-2.5 rounded-xl transition-all duration-200 ${activeSidePanel === 'git' ? 'bg-sky-500/10 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.1)]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
            title="Source Control"
          >
            <Icon name="git" className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveSidePanel('debug')}
            className={`p-2.5 rounded-xl transition-all duration-200 ${activeSidePanel === 'debug' ? 'bg-sky-500/10 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
            title="Debugger"
          >
            <Icon name="debug" className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveSidePanel('live')}
            className={`p-2.5 rounded-xl transition-all duration-200 ${activeSidePanel === 'live' ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
            title="Live Preview"
          >
            <Icon name="live" className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveSidePanel('blueprint')}
            className={`p-2.5 rounded-xl transition-all duration-200 ${activeSidePanel === 'blueprint' ? 'bg-sky-500/10 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.1)]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
            title="Project Blueprint"
          >
            <Icon name="blueprint" className="w-5 h-5" />
          </button>
          <div className="flex-grow" />
          <button 
            onClick={() => setIsExplorerVisible(!isExplorerVisible)}
            className={`p-2.5 rounded-xl transition-all duration-200 ${isExplorerVisible ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'}`}
            title="Toggle File Explorer (Ctrl+B)"
          >
            <Icon name="folder" className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveSidePanel('mcp')}
            className={`p-2.5 rounded-xl transition-all duration-200 ${activeSidePanel === 'mcp' ? 'bg-sky-500/10 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.1)]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
            title="MCP Tools"
          >
            <Icon name="command" className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveSidePanel('extensions')}
            className={`p-2.5 rounded-xl transition-all duration-200 ${activeSidePanel === 'extensions' ? 'bg-sky-500/10 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.1)]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
            title="Extensions"
          >
            <Icon name="cloud" className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveSidePanel('settings')}
            className={`p-2.5 rounded-xl transition-all duration-200 ${activeSidePanel === 'settings' ? 'bg-slate-700 text-slate-100 shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
            title="Settings"
          >
            <Icon name="settings" className="w-5 h-5" />
          </button>
        </div>

        {isExplorerVisible && (
          <FileExplorer 
            files={files} 
            onFileSelect={handleFileSelect} 
            onImportFiles={handleImportFiles}
            onNewFile={handleNewFile}
            onNewFolder={handleNewFolder}
            onRenameFile={handleRenameFile}
            onDeleteFile={handleDeleteFile}
            activeFileId={activeFileId} 
          />
        )}
        
        <div className="flex-grow flex flex-col">
          <Editor
            openFiles={openFiles}
            activeFileId={activeFileId}
            fileContents={fileContents}
            onContentChange={handleContentChange}
            onSave={handleSaveFile}
            onDownload={handleDownloadFile}
            onSelectTab={setActiveFileId}
            onCloseTab={handleCloseFile}
            onRun={handleRunCode}
            onDebug={handleDebugCode}
            debugState={debugState}
            onToggleBreakpoint={handleToggleBreakpoint}
            settings={settings}
            onProblemsChange={handleProblemsChange}
          />
          <Terminal 
            terminalOutput={terminalOutput} 
            problems={problems}
            programOutput={programOutput}
            debugLogs={debugLogs}
            onCommand={handleTerminalCommand}
            onClear={handleClearTerminal}
            files={files}
            activeTab={activeTerminalTab}
            setActiveTab={setActiveTerminalTab}
          />
        </div>
        
        {activeSidePanel === 'ai' ? (
          <AiPanel 
            onRunTask={handleAiTask} 
            isLoading={isLoading} 
            activeTask={activeAiTask}
            onTaskChange={setActiveAiTask}
          />
        ) : activeSidePanel === 'git' ? (
          <GitPanel
            gitState={gitState}
            files={files}
            onInitialize={handleGitInitialize}
            onCommit={handleGitCommit}
            onPush={handleGitPush}
            onPull={handleGitPull}
            onStageFile={handleStageFile}
            onUnstageFile={handleUnstageFile}
            onConnectGitHub={handleConnectGitHub}
            onPublishToGitHub={handlePublishToGitHub}
          />
        ) : activeSidePanel === 'debug' ? (
          <DebugPanel 
            activeFileId={activeFileId} 
            fileName={findFile(files, activeFileId)?.name || 'No File'}
            code={fileContents[activeFileId] || ''}
            onClose={() => setActiveSidePanel('ai')}
            debugState={debugState}
            onStepOver={() => handleDebugStep('stepOver')}
            onStepInto={() => handleDebugStep('stepInto')}
            onContinue={() => handleDebugStep('continue')}
            onStop={handleStopDebug}
          />
        ) : activeSidePanel === 'mcp' ? (
          <McpPanel onClose={() => setActiveSidePanel('ai')} />
        ) : activeSidePanel === 'extensions' ? (
          <ExtensionsPanel onClose={() => setActiveSidePanel('ai')} />
        ) : activeSidePanel === 'settings' ? (
          <SettingsPanel 
            settings={settings} 
            onSettingsChange={setSettings} 
            onClose={() => setActiveSidePanel('ai')} 
          />
        ) : activeSidePanel === 'blueprint' ? (
          <BlueprintPanel 
            files={files} 
            onClose={() => setActiveSidePanel('ai')} 
          />
        ) : (
          <LivePreview
            activeFileId={activeFileId}
            fileName={findFile(files, activeFileId)?.name || 'No File'}
            content={fileContents[activeFileId] || ''}
            onClose={() => setActiveSidePanel('ai')}
          />
        )}
      </main>
    </div>
  </div>
  );
};

export default App;
