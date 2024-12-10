"use client";

import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import * as amplitude from '@amplitude/analytics-browser';
import { sessionReplayPlugin } from '@amplitude/plugin-session-replay-browser';
import { Button, Input, TruncatedText, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui";
import { cn } from "@/lib/utils";
import { getProviderForModel } from '@/config/models';
import { InitialModelSelection, StreamingStatus, ResultCard } from '@/components/pages';
import Image from 'next/image';
import { getDefaultModels } from '@/config/models';
import MobileResultCarousel from '@/components/pages/mobileresultcarousel';

const Header = ({ mode, onModeChange, onNewChat }: { 
  mode: 'fast' | 'smart', 
  onModeChange: (mode: 'fast' | 'smart') => void,
  onNewChat: () => void 
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleModeChange = (newMode: string) => {
    const modeValue = newMode === 'Fast Model' ? 'fast' : 'smart';
    localStorage.setItem('modelMode', modeValue);
    onModeChange(modeValue);
  };

  const handleHistoryClick = () => {
    // Create and append overlay with fade-in animation
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black opacity-0 z-40 transition-opacity duration-300 ease-in-out';
    document.body.appendChild(overlay);

    // Create and append sidebar with slide-in animation
    const sidebar = document.createElement('div');
    sidebar.className = 'fixed left-0 top-0 h-full w-64 bg-white z-50 transform -translate-x-full transition-all duration-300 ease-in-out shadow-2xl';
    sidebar.innerHTML = `
      <div class="flex justify-between items-center p-4">
        <h2 class="text-base font-semibold font-inter pl-4 pt-1">Chat History</h2>
        <button class="text-gray-500 hover:text-gray-700 transition-colors duration-200" id="closeSidebar">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="absolute inset-0 flex items-center justify-center text-sm text-gray-500 mt-16">
        Feature coming soon!
      </div>
    `;
    document.body.appendChild(sidebar);

    // Prevent body scroll when sidebar is open
    document.body.style.overflow = 'hidden';

    // Trigger animations after a small delay
    requestAnimationFrame(() => {
      overlay.style.opacity = '0.5';
      sidebar.classList.remove('-translate-x-full');
    });

    // Add click handler to close with animations
    const handleClose = () => {
      overlay.style.opacity = '0';
      sidebar.classList.add('-translate-x-full');
      
      // Remove elements and restore body scroll after animation completes
      setTimeout(() => {
        document.body.style.overflow = '';
        // Add a small delay between opacity and removal
        setTimeout(() => {
          overlay.remove();
          sidebar.remove();
        }, 50);
      }, 300);
    };

    overlay.addEventListener('click', handleClose);
    sidebar.querySelector('#closeSidebar')?.addEventListener('click', handleClose);
  };

  return (
    <header className="bg-white px-4 sm:px-10 py-4 flex flex-wrap justify-between items-center gap-4 fixed top-0 left-0 right-0 z-50">
      <div className="flex space-x-3">
        <Button
          variant="outline"
          size="xs"
          className="rounded-lg p-2"
          onClick={handleHistoryClick}
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
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </Button>
        <Button
          variant="outline"
          size="xs"
          className="text-xs"
          onClick={onNewChat}
        >
          + New Chat
        </Button>
      </div>
      <div className="flex items-center space-x-3">
        <Select 
          value={mounted ? (mode === 'fast' ? 'Fast Model' : 'Smart Model') : undefined} 
          onValueChange={handleModeChange}
        >
          <SelectTrigger className="h-8 text-xs border border-zinc-200 bg-white w-auto px-3 font-inter">
            {mounted ? (mode === 'fast' ? 'Fast Model' : 'Smart Model') : ''}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Fast Model" className="text-xs font-inter">
              <div>
                <div>Fast Model</div>
                <div className="text-gray-500 text-[10px]">Prioritising fastest experience</div>
              </div>
            </SelectItem>
            <SelectItem value="Smart Model" className="text-xs font-inter">
              <div>
                <div>Smart Model</div>
                <div className="text-gray-500 text-[10px]">Giving models some time to think</div>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <div className="hidden sm:block">
          <Button variant="outline" size="xs" className="text-xs group relative">
            v2.1
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full mt-2 px-3 py-2 bg-black text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-[90vw] w-60 break-words whitespace-normal">
              <div className="font-semibold mb-1 text-left">What&apos;s New?</div>
              <ul className="list-disc list-inside text-left">
                <li>Brand new design</li>
                <li>Redesigned mobile experience</li>
                <li>Offers vastly better multi-model response</li>
                <li>Offers fast and smart models</li>
              </ul>
            </div>
          </Button>
        </div>
        <Button size="xs" className="text-xs">Sign Up</Button>
      </div>
    </header>
  );
};

export default function SDKPlayground() {
  // Initialize mode from localStorage or default to 'fast'
  const [mode, setMode] = useState<'fast' | 'smart'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('modelMode') as 'fast' | 'smart') || 'fast';
    }
    return 'fast';
  });

  // Handle mode changes
  const handleModeChange = (newMode: 'fast' | 'smart') => {
    setMode(newMode);
    localStorage.setItem('modelMode', newMode);
    const newModels = getDefaultModels(newMode);
    setModels(newModels);
  };

  // Initialize models based on the stored mode
  const [models, setModels] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('modelMode') as 'fast' | 'smart';
      return getDefaultModels(savedMode || 'fast');
    }
    return getDefaultModels('fast');
  });

  // Initialize state variables
  const [input, setInput] = useState('');
  const [conversations, setConversations] = useState<Array<{ 
    prompt: string; 
    results: string[]; 
    fusionResult: string; 
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [conversationHistories, setConversationHistories] = useState<{ [modelId: string]: Array<{ role: string; content: string }> }>({});
  const latestConversationRef = useRef<HTMLDivElement>(null);
  const [isInitialState, setIsInitialState] = useState(true);
  const [isDismissing, setIsDismissing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [streamingModels, setStreamingModels] = useState<string[]>([]);
  const [isInitialFooter, setIsInitialFooter] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [isFusionLoading, setIsFusionLoading] = useState(false);
  const fusionResultRef = useRef<HTMLDivElement>(null);
  const [showAllModels, setShowAllModels] = useState(true);

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
    setIsStreaming(true);
    const currentInput = input;
    setInput('');
    // Reset fusion result for new prompt

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

    // Add new conversation entry
    setConversations(prev => {
      const newConversations = [...prev, { 
        prompt: currentInput, 
        results: ['', '', ''], 
        fusionResult: '' 
      }];
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

    // Update conversations with all responses
    setConversations(prev => {
      const newConversations = [...prev];
      newConversations[newConversations.length - 1].results = responses.filter((response): response is string => response !== undefined);
      console.log('Final updated conversations:', newConversations);
      return newConversations;
    });

    // Automatically trigger fusion after responses are loaded
    handleFusion('Multi-Model Response', true, updatedConversationHistories);

    setIsLoading(false);
  };

  useEffect(() => {
    if (latestConversationRef.current && window.innerWidth <= 768) {
      latestConversationRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      const headerHeight = document.querySelector('header')?.offsetHeight ?? 0;
      window.scrollBy(0, -headerHeight - 10); // Adjust scroll position by header height
    } else if (latestConversationRef.current) {
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
  }, []);

  // Update isStreaming state when streamingModels changes
  useEffect(() => {
    setIsStreaming(streamingModels.length > 0);
  }, [streamingModels]);

  const handleButtonClick = (buttonName: string) => {
    const newState = activeButton !== buttonName;
    setActiveButton(newState ? buttonName : null);
    localStorage.setItem(`is${buttonName.replace(/\s+/g, '')}Enabled`, newState.toString());
  };

  const handleFusion = async (buttonName: string, autoCall: boolean = false, latestConversationHistories?: { [modelId: string]: Array<{ role: string; content: string }> }) => {
    if (!autoCall) {
      setIsFusionLoading(true);
    }
    
    // Clear previous fusion result
    setConversations(prev => {
      const newConversations = [...prev];
      const currentConversation = newConversations[newConversations.length - 1];
      currentConversation.fusionResult = '';
      return newConversations;
    });

    const historiesForFusion = latestConversationHistories || conversationHistories;

    if (Object.keys(historiesForFusion).length === 0) {
      console.error('No conversation histories available for fusion');
      setConversations(prev => {
        const newConversations = [...prev];
        const currentConversation = newConversations[newConversations.length - 1];
        currentConversation.fusionResult = 'Error: No conversation histories available for fusion';
        return newConversations;
      });
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
      "Multi-Model Response": "Instruction: Response in the language as the ask and the responses. Based on the ask, use only 1 of the 2 modes that would provide the most optimal output: synethsis, or create. There is no need to state explicitly which mode you are using in the response. Each mode corresponds to a set of requirements.\\n\\nSynthesis: 'Prioritize key information in your answer. Analyze and synthesize the responses from three different persons to the ask\\n\\nYour synthesis should:\\n\\n- provide answer that incorporates the best insights from all three responses address/answer the question if applicable, note any unique perspectives or information provided by individual models use bold or italics where appropriate\\n- highlight discrepancies between responses (and refer to the person) if relevant, you may present this via table if deemed useful; \\n- you may directly quote from their response, or copy the entire paragraph/phrase/table as long as it best answers the question'\\n\\nCreate: 'Take all 3 responses and merge into 1 single output in respond to the ask. It should:\\n\\n- Prioritse the exact ask\\n- Consider the key difference of various responses, and carefully select the best from each response, then finally, merge into one\\n- You may directly copy contents and/or formatting from their response if deemed to meet the quality, or copy the entire paragraph/phrase/table as long as it best address the ask\\n- Do not state the source, or mention Anny, Ben, and Clarice'\\n\\n- For both modes, add a divider after the output, and have footnotes of which parts were contributed by which response",    };

    const fusionModel = 'gpt-4o-2024-08-06';

    const prompt = `${prePrompts[buttonName as keyof typeof prePrompts]}\n\nThe Ask: ${latestPrompt}\n\nAnny: ${latestResponses[0]}\nBen: ${latestResponses[1]}\nClarice: ${latestResponses[2]}`;

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
        let accumulatedContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            setIsFusionLoading(false);
            break;
          }

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(5));
                if (data.content) {
                  accumulatedContent += data.content;
                  
                  setConversations(prev => {
                    const newConversations = [...prev];
                    const currentConversation = newConversations[newConversations.length - 1];
                    currentConversation.fusionResult = accumulatedContent;
                    return newConversations;
                  });
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
      setConversations(prev => {
        const newConversations = [...prev];
        const currentConversation = newConversations[newConversations.length - 1];
        currentConversation.fusionResult = 'Error generating Fusion response';
        return newConversations;
      });
      setIsFusionLoading(false);
    } finally {
      if (fusionResultRef.current) {
        fusionResultRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
  };

  const handleNewChat = () => {
    // Clear all conversations and histories
    setConversations([]);
    setConversationHistories({});
    setIsInitialState(true);
    setIsInitialFooter(true);
    setStreamingModels([]);
    setIsStreaming(false);
    setIsFusionLoading(false);
    setInput('');
    
    // Generate new session ID
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    
    // Track new chat event
    amplitude.track('New Chat Started');
  };

  // Render the user interface with header, main content, and footer
  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        mode={mode} 
        onModeChange={handleModeChange} 
        onNewChat={handleNewChat}
      />
      {/* Main content area with conversation history and result cards */}
      <main className={cn(
        "flex-1 w-full overflow-y-auto",
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
                  <div className="hidden sm:flex flex-col gap-6">
                    {/* ManyAI card */}
                    <div className="relative">
                      <ResultCard
                        index={models.length}
                        models={models}
                        results={conversation.results}
                        isFusionCard={true}
                        fusionResult={conversation.fusionResult}
                        isFusionLoading={isFusionLoading}
                      />
                      <button
                        onClick={() => setShowAllModels(!showAllModels)}
                        className="absolute top-5 right-5 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
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
                    </div>
                    
                    {/* Model cards - shared row */}
                    {showAllModels && (
                      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {models.map((_, modelIndex) => (
                          <ResultCard 
                            key={modelIndex} 
                            index={modelIndex} 
                            models={models} 
                            results={conversation.results} 
                            isStreaming={isStreaming}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="sm:hidden w-full h-[calc(100vh-380px)] relative z-0">
                    <MobileResultCarousel
                      models={models}
                      results={conversation.results}
                      fusionResult={conversation.fusionResult}
                      isFusionLoading={isFusionLoading}
                      activeButton={activeButton}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer with input form */}
      <footer className="bg-gray-50 border-t border-border px-4 sm:px-10 py-2 z-10">
        <div className="flex justify-between items-center mb-4">
          {(isStreaming || isFusionLoading) && (
            <StreamingStatus 
              streamingModels={streamingModels} 
              isFusionLoading={isFusionLoading} 
              activeButton={activeButton}
              hasResponses={conversations.length > 0 && conversations[conversations.length - 1].results.some(result => result !== '')}
            />
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4">
          <div className="w-full">
            <Input
              id="message-input"
              ref={inputRef}
              value={input}
              onChange={(e) => {
                const cursorPosition = e.currentTarget.selectionStart;
                const textBeforeCursor = e.currentTarget.value.slice(0, cursorPosition);
                const textAfterCursor = e.currentTarget.value.slice(cursorPosition);
                const element = e.currentTarget;
                
                setInput(e.target.value);
                element.style.height = 'auto';
                element.style.height = `${element.scrollHeight}px`;
                
                // Restore cursor position after paste
                requestAnimationFrame(() => {
                  if (element && document.activeElement === element) {
                    element.selectionStart = cursorPosition;
                    element.selectionEnd = cursorPosition;
                  }
                });
              }}
              onPaste={(e) => {
                e.preventDefault();
                const cursorPosition = e.currentTarget.selectionStart;
                const textBeforeCursor = e.currentTarget.value.slice(0, cursorPosition);
                const textAfterCursor = e.currentTarget.value.slice(cursorPosition);
                const pastedText = e.clipboardData.getData('text').replace(/\n/g, ' ');
                
                const newValue = textBeforeCursor + pastedText + textAfterCursor;
                const newCursorPosition = cursorPosition + pastedText.length;
                
                setInput(newValue);
                
                // Wait for the next render cycle and check if the element exists
                setTimeout(() => {
                  if (e.currentTarget) {
                    e.currentTarget.selectionStart = newCursorPosition;
                    e.currentTarget.selectionEnd = newCursorPosition;
                    
                    // Update height after cursor position is set
                    e.currentTarget.style.height = 'auto';
                    e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                  }
                }, 0);
              }}
              onSubmit={handleSubmit}
              placeholder="Enter your message..."
              leftElement={
                <button
                  type="button"
                  className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors"
                  onClick={() => {
                    console.log('Attachment button clicked');
                  }}
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
                    className="text-zinc-500"
                  >
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
              }
              rightElement={
                <button
                  type="submit"
                  disabled={isLoading || input.trim() === ''}
                  className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-md transition-colors",
                    input.trim() !== '' 
                      ? "bg-zinc-200 hover:bg-zinc-300"
                      : "bg-zinc-100 hover:bg-zinc-200",
                    (isLoading || input.trim() === '') && "opacity-100 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-transparent"></span>
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
                      className="text-zinc-500"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  )}
                </button>
              }
            />
          </div>
          <p className={cn(
            "text-xs text-gray-500 text-center",
            !isInitialFooter && "hide-on-mobile"
          )}>
            {isInitialFooter
              ? "By continuing, you agree to our Terms and our Privacy Policy."
              : "AI make mistakes. That's why we're here for multi-model experiences."}
          </p>
        </form>
      </footer>
    </div>
  );
}
