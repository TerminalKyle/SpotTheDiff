"use client";
import React, { useMemo } from "react";
import { cn } from "../../lib/utils";

interface SideBySideDiffProps {
  originalContent: string;
  modifiedContent: string;
  className?: string;
  showLineNumbers?: boolean;
}

export const SideBySideDiff = ({
  originalContent,
  modifiedContent,
  className,
  showLineNumbers = true,
}: SideBySideDiffProps) => {
  const { originalLines, modifiedLines, maxLines, lineData } = useMemo(() => {
    const originalLines = originalContent.split('\n');
    const modifiedLines = modifiedContent.split('\n');
    const maxLines = Math.max(originalLines.length, modifiedLines.length);
    
    const lineData = Array.from({ length: maxLines }, (_, i) => {
      const originalLine = originalLines[i] || '';
      const modifiedLine = modifiedLines[i] || '';
      const isChanged = originalLine !== modifiedLine;
      
      return {
        originalLine,
        modifiedLine,
        isChanged,
        lineNumber: i
      };
    });
    
    return { originalLines, modifiedLines, maxLines, lineData };
  }, [originalContent, modifiedContent]);

  const renderLine = React.useCallback((line: string, lineNumber: number, side: 'left' | 'right', isChanged: boolean = false) => (
    <div
      key={`${side}-${lineNumber}`}
      className={cn(
        "flex items-start px-4 py-1 min-h-[1.5rem] border-l-4 transition-colors",
        isChanged 
          ? side === 'left' 
            ? "bg-red-500/10 border-l-red-500" 
            : "bg-green-500/10 border-l-green-500"
          : "border-l-transparent hover:bg-white/5"
      )}
    >
      {showLineNumbers && (
        <div className="w-12 text-right pr-4 text-xs text-gray-500 select-none">
          {lineNumber + 1}
        </div>
      )}
      <div className="flex-1 font-mono text-sm">
        <span className={cn(
          "inline-block w-4 text-center font-bold mr-2",
          isChanged 
            ? side === 'left' 
              ? "text-red-400" 
              : "text-green-400"
            : "text-gray-300"
        )}>
          {side === 'left' ? '-' : '+'}
        </span>
        <span className={cn(
          isChanged 
            ? side === 'left' 
              ? "text-red-300" 
              : "text-green-300"
            : "text-gray-300"
        )}>
          {line || '\u00A0'}
        </span>
      </div>
    </div>
  ), [showLineNumbers]);

  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-red-500/20 rounded-lg p-3 border border-red-500/30">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <h3 className="text-sm font-semibold text-white">Original</h3>
          </div>
        </div>
        <div className="bg-green-500/20 rounded-lg p-3 border border-green-500/30">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <h3 className="text-sm font-semibold text-white">Modified</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-black/40 rounded-xl border border-white/10 overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <div className="font-mono text-sm">
            {lineData.map(({ originalLine, lineNumber, isChanged }) => 
              renderLine(originalLine, lineNumber, 'left', isChanged)
            )}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          <div className="font-mono text-sm">
            {lineData.map(({ modifiedLine, lineNumber, isChanged }) => 
              renderLine(modifiedLine, lineNumber, 'right', isChanged)
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
