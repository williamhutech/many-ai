"use client";

import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import * as amplitude from '@amplitude/analytics-browser';
import { sessionReplayPlugin } from '@amplitude/plugin-session-replay-browser';
import { Button, Input, UserPromptBubble } from "@/components/ui";
import { cn } from "@/lib/utils";
import { getProviderForModel, getModelByProviderAndMode, getDefaultModels } from '@/config/models';
import { InitialModelSelection, StreamingStatus, ResultCard } from '@/components/pages';
import Image from 'next/image';
import MobileResultCarousel from '@/components/pages/mobileresultcarousel';
import dynamic from 'next/dynamic';
import React from 'react';
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";

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
    
    // Track mode change event
    amplitude.track('Mode Changed', {
      previousMode: mode,
      newMode: modeValue,
    });
    
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
          <SelectTrigger 
            className="h-8 text-xs border border-zinc-200 bg-white w-auto px-3 font-inter"
          >
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
            v2.3
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

// Define the fixed provider order
const providerOrder = ['Anthropic', 'OpenAI', 'Google', 'Together AI'];

// Helper function to sort models based on providerOrder
const sortModels = (modelsToSort: string[]): string[] => {
  return providerOrder
    .map(providerName => {
      return modelsToSort.find(modelId => {
        const modelProvider = getProviderForModel(modelId);
        return modelProvider?.name === providerName;
      });
    })
    .filter(Boolean) as string[];
};

