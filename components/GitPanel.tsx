
import React, { useState } from 'react';
import { GitState, GitCommit, FileNode } from '../types';
import { Icon } from './Icon';

interface GitPanelProps {
  gitState: GitState;
  files: FileNode[];
  onInitialize: () => void;
  onCommit: (message: string) => void;
  onPush: () => void;
  onPull: () => void;
  onStageFile: (fileId: string) => void;
  onUnstageFile: (fileId: string) => void;
  onConnectGitHub: () => void;
  onPublishToGitHub: () => void;
}

export const GitPanel: React.FC<GitPanelProps> = ({
  gitState,
  files,
  onInitialize,
  onCommit,
  onPush,
  onPull,
  onStageFile,
  onUnstageFile,
  onConnectGitHub,
  onPublishToGitHub,
}) => {
  const [commitMessage, setCommitMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'changes' | 'history'>('changes');
  const [expandedCommitId, setExpandedCommitId] = useState<string | null>(null);

  const findFile = (nodes: FileNode[], id: string): FileNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findFile(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const stagedFiles = gitState.stagedFiles.map(id => findFile(files, id)).filter(Boolean) as FileNode[];
  
  const getChangedFiles = (nodes: FileNode[]): FileNode[] => {
    let changed: FileNode[] = [];
    nodes.forEach(node => {
      if (node.type === 'file' && node.isDirty && !gitState.stagedFiles.includes(node.id)) {
        changed.push(node);
      }
      if (node.children) {
        changed = [...changed, ...getChangedFiles(node.children)];
      }
    });
    return changed;
  };

  const changedFiles = getChangedFiles(files);

  if (!gitState.isInitialized) {
    return (
      <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col items-center justify-center p-8 text-center h-full">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-2xl ring-4 ring-slate-800/50">
          <Icon name="git" className="w-10 h-10 text-slate-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-3 tracking-tight">Git Uninitialized</h2>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">Initialize a repository to track versions and collaborate with teams.</p>
        <button
          onClick={onInitialize}
          className="w-full bg-sky-600 text-white font-bold py-2.5 px-6 rounded-lg text-sm hover:bg-sky-500 transition-all shadow-[0_0_20px_rgba(2,132,199,0.3)] hover:scale-[1.02] active:scale-95"
        >
          Initialize Repository
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden h-full shadow-2xl z-10 font-sans">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center space-x-2">
          <Icon name="git" className="w-4 h-4 text-sky-400" />
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Source Control</h2>
        </div>
        <div className="flex bg-slate-900 rounded-md p-1 border border-white/5">
          <button onClick={onPull} title="Pull" className="p-1.5 hover:bg-slate-800 rounded-md text-slate-500 hover:text-sky-400 transition-colors">
            <Icon name="cloud" className="w-3.5 h-3.5 rotate-180" />
          </button>
          <button onClick={onPush} title="Push" className="p-1.5 hover:bg-slate-800 rounded-md text-slate-500 hover:text-emerald-400 transition-colors">
            <Icon name="cloud" className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-950/20 border-b border-white/5">
        <button 
          onClick={() => setActiveTab('changes')}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all relative ${
            activeTab === 'changes' ? 'text-sky-400 bg-slate-800/10' : 'text-slate-600 hover:text-slate-400'
          }`}
        >
          Changes
          {activeTab === 'changes' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 shadow-[0_0_10px_rgba(56,189,248,0.5)]" />}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all relative ${
            activeTab === 'history' ? 'text-sky-400 bg-slate-800/10' : 'text-slate-600 hover:text-slate-400'
          }`}
        >
          History
          {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 shadow-[0_0_10px_rgba(56,189,248,0.5)]" />}
        </button>
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar bg-slate-900">
        {activeTab === 'changes' ? (
          <div className="p-4 space-y-6 text-slate-300">
            {/* GitHub Info */}
            <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5">
              {gitState.githubUser ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0">
                    <img src={gitState.githubUser.avatar_url} className="w-7 h-7 rounded-full ring-2 ring-slate-800" alt="" referrerPolicy="no-referrer" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-100 truncate">{gitState.githubUser.login}</div>
                      <div className="text-[9px] text-slate-500 truncate">Connected to GitHub</div>
                    </div>
                  </div>
                  <button onClick={onPublishToGitHub} className="bg-sky-500/10 text-sky-400 text-[10px] font-bold px-3 py-1 rounded-md border border-sky-500/20 hover:bg-sky-500 hover:text-white transition-all">
                    Sync
                  </button>
                </div>
              ) : (
                <button onClick={onConnectGitHub} className="w-full py-2.5 bg-slate-800/50 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all border border-white/5">
                  Link GitHub Account
                </button>
              )}
            </div>

            {/* Commit Message */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold text-slate-500 flex items-center">
                  <Icon name="branch" className="w-3 h-3 mr-1.5 text-sky-500" />
                  {gitState.currentBranch}
                </span>
              </div>
              <textarea
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="What did you build today?"
                className="w-full bg-slate-950/50 border border-white/5 rounded-xl p-3 text-xs text-slate-200 resize-none h-24 focus:border-sky-500/50 outline-none transition-all placeholder:text-slate-700 custom-scrollbar shadow-inner"
              />
              <button
                onClick={() => {
                  if (commitMessage.trim()) {
                    onCommit(commitMessage);
                    setCommitMessage('');
                  }
                }}
                disabled={!commitMessage.trim() || gitState.stagedFiles.length === 0}
                className="w-full bg-sky-600 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-white/5 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
              >
                Commit Changes
              </button>
            </div>

            {/* List sections */}
            <div className="space-y-4">
              <section>
                <header className="flex items-center justify-between px-1 mb-2">
                  <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest text-slate-500">Staged</h3>
                  <span className="text-[10px] font-mono text-sky-400 bg-sky-400/5 px-2 py-0.5 rounded-full">{stagedFiles.length}</span>
                </header>
                <div className="space-y-1">
                  {stagedFiles.length === 0 ? (
                    <div className="py-4 text-center text-[10px] text-slate-700 border border-dashed border-white/5 rounded-xl italic">No files staged</div>
                  ) : (
                    stagedFiles.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 group transition-all">
                        <div className="flex items-center min-w-0">
                          <Icon name="file" className="w-3.5 h-3.5 mr-3 text-emerald-500" />
                          <span className="text-xs text-slate-300 truncate">{file.name}</span>
                        </div>
                        <button onClick={() => onUnstageFile(file.id)} className="p-1 opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-all">
                          <Icon name="close" className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section>
                <header className="flex items-center justify-between px-1 mb-2">
                  <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest text-slate-500">Modified</h3>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-400/5 px-2 py-0.5 rounded-full">{changedFiles.length}</span>
                </header>
                <div className="space-y-1">
                  {changedFiles.length === 0 ? (
                    <div className="py-4 text-center text-[10px] text-slate-700 border border-dashed border-white/5 rounded-xl italic">Working tree clean</div>
                  ) : (
                    changedFiles.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 group transition-all">
                        <div className="flex items-center min-w-0">
                          <Icon name="file" className="w-3.5 h-3.5 mr-3 text-amber-500" />
                          <span className="text-xs text-slate-300 truncate">{file.name}</span>
                        </div>
                        <button onClick={() => onStageFile(file.id)} className="px-2 py-0.5 opacity-0 group-hover:opacity-100 hover:text-sky-400 transition-all text-[9px] font-black uppercase text-slate-500">
                          Stage
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        ) : (
          /* History tab Content */
          <div className="p-4 space-y-6">
            <header className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Logs</h3>
            </header>

            {gitState.commits.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center">
                <Icon name="git" className="w-8 h-8 text-slate-800 mb-4 opacity-50" />
                <p className="text-[11px] text-slate-600 italic leading-relaxed px-10">Commit history will appear here once you've saved your progress.</p>
              </div>
            ) : (
              <div className="grid gap-3 relative before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-px before:bg-white/5">
                {gitState.commits.map(commit => (
                  <div key={commit.id} className="relative pl-8 group">
                    <div className="absolute left-0 top-1.5 w-6 h-6 bg-slate-900 border border-white/5 rounded-full flex items-center justify-center z-10 group-hover:border-sky-500 transition-colors">
                      <Icon name="ai" className="w-2.5 h-2.5 text-slate-700 group-hover:text-sky-500" />
                    </div>
                    
                    <div className={`p-4 rounded-xl border transition-all duration-300 ${
                      expandedCommitId === commit.id 
                        ? 'bg-slate-950 border-sky-500/30 shadow-2xl' 
                        : 'bg-slate-950/40 border-white/5 hover:bg-slate-850 hover:border-white/10'
                    }`}>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="min-w-0">
                          <div className="text-[13px] font-bold text-slate-200 line-clamp-2 leading-tight mb-1.5">{commit.message}</div>
                          <div className="flex items-center space-x-2 text-[10px]">
                             <span className="text-slate-500 font-bold truncate">{commit.author}</span>
                             <span className="text-slate-800">•</span>
                             <span className="text-slate-600 font-medium">{new Date(commit.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="text-[9px] font-mono text-sky-400/60 bg-sky-400/5 px-2 py-0.5 rounded border border-white/5 font-bold uppercase shrink-0">{commit.id}</div>
                      </div>

                      {commit.filesChanged && commit.filesChanged.length > 0 && (
                        <div className="pt-3 border-t border-white/5 mt-3">
                          <button 
                            onClick={() => setExpandedCommitId(expandedCommitId === commit.id ? null : commit.id)}
                            className={`w-full flex items-center justify-between text-[9px] font-black uppercase tracking-widest transition-colors ${
                              expandedCommitId === commit.id ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            <span>Inspect Diffs ({commit.filesChanged.length})</span>
                            <Icon name="live" className={`w-3 h-3 transition-transform ${expandedCommitId === commit.id ? 'rotate-90 text-sky-400' : ''}`} />
                          </button>

                          {expandedCommitId === commit.id && (
                            <div className="mt-4 space-y-4 animate-fade-in">
                              {commit.filesChanged.map((fc, i) => (
                                <div key={i} className="bg-slate-950 rounded-xl border border-white/5 overflow-hidden">
                                  <div className="px-3 py-1 bg-white/5 flex items-center justify-between">
                                    <span className="text-[9px] font-mono text-slate-400 truncate max-w-[150px]">{fc.path}</span>
                                    <span className="text-[8px] font-black text-emerald-400 bg-emerald-400/5 px-1.5 rounded uppercase tracking-tighter">Modified</span>
                                  </div>
                                  <div className="p-3 font-mono text-[9px] leading-relaxed text-slate-500 max-h-40 overflow-y-auto whitespace-pre custom-scrollbar italic opacity-80">
                                    {fc.content}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
