
import React, { useEffect, useState, useRef, useCallback } from 'react';
import EditorComponent from 'react-simple-code-editor';
import Prism from 'prismjs';
import prettier from 'prettier/standalone';
import parserBabel from 'prettier/plugins/babel';
import parserHtml from 'prettier/plugins/html';
import parserCss from 'prettier/plugins/postcss';
import parserEstree from 'prettier/plugins/estree';
import parserTypescript from 'prettier/plugins/typescript';
import { completeCode, runAiTask } from '../services/geminiService';
import { AiTask } from '../types';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-markup'; // HTML
import { FileNode, DebugState, IdeSettings } from '../types';
import { Icon } from './Icon';

interface EditorProps {
  openFiles: FileNode[];
  activeFileId: string;
  fileContents: Record<string, string>;
  onContentChange: (fileId: string, content: string) => void;
  onSave: (fileId: string) => void;
  onDownload: (fileId: string) => void;
  onSelectTab: (fileId: string) => void;
  onCloseTab: (fileId: string) => void;
  onRun: (fileId: string) => void;
  onDebug: (fileId: string) => void;
  debugState: DebugState;
  onToggleBreakpoint: (fileId: string, line: number) => void;
  settings: IdeSettings;
  onProblemsChange?: (problems: { line: number; message: string }[]) => void;
}

