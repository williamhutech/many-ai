"use client";

import { useState, useEffect, useRef } from 'react';
import * as amplitude from '@amplitude/analytics-browser';
import { sessionReplayPlugin } from '@amplitude/plugin-session-replay-browser';
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
import { getAllModels, Model, getProviderForModel } from '@/config/models';

export default function SDKPlayground() {
  const defaultModels = ['gemini-1.5-pro-002', 'gpt-4o-2024-08-06', 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo'];

  // Initialize state variables
  const [models, setModels] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const storedModels = localStorage.getItem('selectedModels');
      return storedModels ? JSON.parse(storedModels) : defaultModels;
    }
    return defaultModels;
  });
  const [input, setInput] = useState('');
  const [conversations, setConversations] = useState<Array<{ prompt: string, results: string[] }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [conversationHistories, setConversationHistories] = useState<{ [modelId: string]: Array<{ role: string; content: string }> }>({});
  const [showCopiedPopup, setShowCopiedPopup] = useState(false);
  const latestConversationRef = useRef<HTMLDivElement>(null);
  const [isInitialState, setIsInitialState] = useState(true);
  const [isDismissing, setIsDismissing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [streamingModels, setStreamingModels] = useState<string[]>([]);

  // Initialize Amplitude when the component mounts
  useEffect(() => {
    const sessionReplayTracking = sessionReplayPlugin();
    amplitude.add(sessionReplayTracking);

    amplitude.init('1c41ff2fec59f888fb92fd241eeafe66', undefined, {
      defaultTracking: {
        sessions: true,
        pageViews: true,
        formInteractions: true,
        fileDownloads: true,
      },
    });
  }, []);

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
    const existingIndex = newModels.findIndex(model => model === value);

    if (existingIndex !== -1 && existingIndex !== index) {
      // Swap the models
      [newModels[index], newModels[existingIndex]] = [newModels[existingIndex], newModels[index]];
    } else {
      newModels[index] = value;
    }

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
    
    // Reset input box height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    
    if (isInitialState) {
      setIsDismissing(true);
      setTimeout(() => {
        setIsInitialState(false);
        setIsDismissing(false);
      }, 250); // Match this duration with the CSS animation duration
    }

    // Track prompt submission event
    amplitude.track('Prompt Submitted', {
      promptLength: currentInput.length,
      selectedModels: models,
    });

    // Add new conversation entry
    setConversations(prev => [...prev, { prompt: currentInput, results: ['', '', ''] }]);

    // Function to fetch response for a single model
    const fetchModelResponse = async (index: number) => {
      const modelId = models[index];
      const provider = getProviderForModel(modelId);
      if (!provider) return;

      setStreamingModels(prev => [...prev, provider.nickname]);

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
                  setConversations(prev => {
                    const newConversations = [...prev];
                    newConversations[newConversations.length - 1].results[index] = modelResponse;
                    return newConversations;
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
        setConversations(prev => {
          const newConversations = [...prev];
          newConversations[newConversations.length - 1].results[index] = `Error: ${error instanceof Error ? error.message : 'Failed to fetch response'}`;
          return newConversations;
        });
      } finally {
        setStreamingModels(prev => prev.filter(m => m !== provider.nickname));
      }
    };

    // Fetch responses from all models simultaneously
    await Promise.all(models.map((_, index) => fetchModelResponse(index)));

    setIsLoading(false);
  };

  useEffect(() => {
    if (latestConversationRef.current) {
      latestConversationRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversations]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [isInitialState]);

  // Render the user interface with header, main content, and footer
  return (
    <div className="flex flex-col h-screen">
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

      {/* Main content area with conversation history and result cards */}
      <main className={cn(
        "flex-1 w-full overflow-y-auto pb-32",
        isInitialState ? "flex items-center justify-center" : ""
      )}>
        <div className="container mx-auto p-6">
          {(isInitialState || isDismissing) ? (
            <div className={cn(
              "transition-opacity duration-500",
              isDismissing ? "opacity-0" : "opacity-100"
            )}>
              <InitialModelSelection models={models} handleModelChange={handleModelChange} />
            </div>
          ) : (
            <div className="space-y-6">
              {conversations.map((conversation, index) => (
                <div 
                  key={index} 
                  className="space-y-4"
                  ref={index === conversations.length - 1 ? latestConversationRef : null}
                >
                  {/* User's prompt speech bubble */}
                  <div className="flex justify-end mb-4">
                    <div className="max-w-3/4 p-3 rounded bg-gray-100">
                      <p className="text-sm text-gray-800">{conversation.prompt}</p>
                    </div>
                  </div>
                  {/* AI response cards */}
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {[0, 1, 2].map((modelIndex) => (
                      <ResultCard 
                        key={modelIndex} 
                        index={modelIndex} 
                        models={models} 
                        results={conversation.results} 
                        handleModelChange={handleModelChange} 
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer with input form */}
      <footer className="fixed bottom-0 left-0 right-0 bg-gray-50 border-t border-border px-10 py-4">
        <StreamingStatus streamingModels={streamingModels} />
        <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4">
          <div className="w-full flex items-end space-x-4">
            <div className="flex-1">
              <Input
                id="message-input"
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.currentTarget.style.height = 'auto';
                  e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                }}
                onSubmit={handleSubmit}
                placeholder="Enter your message..."
                className="w-full placeholder-gray-500 placeholder-opacity-100 focus:placeholder-opacity-0"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || input.trim() === ''}
              className={cn(
                "px-6 py-2 min-w-[40px]",
                (isLoading || input.trim() === '') && "opacity-50 cursor-not-allowed bg-gray-500"
              )}
            >
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
const ResultCard = ({ index, models, results, handleModelChange }: {
  index: number;
  models: string[];
  results: string[];
  handleModelChange: (index: number, value: string) => void;
}) => {
  const [modelOptions, setModelOptions] = useState<Model[]>([]);

  useEffect(() => {
    setModelOptions(getAllModels());
  }, []);

  return (
    <Card 
      className={cn(
        "flex flex-col h-full max-h-[calc(100vh-300px)]",
        "transition-all duration-200"
      )}
    >
      <CardHeader className="flex items-center justify-between p-2">
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
      <CardContent className="p-4 pt-0 flex-1 overflow-y-auto">
        <Textarea
          value={results[index]}
          className="h-full w-full text-xs-custom"
          aria-placeholder="Response will appear here..."
        />
      </CardContent>
    </Card>
  );
};

const InitialModelSelection = ({ models, handleModelChange }: {
  models: string[];
  handleModelChange: (index: number, value: string) => void;
}) => {
  const [modelOptions, setModelOptions] = useState<Model[]>([]);

  useEffect(() => {
    setModelOptions(getAllModels());
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-semibold text-center">
        Start by Selecting the Models You&apos;d like to Use:
      </h2>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full">
        {[0, 1, 2].map((index) => (
          <Card key={index} className="p-4">
            <Select
              value={models[index]}
              onValueChange={(value) => handleModelChange(index, value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {modelOptions.map(model => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
        ))}
      </div>
    </div>
  );
};

const StreamingStatus = ({ streamingModels }: { streamingModels: string[] }) => {
  if (streamingModels.length === 0) return null;

  const statusText = streamingModels.length === 1
    ? `${streamingModels[0]} is thinking...`
    : `${streamingModels.slice(0, -1).join(', ')} and ${streamingModels[streamingModels.length - 1]} are thinking...`;

  return (
    <div className="text-xs text-gray-500 mb-4">
      {statusText}
    </div>
  );
};