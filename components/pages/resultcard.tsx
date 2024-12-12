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

export const ResultCard: React.FC<ResultCardProps> = 
  ({ index, models, results, conversationIndex, isStreaming, isFusionCard, fusionResult, isFusionLoading, showAllModels, onToggleShowAllModels, onRegenerate, isRegenerating, isLatestConversation }) => {
    const textareaRef = useRef<HTMLDivElement>(null);
    
    const shouldShowStreaming = isLatestConversation && isStreaming;
    
    const currentResult = isFusionCard ? fusionResult : (results && results[index] ? results[index] : '');
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

    const handleCopy = async () => {
      if (!currentResult) return;
      const contentToCopy = currentResult.split('---')[0];
      
      try {
        await navigator.clipboard.writeText(contentToCopy.trim());
        setHasCopied(true);
        
        // Track copy event
        amplitude.track('Response Copied', {
          isFusionCard,
          contentLength: contentToCopy.trim().length,
          modelName: isFusionCard ? 'ManyAI' : selectedProvider?.nickname
        });
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    };

    const replacePersonWithNickname = (text: string) => {
      if (!text) return '';
      let modifiedText = text;
      models.forEach((modelId, index) => {
        const provider = getProviderForModel(modelId);
        if (provider) {
          const regexPerson = new RegExp(`Person ${index + 1}`, 'g');
          const regexName = new RegExp(`${index === 0 ? 'Anny' : index === 1 ? 'Ben' : 'Clarice'}`, 'g');
          modifiedText = modifiedText
            .replace(regexPerson, provider.nickname)
            .replace(regexName, provider.nickname);
        }
      });
      return modifiedText;
    };
    const selectedModel = isFusionCard ? '' : models[index];
    const selectedProvider = isFusionCard ? null : getProviderForModel(selectedModel);

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
                      <path d="m18 15-6-6-6 6"/>
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
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        <CardContent className="flex-1 overflow-y-auto p-5 pt-1 relative">
          {((shouldShowStreaming && isStreaming) || 
             (isFusionCard && (isFusionLoading || !currentResult)) ||
             isRegenerating) ? (
            <ContentSkeletonLoader />
          ) : (
            <Textarea
              ref={textareaRef}
              value={isFusionCard ? replacePersonWithNickname(currentResult || '') : (currentResult || '')}
              className="w-full text-sm text-gray-700"
              style={{ maxHeight: '300px', overflowY: 'auto', resize: 'none' }}
              aria-placeholder="Response will appear here..."
            />
          )}
        </CardContent>
      </Card>
    );
  }
;

ResultCard.displayName = 'ResultCard';

export default ResultCard;