export const Editor: React.FC<EditorProps> = ({
  openFiles,
  activeFileId,
  fileContents,
  onContentChange,
  onSave,
  onDownload,
  onSelectTab,
  onCloseTab,
  onRun,
  onDebug,
  debugState,
  onToggleBreakpoint,
  settings,
  onProblemsChange,
}) => {
  const activeFile = openFiles.find(f => f.id === activeFileId);
  const [isAiCompleting, setIsAiCompleting] = useState(false);
  const [lintErrors, setLintErrors] = useState<{line: number, message: string}[]>([]);
  const editorRef = useRef<any>(null);
  const lastProblemsRef = useRef<string>('[]');

  const content = fileContents[activeFileId] || '';
  const lines = content.split('\n');
  const lineCount = lines.length;

  const handleAiComplete = useCallback(async () => {
    if (!activeFile || isAiCompleting) return;
    
    // Find the textarea to get cursor position
    const textarea = document.querySelector('.editor-container textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const selectionStart = textarea.selectionStart;
    const content = fileContents[activeFileId] || '';
    const codeBefore = content.substring(0, selectionStart);
    const codeAfter = content.substring(selectionStart);

    setIsAiCompleting(true);
    try {
      const completion = await completeCode(codeBefore, codeAfter, activeFile.name);
      if (completion) {
        const newContent = codeBefore + completion + codeAfter;
        onContentChange(activeFileId, newContent);
        
        // Update cursor position after completion
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(selectionStart + completion.length, selectionStart + completion.length);
        }, 0);
      }
    } catch (err) {
      console.error('AI completion failed:', err);
    } finally {
      setIsAiCompleting(false);
    }
  }, [activeFile, isAiCompleting, fileContents, activeFileId, onContentChange]);

  const handleSave = useCallback(() => {
    if (activeFileId) {
      if (settings.formatOnSave) {
        handleFormat().then(() => onSave(activeFileId));
      } else {
        onSave(activeFileId);
      }
    }
  }, [activeFileId, settings.formatOnSave, onSave]);

  // Handle editor-specific shortcuts
  useEffect(() => {
    if (!settings.enableShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // We let App.tsx handle the global Ctrl+S for saving, 
      // but we should probably handle formatting here first if it's an editor save.
      // Actually, if we're in the Editor, let's handle Ctrl+S here to include formatting.
      if (cmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        e.stopImmediatePropagation(); // Prevent App.tsx from also handling it
        handleSave();
      }

      // AI Code completion: Ctrl+Space (always editor specific)
      if (cmdOrCtrl && e.key === ' ') {
        e.preventDefault();
        handleAiComplete();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true); // Use capture to handle it before App.tsx
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [activeFileId, handleSave, handleAiComplete, settings.enableShortcuts]);

  const getFileIconName = (fileName: string): any => {
    if (/\.(jsx|tsx)$/.test(fileName)) return 'react';
    if (/\.css$/.test(fileName)) return 'css';
    if (/\.json$/.test(fileName)) return 'json';
    if (/\.(js|ts)$/.test(fileName)) return 'js';
    if (/\.md$/.test(fileName)) return 'markdown';
    if (/\.py$/.test(fileName)) return 'python';
    if (/\.html$/.test(fileName)) return 'html';
    return 'file';
  };

  const getLanguage = (fileName: string): string => {
    if (/\.tsx?$/.test(fileName)) return 'typescript';
    if (/\.jsx?$/.test(fileName)) return 'javascript';
    if (/\.css$/.test(fileName)) return 'css';
    if (/\.json$/.test(fileName)) return 'json';
    if (/\.md$/.test(fileName)) return 'markdown';
    if (/\.py$/.test(fileName)) return 'python';
    if (/\.html$/.test(fileName)) return 'markup';
    return 'javascript';
  };

  // Auto-close brackets & AI Auto-trigger
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!settings.autoCloseBrackets) return;

    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;

    const pairs: Record<string, string> = {
      '(': ')',
      '[': ']',
      '{': '}',
      '"': '"',
      "'": "'",
      '`': '`'
    };

    if (pairs[e.key]) {
      e.preventDefault();
      const closing = pairs[e.key];
      const newValue = value.substring(0, start) + e.key + closing + value.substring(end);
      onContentChange(activeFileId, newValue);
      
      // Move cursor between brackets
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
    }
  };

  // Debounced Auto-completion & AI Linting
  useEffect(() => {
    if (!settings.autoCompletion || !activeFile) return;

    const timer = setTimeout(async () => {
        // Virtual AI Linting
        try {
          const lintResponse = await runAiTask(AiTask.DebugAnalyze, "Act as a linter. Analyze this code for errors. Output ONLY a raw JSON array of objects with 'line' (number) and 'message' (string) keys. No prose, no markdown blocks. If no errors, return [].", content);
          
          // Clean the response: remove markdown fences and surrounding noise
          let cleanedResponse = lintResponse.replace(/```json/g, '').replace(/```/g, '').trim();
          
          const firstBracket = cleanedResponse.indexOf('[');
          const lastBracket = cleanedResponse.lastIndexOf(']');
          
          if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
            const jsonStr = cleanedResponse.substring(firstBracket, lastBracket + 1);
            try {
              const errors = JSON.parse(jsonStr);
              if (Array.isArray(errors)) {
                // Ensure every item is valid
                const validErrors = errors.filter(e => typeof e.line === 'number' && typeof e.message === 'string');
                
                const errorsStr = JSON.stringify(validErrors);
                if (errorsStr !== lastProblemsRef.current) {
                  lastProblemsRef.current = errorsStr;
                  setLintErrors(validErrors);
                  onProblemsChange?.(validErrors);
                }
              }
            } catch (parseErr) {
              console.warn('AI Lint JSON parse failed:', parseErr, jsonStr);
            }
          }
        } catch (err) {
          console.error('Linting extraction failed:', err);
        }
    }, 2000);

    return () => clearTimeout(timer);
  }, [content, settings.autoCompletion, activeFile]);

  const highlight = (code: string, language: string) => {
    const lang = Prism.languages[language] || Prism.languages.javascript;
    return Prism.highlight(code, lang, language);
  };

  const handleFormat = async () => {
    if (!activeFile) return;
    const content = fileContents[activeFileId] || '';
    const language = getLanguage(activeFile.name);
    
    if (language === 'python') {
      try {
        const formatted = await runAiTask(AiTask.FormatPython, '', content);
        onContentChange(activeFileId, formatted);
        return;
      } catch (err) {
        console.error('Python formatting failed:', err);
        return;
      }
    }

    let parser = 'babel';
    let plugins: any[] = [parserBabel, parserEstree];

    if (language === 'typescript') {
      parser = 'typescript';
      plugins = [parserTypescript, parserEstree];
    } else if (language === 'markup') {
      parser = 'html';
      plugins = [parserHtml];
    } else if (language === 'css') {
      parser = 'css';
      plugins = [parserCss];
    } else if (language === 'json') {
      parser = 'json';
      plugins = [parserBabel, parserEstree];
    }

    try {
      const formatted = await prettier.format(content, {
        parser,
        plugins,
        semi: true,
        singleQuote: true,
        tabWidth: 2,
      });
      onContentChange(activeFileId, formatted);
    } catch (err) {
      console.error('Formatting failed:', err);
    }
  };

  return (
    <div className="flex-grow flex flex-col bg-transparent overflow-hidden">
      {/* Tabs & Toolbar */}
      <div className="flex items-center bg-slate-950/5 border-b border-white/5 shadow-sm">
        <div className="flex-grow flex overflow-x-auto scrollbar-hide">
          {openFiles.map(file => (
            <div
              key={file.id}
              onClick={() => onSelectTab(file.id)}
              className={`flex items-center px-4 py-2.5 text-[11px] font-medium cursor-pointer border-r border-white/5 whitespace-nowrap transition-all relative group ${
                activeFileId === file.id 
                  ? 'bg-slate-800 text-slate-100' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-850'
              }`}
            >
              <Icon name={getFileIconName(file.name)} className="w-3.5 h-3.5 mr-2 opacity-80" />
              <span className="truncate max-w-[120px]">{file.name}</span>
              {file.isDirty && (
                <div className="ml-2 w-1.5 h-1.5 bg-sky-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.5)]" title="Unsaved changes" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(file.id);
                }}
                className={`ml-3 p-1 rounded-md transition-all ${
                  activeFileId === file.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                } hover:bg-slate-700`}
              >
                <Icon name="close" className="w-2.5 h-2.5" />
              </button>
              {activeFileId === file.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
              )}
            </div>
          ))}
        </div>
        
        {/* Editor Toolbar */}
        {activeFile && (
          <div className="flex items-center px-3 space-x-1 border-l border-white/5 bg-slate-900/50 backdrop-blur-sm self-stretch">
            <button 
              onClick={() => onSave(activeFileId)}
              className="p-1.5 hover:bg-slate-800 rounded-lg transition-all text-slate-500 hover:text-white" 
              title="Save File (Ctrl+S)"
            >
              <Icon name="save" className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-white/5 mx-1" />
            <div className="flex items-center bg-slate-950/50 rounded-lg p-0.5 border border-white/5">
              <button 
                onClick={() => onRun(activeFileId)}
                className="p-1.5 hover:bg-slate-800 rounded-md transition-all text-emerald-500 hover:text-emerald-400" 
                title="Run Code"
              >
                <Icon name="play" className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onDebug(activeFileId)}
                className="p-1.5 hover:bg-slate-800 rounded-md transition-all text-rose-500 hover:text-rose-400" 
                title="Debug Code"
              >
                <Icon name="bug" className="w-4 h-4" />
              </button>
            </div>
            <div className="w-px h-4 bg-white/5 mx-1" />
            <button 
              onClick={handleFormat}
              className="p-1.5 hover:bg-slate-800 rounded-lg transition-all text-slate-500 hover:text-white" 
              title="Format Code"
            >
              <Icon name="format" className="w-4 h-4" />
            </button>
            <button 
              onClick={handleAiComplete}
              disabled={isAiCompleting}
              className={`p-1.5 hover:bg-slate-800 rounded-lg transition-all ${
                isAiCompleting ? 'text-sky-400 animate-pulse bg-sky-400/5' : 'text-slate-500 hover:text-sky-400 hover:bg-sky-400/5'
              }`} 
              title="AI Autocomplete (⌃Space)"
            >
              <Icon name="sparkles" className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Code Area */}
      <div className="flex-grow overflow-auto bg-transparent custom-scrollbar editor-container flex relative">
        {activeFile ? (
          <>
            {/* Gutter */}
            <div className="flex-shrink-0 bg-slate-900/50 border-r border-white/5 select-none w-12 pt-[20px] text-right font-mono text-[11px] leading-[1.5]">
              {lines.map((_, i) => {
                const lineNum = i + 1;
                const isBreakpoint = debugState.breakpoints.some(bp => bp.fileId === activeFileId && bp.line === lineNum);
                const isCurrentLine = debugState.currentLine === lineNum && debugState.status !== 'inactive';
                const hasError = lintErrors.find(e => e.line === lineNum);
                
                return (
                  <div 
                    key={i} 
                    className={`relative px-2 group cursor-pointer transition-colors ${isCurrentLine ? 'bg-sky-500/20 text-sky-400' : 'text-slate-600 hover:text-slate-400'}`}
                    onClick={() => onToggleBreakpoint(activeFileId, lineNum)}
                    title={hasError?.message}
                  >
                    {lineNum}
                    {/* Error indicator */}
                    {hasError && (
                      <div className="absolute right-0 top-1 w-1 h-[80%] bg-rose-500/50" />
                    )}
                    {/* Breakpoint indicator */}
                    {isBreakpoint && (
                      <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                    )}
                    {/* Step indicator */}
                    {isCurrentLine && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 border-l-4 border-l-sky-500 border-y-4 border-y-transparent" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex-grow relative" ref={editorRef}>
              <EditorComponent
                value={fileContents[activeFileId] || ''}
                onValueChange={(code) => onContentChange(activeFileId, code)}
                onKeyDown={handleEditorKeyDown}
                highlight={(code) => highlight(code, getLanguage(activeFile.name))}
                padding={20}
                className="font-mono text-sm min-h-full"
                style={{
                  fontFamily: settings.fontFamily,
                  fontSize: settings.fontSize,
                  lineHeight: '1.5',
                  backgroundColor: 'transparent',
                  color: '#cbd5e1',
                }}
              />
              {/* Highlight background for current line */}
              {debugState.currentLine !== null && debugState.status !== 'inactive' && (
                <div 
                  className="absolute pointer-events-none bg-sky-500/10 w-full"
                  style={{
                    top: `${20 + (debugState.currentLine - 1) * 21}px`, // 14px * 1.5 = 21px line height
                    height: '21px'
                  }}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center text-slate-500 h-full">
            <div className="text-center">
              <Icon name="react" className="w-16 h-16 mx-auto mb-4 opacity-10" />
              <p>Select a file to begin editing or use the AI Panel to generate code.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
