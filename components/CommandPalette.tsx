
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FileNode, AiTask, AiTaskType } from '../types';
import { Icon } from './Icon';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileNode[];
  activeFileId: string;
  onFileSelect: (fileId: string) => void;
  onAiTaskSelect: (task: AiTaskType) => void;
  onSave: (fileId: string) => void;
  onGitInit: () => void;
  onGitPush: () => void;
  onGitPull: () => void;
}

interface CommandItem {
  id: string;
  type: 'file' | 'task' | 'command';
  label: string;
  subLabel?: string;
  value: string | AiTaskType;
  icon?: string;
}

const getFileIconName = (fileName: string): 'react' | 'css' | 'json' | 'js' | 'markdown' | 'file' => {
  if (/\.(jsx|tsx)$/.test(fileName)) return 'react';
  if (/\.css$/.test(fileName)) return 'css';
  if (/\.json$/.test(fileName)) return 'json';
  if (/\.(js|ts)$/.test(fileName)) return 'js';
  if (/\.md$/.test(fileName)) return 'markdown';
  return 'file';
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  isOpen, 
  onClose, 
  files, 
  activeFileId,
  onFileSelect, 
  onAiTaskSelect,
  onSave,
  onGitInit,
  onGitPush,
  onGitPull
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Small delay to ensure render
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Flatten files for search
  const flattenedFiles = useMemo(() => {
    const result: CommandItem[] = [];
    
    const traverse = (nodes: FileNode[], path: string) => {
      nodes.forEach(node => {
        const currentPath = path ? `${path}/${node.name}` : node.name;
        if (node.type === 'file') {
          result.push({
            id: `file-${node.id}`,
            type: 'file',
            label: node.name,
            subLabel: path,
            value: node.id,
            icon: getFileIconName(node.name)
          });
        }
        if (node.children) {
          traverse(node.children, currentPath);
        }
      });
    };
    
    traverse(files, '');
    return result;
  }, [files]);

  const aiTasks: CommandItem[] = [
    { id: 'cmd-save', label: 'File: Save', type: 'command', value: 'save', icon: 'save' },
    { id: 'git-init', label: 'Git: Initialize', type: 'command', value: 'git-init', icon: 'git' },
    { id: 'git-push', label: 'Git: Push', type: 'command', value: 'git-push', icon: 'cloud' },
    { id: 'git-pull', label: 'Git: Pull', type: 'command', value: 'git-pull', icon: 'cloud' },
    { id: 'task-generate', label: 'AI: Generate Code', type: 'task', value: AiTask.GenerateCode },
    { id: 'task-explain', label: 'AI: Explain Code', type: 'task', value: AiTask.ExplainCode },
    { id: 'task-refactor', label: 'AI: Refactor Code', type: 'task', value: AiTask.RefactorCode },
    { id: 'task-tests', label: 'AI: Generate Tests', type: 'task', value: AiTask.GenerateTests },
    { id: 'task-chat', label: 'AI: Chat', type: 'task', value: AiTask.Chat },
  ];

  const filteredItems = useMemo(() => {
    const q = query.toLowerCase();
    const tasks = aiTasks.filter(item => item.label.toLowerCase().includes(q));
    const files = flattenedFiles.filter(item => 
      item.label.toLowerCase().includes(q) || 
      (item.subLabel && item.subLabel.toLowerCase().includes(q))
    );
    return [...tasks, ...files];
  }, [query, flattenedFiles]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      scrollIntoView(selectedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      scrollIntoView(selectedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems.length > 0) {
        handleSelect(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const scrollIntoView = (index: number) => {
    // Simple scrolling logic
    if (listRef.current) {
        // Implementation could be improved for perfect scrolling behavior
    }
  };

  const handleSelect = (item: CommandItem) => {
    if (item.type === 'file') {
      onFileSelect(item.value as string);
    } else if (item.type === 'command') {
      if (item.value === 'save' && activeFileId) {
        onSave(activeFileId);
      } else if (item.value === 'git-init') {
        onGitInit();
      } else if (item.value === 'git-push') {
        onGitPush();
      } else if (item.value === 'git-pull') {
        onGitPull();
      }
    } else {
      onAiTaskSelect(item.value as AiTaskType);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div 
        className="bg-slate-800 w-full max-w-xl rounded-xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center p-4 border-b border-slate-700">
          <Icon name="search" className="w-5 h-5 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-grow bg-transparent text-slate-200 outline-none text-lg placeholder-slate-500"
            placeholder="Type a command or search files..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <div className="text-xs text-slate-500 px-2 py-1 rounded bg-slate-700 border border-slate-600">
            Esc
          </div>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-2" ref={listRef}>
          {filteredItems.length === 0 ? (
            <div className="p-4 text-center text-slate-500">No results found.</div>
          ) : (
            filteredItems.map((item, index) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                className={`flex items-center px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                  index === selectedIndex ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <div className={`mr-3 ${index === selectedIndex ? 'text-white' : 'text-slate-400'}`}>
                  {item.type === 'task' || item.type === 'command' ? (
                     <Icon name={item.icon as any || 'command'} className="w-5 h-5" />
                  ) : (
                     <Icon name={item.icon as any || 'file'} className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="font-medium truncate">{item.label}</div>
                  {item.subLabel && (
                    <div className={`text-xs truncate ${index === selectedIndex ? 'text-sky-200' : 'text-slate-500'}`}>
                      {item.subLabel}
                    </div>
                  )}
                </div>
                {item.type === 'task' && index === selectedIndex && (
                  <span className="text-xs text-sky-200 ml-2">Run</span>
                )}
                {item.type === 'file' && index === selectedIndex && (
                  <span className="text-xs text-sky-200 ml-2">Open</span>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="bg-slate-800 border-t border-slate-700 px-4 py-2 text-xs text-slate-500 flex justify-between items-center">
            <span>
              <span className="font-bold text-slate-400">↑↓</span> to navigate
              <span className="mx-2">·</span>
              <span className="font-bold text-slate-400">Enter</span> to select
            </span>
            <span className="opacity-50">Gemini IDE</span>
        </div>
      </div>
    </div>
  );
};
