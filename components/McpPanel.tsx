
import React, { useState } from 'react';
import { McpTool } from '../types';
import { Icon } from './Icon';

const INITIAL_MCP_TOOLS: McpTool[] = [
  {
    id: 'filesystem',
    name: 'Filesystem MCP',
    description: 'Provides direct access to the local and remote filesystem for the AI model.',
    status: 'connected',
    source: 'github.com/modelcontextprotocol/servers/tree/main/src/filesystem'
  },
  {
    id: 'sqlite',
    name: 'SQLite Explorer',
    description: 'Allows querying and modifying local SQLite databases via natural language.',
    status: 'disconnected',
    source: 'github.com/modelcontextprotocol/servers/tree/main/src/sqlite'
  },
  {
    id: 'google-maps',
    name: 'Google Maps Tools',
    description: 'Enables search, directions, and place information retrieval for grounding.',
    status: 'error',
    source: 'github.com/googlemaps/mcp-server'
  }
];

interface McpPanelProps {
  onClose: () => void;
}

export const McpPanel: React.FC<McpPanelProps> = ({ onClose }) => {
  const [tools, setTools] = useState<McpTool[]>(INITIAL_MCP_TOOLS);
  const [isAdding, setIsAdding] = useState(false);
  const [newUrl, setNewUrl] = useState('');

  const toggleConnect = (id: string) => {
    setTools(prev => prev.map(tool => {
      if (tool.id === id) {
        return {
          ...tool,
          status: tool.status === 'connected' ? 'disconnected' : 'connected'
        };
      }
      return tool;
    }));
  };

  const handleAddTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;

    const newTool: McpTool = {
      id: `custom-${Date.now()}`,
      name: newUrl.split('/').pop() || 'Remote Tool',
      description: `Custom MCP tool configured from ${newUrl}`,
      status: 'disconnected',
      source: newUrl
    };

    setTools([...tools, newTool]);
    setNewUrl('');
    setIsAdding(false);
  };

  return (
    <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col overflow-hidden">
      <div className="p-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center">
          <Icon name="command" className="w-4 h-4 mr-2 text-sky-400" />
          <h2 className="text-xs font-bold uppercase text-slate-400">MCP Tools</h2>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded text-slate-400">
          <Icon name="close" className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        <p className="text-[10px] text-slate-500 leading-relaxed">
          The Model Context Protocol (MCP) enables developers to build secure integrations that provide AI models with relevant data and tools.
        </p>

        <div className="flex items-center justify-between">
          <div className="text-[10px] font-bold uppercase text-slate-500">Registry</div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="text-[10px] text-sky-400 hover:text-sky-300 font-bold uppercase"
          >
            {isAdding ? 'Cancel' : '+ Add Server'}
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleAddTool} className="bg-slate-900 p-3 rounded border border-slate-700 space-y-2">
            <input 
              type="text"
              placeholder="npx @modelcontextprotocol/server-..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
            />
            <button 
              type="submit"
              className="w-full bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold py-1.5 rounded transition-colors uppercase"
            >
              Configure MCP
            </button>
          </form>
        )}

        <div className="space-y-3">
          {tools.map(tool => (
            <div key={tool.id} className="bg-slate-900 p-3 rounded border border-slate-700 hover:border-slate-600 transition-colors group">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-xs font-bold text-slate-200">{tool.name}</div>
                  <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">{tool.description}</div>
                </div>
                <div className={`w-2 h-2 rounded-full mt-1 ${
                  tool.status === 'connected' ? 'bg-emerald-500' : 
                  tool.status === 'error' ? 'bg-rose-500' : 'bg-slate-600'
                }`} title={tool.status} />
              </div>
              
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
                <div className="text-[9px] text-slate-600 truncate max-w-[120px]" title={tool.source}>
                  {tool.source.replace('github.com/', '')}
                </div>
                <button 
                  onClick={() => toggleConnect(tool.id)}
                  disabled={tool.status === 'error'}
                  className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                    tool.status === 'connected' ? 'bg-slate-800 text-rose-400 hover:bg-rose-900/20' : 
                    tool.status === 'disconnected' ? 'bg-sky-600 text-white hover:bg-sky-500' :
                    'bg-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {tool.status === 'connected' ? 'Disconnect' : tool.status === 'error' ? 'Config Error' : 'Connect'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 bg-slate-900/50 border-t border-slate-700">
         <div className="flex items-center justify-center space-x-2 text-[10px] text-slate-500">
           <Icon name="sparkles" className="w-3 h-3" />
           <span>AI model automatically uses connected MCP tools.</span>
         </div>
      </div>
    </div>
  );
};
