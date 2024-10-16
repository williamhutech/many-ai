import React, { useRef, useEffect, useState } from 'react';

interface TruncatedTextProps {
  text: string;
  maxLines: number;
}

export const TruncatedText: React.FC<TruncatedTextProps> = ({ text, maxLines }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [truncatedText, setTruncatedText] = useState(text);

  useEffect(() => {
    const truncateText = () => {
      const container = containerRef.current;
      if (!container) return;

      const lineHeight = parseInt(window.getComputedStyle(container).lineHeight);
      const maxHeight = lineHeight * maxLines;

      let low = 0;
      let high = text.length;
      let mid;

      while (low <= high) {
        mid = Math.floor((low + high) / 2);
        container.textContent = text.slice(0, mid) + '...';

        if (container.offsetHeight > maxHeight) {
          high = mid - 1;
        } else {
          low = mid + 1;
        }
      }

      setTruncatedText(text.slice(0, high) + (high < text.length ? '...' : ''));
    };

    truncateText();
    window.addEventListener('resize', truncateText);

    return () => {
      window.removeEventListener('resize', truncateText);
    };
  }, [text, maxLines]);

  return (
    <div ref={containerRef} className="text-sm text-gray-800">
      {truncatedText}
    </div>
  );
};
