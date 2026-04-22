
import React from 'react';
import { IdeSettings } from '../types';
import { Icon } from './Icon';

interface SettingsPanelProps {
  settings: IdeSettings;
  onSettingsChange: (settings: IdeSettings) => void;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSettingsChange, onClose }) => {
  const updateSetting = <K extends keyof IdeSettings>(key: K, value: IdeSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="w-80 bg-slate-900 border-l border-white/5 flex flex-col overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center">
          <Icon name="settings" className="w-4 h-4 mr-2 text-slate-400" />
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Settings</h2>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-md text-slate-500 hover:text-white transition-colors">
          <Icon name="close" className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-6 space-y-8 custom-scrollbar bg-slate-900">
        {/* Editor Section */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest border-b border-white/5 pb-2">Editor</h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-xs text-slate-200 block">AI Suggestion</label>
              <p className="text-[10px] text-slate-500">Enable AI code completion as you type.</p>
            </div>
            <button 
              onClick={() => updateSetting('autoCompletion', !settings.autoCompletion)}
              className={`w-10 h-5 rounded-full transition-all relative ${settings.autoCompletion ? 'bg-sky-500' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.autoCompletion ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-xs text-slate-200 block">Ghost Text</label>
              <p className="text-[10px] text-slate-500">Show transient AI completions in editor.</p>
            </div>
            <button 
              onClick={() => updateSetting('aiGhostText', !settings.aiGhostText)}
              className={`w-10 h-5 rounded-full transition-all relative ${settings.aiGhostText ? 'bg-sky-500' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.aiGhostText ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-xs text-slate-200 block">Auto Close Brackets</label>
              <p className="text-[10px] text-slate-500">Automatically close braces, quotes, etc.</p>
            </div>
            <button 
              onClick={() => updateSetting('autoCloseBrackets', !settings.autoCloseBrackets)}
              className={`w-10 h-5 rounded-full transition-all relative ${settings.autoCloseBrackets ? 'bg-sky-500' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.autoCloseBrackets ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-xs text-slate-200 block">Format on Save</label>
              <p className="text-[10px] text-slate-500">Prettier/AI formatting when saving.</p>
            </div>
            <button 
              onClick={() => updateSetting('formatOnSave', !settings.formatOnSave)}
              className={`w-10 h-5 rounded-full transition-all relative ${settings.formatOnSave ? 'bg-sky-500' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.formatOnSave ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </section>

        {/* Visuals Section */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest border-b border-white/5 pb-2">Interface</h3>
          
          <div className="space-y-2">
            <label className="text-xs text-slate-400 block">Font Size</label>
            <div className="flex items-center space-x-3">
              <input 
                type="range" 
                min="10" 
                max="24" 
                value={settings.fontSize} 
                onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                className="flex-grow accent-sky-500"
              />
              <span className="text-xs font-mono text-slate-200 w-8">{settings.fontSize}px</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-400 block">App Zoom (Scaling)</label>
            <div className="flex items-center space-x-3">
              <input 
                type="range" 
                min="50" 
                max="200" 
                step="5"
                value={settings.zoom} 
                onChange={(e) => updateSetting('zoom', parseInt(e.target.value))}
                className="flex-grow accent-sky-500"
              />
              <span className="text-xs font-mono text-slate-200 w-10">{settings.zoom}%</span>
            </div>
            <p className="text-[10px] text-slate-500">Scale the entire IDE UI for better visibility.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-400 block">Theme</label>
            <div className="grid grid-cols-3 gap-2">
              {(['dark', 'light', 'amoled'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => updateSetting('theme', t)}
                  className={`py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${
                    settings.theme === t 
                      ? 'bg-sky-500 border-sky-500 text-white' 
                      : 'bg-slate-950 border-white/5 text-slate-500 hover:border-white/20'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Shortcuts Section */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest border-b border-white/5 pb-2">Keyboard Shortcuts</h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-xs text-slate-200 block">Enable Shortcuts</label>
              <p className="text-[10px] text-slate-500">Enable global keyboard hotkeys.</p>
            </div>
            <button 
              onClick={() => updateSetting('enableShortcuts', !settings.enableShortcuts)}
              className={`w-10 h-5 rounded-full transition-all relative ${settings.enableShortcuts ? 'bg-sky-500' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.enableShortcuts ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-400 block">Keymap Profile</label>
            <div className="grid grid-cols-2 gap-2">
              {(['vscode', 'classic'] as const).map((profile) => (
                <button
                  key={profile}
                  onClick={() => updateSetting('keyMap', profile)}
                  className={`py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${
                    settings.keyMap === profile 
                      ? 'bg-sky-500 border-sky-500 text-white' 
                      : 'bg-slate-950 border-white/5 text-slate-500 hover:border-white/20'
                  }`}
                >
                  {profile === 'vscode' ? 'VS Code' : 'Classic'}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="pt-10">
          <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl">
            <div className="flex items-center mb-2">
              <Icon name="sparkles" className="w-3.5 h-3.5 text-sky-400 mr-2" />
              <span className="text-[10px] font-black uppercase text-slate-300">AI Intelligence</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Gemini model is processing your code in real-time. Disabling AI features will reduce resource usage and token consumption.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
