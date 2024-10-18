"use client";

import { useState, useEffect, useRef } from 'react';
import * as amplitude from '@amplitude/analytics-browser';
import { sessionReplayPlugin } from '@amplitude/plugin-session-replay-browser';
import { Button, Input, TruncatedText } from "@/components/ui";
import { cn } from "@/lib/utils";
import { getProviderForModel } from '@/config/models';
import { InitialModelSelection, StreamingStatus, ResultCard, FusionResult } from '@/components/pages';
import Image from 'next/image';

const Header = () => (
  <header className="bg-white border-b border-gray-100 px-10 py-3 flex justify-between items-center">
    <h1 className="text-lg font-semibold font-inter">
      <span className="cursor-pointer flex items-center" onClick={() => window.location.reload()}>
        <Image src="/logo.svg" alt="ManyAI Logo" width={32} height={32} className="mr-4" />
        {/* <Image src="/manyai_logo.svg" alt="ManyAI Logo" width={80} height={20} className="mr-2" /> */}
      </span>
    </h1>
    <div className="space-x-3">
      <div className="relative inline-block">
        <Button variant="outline" size="xs" className="text-xs group">
          v1.02
          <div className="absolute top-full left-0 mt-2 px-3 py-2 bg-black text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-[90vw] w-60 break-words whitespace-normal">
            <div className="font-semibold mb-1 text-left">What&apos;s New?</div>
            <ul className="list-disc list-inside text-left">
              <li>Dynamic UI for extremely long prompts</li>
              <li>Input box is now scrollable</li>
            </ul>
          </div>
        </Button>
      </div>
      <Button variant="outline" size="xs" className="text-xs">Log in</Button>
      <Button size="xs" className="text-xs">Sign Up</Button>
    </div>
  </header>
);

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
  const [conversations, setConversations] = useState<Array<{ prompt: string; results: string[] }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [conversationHistories, setConversationHistories] = useState<{ [modelId: string]: Array<{ role: string; content: string }> }>({});
  const [showCopiedPopup, setShowCopiedPopup] = useState(false);
  const latestConversationRef = useRef<HTMLDivElement>(null);
  const [isInitialState, setIsInitialState] = useState(true);
  const [isDismissing, setIsDismissing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [streamingModels, setStreamingModels] = useState<string[]>([]);
  const [isInitialFooter, setIsInitialFooter] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConsolidateEnabled, setIsConsolidateEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isConsolidateEnabled') === 'true';
    }
    return true;
  });
  const [isCompareEnabled, setIsCompareEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isCompareEnabled') === 'true';
    }
    return false;
  });
  const [isHighlightEnabled, setIsHighlightEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isHighlightEnabled') === 'true';
    }
    return false;
  });
  const [isSuggestMoreEnabled, setIsSuggestMoreEnabled] = useState(false);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [fusionResult, setFusionResult] = useState<string>('');
  const [isFusionLoading, setIsFusionLoading] = useState(false);
  const fusionResultRef = useRef<HTMLDivElement>(null);

  // Initialize Amplitude when the component mounts
  useEffect(() => {
    const sessionReplayTracking = sessionReplayPlugin();
    amplitude.add(sessionReplayTracking);

    amplitude.init(process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY || '', undefined, {
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
  const handleModelChange = (index: number, newModel: string) => {
    setModels(prevModels => {
      const newModels = [...prevModels];
      const oldModel = newModels[index];
      const existingIndex = newModels.indexOf(newModel);

      if (existingIndex !== -1) {
        // Swap the models
        newModels[existingIndex] = oldModel;
      }

      newModels[index] = newModel;

      // Update localStorage
      localStorage.setItem('selectedModels', JSON.stringify(newModels));

      return newModels;
    });
  };

  // Handle form submission and fetch responses from selected models
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInitialFooter(false);
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
      }, 250);
    }

    // Track prompt submission event
    amplitude.track('Prompt Submitted', {
      promptLength: currentInput.length,
      selectedModels: models,
    });

    // Add new conversation entry
    setConversations(prev => {
      const newConversations = [...prev, { prompt: currentInput, results: ['', '', ''] }];
      console.log('New conversation added:', newConversations);
      return newConversations;
    });

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
        let fullResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullResponse += chunk;

          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(5));
                if (data.content) {
                  modelResponse += data.content;
                  setConversations(prev => {
                    const newConversations = [...prev];
                    newConversations[newConversations.length - 1].results[index] = modelResponse;
                    console.log(`Updated conversation for ${modelId}:`, newConversations);
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

        console.log(`Full API response for ${modelId}:`, fullResponse);

        // Update conversation histories
        setConversationHistories(prev => {
          const history = prev[modelId] || [];
          const newHistory = [
            ...history,
            { role: 'user', content: currentInput },
            { role: 'assistant', content: modelResponse },
          ];
          console.log(`Updated conversation history for ${modelId}:`, newHistory);
          return {
            ...prev,
            [modelId]: newHistory,
          };
        });

        return modelResponse;
      } catch (error) {
        console.error(`Error fetching response for ${modelId}:`, error);
        setConversations(prev => {
          const newConversations = [...prev];
          newConversations[newConversations.length - 1].results[index] = `Error: ${error instanceof Error ? error.message : 'Failed to fetch response'}`;
          console.log(`Error updating conversation for ${modelId}:`, newConversations);
          return newConversations;
        });
        return '';
      } finally {
        setStreamingModels(prev => prev.filter(m => m !== provider.nickname));
      }
    };

    // Fetch responses from all models simultaneously
    const responses = await Promise.all(models.map((_, index) => fetchModelResponse(index)));

    // Update conversations with all responses
    setConversations(prev => {
      const newConversations = [...prev];
      newConversations[newConversations.length - 1].results = responses.filter((response): response is string => response !== undefined);
      console.log('Final updated conversations:', newConversations);
      return newConversations;
    });

    // Update conversation histories
    const updatedConversationHistories = { ...conversationHistories };
    models.forEach((modelId, index) => {
      const history = updatedConversationHistories[modelId] || [];
      updatedConversationHistories[modelId] = [
        ...history,
        { role: 'user', content: currentInput },
        { role: 'assistant', content: responses[index] || '' },
      ];
    });
    setConversationHistories(updatedConversationHistories);
    console.log('Final updated conversation histories:', updatedConversationHistories);

    // Check if a fusion button is active and trigger fusion
    if (activeButton) {
      console.log('Triggering fusion with active button:', activeButton);
      await handleFusion(activeButton, true, updatedConversationHistories);
    }

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

  useEffect(() => {
    if (fusionResultRef.current) {
      fusionResultRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [fusionResult]);

  // Update isStreaming state when streamingModels changes
  useEffect(() => {
    setIsStreaming(streamingModels.length > 0);
  }, [streamingModels]);

  const handleButtonClick = (buttonName: string) => {
    if (activeButton === buttonName) {
      setActiveButton(null);
      setFusionResult('');
      localStorage.removeItem(`is${buttonName}Enabled`);
      switch (buttonName) {
        case 'Consolidate':
          setIsConsolidateEnabled(false);
          break;
        case 'Compare':
          setIsCompareEnabled(false);
          break;
        case 'Highlight':
          setIsHighlightEnabled(false);
          break;
      }
    } else {
      setActiveButton(buttonName);
      localStorage.setItem(`is${buttonName}Enabled`, 'true');
      switch (buttonName) {
        case 'Consolidate':
          setIsConsolidateEnabled(true);
          break;
        case 'Compare':
          setIsCompareEnabled(true);
          break;
        case 'Highlight':
          setIsHighlightEnabled(true);
          break;
      }
      if (conversations.length > 0) {
        handleFusion(buttonName, false);
      }
    }
  };

  const handleFusion = async (buttonName: string, autoCall: boolean = false, latestConversationHistories?: { [modelId: string]: Array<{ role: string; content: string }> }) => {
    if (!autoCall) {
      setIsFusionLoading(true);
    }
    setFusionResult(''); // Clear previous fusion result immediately

    const historiesForFusion = latestConversationHistories || conversationHistories;

    if (Object.keys(historiesForFusion).length === 0) {
      console.error('No conversation histories available for fusion');
      setFusionResult('Error: No conversation histories available for fusion');
      setIsFusionLoading(false);
      return;
    }

    const latestPrompt = historiesForFusion[models[0]]?.slice(-2)[0]?.content || '';
    const latestResponses = models.map(modelId => 
      historiesForFusion[modelId]?.slice(-1)[0]?.content || ''
    );

    console.log('Latest prompt for fusion:', latestPrompt);
    console.log('Latest responses for fusion:', latestResponses);

    const prePrompts = {
      Consolidate: "Instruction: Generate a concise, executive-level summary of three different responses to the following question: [INSERT QUESTION HERE]\n\nYour summary should:\n\nBe brief and straight to the point\nUse bullet points or numbered lists for clarity\nHighlight key features or benefits for each option\nMention any standout or highlights\nFormat the summary for easy readability\nUse bold for key points that answer the questions where appropriate.\nUse italics for emphasis where appropriate.\n\nStructure of response:\n\nSummary (to be Bolded): [Summary of responses]\n\n1. [Name of Person] (Bold): [Summary of the Person's Response], and so on.",
      Compare: "[INSERT COMPARE PRE-PROMPT HERE]",
      Highlight: "[INSERT HIGHLIGHT PRE-PROMPT HERE]",
      Merge: "[INSERT FUSION PRE-PROMPT HERE]"
    };

    const fusionModel = 'gemini-1.5-flash-002';

    const prompt = `${prePrompts[buttonName as keyof typeof prePrompts]}\n\nThe Question: ${latestPrompt}\n\nPerson 1: ${latestResponses[0]}\nPerson 2: ${latestResponses[1]}\nPerson 3: ${latestResponses[2]}`;

    console.log('Fusion prompt:', prompt);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          sessionId,
          conversationHistories: {},
          selectedModel: fusionModel,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate Fusion response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(5));
                if (data.content) {
                  setFusionResult(prev => prev + data.content);
                }
              } catch (error) {
                console.error('Error parsing JSON:', error);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in Fusion:', error);
      setFusionResult('Error generating Fusion response');
    } finally {
      if (!autoCall) {
        setIsFusionLoading(false);
      }
      if (fusionResultRef.current) {
        fusionResultRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
  };

  // Render the user interface with header, main content, and footer
  return (
    <div className="flex flex-col h-screen">
      <Header />
      {/* Main content area with conversation history and result cards */}
      <main className={cn(
        "flex-1 w-full overflow-y-auto", // Remove pb-48 as we're using padding-bottom in CSS
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
                      <TruncatedText text={conversation.prompt} maxLines={3} />
                    </div>
                  </div>
                  {/* AI response cards */}
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {models.map((_, modelIndex) => (
                      <ResultCard 
                        key={modelIndex} 
                        index={modelIndex} 
                        models={models} 
                        results={conversation.results} 
                        handleModelChange={handleModelChange} 
                      />
                    ))}
                  </div>
                  {(activeButton || fusionResult) && (
                    <FusionResult
                      result={fusionResult}
                      isLoading={isFusionLoading}
                      ref={fusionResultRef}
                      models={models}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer with input form */}
      <footer className="bg-gray-50 border-t border-border px-10 py-4 z-10">
        <div className="flex justify-between items-center mb-4">
          {isStreaming || isFusionLoading ? (
            <StreamingStatus streamingModels={streamingModels} isFusionLoading={isFusionLoading} activeButton={activeButton} />
          ) : (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="xs"
                className="text-xs flex items-center"
                onClick={() => handleButtonClick('Consolidate')}
              >
                {activeButton === 'Consolidate' && (
                  <img
                    src="/status-enabled.svg"
                    alt="Enabled"
                    className="mr-2"
                  />
                )}
                Consolidate
              </Button>
              <Button
                variant="outline"
                size="xs"
                className="text-xs flex items-center"
                onClick={() => handleButtonClick('Compare')}
              >
                {activeButton === 'Compare' && (
                  <img
                    src="/status-enabled.svg"
                    alt="Enabled"
                    className="mr-2"
                  />
                )}
                Compare
              </Button>
              <Button
                variant="outline"
                size="xs"
                className="text-xs flex items-center"
                onClick={() => handleButtonClick('Highlight')}
              >
                {activeButton === 'Highlight' && (
                  <img
                    src="/status-enabled.svg"
                    alt="Enabled"
                    className="mr-2"
                  />
                )}
                Highlight
              </Button>
            </div>
          )}
        </div>
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
            {isInitialFooter
              ? "By prompting, you agree to our Terms and have read our Privacy Policy."
              : "AI make mistakes. That's why we're here for multi-model experiences."}
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
