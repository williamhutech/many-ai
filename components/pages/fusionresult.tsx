import React, { forwardRef, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { getProviderForModel } from '@/config/models';

interface FusionResultProps {
  result: string;
  isLoading: boolean;
  models: string[];
}

const FusionResult = forwardRef<HTMLDivElement, FusionResultProps>(
  ({ result, isLoading, models }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
        textarea.scrollTop = 0; // Scroll to the top
      }
    }, [result]);

    const replacePersonWithNickname = (text: string) => {
      let modifiedText = text;
      models.forEach((modelId, index) => {
        const provider = getProviderForModel(modelId);
        if (provider) {
          // Replace both formats (Person X and named characters)
          const regexPerson = new RegExp(`Person ${index + 1}`, 'g');
          const regexName = new RegExp(`${index === 0 ? 'Anny' : index === 1 ? 'Ben' : 'Clarice'}`, 'g');
          modifiedText = modifiedText
            .replace(regexPerson, provider.nickname)
            .replace(regexName, provider.nickname);
        }
      });
      return modifiedText;
    };

    const displayResult = replacePersonWithNickname(result);

    return (
      <Card className="mt-6 w-full mb-48 bg-white" ref={ref}>
        <CardContent className="p-4">
          <Textarea
            ref={ref}
            value={displayResult}
            className="w-full text-xs-custom overflow-y-auto"
            style={{ minHeight: '48px', maxHeight: '300px', resize: 'none' }}
          />
        </CardContent>
      </Card>
    );
  }
);

FusionResult.displayName = 'FusionResult';

export default FusionResult;
