
import React, { useState, useEffect, useRef } from 'react';
import { AiTask, AiTaskType } from '../types';

interface AiPanelProps {
  onRunTask: (task: AiTaskType, prompt: string) => void;
  isLoading: boolean;
  activeTask: AiTaskType;
  onTaskChange: (task: AiTaskType) => void;
}

export const AiPanel: React.FC<AiPanelProps> = ({ onRunTask, isLoading, activeTask, onTaskChange }) => {
  const [prompt, setPrompt] = useState('');
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input when task changes to something requiring input
  useEffect(() => {
    if (activeTask === AiTask.GenerateCode || activeTask === AiTask.Chat) {
      promptInputRef.current?.focus();
    }
  }, [activeTask]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onRunTask(activeTask, prompt);
    }
  };

  const getPromptPlaceholder = () => {
    switch(activeTask) {
        case AiTask.GenerateCode:
            return "e.g., a React component for a login form";
        case AiTask.ExplainCode:
            return "Prompt is not needed. Explains the active file.";
        case AiTask.RefactorCode:
            return "Prompt is not needed. Refactors the active file.";
        case AiTask.GenerateTests:
            return "Prompt is not needed. Generates tests for the active file.";
        case AiTask.Chat:
            return "Ask a coding question...";
        default:
            return "Enter your prompt...";
    }
  }
  
  const isPromptDisabled = [AiTask.ExplainCode, AiTask.RefactorCode, AiTask.GenerateTests].includes(activeTask);

  return (
    <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col">
      <h2 className="text-xs font-bold uppercase text-slate-400 p-3 border-b border-slate-700">AI Assistant</h2>
      <form onSubmit={handleSubmit} className="p-4 flex-grow flex flex-col">
        <div className="mb-4">
          <label htmlFor="ai-task" className="block text-sm font-medium mb-1 text-slate-300">Task</label>
          <select
            id="ai-task"
            value={activeTask}
            onChange={(e) => onTaskChange(e.target.value as AiTaskType)}
            className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm text-white focus:ring-sky-500 focus:border-sky-500"
          >
            {Object.values(AiTask).map(task => (
              <option key={task} value={task}>{task}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4 flex-grow flex flex-col">
          <label htmlFor="ai-prompt" className="block text-sm font-medium mb-1 text-slate-300">Prompt</label>
          <textarea
            id="ai-prompt"
            ref={promptInputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isPromptDisabled || isLoading}
            placeholder={getPromptPlaceholder()}
            className="w-full flex-grow bg-slate-700 border border-slate-600 rounded-md p-2 text-sm text-white resize-none focus:ring-sky-500 focus:border-sky-500 disabled:opacity-50"
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading || (isPromptDisabled ? false : !prompt.trim())}
          className="w-full bg-sky-600 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : `Run ${activeTask}`}
        </button>
      </form>
    </div>
  );
};
