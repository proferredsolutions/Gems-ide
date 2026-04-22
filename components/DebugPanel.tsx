
import React, { useState } from 'react';
import { Icon } from './Icon';
import { runAiTask } from '../services/geminiService';
import { AiTask, DebugState } from '../types';

interface DebugPanelProps {
  activeFileId: string;
  fileName: string;
  code: string;
  onClose: () => void;
  debugState: DebugState;
  onStepOver: () => void;
  onStepInto: () => void;
  onContinue: () => void;
  onStop: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ 
  activeFileId, 
  fileName, 
  code, 
  onClose,
  debugState,
  onStepOver,
  onStepInto,
  onContinue,
  onStop
}) => {
  const [isAnalysing, setIsAnalysing] = useState(false);

  const isDebuggerActive = debugState.status !== 'inactive';

  return (
    <div className="w-80 bg-slate-900 border-l border-white/5 flex flex-col overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center">
          <Icon name="bug" className="w-4 h-4 mr-2 text-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Interactive Debugger</h2>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-md text-slate-500 hover:text-white transition-colors">
          <Icon name="close" className="w-4 h-4" />
        </button>
      </div>

      {/* Debug Controls Toolbar */}
      {isDebuggerActive && (
        <div className="p-3 bg-slate-800/40 border-b border-white/5 flex justify-center space-x-2">
          <button 
            onClick={onContinue}
            className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-all shadow-lg active:scale-90"
            title="Continue (F5)"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </button>
          <button 
            onClick={onStepOver}
            className="p-2 bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white rounded-lg transition-all shadow-lg active:scale-90"
            title="Step Over (F10)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>
          </button>
          <button 
            onClick={onStepInto}
            className="p-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white rounded-lg transition-all shadow-lg active:scale-90"
            title="Step Into (F11)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M19 13l-7 7-7-7m7-15v15"/></svg>
          </button>
          <div className="w-px h-6 bg-white/5 mx-1 self-center" />
          <button 
            onClick={onStop}
            className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all shadow-lg active:scale-90"
            title="Stop Debugging"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg>
          </button>
        </div>
      )}

      <div className="flex-grow overflow-y-auto p-4 space-y-6 custom-scrollbar bg-slate-900">
        {/* Session Status */}
        <div>
          <div className="text-[10px] font-bold uppercase text-slate-600 tracking-widest mb-3">Debug Session</div>
          <div className={`rounded-xl p-4 border transition-all ${isDebuggerActive ? 'bg-sky-500/5 border-sky-500/20 shadow-[0_0_20px_rgba(56,189,248,0.05)]' : 'bg-slate-950/50 border-white/5 opacity-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-slate-100 font-bold flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 shadow-[0_0_8px_currentColor] ${isDebuggerActive ? 'bg-emerald-500 text-emerald-500 animate-pulse' : 'bg-slate-700 text-slate-700'}`} />
                {isDebuggerActive ? (debugState.status === 'paused' ? 'Paused' : 'Running') : 'Inactive'}
              </div>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-tighter">Python 3.10 Venv</span>
            </div>
            <div className="flex items-center text-[11px] text-slate-400 font-mono">
               <Icon name="file" className="w-3 h-3 mr-1.5 opacity-50" />
               <span className="truncate">{fileName}</span>
               {debugState.currentLine && (
                 <span className="ml-2 text-sky-400 font-bold">: line {debugState.currentLine}</span>
               )}
            </div>
          </div>
        </div>

        {/* Variables Inspector */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="text-[10px] font-bold uppercase text-slate-600 tracking-widest">Variables</div>
            <span className="text-[9px] font-mono text-slate-700 bg-slate-950 px-1.5 rounded uppercase">Locals</span>
          </div>
          <div className="bg-slate-950/50 rounded-xl border border-white/5 divide-y divide-white/5 overflow-hidden">
            {Object.keys(debugState.variables).length > 0 ? Object.entries(debugState.variables).map(([key, val]) => (
              <div key={key} className="flex flex-col p-3 hover:bg-white/5 transition-colors group">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[12px] font-mono text-sky-400 font-bold">{key}</span>
                  <span className="text-[9px] font-mono text-slate-600 uppercase tracking-tighter">{typeof val}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-300 break-all bg-slate-900/50 p-1.5 rounded border border-white/5 group-hover:border-sky-500/20 transition-all">
                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                </div>
              </div>
            )) : (
              <div className="p-6 text-center text-xs text-slate-600 italic">No variables in current scope</div>
            )}
          </div>
        </div>

        {/* Call Stack */}
        <div>
          <div className="text-[10px] font-bold uppercase text-slate-600 tracking-widest mb-3 px-1">Call Stack</div>
          <div className="space-y-2">
            {debugState.callStack.length > 0 ? debugState.callStack.map((frame, idx) => (
              <div key={idx} className={`relative pl-6 py-2 pr-3 rounded-lg border transition-all ${idx === 0 ? 'bg-sky-500/10 border-sky-500/30 shadow-lg' : 'bg-slate-950/30 border-white/5 opacity-60'}`}>
                <div className={`absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,1)]' : 'bg-slate-700'}`} />
                <div className="flex justify-between items-center text-[12px]">
                  <span className={`font-mono ${idx === 0 ? 'text-slate-100 font-bold' : 'text-slate-500'}`}>{frame.name}</span>
                  <span className="text-[10px] text-slate-600 font-mono">L{frame.line}</span>
                </div>
                <div className="text-[9px] text-slate-700 truncate font-mono mt-0.5">{frame.fileId}</div>
              </div>
            )) : (
              <div className="p-4 text-center text-xs text-slate-700 border border-dashed border-white/5 rounded-xl">Main Thread Execution</div>
            )}
          </div>
        </div>

        {/* Breakpoints List */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="text-[10px] font-bold uppercase text-slate-600 tracking-widest">Breakpoints</div>
            <span className="text-[10px] font-mono text-slate-700">{debugState.breakpoints.length} ACTIVE</span>
          </div>
          <div className="space-y-1">
            {debugState.breakpoints.map((bp, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-950/50 border border-white/5 rounded-lg px-3 py-2 text-[11px] group hover:border-rose-500/30 transition-all">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-rose-500 rounded-full mr-3 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                  <span className="text-slate-400 font-mono">{fileName}:<span className="text-slate-200">{bp.line}</span></span>
                </div>
                <div className="w-2 h-2 bg-emerald-500/50 rounded-full" title="Enabled" />
              </div>
            ))}
            {debugState.breakpoints.length === 0 && (
              <div className="text-[10px] text-slate-700 italic px-1">Click the line numbers in the editor to set breakpoints.</div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-950/60 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-sky-500 rounded-full"></div>
          <span className="text-[9px] font-bold text-slate-500 tracking-tighter">VDX 1.4 ENGINE</span>
        </div>
        <span className="text-[9px] font-mono text-slate-700">CPU: 12% • MEM: 64MB</span>
      </div>
    </div>
  );
};