export default function SDKPlayground() {
  // Initialize mode to 'fast'
  const [mode, setMode] = useState<'fast' | 'smart'>('fast');

  // Initialize models to default models for 'fast' mode
  const [models, setModels] = useState<string[]>(getDefaultModels('fast'));

  // Function to handle mode change
  const handleModeChange = (newMode: 'fast' | 'smart') => {
    setMode(newMode);

    // Update localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('modelMode', newMode);
    }

    // Track mode change event
    amplitude.track('Mode Changed', {
      previousMode: mode,
      newMode: newMode,
    });

    // Update models when mode changes
    setModels(prevModels => {
      const selectedProviders = prevModels.map(modelId => {
        const provider = getProviderForModel(modelId);
        return provider?.name;
      }).filter(Boolean) as string[];

      const newModels = selectedProviders.map(providerName => {
        const model = getModelByProviderAndMode(providerName, newMode);
        return model?.id || '';
      });

      // Return sorted models according to providerOrder
      return sortModels(newModels.filter(id => id !== ''));
    });
  };

  // Initialize mode and models from localStorage on mount
  useEffect(() => {
    // Check if 'localStorage' is available
    if (typeof window !== 'undefined') {
      // Load mode from localStorage
      const savedMode = localStorage.getItem('modelMode') as 'fast' | 'smart';
      if (savedMode) {
        setMode(savedMode);
      }

      // Load selected models from localStorage
      const savedModels = localStorage.getItem('selectedModels');
      if (savedModels) {
        const parsedModels = JSON.parse(savedModels);
        setModels(sortModels(parsedModels.slice(0, 3)));
      }
    }
  }, []);

  // Save mode to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('modelMode', mode);
    }
  }, [mode]);

  // Save models to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedModels', JSON.stringify(models));
    }
  }, [models]);

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
  const [footerHeight, setFooterHeight] = React.useState(120); // Default height
  const [editingPromptIndex, setEditingPromptIndex] = useState<number | null>(null);
  const [editedPrompt, setEditedPrompt] = useState<string>('');
  const [regeneratingModels, setRegeneratingModels] = useState<number[]>([]);
  const [bubbleHeights, setBubbleHeights] = useState<{ [key: number]: number }>({});
  const previousHeightRef = useRef<{ [key: number]: number }>({});

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
    // Initialize empty conversation histories for all models
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

  // Move fetchModelResponse outside handleSubmit but inside SDKPlayground
  const fetchModelResponse = async (index: number, currentInput: string) => {
    const modelId = models[index];
    const provider = getProviderForModel(modelId);
    if (!provider) return;

    setStreamingModels(prev => [...prev, provider.nickname]);

    try {      
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
        const newHistory = [...history];
        
        // If this is a new conversation
        if (history.length === 0) {
          newHistory.push(
            { role: 'user', content: currentInput },
            { role: 'assistant', content: modelResponse }
          );
        } else {
          // Update or append the latest exchange
          if (history[history.length - 1].role === 'assistant') {
            // If the last message was from assistant, add new user message and response
            newHistory.push(
              { role: 'user', content: currentInput },
              { role: 'assistant', content: modelResponse }
            );
          } else {
            // If the last message was from user, append assistant response
            newHistory.push({ role: 'assistant', content: modelResponse });
          }
        }

        return {
          ...prev,
          [modelId]: newHistory
        };
      });

      return modelResponse;
    } catch (error) {
      console.error(`Error fetching response for ${modelId}:`, error);
      setConversations(prev => {
        const newConversations = [...prev];
        newConversations[newConversations.length - 1].results[index] = `Error: ${error instanceof Error ? error.message : 'Failed to fetch response'}`;
        return newConversations;
      });
      return '';
    } finally {
      setStreamingModels(prev => prev.filter(m => m !== provider.nickname));
    }
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

    // Fetch responses from all models simultaneously
    const responses = await Promise.all(models.map((_, index) => fetchModelResponse(index, currentInput)));

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
      return newConversations;
    });

    // Automatically trigger fusion after responses are loaded
    handleFusion('Multi-Model Response', true, updatedConversationHistories);

    setIsLoading(false);
    setIsStreaming(false);

    // Track prompt submission
    amplitude.track('Prompt Submitted', {
      promptLength: currentInput.trim().length,
      modelCount: models.length,
      mode: mode
    });
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
    // Always set loading state, regardless of autoCall
    setIsFusionLoading(true);
    
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

    const prePrompts = {
      "Multi-Model Response": "Instruction: Response in the language as the ask and the responses. Based on the ask, use only 1 of the 2 modes that would provide the most optimal output: synethsis, or create. There is no need to state explicitly which mode you are using in the response. If there is minimal to no value add in synthesizing, nor is the ask related to create/generate - use the 3rd mode - follow up. Each mode corresponds to a set of requirements.\\n\\n1.Synthesis: 'Prioritize key information in your answer. Analyze and synthesize the responses from three different persons to the ask\\n\\nYour synthesis should:\\n\\n- provide answer that incorporates the best insights from all three responses address/answer the question if applicable, note any unique perspectives or information provided by individual models\\n- use bold and/or bullet points where appropriate\\n- highlight discrepancies between responses (and refer to the person) if relevant, you may present this via table if deemed useful; \\n- you may directly quote from their response, or copy the entire paragraph/phrase/table as long as it best answers the question'\\n\\n2.Create: 'Take all 3 responses and merge into 1 single output in respond to the ask. It should:\\n\\n- Prioritse the exact ask\\n- Consider the key difference of various responses, and carefully select the best from each response, then finally, merge into one\\n- You may directly copy contents and/or formatting from their response if deemed to meet the quality, or copy the entire paragraph/phrase/table as long as it best address the ask\\n- Do not state the source, or mention Anny, Bella, and Clarice'\\n\\n- For both modes, add a divider after the output, and have footnotes of which parts were contributed by which response in italics.\\n\\n3.Follow Up: 'Since no value add in synthesizing/creating, simply respond to the ask, followed by some sort of follow up. No mention of name of response. No footnote or divider allowed.'",    };

    const fusionModel = 'gpt-4o-2024-08-06';
      
    const prompt = `${prePrompts[buttonName as keyof typeof prePrompts]}\n\nThe Ask: ${latestPrompt}\n\nAnny: ${latestResponses[0]}\nBella: ${latestResponses[1]}\nClarice: ${latestResponses[2]}`;

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
    amplitude.track('New Chat');
  };

  React.useEffect(() => {
    const handleHeightChange = (e: CustomEvent<{ height: number }>) => {
      setFooterHeight(e.detail.height);
      document.documentElement.style.setProperty('--footer-height', `${e.detail.height}px`);
    };

    window.addEventListener('inputHeightChange', handleHeightChange as EventListener);
    return () => {
      window.removeEventListener('inputHeightChange', handleHeightChange as EventListener);
    };
  }, []);

  const handleRegenerate = async (modelIndex: number | null) => {
    // Track regeneration event
    amplitude.track('Answer Regenerated', {
      modelIndex: modelIndex,
      isFusion: modelIndex === null,
      mode: mode
    });
    if (!sessionId || conversations.length === 0) return;
    
    const currentConversation = conversations[conversations.length - 1];
    const currentPrompt = currentConversation.prompt;
    
    if (modelIndex === null) {
      // Regenerate ManyAI fusion result using latest results from the current conversation
      const latestResults = currentConversation.results;
      const updatedHistories = { ...conversationHistories };
      
      // Update histories with latest results before fusion
      models.forEach((modelId, idx) => {
        const history = updatedHistories[modelId] || [];
        // Update the last assistant response or add new ones
        if (history.length >= 2) {
          history[history.length - 1] = { role: 'assistant', content: latestResults[idx] || '' };
        } else {
          history.push(
            { role: 'user', content: currentPrompt },
            { role: 'assistant', content: latestResults[idx] || '' }
          );
        }
        updatedHistories[modelId] = history;
      });
      
      handleFusion('Multi-Model Response', false, updatedHistories);
      return;
    }

    setRegeneratingModels(prev => [...prev, modelIndex]);
    const modelId = models[modelIndex];
    const provider = getProviderForModel(modelId);
    if (!provider) return;

    setStreamingModels(prev => [...prev, provider.nickname]);

    try {
      // Get the current history for this model
      const currentHistory = conversationHistories[modelId] || [];
      
      // Remove the last assistant response if it exists
      const updatedHistory = currentHistory.length >= 2 
        ? currentHistory.slice(0, -1) 
        : currentHistory;

      // Make the API call with the updated history
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPrompt,
          sessionId,
          conversationHistories: {
            [modelId]: updatedHistory
          },
          selectedModel: modelId,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to generate response');
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
              const data = JSON.parse(line.slice(5));
              if (data.content) {
                modelResponse += data.content;
                setConversations(prev => {
                  const newConversations = [...prev];
                  newConversations[newConversations.length - 1].results[modelIndex] = modelResponse;
                  return newConversations;
                });
              }
            } catch (error) {
              console.error('Error parsing JSON:', error);
            }
          }
        }
      }

      // Update conversation history correctly
      setConversationHistories(prev => {
        const updated = { ...prev };
        if (updated[modelId]?.length >= 2) {
          // Find the last assistant message and update its content
          const lastAssistantIndex = updated[modelId].findLastIndex(msg => msg.role === 'assistant');
          if (lastAssistantIndex !== -1) {
            updated[modelId][lastAssistantIndex].content = modelResponse;
          }
        }
        return updated;
      });

    } catch (error) {
      console.error(`Error regenerating response:`, error);
    } finally {
      setRegeneratingModels(prev => prev.filter(i => i !== modelIndex));
      setStreamingModels(prev => prev.filter(m => m !== provider.nickname));
    }
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
              <InitialModelSelection
                models={models}
                setModels={setModels}
                mode={mode}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {conversations.map((conversation, index) => (
                <div key={index} className="conversation-section">
                  {/* User prompt bubble */}
                  <UserPromptBubble
                    prompt={conversation.prompt}
                    index={index}
                    isEditing={editingPromptIndex === index}
                    isLatestPrompt={index === conversations.length - 1}
                    onEditStart={() => {
                      setEditingPromptIndex(index);
                      setEditedPrompt(conversation.prompt);
                    }}
                    onEditCancel={() => {
                      setEditingPromptIndex(null);
                      setEditedPrompt('');
                    }}
                    onEditComplete={(newPrompt) => {
                      setConversations(prev => {
                        const newConversations = [...prev];
                        newConversations[index].prompt = newPrompt;
                        return newConversations;
                      });
                      setEditingPromptIndex(null);
                      setEditedPrompt('');
                    }}
                    onRegenerateFromEdit={(newPrompt, promptIndex) => {
                      // First, remove the last exchange from conversation histories
                      setConversationHistories(prev => {
                        const updated = { ...prev };
                        models.forEach(modelId => {
                          const history = updated[modelId] || [];
                          if (history.length >= 2) {
                            // Remove the last user-assistant pair
                            updated[modelId] = history.slice(0, -2);
                          }
                        });
                        return updated;
                      });

                      // Now treat it as a new prompt by calling fetchModelResponse
                      const fetchResponses = async () => {
                        // Wait for all model responses to complete
                        const responses = await Promise.all(models.map((_, index) => fetchModelResponse(index, newPrompt)));
                        
                        // Update conversations with all responses first
                        setConversations(prev => {
                          const newConversations = [...prev];
                          newConversations[promptIndex].results = responses.filter(response => response !== undefined) as string[];
                          return newConversations;
                        });

                        // After responses are updated in state, add new exchange to histories
                        const updatedHistories = { ...conversationHistories };
                        models.forEach((modelId, idx) => {
                          const history = updatedHistories[modelId] || [];
                          history.push(
                            { role: 'user', content: newPrompt },
                            { role: 'assistant', content: responses[idx] || '' }
                          );
                          updatedHistories[modelId] = history;
                        });

                        // Now trigger fusion with the updated histories
                        handleFusion('Multi-Model Response', true, updatedHistories);
                      };
                      fetchResponses();
                    }}
                  />

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
                        showAllModels={showAllModels}
                        onToggleShowAllModels={() => setShowAllModels(!showAllModels)}
                        onRegenerate={handleRegenerate}
                        isLatestConversation={index === conversations.length - 1}
                        isStreaming={isStreaming}
                      />
                    </div>

                    {/* Model cards */}
                    {showAllModels && (
                      <div className={`
                        grid gap-6
                        ${models.filter(Boolean).length === 2 
                          ? 'grid-cols-1 sm:grid-cols-2' 
                          : models.filter(Boolean).length === 3
                            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                        }
                      `}>
                        {models.map((modelId, idx) => {
                          if (!modelId) return null;
                          const provider = getProviderForModel(modelId);
                          if (!provider) return null;

                          return (
                            <ResultCard 
                              key={modelId}
                              index={idx}
                              models={models}
                              results={conversation.results}
                              isStreaming={isStreaming}
                              isRegenerating={regeneratingModels.includes(idx)}
                              onRegenerate={handleRegenerate}
                              isLatestConversation={index === conversations.length - 1}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Mobile carousel */}
                  <div className="sm:hidden w-full h-[calc(100vh-var(--header-height)-var(--footer-height))]">
                    <MobileResultCarousel
                      models={models}
                      results={conversation.results}
                      fusionResult={conversation.fusionResult}
                      isFusionLoading={isFusionLoading}
                      activeButton={activeButton}
                      onRegenerate={handleRegenerate}
                      isLatestConversation={index === conversations.length - 1}
                      isStreaming={isStreaming}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer with input form */}
      <footer 
        className="bg-gray-50 border-t border-border px-4 sm:px-10 py-2 z-10"
        style={{ 
          minHeight: `${footerHeight}px`,
          height: 'auto'
        }}
      >
        <div className="footer-content">
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            {(isStreaming || isFusionLoading) && (
              <StreamingStatus 
                streamingModels={streamingModels} 
                isFusionLoading={isFusionLoading} 
                activeButton={activeButton}
                hasResponses={conversations.length > 0 && conversations[conversations.length - 1].results.some(result => result !== '')}
              />
            )}
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4 w-full">
            <div className="w-11/12 max-h-[40vh]">
              <Input
                id="message-input"
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  const element = e.currentTarget;
                  const lineHeight = parseInt(window.getComputedStyle(element).lineHeight);
                  const maxHeight = lineHeight * 5; // Limit to 5 lines
                  
                  setInput(e.target.value);
                  element.style.height = 'auto';
                  
                  // Apply max height limit
                  const newHeight = Math.min(element.scrollHeight, maxHeight);
                  element.style.height = `${newHeight}px`;
                  
                  // Enable/disable scrolling based on content height
                  if (element.scrollHeight > maxHeight) {
                    element.style.overflowY = 'auto';
                  } else {
                    element.style.overflowY = 'hidden';
                  }
                  
                  // Maintain cursor position
                  const cursorPosition = e.currentTarget.selectionStart;
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
              "text-xs text-gray-500 flex-shrink-0 pb-2",
              !isInitialFooter && "hide-on-mobile"
            )}>
              {isInitialFooter
                ? "By continuing, you agree to our Terms and our Privacy Policy."
                : "AI make mistakes. That's why we're here for multi-model experiences."}
            </p>
            {!isInitialFooter && <div className="h-6 sm:hidden" />}
          </form>
        </div>
      </footer>
    </div>
  );
}