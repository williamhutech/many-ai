import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { getProviderForModel } from '@/config/models';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import * as amplitude from '@amplitude/analytics-browser';

interface ResultCardProps {
  index: number;
  models: string[];
  results: string[];
  conversationIndex?: number;
  isStreaming?: boolean;
  isFusionCard?: boolean;
  fusionResult?: string;
  isFusionLoading?: boolean;
  showAllModels?: boolean;
  onToggleShowAllModels?: () => void;
  onRegenerate?: (index: number | null) => void;
  isRegenerating?: boolean;
  isLatestConversation?: boolean;
  conversation?: {
    id: string;
    timestamp: string;
  };
}

export const ResultCard = ({
  index,
  models,
  results,
  conversationIndex,
  isStreaming,
  isFusionCard,
  fusionResult,
  isFusionLoading,
  showAllModels,
  onToggleShowAllModels,
  onRegenerate,
  isRegenerating,
  isLatestConversation,
}: ResultCardProps) => {
  const textareaRef = useRef<HTMLDivElement>(null);

  const shouldShowStreaming = isLatestConversation && isStreaming;

  const selectedModel = isFusionCard ? '' : models[index];
  const selectedProvider = isFusionCard ? null : getProviderForModel(selectedModel);

  // Track both streaming and content states
  const [localContent, setLocalContent] = useState('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  const currentResult = isFusionCard
    ? fusionResult
    : results && results[index]
    ? results[index]
    : '';
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    if (textareaRef.current && currentResult) {
      textareaRef.current.scrollTop = 0;
    }
  }, [currentResult]);

  // Update the timeout to 1.0 seconds for smoother but faster transition
  useEffect(() => {
    if (hasCopied) {
      const timer = setTimeout(() => {
        setHasCopied(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasCopied]);

  // Update local content when result changes
  useEffect(() => {
    setLocalContent(currentResult || '');
  }, [currentResult]);

  // Handle loading state
  useEffect(() => {
    if (isLatestConversation) {
      if (isFusionCard) {
        // Show loading for fusion card when either fusion is loading OR any model is still streaming
        setIsLoadingContent(Boolean(isFusionLoading || isStreaming));
      } else {
        // For individual model cards, only show loading for that specific model
        const isModelStreaming = isStreaming && !isFusionLoading;
        setIsLoadingContent(Boolean(isModelStreaming || isRegenerating));
      }
    } else {
      setIsLoadingContent(false);
    }
  }, [isStreaming, isFusionLoading, isLatestConversation, isFusionCard, isRegenerating]);

  const handleCopy = async () => {
    if (!currentResult) return;

    try {
      // Create temporary container for HTML conversion
      const container = document.createElement('div');
      const tempDiv = document.createElement('div');
      document.body.appendChild(tempDiv); // Temporarily add to DOM

      // Convert Markdown to formatted text while preserving formatting
      let formattedText = currentResult
        // Preserve paragraphs first (convert double newlines to <p> tags)
        .replace(/\n\s*\n/g, '</p><p>')
        // Convert bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Convert italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        // Convert headers with proper spacing - using temp element for proper parsing
        .replace(/^# (.*$)/gm, (match, p1) => {
          tempDiv.innerHTML = `<div style="font-size: 2em; font-weight: bold; margin: 0.67em 0;">${p1}</div>`;
          return tempDiv.innerHTML;
        })
        .replace(/^## (.*$)/gm, (match, p1) => {
          tempDiv.innerHTML = `<div style="font-size: 1.5em; font-weight: bold; margin: 0.83em 0;">${p1}</div>`;
          return tempDiv.innerHTML;
        })
        .replace(/^### (.*$)/gm, (match, p1) => {
          tempDiv.innerHTML = `<div style="font-size: 1.17em; font-weight: bold; margin: 1em 0;">${p1}</div>`;
          return tempDiv.innerHTML;
        })
        // Convert blockquotes with spacing
        .replace(/^\> (.*$)/gm, '<blockquote>$1</blockquote><br>')
        // Convert code blocks with spacing
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre><br>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        // Convert lists with proper spacing
        .replace(/^\- (.*$)/gm, '<li>$1</li>')
        .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
        // Wrap lists in ul/ol tags
        .replace(/(<li>.*<\/li>)\n/g, '<ul>$1</ul><br>')
        // Convert links
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
        // Handle single line breaks
        .replace(/([^\n])\n([^\n])/g, '$1<br>$2')
        // Normalize spacing between elements
        .replace(/>(\s*)</g, '>\n<')
        // Wrap in paragraph if not already wrapped
        .replace(/^(.+?)$/, '<p>$1</p>');

      // Clean up any empty paragraphs
      formattedText = formattedText
        .replace(/<p>\s*<\/p>/g, '')
        .replace(/<br>\s*<br>/g, '<br>');

      // Clean up temp element
      document.body.removeChild(tempDiv);

      // Set the HTML content
      container.innerHTML = formattedText;

      // Create a clipboard item with both HTML and plain text formats
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([container.innerHTML], { type: 'text/html' }),
        'text/plain': new Blob([container.textContent || ''], { type: 'text/plain' })
      });

      await navigator.clipboard.write([clipboardItem]);
      setHasCopied(true);

      // Track copy event
      amplitude.track('Response Copied', {
        isFusionCard,
        contentLength: formattedText.length,
        modelName: isFusionCard ? 'ManyAI' : selectedProvider?.nickname
      });
    } catch (err) {
      // Fallback to plain text if rich copy fails
      try {
        const plainText = currentResult.replace(/\*\*/g, '').replace(/\*/g, '');
        await navigator.clipboard.writeText(plainText);
        setHasCopied(true);
      } catch (fallbackErr) {
        console.error('Failed to copy text:', err);
      }
    }
  };

  const replacePersonWithNickname = (text: string) => {
    if (!text) return '';
    let modifiedText = text;
    models.forEach((modelId, index) => {
      const provider = getProviderForModel(modelId);
      if (provider) {
        const regexPerson = new RegExp(`Person ${index + 1}`, 'g');
        const regexName = new RegExp(
          `${index === 0 ? 'Anny' : index === 1 ? 'Bella' : 'Clarice'}`,
          'g'
        );
        modifiedText = modifiedText
          .replace(regexPerson, provider.nickname)
          .replace(regexName, provider.nickname);
      }
    });
    return modifiedText;
  };

  const ContentSkeletonLoader = () => (
    <div className="animate-pulse space-y-2 p-4">
      <div className="space-y-2">
        <div className="h-4 bg-zinc-100 rounded w-[100%]"></div>
        <div className="h-4 bg-zinc-100 rounded w-[100%]"></div>
        <div className="h-4 bg-zinc-100 rounded w-[95%]"></div>
      </div>
    </div>
  );

  const handleToggleShowAllModels = () => {
    amplitude.track('Toggle Model View', {
      action: showAllModels ? 'show_less' : 'show_more',
      modelCount: models.length,
    });
    if (onToggleShowAllModels) {
      onToggleShowAllModels();
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center justify-between p-5 pb-0">
        <div className="flex items-center gap-3">
          {isFusionCard ? (
            <>
              <Image
                src="/avatars/manyai.png"
                alt="ManyAI avatar"
                width={32}
                height={32}
                className="rounded-full border border-zinc-150"
                style={{ marginLeft: '8px' }}
                priority
              />
              <span className="text-sm font-semibold">ManyAI</span>
            </>
          ) : (
            selectedProvider && (
              <>
                <Image
                  src={selectedProvider.avatar}
                  alt={`${selectedProvider.nickname} avatar`}
                  width={32}
                  height={32}
                  className="rounded-full border border-zinc-150"
                  style={{ marginLeft: '8px' }}
                  priority
                />
                <span className="text-sm font-semibold">{selectedProvider?.nickname}</span>
              </>
            )
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="xs"
            className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors"
            onClick={() => onRegenerate?.(isFusionCard ? null : index)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-zinc-400"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors"
            onClick={handleCopy}
          >
            {hasCopied ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-zinc-400"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-zinc-400"
              >
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
            )}
          </Button>
          {isFusionCard && (
            <button
              onClick={onToggleShowAllModels}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors hide-on-mobile"
            >
              {showAllModels ? (
                <>
                  Show Less
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m18 15-6-6-6 6" />
                  </svg>
                </>
              ) : (
                <>
                  Show More
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </div>
      <CardContent className="flex-1 overflow-y-auto p-5 pt-1 relative">
        {(isLoadingContent || isRegenerating) ? (
          <ContentSkeletonLoader />
        ) : (
          <Textarea
            ref={textareaRef}
            value={
              isFusionCard
                ? replacePersonWithNickname(localContent || '')
                : localContent || ''
            }
            className="w-full text-sm text-gray-700"
            style={{ maxHeight: '300px', overflowY: 'auto', resize: 'none' }}
            aria-placeholder="Response will appear here..."
          />
        )}
      </CardContent>
    </Card>
  );
};

ResultCard.displayName = 'ResultCard';

export default ResultCard;
