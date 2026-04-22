
import React, { useRef, useEffect, useState } from 'react';
import { Icon } from './Icon';
import { TerminalTab, FileNode } from '../types';

interface TerminalProps {
  terminalOutput: string[];
  problems: { line: number; message: string; file: string }[];
  programOutput: string[];
  debugLogs: string[];
  onCommand: (command: string) => void;
  onClear: (tab: TerminalTab) => void;
  files: FileNode[];
  activeTab: TerminalTab;
  setActiveTab: (tab: TerminalTab) => void;
}

export const Terminal: React.FC<TerminalProps> = ({ 
  terminalOutput, 
  problems, 
  programOutput, 
  debugLogs,
  onCommand,
  onClear,
  files,
  activeTab,
  setActiveTab
}) => {
  const [inputValue, setInputValue] = useState('');
  const endOfOutputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endOfOutputRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalOutput, problems, programOutput, debugLogs, activeTab]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      onCommand(inputValue.trim());
      setInputValue('');
    }
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="h-64 flex flex-col transition-colors duration-300 bg-slate-900 border-t border-white/5 font-sans" onClick={focusInput}>
      {/* Tabs Header */}
      <div className="flex items-center px-4 bg-slate-950/40 border-b border-white/5 h-9 shrink-0">
        <div className="flex space-x-6 h-full items-center">
          {[
            { id: 'problems', label: 'PROBLEMS', count: problems.length },
            { id: 'output', label: 'OUTPUT' },
            { id: 'debug', label: 'DEBUG CONSOLE' },
            { id: 'terminal', label: 'TERMINAL' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab(tab.id as TerminalTab);
              }}
              className={`h-full text-[11px] font-bold tracking-wider relative flex items-center transition-all ${
                activeTab === tab.id ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
              {'count' in tab && tab.count && tab.count > 0 ? (
                <span className="ml-1.5 px-1 bg-slate-800 rounded-full text-[9px] text-slate-400 min-w-[14px] text-center">
                  {tab.count}
                </span>
              ) : null}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.4)]" />
              )}
            </button>
          ))}
        </div>
        <div className="flex-grow" />
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onClear(activeTab);
          }}
          className="p-1 hover:bg-slate-800 rounded text-slate-500 transition-colors"
          title="Clear logs"
        >
          <Icon name="close" className="w-3.5 h-3.5 rotate-45" />
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'terminal' && (
          <div className="text-xs font-mono">
            <div className="whitespace-pre-wrap text-emerald-400 mb-2">gemini-ide login: user... system ready.</div>
            {terminalOutput.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap mb-1">{line}</div>
            ))}
            <div className="flex items-center mt-1">
              <span className="text-emerald-500 mr-2 font-bold whitespace-nowrap">user@gemini-ide:~$</span>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-transparent border-none outline-none text-slate-200 w-full p-0 font-mono"
                spellCheck={false}
                autoFocus
              />
            </div>
          </div>
        )}

        {activeTab === 'problems' && (
          <div className="space-y-2 text-xs">
            {problems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 mt-4">
                <Icon name="ai" className="w-8 h-8 mb-2 opacity-10" />
                <p>No problems have been detected in the workspace.</p>
              </div>
            ) : (
              problems.map((prob, i) => (
                <div key={i} className="flex items-start space-x-3 p-2 hover:bg-slate-800/50 rounded-lg group transition-colors">
                  <div className="w-4 h-4 mt-0.5 shrink-0 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full shadow-[0_0_5px_rgba(244,63,94,0.5)]" />
                  </div>
                  <div className="flex-grow space-y-1">
                    <div className="text-slate-200 leading-relaxed font-medium">{prob.message}</div>
                    <div className="text-[10px] text-slate-500 flex items-center font-mono">
                      <span className="text-sky-400/70 hover:underline cursor-pointer">{prob.file}</span>
                      <span className="mx-1">:</span>
                      <span>line {prob.line}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'output' && (
          <div className="text-xs font-mono">
            <div className="text-slate-500 italic mb-3 border-b border-white/5 pb-1">Python REPL Environment (3.11)</div>
            {programOutput.length === 0 ? (
              <div className="text-slate-600 italic">No output yet. Run your code to see results here.</div>
            ) : (
              programOutput.map((line, i) => (
                <div key={i} className={`whitespace-pre-wrap ${line.startsWith('Error:') ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>{line}</div>
              ))
            )}
          </div>
        )}

        {activeTab === 'debug' && (
          <div className="text-xs font-mono space-y-1">
            <div className="text-rose-400/70 text-[10px] uppercase font-bold tracking-widest mb-2 flex items-center">
              <Icon name="debug" className="w-3 h-3 mr-1.5" />
              Debug Session Logs
            </div>
            {debugLogs.length === 0 ? (
              <div className="text-slate-600 italic">Start a debug session to see internal logs and stack traces.</div>
            ) : (
              debugLogs.map((log, i) => (
                <div key={i} className="flex items-start space-x-2 py-0.5 border-l-2 border-slate-800 pl-3 ml-1">
                  <span className="text-[10px] text-slate-600 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                  <span className="text-sky-300/80">{log}</span>
                </div>
              ))
            )}
          </div>
        )}
        <div ref={endOfOutputRef} />
      </div>
    </div>
  );
};
