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
}

const ResultCard: React.FC<ResultCardProps> = React.memo(
  ({ index, models, results, isStreaming }) => {
    const textareaRef = useRef<HTMLDivElement>(null);
    const currentResult = results[index];
    
    useEffect(() => {
      if (textareaRef.current && currentResult) {
        textareaRef.current.scrollTop = 0;
      }
    }, [currentResult]);

    const selectedModel = models[index];
    const selectedProvider = getProviderForModel(selectedModel);

    return (
      <Card className="flex flex-col h-full">
        <div className="flex items-center gap-3 p-5 pb-0">
          {selectedProvider && (
            <Image
              src={selectedProvider.avatar}
              alt={`${selectedProvider.nickname} avatar`}
              width={32}
              height={32}
              className="rounded-full border border-zinc-150"
              style={{ marginLeft: '8px' }}
            />
          )}
          <span className="text-sm font-semibold">{selectedProvider?.nickname}</span>
        </div>
        <CardContent className="flex-1 overflow-y-auto p-5 pt-1 relative">
          {isStreaming && !currentResult && (
            <div className="absolute inset-0 bg-white">
              <div className="animate-pulse space-y-2 p-4">
                {/* First paragraph */}
                <div className="space-y-2">
                  <div className="h-4 bg-zinc-100 rounded w-[100%]"></div>
                  <div className="h-4 bg-zinc-100 rounded w-[100%]"></div>
                  <div className="h-4 bg-zinc-100 rounded w-[95%]"></div>
                </div>
              </div>
            </div>
          )}
          <Textarea
            ref={textareaRef}
            value={currentResult}
            className="w-full text-sm text-gray-700"
            style={{ maxHeight: '300px', overflowY: 'auto', resize: 'none' }}
            aria-placeholder="Response will appear here..."
          />
        </CardContent>
      </Card>
    );
  }
);

ResultCard.displayName = 'ResultCard';

export default ResultCard;
