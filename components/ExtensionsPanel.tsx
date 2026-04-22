
import React, { useState } from 'react';
import { Extension } from '../types';
import { Icon } from './Icon';

const INITIAL_EXTENSIONS: Extension[] = [
  {
    id: 'prettier',
    name: 'Prettier - Code Formatter',
    description: 'A shared code formatter that enforces consistent style across all your files.',
    author: 'Prettier Org',
    version: '3.0.0',
    isEnabled: true,
    category: 'Tool'
  },
  {
    id: 'eslint',
    name: 'ESLint Integration',
    description: 'Find and fix problems in your JavaScript/TypeScript code automatically.',
    author: 'ESLint Team',
    version: '8.4.1',
    isEnabled: true,
    category: 'Linter'
  },
  {
    id: 'gitlens',
    name: 'GitLens Simulated',
    description: 'Visualize code authorship and historical context with blame markers.',
    author: 'GitKraken',
    version: '15.0.0',
    isEnabled: false,
    category: 'Tool'
  },
  {
    id: 'python-debug',
    name: 'Python AI Debugger',
    description: 'Rich AI-powered debugging for the Python language using context extraction.',
    author: 'Gemini Labs',
    version: '1.2.0',
    isEnabled: true,
    category: 'Language'
  },
  {
    id: 'theme-nord',
    name: 'Nord Night Theme',
    description: 'An arctic, north-bluish color palette for focus and readability.',
    author: 'Arctic Ice Studio',
    version: '0.1.0',
    isEnabled: false,
    category: 'Theme'
  }
];

interface ExtensionsPanelProps {
  onClose: () => void;
}

export const ExtensionsPanel: React.FC<ExtensionsPanelProps> = ({ onClose }) => {
  const [extensions, setExtensions] = useState<Extension[]>(INITIAL_EXTENSIONS);
  const [search, setSearch] = useState('');

  const toggleExtension = (id: string) => {
    setExtensions(prev => prev.map(ext => {
      if (ext.id === id) {
        return { ...ext, isEnabled: !ext.isEnabled };
      }
      return ext;
    }));
  };

  const filteredExtensions = extensions.filter(ext => 
    ext.name.toLowerCase().includes(search.toLowerCase()) || 
    ext.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col overflow-hidden text-slate-300">
      <div className="p-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center">
          <Icon name="cloud" className="w-4 h-4 mr-2 text-sky-400" />
          <h2 className="text-xs font-bold uppercase text-slate-400">Extensions</h2>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded text-slate-400">
          <Icon name="close" className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 border-b border-slate-700">
        <div className="relative">
          <input 
            type="text"
            placeholder="Search extensions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-sky-500 pl-8"
          />
          <div className="absolute left-2.5 top-2 text-slate-500">
            <Icon name="search" className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {filteredExtensions.map(ext => (
          <div key={ext.id} className="flex space-x-3 p-2 rounded hover:bg-slate-750 group transition-colors border border-transparent hover:border-slate-700">
            <div className="shrink-0 w-10 h-10 bg-slate-900 rounded flex items-center justify-center border border-slate-700 group-hover:border-slate-600">
               <Icon 
                 name={ext.category === 'Language' ? 'python' : ext.category === 'Theme' ? 'react' : ext.category === 'Tool' ? 'format' : 'save'} 
                 className={`w-6 h-6 ${ext.isEnabled ? 'text-sky-400' : 'text-slate-600'}`} 
               />
            </div>
            <div className="flex-grow min-w-0">
               <div className="flex items-center justify-between mb-0.5">
                  <div className="text-xs font-bold truncate">{ext.name}</div>
                  <div className="text-[10px] text-slate-500 shrink-0">v{ext.version}</div>
               </div>
               <div className="text-[10px] text-slate-500 line-clamp-2 leading-snug mb-2">
                 {ext.description}
               </div>
               <div className="flex items-center justify-between">
                  <div className="text-[9px] text-slate-500 italic">by {ext.author}</div>
                  <button 
                    onClick={() => toggleExtension(ext.id)}
                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                      ext.isEnabled ? 'bg-slate-700 text-slate-400 hover:text-white' : 'bg-sky-600 text-white hover:bg-sky-500'
                    }`}
                  >
                    {ext.isEnabled ? 'Disable' : 'Enable'}
                  </button>
               </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-slate-900 border-t border-slate-700 flex items-center justify-between text-[10px]">
        <span className="text-slate-500">{extensions.filter(e => e.isEnabled).length} Enabled</span>
        <button className="text-sky-400 hover:underline">Marketplace Settings</button>
      </div>
    </div>
  );
};
