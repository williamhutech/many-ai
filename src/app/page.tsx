"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getAllModels, Model } from '@/config/models';

export default function SDKPlayground() {
  const defaultModels = ['gemini-1.5-pro-002', 'gpt-4o-2024-08-06', 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo'];

  // Initialize state variables for models, input, results, loading, session, and conversation histories
  const [models, setModels] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const storedModels = localStorage.getItem('selectedModels');
      return storedModels ? JSON.parse(storedModels) : defaultModels;
    }
    return defaultModels;
  });
  const [input, setInput] = useState('');
  const [results, setResults] = useState(['', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [conversationHistories, setConversationHistories] = useState<{ [modelId: string]: Array<{ role: string; content: string }> }>({});
  const [showCopiedPopup, setShowCopiedPopup] = useState(false);

  // Refresh the webpage when the title is clicked
  const handleTitleClick = () => {
    window.location.reload();
  };

  // Set up a new session and clear conversation histories on component mount
  useEffect(() => {
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    localStorage.removeItem('haikuHistory');
    localStorage.removeItem('sonnetHistory');
    localStorage.removeItem('gpt4oHistory');
    setConversationHistories({});
  }, []);

  // Update local storage when models change
  useEffect(() => {
    localStorage.setItem('selectedModels', JSON.stringify(models));
  }, [models]);

  // Update the selected model for a specific index
  const handleModelChange = (index: number, value: string) => {
    const newModels = [...models];
    newModels[index] = value;
    setModels(newModels);
    localStorage.setItem('selectedModels', JSON.stringify(newModels));
  };

  // Handle form submission and fetch responses from selected models
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) return;
    setIsLoading(true);
    const currentInput = input;
    setInput('');

    // Function to fetch response for a single model
    const fetchModelResponse = async (index: number) => {
      const modelId = models[index];
      try {
        console.log(`Sending request for model: ${modelId}`);
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: currentInput,
            sessionId,
            conversationHistories,
            selectedModel: modelId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate response');
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let modelResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  modelResponse += data.content;
                  setResults(prevResults => {
                    const newResults = [...prevResults];
                    newResults[index] = modelResponse;
                    return newResults;
                  });
                } else if (data.error) {
                  throw new Error(data.error);
                }
              } catch (error) {
                console.error('Error parsing JSON:', error);
              }
            }
          }
        }

        // Update conversation histories
        setConversationHistories(prev => {
          const history = prev[modelId] || [];
          return {
            ...prev,
            [modelId]: [
              ...history,
              { role: 'user', content: currentInput },
              { role: 'assistant', content: modelResponse },
            ],
          };
        });
      } catch (error) {
        console.error(`Error fetching response for ${modelId}:`, error);
        setResults(prevResults => {
          const newResults = [...prevResults];
          newResults[index] = `Error: ${error instanceof Error ? error.message : 'Failed to fetch response'}`;
          return newResults;
        });
      }
    };

    // Fetch responses from all models simultaneously
    await Promise.all(models.map((_, index) => fetchModelResponse(index)));
    setIsLoading(false);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setShowCopiedPopup(true);
      setTimeout(() => setShowCopiedPopup(false), 2000);
    });
  };

  // Render the user interface with header, main content, and footer
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-10 py-3">
        <h1 className="text-lg font-semibold font-inter">
          <span 
            className="cursor-pointer" 
            onClick={handleTitleClick}
          >
            AI Teamwork
          </span>
        </h1>
      </header>

      {/* Main content area with result cards */}
      <main className="flex-1 container mx-auto p-6 overflow-hidden">
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <ResultCard key={index} index={index} models={models} results={results} handleModelChange={handleModelChange} handleCopy={handleCopy} />
          ))}
        </div>
      </main>

      {/* Footer with input form */}
      <footer className="bg-gray-50 border-t border-border px-10 py-4">
        <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4">
          <div className="w-full flex items-end space-x-4">
            <div className="flex-1">
              <Input
                id="message-input"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.currentTarget.style.height = 'auto';
                  e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                }}
                onSubmit={handleSubmit}
                placeholder={results.some(result => result !== '') ? input : 'Enter your message...'}
                className="w-full placeholder-gray-500 placeholder-opacity-100 focus:placeholder-opacity-0"
              />
            </div>
            <Button type="submit" disabled={isLoading} className="px-6 py-2 min-w-[40px]">
              {isLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent inline-block"></span>
                  Generating...
                </>
              ) : (
                'Send'
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 text-center">
            AI can make mistakes. Check important info.
          </p>
        </form>
      </footer>

      {showCopiedPopup && (
        <div className="fixed bottom-4 left-4 bg-gray-100 text-gray-600 px-3 py-2 rounded-md text-xs z-50 copied-popup font-regular">
          Copied to Clipboard
        </div>
      )}
    </div>
  );
}

// Render a card component for displaying model results
const ResultCard = ({ index, models, results, handleModelChange, handleCopy }: {
  index: number;
  models: string[];
  results: string[];
  handleModelChange: (index: number, value: string) => void;
  handleCopy: (content: string) => void;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [modelOptions, setModelOptions] = useState<Model[]>([]);

  useEffect(() => {
    setModelOptions(getAllModels());
  }, []);

  useEffect(() => {
    const handleCopyEvent = (e: ClipboardEvent) => {
      if (isHovering) {
        e.preventDefault();
        handleCopy(results[index]);
      }
    };

    document.addEventListener('copy', handleCopyEvent);

    return () => {
      document.removeEventListener('copy', handleCopyEvent);
    };
  }, [index, isHovering, results, handleCopy]);

  return (
    <Card 
      className={cn(
        "flex flex-col h-full max-h-[calc(100vh-250px)]",
        "hover:border-gray-500 hover:ring-0.5 hover:ring-gray-500 dark:hover:border-gray-300 dark:hover:ring-gray-300",
        "transition-all duration-200"
      )}
      ref={cardRef}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <CardHeader className="flex items-center justify-between p-4">
        <Select
          value={models[index]}
          onValueChange={(value) => handleModelChange(index, value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {modelOptions.map(model => (
              <SelectItem key={model.id} value={model.id} className="px-2">
                {model.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-1 max-h-[calc(100vh-300px)] overflow-y-auto">
        <Textarea
          value={results[index]}
          className="h-full w-full text-xs-custom"
          aria-placeholder="Response will appear here..."
        />
      </CardContent>
    </Card>
  );
};