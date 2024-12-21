import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import * as amplitude from '@amplitude/analytics-browser';

interface UserPromptBubbleProps {
  prompt: string;
  index: number;
  isEditing: boolean;
  isLatestPrompt?: boolean;
  onEditStart: () => void;
  onEditCancel: () => void;
  onEditComplete?: (newPrompt: string) => void;
  onRegenerateFromEdit?: (newPrompt: string, index: number) => void;
}

export const UserPromptBubble: React.FC<UserPromptBubbleProps> = ({
  prompt,
  index,
  isEditing,
  isLatestPrompt,
  onEditStart,
  onEditCancel,
  onEditComplete,
  onRegenerateFromEdit,
}) => {
  const [editedPrompt, setEditedPrompt] = useState(prompt);
  const [bubbleWidth, setBubbleWidth] = useState('auto');
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditedPrompt(prompt);
  }, [prompt]);

  const calculateOptimalWidth = React.useCallback((text: string, forceHoverState?: boolean) => {
    const maxWidth = window.innerWidth * 0.75;
    const isMobile = window.innerWidth <= 768;
    
    const span = document.createElement('span');
    span.style.visibility = 'hidden';
    span.style.position = 'absolute';
    span.style.whiteSpace = 'pre-wrap';
    span.style.fontSize = isMobile ? '16px' : '14px';
    span.style.padding = '12px';
    span.style.lineHeight = '1.5';
    span.style.wordBreak = 'break-all';
    span.style.maxWidth = `${maxWidth}px`;
    span.style.display = 'inline-block';
    span.textContent = text;
    document.body.appendChild(span);
    
    const textWidth = span.offsetWidth;
    document.body.removeChild(span);
    
    const bufferSpace = (!isEditing && !forceHoverState && !isMobile) ? 6 : 0;
    const extraPadding = (isEditing || (isLatestPrompt && forceHoverState && !isMobile)) ? 36 : 0;
    const optimalWidth = textWidth + extraPadding + bufferSpace;
    
    if (text.length < 50 && !isMobile) {
      return `${Math.min(optimalWidth, maxWidth * 0.4)}px`;
    }
    
    return `${Math.min(optimalWidth, maxWidth)}px`;
  }, [isEditing, isLatestPrompt]);

  useEffect(() => {
    const calculateInitialWidth = () => {
      const nonHoverWidth = calculateOptimalWidth(prompt, false);
      setBubbleWidth(nonHoverWidth);
    };
    
    calculateInitialWidth();
  }, [prompt, calculateOptimalWidth]);

  const adjustTextareaHeight = React.useCallback((element: HTMLTextAreaElement) => {
    element.style.height = '24px';
    const scrollHeight = element.scrollHeight;
    const lineHeight = parseInt(window.getComputedStyle(element).lineHeight);
    const maxHeight = Math.min(window.innerHeight * 0.4, lineHeight * 10);
    element.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    
    if (scrollHeight > maxHeight) {
      element.style.overflowY = 'auto';
    } else {
      element.style.overflowY = 'hidden';
    }

    const width = calculateOptimalWidth(element.value, true);
    setBubbleWidth(width);
  }, [calculateOptimalWidth]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      adjustTextareaHeight(textareaRef.current);
    }
  }, [isEditing, editedPrompt, adjustTextareaHeight]);

  const handleEditCancel = React.useCallback(() => {
    onEditCancel();
    setEditedPrompt(prompt);
    setIsHovered(false);
    setBubbleWidth(calculateOptimalWidth(prompt, false));
  }, [onEditCancel, prompt, calculateOptimalWidth]);

  const handleEditComplete = React.useCallback(() => {
    const trimmedPrompt = editedPrompt.trim();
    if (trimmedPrompt !== '' && trimmedPrompt !== prompt) {
      setEditedPrompt(trimmedPrompt);
      onEditComplete?.(trimmedPrompt);
      
      setTimeout(() => {
        onRegenerateFromEdit?.(trimmedPrompt, index);
      }, 0);
    }
    setIsHovered(false);
    setBubbleWidth(calculateOptimalWidth(trimmedPrompt, false));
  }, [editedPrompt, prompt, onEditComplete, onRegenerateFromEdit, index, calculateOptimalWidth]);

  const handleEditStart = () => {
    amplitude.track('Editing Prompt', {
      promptLength: prompt.length,
      isLatestPrompt
    });
    onEditStart();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditing && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleEditCancel();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isEditing) return;
      
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleEditComplete();
      } else if (event.key === 'Escape') {
        handleEditCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditing, handleEditCancel, handleEditComplete]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [isEditing]);

  return (
    <div className="flex justify-end mb-4">
      <div 
        ref={containerRef}
        className="relative rounded bg-gray-100 group inline-block transition-all duration-200"
        style={{ 
          width: bubbleWidth,
          maxWidth: '75%'
        }}
        onMouseEnter={() => {
          setIsHovered(true);
          setBubbleWidth(calculateOptimalWidth(prompt, true));
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setBubbleWidth(calculateOptimalWidth(prompt, false));
        }}
      >
        {isEditing ? (
          <div className="p-3 relative">
            <textarea
              ref={textareaRef}
              value={editedPrompt}
              onChange={(e) => {
                setEditedPrompt(e.target.value);
                adjustTextareaHeight(e.target);
              }}
              className="w-full bg-transparent outline-none resize-none text-sm"
              autoFocus
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2">
              <button
                onClick={handleEditComplete}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
              <button
                onClick={handleEditCancel}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 text-sm relative group">
            {prompt}
            {isLatestPrompt && !isEditing && isHovered && window.innerWidth > 768 && (
              <button
                onClick={handleEditStart}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 opacity-0 group-hover:opacity-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 