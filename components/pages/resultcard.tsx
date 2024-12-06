import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { getProviderForModel } from '@/config/models';
import Image from 'next/image';

interface ResultCardProps {
  index: number;
  models: string[];
  results: string[];
  isStreaming?: boolean;
  isFusionCard?: boolean;
  fusionResult?: string;
  isFusionLoading?: boolean;
}

const ResultCard: React.FC<ResultCardProps> = React.memo(
  ({ index, models, results, isStreaming, isFusionCard, fusionResult, isFusionLoading }) => {
    const textareaRef = useRef<HTMLDivElement>(null);
    const currentResult = isFusionCard ? fusionResult : results[index];
    
    useEffect(() => {
      if (textareaRef.current && currentResult) {
        textareaRef.current.scrollTop = 0;
      }
    }, [currentResult]);

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

    return (
      <Card className="flex flex-col h-full">
        <div className="flex items-center gap-3 p-5 pb-0">
          {isFusionCard ? (
            <>
              <Image
                src="/avatars/manyai.png"
                alt="ManyAI avatar"
                width={32}
                height={32}
                className="rounded-full border border-zinc-150"
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
        <CardContent className="flex-1 overflow-y-auto p-5 pt-1 relative">
          {(isStreaming && !currentResult && !isFusionCard) || (isFusionCard && (isFusionLoading || !currentResult)) ? (
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
);

ResultCard.displayName = 'ResultCard';

export default ResultCard;
