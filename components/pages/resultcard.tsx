import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { getAllModels, Model, getProviderForModel } from '@/config/models';
import Image from 'next/image';

interface ResultCardProps {
  index: number;
  models: string[];
  results: string[];
  handleModelChange: (index: number, value: string) => void;
}

const ResultCard: React.FC<ResultCardProps> = React.memo(
  ({ index, models, results, handleModelChange }) => {
    const [modelOptions, setModelOptions] = useState<Model[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      setModelOptions(getAllModels());
    }, []);

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      }
    }, [results[index]]);

    const selectedModel = modelOptions.find(model => model.id === models[index]);
    const selectedProvider = selectedModel ? getProviderForModel(selectedModel.id) : null;

    return (
      <Card className={cn('flex flex-col h-full max-h-[calc(100vh-300px)]', 'transition-all duration-200')}>
        <CardHeader className="flex items-center justify-between p-2">
          <Select value={models[index]} onValueChange={(value) => handleModelChange(index, value)}>
            <SelectTrigger className="w-full">
              <div className="flex items-center gap-2">
                {selectedProvider && (
                  <Image
                    src={selectedProvider.avatar}
                    alt={`${selectedProvider.nickname} avatar`}
                    width={16}
                    height={16}
                    className="rounded-full"
                  />
                )}
                <span>{selectedModel?.displayName}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {modelOptions.map((model) => {
                const provider = getProviderForModel(model.id);
                return (
                  <SelectItem 
                    key={model.id} 
                    value={model.id} 
                    className="px-2"
                    disabled={models.includes(model.id) && model.id !== models[index]}
                  >
                    <div className="flex items-center gap-2">
                      {provider && (
                        <Image
                          src={provider.avatar}
                          alt={`${provider.nickname} avatar`}
                          width={16}
                          height={16}
                          className="rounded-full"
                        />
                      )}
                      <span>{model.displayName}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-1 overflow-y-auto">
          <Textarea
            value={results[index]}
            className="h-full w-full text-xs-custom"
            aria-placeholder="Response will appear here..."
          />
        </CardContent>
      </Card>
    );
  }
);

ResultCard.displayName = 'ResultCard';

export default ResultCard;
