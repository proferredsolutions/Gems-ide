
import React, { useRef, useEffect } from 'react';
import { Icon } from './Icon';

interface TerminalProps {
  output: string[];
}

export const Terminal: React.FC<TerminalProps> = ({ output }) => {
  const endOfOutputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfOutputRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  return (
    <div className="h-48 flex flex-col transition-colors duration-300 bg-slate-900 border-t border-white/5">
      <div className="px-3 py-1 bg-slate-950/40 text-xs font-bold text-slate-500 border-b border-white/5 flex items-center">
        <Icon name="terminal" className="w-3 h-3 mr-2" />
        TERMINAL
      </div>
      <div className="flex-grow p-3 overflow-y-auto text-xs font-mono whitespace-pre-wrap">
        {output.join('\n')}
        <div ref={endOfOutputRef} />
      </div>
    </div>
  );
};
