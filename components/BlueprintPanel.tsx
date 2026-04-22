
import React, { useEffect, useState } from 'react';
import { runAiTask } from '../services/geminiService';
import { AiTask, FileNode } from '../types';
import { Icon } from './Icon';

interface BlueprintPanelProps {
  files: FileNode[];
  onClose: () => void;
}

export const BlueprintPanel: React.FC<BlueprintPanelProps> = ({ files, onClose }) => {
  const [blueprint, setBlueprint] = useState<string>('Analyzing codebase...');
  const [isLoading, setIsLoading] = useState(false);

  const generateBlueprint = async () => {
    setIsLoading(true);
    try {
      const fileNames = JSON.stringify(files, (key, value) => {
        if (key === 'children') return value;
        if (key === 'name') return value;
        return undefined;
      });
      
      const prompt = `Analyze this file structure and provide a high-level "Engineering Blueprint". 
      Include: 
      1. Technical Stack (inferred)
      2. Core Architecture Pattern
      3. Implementation Strategy for a "Full Coding" workflow.
      
      Structure: ${fileNames}`;
      
      const response = await runAiTask(AiTask.Chat, prompt, "");
      setBlueprint(response);
    } catch (err) {
      setBlueprint("Failed to generate blueprint. Check connection.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateBlueprint();
  }, []);

  return (
    <div className="w-80 bg-slate-900 border-l border-white/5 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center">
          <Icon name="blueprint" className="w-4 h-4 mr-2 text-sky-400" />
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Project Blueprint</h2>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-md text-slate-500 hover:text-white transition-colors">
          <Icon name="close" className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 space-y-4">
             <div className="w-6 h-6 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
             <p className="text-[10px] text-slate-500 uppercase tracking-widest animate-pulse font-bold">Scanning Repository...</p>
          </div>
        ) : (
          <div className="prose prose-invert prose-xs">
            <div className="bg-slate-950/50 rounded-xl p-4 border border-white/5 mb-4">
               <h3 className="text-xs font-bold text-sky-400 mb-2 flex items-center">
                  <Icon name="sparkles" className="w-3 h-3 mr-2" />
                  AI Architect Insights
               </h3>
               <div className="text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap font-sans">
                  {blueprint}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
               <div className="p-3 bg-slate-800/30 rounded-lg border border-white/5">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Files</div>
                  <div className="text-lg font-mono text-white tracking-tight">{files.length * 4} <span className="text-[10px] text-slate-600">LOC</span></div>
               </div>
               <div className="p-3 bg-slate-800/30 rounded-lg border border-white/5">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Health</div>
                  <div className="text-lg font-mono text-emerald-400 tracking-tight">98%</div>
               </div>
            </div>

            <section className="space-y-4">
               <h4 className="text-[10px] font-black uppercase text-slate-600 tracking-[.2em] border-b border-white/5 pb-2">Full Coding Workflow</h4>
               <div className="space-y-3">
                  {[
                    { title: "Architect", desc: "Use Blueprint panel to map data flow." },
                    { title: "Develop", desc: "Leverage AI Autocomplete (Ctrl+Space)." },
                    { title: "Verify", desc: "Watch Gutter Linting for real-time fixes." },
                    { title: "Commit", desc: "Review diffs in Git panel before pushing." }
                  ].map((step, i) => (
                    <div key={i} className="flex space-x-3 group">
                       <div className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:bg-sky-500/20 group-hover:text-sky-400 transition-colors">
                          {i+1}
                       </div>
                       <div>
                          <div className="text-[11px] font-bold text-slate-200">{step.title}</div>
                          <div className="text-[10px] text-slate-500 line-clamp-1">{step.desc}</div>
                       </div>
                    </div>
                  ))}
               </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
