
import React, { useState, useRef, useEffect } from 'react';
import { FileNode } from '../types';
import { Icon } from './Icon';

interface FileExplorerProps {
  files: FileNode[];
  onFileSelect: (fileId: string) => void;
  onImportFiles: (files: FileList) => void;
  onNewFile: () => void;
  onNewFolder: () => void;
  onRenameFile: (fileId: string, newName: string) => void;
  onDeleteFile: (fileId: string) => void;
  activeFileId: string | null;
}

interface FileTreeItemProps {
  node: FileNode;
  onFileSelect: (fileId: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
  onDeleteFile: (fileId: string) => void;
  level: number;
  activeFileId: string | null;
}

const getFileIcon = (fileName: string): any => {
  if (/\.(jsx|tsx)$/.test(fileName)) return 'react';
  if (/\.css$/.test(fileName)) return 'css';
  if (/\.json$/.test(fileName)) return 'json';
  if (/\.(js|ts)$/.test(fileName)) return 'js';
  if (/\.md$/.test(fileName)) return 'markdown';
  if (/\.py$/.test(fileName)) return 'python';
  if (/\.html$/.test(fileName)) return 'html';
  return 'file';
};

const FileTreeItem: React.FC<FileTreeItemProps> = ({ node, onFileSelect, onRenameFile, onDeleteFile, level, activeFileId }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(node.name);
  const isFolder = node.type === 'folder';
  const isActive = node.id === activeFileId;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolder) {
      setIsOpen(!isOpen);
    } else {
      onFileSelect(node.id);
    }
  };

  const handleRenameSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newName && newName !== node.name) {
      onRenameFile(node.id, newName);
    }
    setIsRenaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRenameSubmit();
    if (e.key === 'Escape') {
      setNewName(node.name);
      setIsRenaming(false);
    }
  };
  
  const itemIcon = isFolder ? 'folder' : getFileIcon(node.name);
  const iconColor = isFolder ? 'text-sky-400' : 'text-slate-400';

  return (
    <div className="select-none">
      <div
        onClick={handleToggle}
        className={`group flex items-center px-2 py-1 rounded cursor-pointer transition-colors relative mb-[1px] ${
          isActive ? 'bg-slate-700/50 text-white' : 'text-slate-400 hover:bg-slate-700/30 hover:text-slate-200'
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        <div className="flex items-center flex-grow min-w-0">
          {isFolder && (
            <svg 
              className={`w-3.5 h-3.5 mr-1 text-slate-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          )}
          <Icon name={itemIcon} className={`w-4 h-4 mr-2 shrink-0 ${iconColor}`} />
          
          {isRenaming ? (
            <input
              ref={inputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={() => handleRenameSubmit()}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 text-white text-xs px-1 py-0.5 rounded border border-sky-500 outline-none w-full"
            />
          ) : (
            <span className="text-[13px] truncate flex-grow py-0.5">{node.name}</span>
          )}
        </div>

        {!isRenaming && (
          <div className="hidden group-hover:flex items-center space-x-1 ml-2 shrink-0">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsRenaming(true); }}
              className="p-1 hover:bg-slate-600 rounded text-slate-500 hover:text-sky-400 transition-colors"
              title="Rename"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDeleteFile(node.id); }}
              className="p-1 hover:bg-slate-600 rounded text-slate-500 hover:text-rose-400 transition-colors"
              title="Delete"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}

        {node.isDirty && !isRenaming && (
          <div className="w-1.5 h-1.5 bg-sky-400 rounded-full ml-2 flex-shrink-0" title="Unsaved changes" />
        )}
      </div>
      {isFolder && isOpen && node.children && (
        <div className="border-l border-slate-700/50 ml-[13px]">
          {node.children.map(child => (
            <FileTreeItem 
              key={child.id} 
              node={child} 
              onFileSelect={onFileSelect} 
              onRenameFile={onRenameFile}
              onDeleteFile={onDeleteFile}
              level={level + 1} 
              activeFileId={activeFileId} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({ 
  files, 
  onFileSelect, 
  onImportFiles, 
  onNewFile, 
  onNewFolder, 
  onRenameFile,
  onDeleteFile,
  activeFileId 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImportFiles(e.target.files);
    }
  };

  return (
    <div className="w-64 border-r flex flex-col h-full shadow-xl z-10 transition-colors duration-300 bg-slate-900/50 border-white/5">
      <div className="p-3 flex items-center justify-between group bg-slate-950/20">
        <h2 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Explorer</h2>
        <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={onNewFile}
            className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-sky-400 transition-colors"
            title="New File"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          <button 
            onClick={onNewFolder}
            className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-sky-400 transition-colors"
            title="New Folder"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </button>
          <button 
            onClick={handleImportClick}
            className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-sky-400 transition-colors"
            title="Import Files"
          >
            <Icon name="upload" className="w-3.5 h-3.5" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            multiple 
            className="hidden" 
          />
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto px-2 pb-4 custom-scrollbar">
        {files.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-slate-600">
            <Icon name="folder" className="w-8 h-8 mb-2 opacity-20" />
            <span className="text-[11px]">No files in project</span>
          </div>
        ) : (
          files.map(node => (
            <FileTreeItem 
              key={node.id} 
              node={node} 
              onFileSelect={onFileSelect} 
              onRenameFile={onRenameFile}
              onDeleteFile={onDeleteFile}
              level={0} 
              activeFileId={activeFileId} 
            />
          ))
        )}
      </div>

      <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
         <span>{files.length} Root Items</span>
         <span className="font-mono opacity-50">v1.2.0</span>
      </div>
    </div>
  );
};
