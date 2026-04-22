import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface LivePreviewProps {
  activeFileId: string;
  fileName: string;
  content: string;
  onClose: () => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ activeFileId, fileName, content, onClose }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pythonOutput, setPythonOutput] = useState<string[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<{type: string, args: string[]}[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConsole, setShowConsole] = useState(true);

  const isHtml = fileName.endsWith('.html');
  const isCss = fileName.endsWith('.css');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'CONSOLE_LOG') {
        setConsoleLogs(prev => [...prev, {
          type: event.data.logType,
          args: event.data.args
        }]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (isHtml || isCss) {
      setConsoleLogs([]); // Clear logs on refresh
      updateHtmlPreview();
    }
  }, [activeFileId, content]);

  const updateHtmlPreview = async () => {
    setIsUpdating(true);
    try {
      // If it's CSS, we might want to refresh the HTML file if one is open or just notify success
      // For now, we use the simple update API for both
      await fetch('/api/live/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeFileId, content })
      });
      setPreviewUrl(`/api/live/preview/${activeFileId}?t=${Date.now()}`);
    } catch (err) {
      console.error('Failed to update preview:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="w-96 bg-slate-900 border-l border-slate-700 flex flex-col">
      <div className="p-3 border-b border-slate-700 flex items-center justify-between bg-slate-800">
        <div className="flex items-center space-x-2">
          <Icon name="live" className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase text-slate-300 tracking-wider">Web Preview</span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white">
          <Icon name="close" className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-grow overflow-hidden flex flex-col">
        {(isHtml || isCss) ? (
          <div className="flex-grow flex flex-col">
            <div className="p-2 bg-slate-800 border-b border-slate-700 flex items-center space-x-2">
              <div className="flex-grow bg-slate-900 rounded px-2 py-1 text-[10px] text-slate-400 truncate font-mono">
                {isHtml ? `http://localhost:3000/api/live/view/${activeFileId}` : `Styling: ${fileName}`}
              </div>
              {isHtml && (
                <a 
                  href={previewUrl || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-sky-400"
                  title="Open in new tab"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
            <div className="flex-grow bg-white relative">
              {isUpdating && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                  <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {isHtml ? (
                previewUrl && (
                  <iframe 
                    src={previewUrl} 
                    className="w-full h-full border-none"
                    title="Web Preview"
                  />
                )
              ) : (
                <div className="w-full h-full bg-slate-50 flex items-center justify-center p-6 text-center">
                   <div className="space-y-3">
                      <Icon name="css" className="w-12 h-12 mx-auto" />
                      <h3 className="text-slate-800 font-bold">CSS Updated</h3>
                      <p className="text-xs text-slate-500 max-w-[200px]">Your styles have been synced. Switch to an HTML file to see them in action.</p>
                   </div>
                </div>
              )}
            </div>
            
            {/* Console Window */}
            {isHtml && (
              <div className={`border-t border-slate-700 bg-slate-900 overflow-hidden flex flex-col ${showConsole ? 'h-48' : 'h-8'}`}>
                <div 
                  className="p-2 bg-slate-800 border-b border-slate-700 flex items-center justify-between cursor-pointer hover:bg-slate-750"
                  onClick={() => setShowConsole(!showConsole)}
                >
                  <div className="flex items-center space-x-2">
                    <Icon name="terminal" className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Browser Console</span>
                    {consoleLogs.length > 0 && (
                      <span className="bg-sky-500 text-white text-[8px] px-1 rounded-full">{consoleLogs.length}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setConsoleLogs([]); }}
                      className="text-[9px] text-slate-500 hover:text-slate-300 uppercase font-bold"
                    >
                      Clear
                    </button>
                    <Icon name={showConsole ? 'close' : 'live'} className="w-3 h-3 text-slate-500" />
                  </div>
                </div>
                
                {showConsole && (
                  <div className="flex-grow overflow-y-auto p-2 font-mono text-[11px] space-y-1 custom-scrollbar">
                    {consoleLogs.length === 0 ? (
                      <div className="text-slate-600 italic p-2 text-center">No logs captured...</div>
                    ) : (
                      consoleLogs.map((log, i) => (
                        <div key={i} className="flex border-b border-slate-800/50 pb-1">
                          <span className={`mr-2 shrink-0 ${log.type === 'error' ? 'text-rose-400' : log.type === 'warn' ? 'text-amber-400' : 'text-sky-400 opacity-50'}`}>
                            {log.type === 'log' ? '›' : log.type === 'error' ? '✖' : '⚠'}
                          </span>
                          <span className={log.type === 'error' ? 'text-rose-300' : log.type === 'warn' ? 'text-amber-200' : 'text-slate-300'}>
                            {log.args.join(' ')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center text-slate-500 text-center p-8">
            <div>
              <Icon name="live" className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm">Web Development Preview</p>
              <p className="text-[10px] mt-2 text-slate-600">Select an HTML or CSS file to see real-time updates.</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-2 bg-slate-800 border-t border-slate-700 text-[10px] text-slate-500 flex justify-between">
        <span>Status: {isUpdating ? 'Updating...' : 'Ready'}</span>
        <span>{fileName}</span>
      </div>
    </div>
  );
};
