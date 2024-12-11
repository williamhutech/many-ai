import React, { useRef, useEffect, useState } from 'react';

interface TruncatedTextProps {
  text: string;
  maxLines: number;
  onHeightChange?: (height: number) => void;
}

export const TruncatedText: React.FC<TruncatedTextProps> = ({ text, maxLines, onHeightChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      const container = containerRef.current;
      if (!container) return;

      const lineHeight = parseInt(window.getComputedStyle(container).lineHeight);
      const maxHeight = lineHeight * maxLines;
      const actualHeight = container.scrollHeight;

      setIsTruncated(actualHeight > maxHeight);
      onHeightChange?.(Math.min(actualHeight, maxHeight));
    };

    checkTruncation();
    window.addEventListener('resize', checkTruncation);

    return () => {
      window.removeEventListener('resize', checkTruncation);
    };
  }, [text, maxLines, onHeightChange]);

  return (
    <div
      ref={containerRef}
      className="text-sm text-gray-800"
      style={{
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxHeight: `${24 * maxLines}px`,
        width: 'fit-content',
        minWidth: 'min-content',
        maxWidth: '100%'
      }}
    >
      {text}
      {isTruncated && '...'}
    </div>
  );
};
