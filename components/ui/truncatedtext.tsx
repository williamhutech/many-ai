import React, { useRef, useEffect, useState } from 'react';

interface TruncatedTextProps {
  text: string;
  maxLines: number;
}

export const TruncatedText: React.FC<TruncatedTextProps> = ({ text, maxLines }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      const container = containerRef.current;
      if (!container) return;

      const lineHeight = parseInt(window.getComputedStyle(container).lineHeight);
      const maxHeight = lineHeight * maxLines;

      setIsTruncated(container.scrollHeight > maxHeight);
    };

    checkTruncation();
    window.addEventListener('resize', checkTruncation);

    return () => {
      window.removeEventListener('resize', checkTruncation);
    };
  }, [text, maxLines]);

  return (
    <div
      ref={containerRef}
      className="text-sm text-gray-800"
      style={{
        display: '-webkit-box',
        WebkitLineClamp: maxLines,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {text}
      {isTruncated && '...'}
    </div>
  );
};
