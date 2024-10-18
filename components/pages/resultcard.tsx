import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { getAllModels, Model } from '@/config/models';

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

    return (
      <Card className={cn('flex flex-col h-full max-h-[calc(100vh-300px)]', 'transition-all duration-200')}>
        <CardHeader className="flex items-center justify-between p-2">
          <Select value={models[index]} onValueChange={(value) => handleModelChange(index, value)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {modelOptions.map((model) => (
                <SelectItem 
                  key={model.id} 
                  value={model.id} 
                  className="px-2"
                  disabled={models.includes(model.id) && model.id !== models[index]}
                >
                  {model.displayName}
                </SelectItem>
              ))}
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
