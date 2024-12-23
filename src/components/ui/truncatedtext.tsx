import React, { useRef, useEffect } from 'react';

interface TruncatedTextProps {
  text: string;
  maxLines: number;
  onHeightChange?: (height: number) => void;
}

export const TruncatedText: React.FC<TruncatedTextProps> = ({ text, maxLines, onHeightChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousHeightRef = useRef<number>(0);

  useEffect(() => {
    const checkHeight = () => {
      const container = containerRef.current;
      if (!container) return;

      // Get the actual content height without modifying the container
      const actualHeight = container.scrollHeight;
      const lineHeight = parseInt(window.getComputedStyle(container).lineHeight);
      const maxHeight = lineHeight * maxLines;
      const finalHeight = Math.min(actualHeight, maxHeight);

      // Only update if height has changed
      if (finalHeight !== previousHeightRef.current) {
        previousHeightRef.current = finalHeight;
        onHeightChange?.(finalHeight);
      }
    };

    checkHeight();

    // Debounced resize handler
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkHeight, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, [text, maxLines, onHeightChange]);

  return (
    <div
      ref={containerRef}
      className="text-sm text-gray-800 w-full"
      style={{
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxHeight: `${24 * maxLines}px`
      }}
    >
      {text}
    </div>
  );
};
