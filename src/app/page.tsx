"use client";

import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import * as amplitude from '@amplitude/analytics-browser';
import { sessionReplayPlugin } from '@amplitude/plugin-session-replay-browser';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPromptBubble } from "@/components/ui/promptbubble";
import { Modal } from "@/components/ui/modal";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getProviderForModel, getModelByProviderAndMode, getDefaultModels } from '@/config/models';
import InitialModelSelection from '@/components/pages/initialmodelselection';
import StreamingStatus from '@/components/pages/streamingstatus';
import ResultCard from '@/components/pages/resultcard';
import MobileResultCarousel from '@/components/pages/mobileresultcarousel';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import React from 'react';
import { BLOCKED_COUNTRIES } from '@/config/blocked-countries';
import Link from 'next/link';
import type { PromptParams } from '@/types/components';

// Import auth components
import { AuthModal } from '@/components/ui/authmodal';
import LoginContent from '@/app/auth/login/LoginContent';
import SignUpPage from '@/app/auth/signup/page';
import ResetPasswordContent from '@/app/auth/resetpassword/ResetPasswordContent';
import SignUpContent from '@/app/auth/signup/SignUpContent';

const Header = ({ mode, onModeChange, onNewChat, onAuthClick }: { 
  mode: 'fast' | 'smart', 
  onModeChange: (mode: 'fast' | 'smart') => void,
  onNewChat: () => void,
  onAuthClick: (view: 'login' | 'signup') => void
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
    overlay.className = 'fixed inset-0 bg-black/30 backdrop-blur-sm z-50 animate-in fade-in duration-200';
    document.body.appendChild(overlay);

    // Create and append sidebar with slide-in animation
    const sidebar = document.createElement('div');
    sidebar.className = 'fixed left-0 top-0 h-full w-64 bg-white/95 backdrop-blur-sm z-[51] shadow-lg animate-in slide-in-from-left duration-200';
    sidebar.innerHTML = `
      <div class="flex justify-between items-center p-6">
        <h2 class="text-xl font-semibold">Chat History</h2>
        <button class="text-gray-400 hover:text-gray-600 transition-colors" id="closeSidebar">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="flex items-center justify-center h-full text-sm text-gray-500">
        Feature coming soon!
      </div>
    `;
    document.body.appendChild(sidebar);

    // Prevent body scroll when sidebar is open
    document.body.style.overflow = 'hidden';

    // Add click handler to close with animations
    const handleClose = () => {
      overlay.classList.remove('animate-in', 'fade-in');
      overlay.classList.add('animate-out', 'fade-out');

      sidebar.classList.remove('animate-in', 'slide-in-from-left');
      sidebar.classList.add('animate-out', 'slide-out-to-left');
      
      // Remove elements and restore body scroll after animation completes
      setTimeout(() => {
        document.body.style.overflow = '';
        overlay.remove();
        sidebar.remove();
      }, 200);
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
            v2.4
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

        {/* 
          Instead of a link to /auth/signup, we open the AuthModal and show SignUp content.
          You can similarly do the same for login, reset, etc.
        */}
        <Button 
          size="xs" 
          className="text-xs" 
          onClick={() => onAuthClick('signup')}
        >
          Sign Up
        </Button>
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
  // Auth-related state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup' | 'resetpassword'>('signup');

  // Initialize mode to 'fast'
  const [mode, setMode] = useState<'fast' | 'smart'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('modelMode') as 'fast' | 'smart') || 'fast';
    }
    return 'fast';
  });

  // Initialize models to default models for 'fast' mode
  const [models, setModels] = useState<string[]>(getDefaultModels('fast'));

  // Example: update root state when "Sign Up" is clicked
  const handleOpenAuth = (view: 'login' | 'signup') => {
    setAuthView(view);
    setShowAuthModal(true);
  };

  // This could similarly be used for Login
  const handleCloseAuth = () => {
    setShowAuthModal(false);
  };



  // Function to handle mode change
  const handleModeChange = (newMode: 'fast' | 'smart') => {
    setMode(newMode);

    // Update localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('modelMode', newMode);
    }

    // Track mode change
    amplitude.track('Mode Changed', {
      previousMode: mode,
      newMode: newMode,
    });

    // Update models while preserving conversation history and enabled providers
    setModels(prevModels => {
      // Get the currently enabled providers
      const enabledProviders = new Set(
        prevModels.map(modelId => {
          const provider = getProviderForModel(modelId);
          return provider?.name;
        }).filter(Boolean)
      );

      // Get models for the enabled providers in the new mode
      const newModels = Array.from(enabledProviders)
        .map(providerName => {
          const model = getModelByProviderAndMode(providerName!, newMode);
          return model?.id;
        })
        .filter(Boolean) as string[];

      // Preserve conversation histories
      const providerToHistory = new Map();
      const updatedHistories = { ...conversationHistories };
      
      // First, collect all histories by provider
      prevModels.forEach(modelId => {
        const provider = getProviderForModel(modelId);
        if (provider && conversationHistories[modelId]) {
          providerToHistory.set(provider.name, conversationHistories[modelId]);
        }
      });

      // Then, apply histories to new models based on provider
      newModels.forEach(modelId => {
        const provider = getProviderForModel(modelId);
        if (provider && providerToHistory.has(provider.name)) {
          updatedHistories[modelId] = providerToHistory.get(provider.name);
        }
      });

      setConversationHistories(updatedHistories);
      return newModels;
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
  const inputRef = useRef<HTMLDivElement>(null);
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
  const [isLocationBlocked, setIsLocationBlocked] = useState(false);
  const [blockedCountryName, setBlockedCountryName] = useState<string | null>(null);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  // Check user's location on component mount
  useEffect(() => {
    const checkLocation = async () => {
      try {
        const response = await fetch('/api/location');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (!data.country) {
          console.warn('⚠ No country code received, defaulting to unblocked');
          setIsLocationBlocked(false);
          return;
        }

        const blockedCountry = BLOCKED_COUNTRIES.find(c => c.country === data.country);
        const isBlocked = !!blockedCountry;

        console.log('🌍 Location check result:', {
          ip: data.ip,
          country: data.country,
          countryName: blockedCountry?.country_name,
          isBlocked
        });
        
        if (isBlocked && blockedCountry) {
          console.log(`🚫 Location blocked: ${blockedCountry.country_name} detected`);
          setIsLocationBlocked(true);
          setBlockedCountryName(blockedCountry.country_name);
          amplitude.track('Location Blocked', {
            country: data.country,
            countryName: blockedCountry.country_name,
            ip: data.ip
          });
        } else {
          console.log('✅ Location allowed:', data.country);
          setIsLocationBlocked(false);
          setBlockedCountryName(null);
        }
      } catch (error) {
        console.error('❌ Error checking location:', error);
        setIsLocationBlocked(false);
        setBlockedCountryName(null);
      }
    };

    checkLocation();
  }, []);

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

    // Function to handle scrolling
    const scrollToLatest = () => {
      if (latestConversationRef.current) {
        const isMobile = window.innerWidth <= 768;
        const element = latestConversationRef.current;
        const headerHeight = document.querySelector('header')?.offsetHeight ?? 0;
        const offset = isMobile ? headerHeight + 20 : headerHeight + 100;

        // Wait for next frame to ensure DOM is updated
        requestAnimationFrame(() => {
          const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({
            top: elementTop - offset,
            behavior: 'smooth'
          });
        });
      }
    };

    // Initial scroll after adding new conversation
    requestAnimationFrame(scrollToLatest);

    // Fetch responses from all models simultaneously
    const responses = await Promise.all(models.map((_, index) => fetchModelResponse(index, currentInput)));

    // Update conversation histories
    const updatedConversationHistories = { ...conversationHistories };
    models.forEach((modelId, index) => {
      const history = updatedConversationHistories[modelId] || [];
      history.push(
        { role: 'user', content: currentInput },
        { role: 'assistant', content: responses[index] || '' }
      );
      updatedConversationHistories[modelId] = history;
    });
    setConversationHistories(updatedConversationHistories);

    // Update conversations with all responses
    setConversations(prev => {
      const newConversations = [...prev];
      newConversations[newConversations.length - 1].results = responses.filter((response): response is string => response !== undefined);
      return newConversations;
    });

    // Automatically trigger fusion after responses are loaded
    await handleFusion('Multi-Model Response', true, updatedConversationHistories);

    // Final scroll after all content is loaded
    requestAnimationFrame(() => {
      setTimeout(scrollToLatest, 100);
    });

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
    if (latestConversationRef.current) {
      const isMobile = window.innerWidth <= 768;
      const element = latestConversationRef.current;
      const headerHeight = document.querySelector('header')?.offsetHeight ?? 0;
      const offset = isMobile ? headerHeight + 20 : headerHeight + 100;

      const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementTop - offset,
        behavior: 'smooth'
      });
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
      "Multi-Model Response": "Instruction: Response in the language as the ask and the responses. Based on the ask, use only 1 of the 2 modes that would provide the most optimal output: synethsis, or create. There is no need to state explicitly which mode you are using in the response. If there is minimal to no value add in synthesizing, nor is the ask related to create/generate - use the 3rd mode - follow up. Each mode corresponds to a set of requirements.\\n\\n1.Synthesis: 'Prioritize key information in your answer. Analyze and synthesize the responses from three different persons to the ask\\n\\nYour synthesis should:\\n\\n- provide answer that incorporates the best insights from all three responses address/answer the question if applicable, note any unique perspectives or information provided by individual models\\n- use bold and/or bullet points where appropriate\\n- highlight discrepancies between responses (and refer to the person) if relevant, you may present this via table if deemed useful; \\n- you may directly quote from their response, or copy the entire paragraph/phrase/table as long as it best answers the question'\\n\\n2.Create: 'Take all 3 responses and merge into 1 single output in respond to the ask. It should:\\n\\n- Prioritse the exact ask\\n- Consider the key difference of various responses, and carefully select the best from each response, then finally, merge into one\\n- You may directly copy contents and/or formatting from their response if deemed to meet the quality, or copy the entire paragraph/phrase/table as long as it best address the ask\\n- Do not state the source, or mention Anny, Bella, and Clarice'\\n\\n- For either of the 2 modes, you must add a divider after the output, and have footnotes specififying which part of the response were contributed by whom in italics.\\n\\n3.Follow Up: 'Since no value add in synthesizing/creating, simply respond to the ask, followed by some sort of follow up. No mention of name of response. No footnote or divider allowed.'",    };

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

  useEffect(() => {
    if (conversations.length > 0) {
      requestAnimationFrame(() => {
        if (latestConversationRef.current) {
          const isMobile = window.innerWidth <= 768;
          const element = latestConversationRef.current;
          const headerHeight = document.querySelector('header')?.offsetHeight ?? 0;
          const offset = isMobile ? headerHeight + 20 : headerHeight + 100;

          const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({
            top: elementTop - offset,
            behavior: 'smooth'
          });
        }
      });
    }
  }, [conversations]);

  const handleInputChange = (e: { target: { value: string } }) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleRegenerateFromEdit = ({ newPrompt, promptIndex }: PromptParams) => {
    // Your implementation
  };

  const handleEditComplete = ({ newPrompt }: PromptParams) => {
    // Your implementation
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

  // Render the user interface with header, main content, and footer
  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        mode={mode} 
        onModeChange={handleModeChange} 
        onNewChat={handleNewChat}
        onAuthClick={handleOpenAuth}
      />
      {/* Main content area with conversation history and result cards */}
      <main className="flex-grow">
        <div className={cn(
          "container mx-auto",
          isInitialState ? "p-4" : "p-6",
          "md:max-w-[1200px]"
        )}>
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
                    onEditComplete={handleEditComplete}
                    onRegenerateFromEdit={handleRegenerateFromEdit}
                  />

                  {/* Desktop layout (hidden on smaller than 640px) */}
                  <div className="hidden sm:flex flex-col gap-6">
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

                    {showAllModels && (
                      <div
                        className={`
                          grid gap-6
                          ${
                            models.filter(Boolean).length === 2
                              ? 'grid-cols-1 sm:grid-cols-2'
                              : models.filter(Boolean).length === 3
                                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                          }
                        `}
                      >
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

                  {/* Mobile carousel (hidden at ≥640px) */}
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
        className={cn(
          "relative bg-gray-50 border-t border-border z-10",
          "px-4 sm:px-10 py-4"
        )}
        style={{ 
          minHeight: `${footerHeight}px`
        }}
      >
        {(isStreaming || isFusionLoading) && (
          <StreamingStatus 
            streamingModels={streamingModels} 
            isFusionLoading={isFusionLoading} 
            activeButton={activeButton}
            hasResponses={conversations.length > 0 && conversations[conversations.length - 1].results.some(result => result !== '')}
          />
        )}
        <div className={cn(
          "footer-content flex flex-col items-center",
          "max-w-screen-2xl mx-auto space-y-4"
        )}>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!isLocationBlocked) {
              handleSubmit(e);
            }
          }} className="w-full flex justify-center">
            <div className="w-11/12 max-h-[40vh]">
              <Input
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onPaste={(e: React.ClipboardEvent<HTMLDivElement>) => {
                  if (!isLocationBlocked) {
                    e.preventDefault();
                    const text = e.clipboardData.getData('text').replace(/\n/g, ' ');
                    const selection = window.getSelection();
                    const range = selection?.getRangeAt(0);
                    
                    if (range) {
                      const newValue = input.slice(0, range.startOffset) + text + input.slice(range.endOffset);
                      setInput(newValue);
                    }
                  }
                }}
                disabled={isLocationBlocked}
                placeholder={isLocationBlocked ? `We're sorry, this service is not offered in ${blockedCountryName} at the moment. Stay tuned!` : "Enter your message..."}
                className={cn(
                  isLocationBlocked && "bg-[#F7F7F8] text-zinc-600"
                )}
                leftElement={
                  <button
                    type="button"
                    className={cn(
                      "w-7 h-7 flex items-center justify-center rounded-md transition-colors",
                      "hover:bg-zinc-100",
                      isLocationBlocked && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => {
                      if (!isLocationBlocked) {
                        console.log('Attachment button clicked');
                        amplitude.track('Attachment Button Clicked', {
                          timestamp: new Date('2024-12-18T18:10:03+08:00').toISOString()
                        });
                      }
                    }}
                    disabled={isLocationBlocked}
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
                    disabled={isLoading || input.trim() === '' || isLocationBlocked}
                    className={cn(
                      "w-7 h-7 flex items-center justify-center rounded-md transition-colors",
                      input.trim() !== '' 
                        ? "bg-zinc-200 hover:bg-zinc-300"
                        : "bg-zinc-100 hover:bg-zinc-200",
                      (isLoading || isLocationBlocked) && "opacity-50 cursor-not-allowed"
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
          </form>
          <p className={cn(
            "text-xs text-gray-500 flex-shrink-0",
            "pb-0"
          )}>
            {isInitialFooter
              ? <>By continuing, you agree to our <button onClick={(e) => { e.preventDefault(); setIsTermsOpen(true); }} className="underline hover:text-gray-700">Terms</button> and our <button onClick={(e) => { e.preventDefault(); setIsPrivacyOpen(true); }} className="underline hover:text-gray-700">Privacy Policy</button>.</>
              : <>
                  <span className="hidden sm:inline">AI can make mistakes. That&apos;s why we&apos;re building a multi-model experience.</span>
                  <span className="inline sm:hidden">If you like it so far, share ManyAI with your friends!</span>
                </>
            }
          </p>
        </div>
      </footer>

      {/* Terms Modal */}
      <Modal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        title="Terms of Service"
      >
        <div className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold mb-2">1. Service Description</h3>
            <p>ManyAI provides a multi-model AI experience platform that allows users to interact with various AI models simultaneously. Our service aggregates responses from different AI providers to deliver comprehensive and diverse insights.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">2. User Responsibilities</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must use the service in compliance with all applicable laws and regulations.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You agree not to use the service for any illegal or unauthorized purposes.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">3. Service Limitations</h3>
            <p>Our service is not available in certain jurisdictions due to regulatory requirements. We reserve the right to modify or discontinue any aspect of the service at any time.</p>
          </section>
        </div>
      </Modal>

      {/* Privacy Modal */}
      <Modal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        title="Privacy Policy"
      >
        <div className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold mb-2">1. Information We Collect</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>User inputs and prompts submitted to the AI models</li>
              <li>Usage patterns and interaction data</li>
              <li>Location data for service availability</li>
              <li>Technical device/browser info</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">2. How We Use Your Information</h3>
            <p>We use your information to provide and improve our multi-model AI service, determine service availability based on your location, analyze usage patterns, and monitor and prevent abuse.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">3. Data Security</h3>
            <p>We employ industry-standard security measures to protect your data. This includes encryption of data in transit and secure handling of all user interactions.</p>
          </section>
        </div>
      </Modal>

      {/* 
        The AuthModal. 
        The "authView" state decides which auth component to render: 
        "login" or "signup," etc.
      */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={handleCloseAuth}
      >
        {authView === 'login' && (
          <LoginContent onViewChange={(view) => setAuthView(view as 'login' | 'signup' | 'resetpassword')} />
        )}
        {authView === 'signup' && (
          <SignUpContent onViewChange={(view) => setAuthView(view as 'login' | 'signup' | 'resetpassword')} />
        )}
        {authView === 'resetpassword' && (
          <ResetPasswordContent onViewChange={(view) => setAuthView(view as 'login' | 'signup' | 'resetpassword')} />
        )}
      </AuthModal>
    </div>
  );
}