"use client";
import React, { useState, useRef, useCallback } from "react";
import { cn } from "../../lib/utils";

interface CompareProps {
  firstContent?: string;
  secondContent?: string;
  className?: string;
  initialSliderPercentage?: number;
}

export const Compare = ({
  firstContent = "",
  secondContent = "",
  className,
  initialSliderPercentage = 50,
}: CompareProps) => {
  const [sliderXPercent, setSliderXPercent] = useState(initialSliderPercentage);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!sliderRef.current || !isDragging) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = (x / rect.width) * 100;
      setSliderXPercent(Math.max(0, Math.min(100, percent)));
    },
    [isDragging]
  );

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      ref={sliderRef}
      className={cn("w-full h-[600px] relative border border-white/20 rounded-lg overflow-hidden select-none", className)}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-30 cursor-col-resize"
        style={{ left: `${sliderXPercent}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-8 bg-blue-500 rounded flex items-center justify-center">
          <div className="w-1 h-4 bg-white rounded"></div>
        </div>
      </div>

      {secondContent && (
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm">
          <div className="p-4 h-full overflow-y-auto">
            <pre className="font-mono text-sm text-white whitespace-pre-wrap m-0">
              {secondContent}
            </pre>
          </div>
        </div>
      )}

      {firstContent && (
        <div
          className="absolute inset-0 bg-white/5 backdrop-blur-sm"
          style={{
            clipPath: `inset(0 ${100 - sliderXPercent}% 0 0)`,
          }}
        >
          <div className="p-4 h-full overflow-y-auto">
            <pre className="font-mono text-sm text-white whitespace-pre-wrap m-0">
              {firstContent}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
