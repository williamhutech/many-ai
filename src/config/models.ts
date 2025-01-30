import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import TogetherClient from 'together-ai';

// Define interfaces for Model and AIProvider
export interface Model {
  id: string;
  displayName: string;
  maxTokens: number;
  enabled: boolean;
  mode: 'fast' | 'smart' | 'ultra_fast' | 'ultra_smart';
  prePrompt: string;
}

export interface AIProvider {
  name: string;
  clientName: string;
  nickname: string;
  avatar: string;
  models: Model[];
}

// Define the available AI providers and their models
export const aiProviders: AIProvider[] = [
  {
    name: 'Anthropic',
    clientName: 'anthropic',
    nickname: 'Claude',
    avatar: '/avatars/claude.png',
    models: [
      {
        id: 'claude-3-haiku-20240307',
        displayName: 'Claude Haiku 3 [FAST]',
        maxTokens: 4096,
        enabled: true,
        mode: 'fast',
        prePrompt: 'Prioritize key information in your answer if applicable; else go straight to point.',
      },
      {
        id: 'claude-3-5-sonnet-20240620',
        displayName: 'Claude Sonnet 3.5 [Smart]',
        maxTokens: 4096,
        enabled: true,
        mode: 'smart',
        prePrompt: 'Prioritize key information in your answer if applicable; else go straight to point.',
      },
    ],
  },
  {
    name: 'OpenAI',
    clientName: 'openai',
    nickname: 'ChatGPT',
    avatar: '/avatars/chatgpt.png',
    models: [
      {
        id: 'gpt-4o-2024-08-06',
        displayName: 'ChatGPT 4o [Smart]',
        maxTokens: 20000,
        enabled: true,
        mode: 'smart',
        prePrompt: 'Prioritize key information in your answer.',
      },
      {
        id: 'gpt-4o-mini-2024-07-18',
        displayName: 'ChatGPT 4o [FAST]',
        maxTokens: 10000,
        enabled: true,
        mode: 'fast',
        prePrompt: 'Prioritize key information in your answer.',
      },
      {
        id: 'o1-mini-2024-09-12',
        displayName: 'ChatGPT 4o1 Mini [FAST]',
        maxTokens: 2000,
        enabled: true,
        mode: 'fast',
        prePrompt: 'Prioritize key information in your answer.',
      },
    ],
  },
  {
    name: 'Google',
    clientName: 'google',
    nickname: 'Gemini',
    avatar: '/avatars/gemini.png',
    models: [
      {
        id: 'gemini-1.5-pro',
        displayName: 'Gemini 1.5 [Smart]',
        maxTokens: 10000,
        enabled: true,
        mode: 'smart',
        prePrompt: 'Prioritize key information in your answer if applicable',
      },
      {
        id: 'gemini-1.5-flash',
        displayName: 'Gemini 1.5 [FAST]',
        maxTokens: 10000,
        enabled: true,
        mode: 'fast',
        prePrompt: 'Prioritize key information in your answer if applicable',
      },
    ],
  },
  {
    name: 'DeepInfra',
    clientName: 'deepinfra',
    nickname: 'Llama',
    avatar: '/avatars/llama.png',
    models: [
      {
        id: 'meta-llama/Llama-3.2-90B-Vision-Instruct',
        displayName: 'Llama 3.2 [Smart]',
        maxTokens: 1000,
        enabled: false,
        mode: 'smart',
        prePrompt: '',
      },
      {
        id: 'meta-llama/Llama-3.2-11B-Vision-Instruct',
        displayName: 'Llama 3.2 [FAST]',
        maxTokens: 1000,
        enabled: false,
        mode: 'fast',
        prePrompt: '',
      },
      {
        id: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
        displayName: 'Llama 3.1 70B - DI',
        maxTokens: 1000,
        enabled: false,
        mode: 'smart',
        prePrompt: '',
      },
    ],
  },
  {
    name: 'Groq',
    clientName: 'groq',
    nickname: 'Llama',
    avatar: '/avatars/llama.png',
    models: [
      {
        id: 'llama-3.2-90b-vision-preview',
        displayName: 'Llama 3.2 [ULTRA Smart]',
        maxTokens: 2000,
        enabled: false,
        mode: 'smart',
        prePrompt: '',
      },
      {
        id: 'llama-3.2-11b-vision-preview',
        displayName: 'Llama 3.2 [ULTRA FAST]',
        maxTokens: 2000,
        enabled: false,
        mode: 'fast',
        prePrompt: '',
      },
    ],
  },
  {
    name: 'Together AI',
    clientName: 'together',
    nickname: 'Llama',
    avatar: '/avatars/llama.png',
    models: [
      {
        id: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
        displayName: 'Llama [Smart]',
        maxTokens: 2000,
        enabled: true,
        mode: 'smart',
        prePrompt: '',
      },
      {
        id: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
        displayName: 'Llama [FAST]',
        maxTokens: 2000,
        enabled: true,
        mode: 'fast',
        prePrompt: '',
      },
    ],
  },
];

// Function to get all available models
export const getAllModels = (): Model[] => {
  return aiProviders.flatMap(provider => provider.models.filter(model => model.enabled));
};

// Function to get a specific model by its ID
export const getModelById = (id: string): Model | undefined => {
  return getAllModels().find(model => model.id === id);
};

// Function to get the provider for a specific model
export const getProviderForModel = (modelId: string): AIProvider | undefined => {
  return aiProviders.find(provider => provider.models.some(model => model.id === modelId));
};

// Function to get model by provider and mode
export const getModelByProviderAndMode = (providerName: string, mode: 'fast' | 'smart'): Model | undefined => {
  const provider = aiProviders.find(p => p.name === providerName);
  if (!provider) return undefined;

  // Filter models by mode
  const modeModels = provider.models.filter(m => {
    if (mode === 'fast') {
      return m.mode === 'fast' || m.mode === 'ultra_fast';
    } else {
      return m.mode === 'smart' || m.mode === 'ultra_smart';
    }
  });

  // If no models found for the specified mode, get models of the opposite mode
  if (modeModels.length === 0) {
    const fallbackModels = provider.models.filter(m => {
      if (mode === 'fast') {
        return m.mode === 'smart' || m.mode === 'ultra_smart';
      } else {
        return m.mode === 'fast' || m.mode === 'ultra_fast';
      }
    });
    return fallbackModels[0];
  }

  // Return the first model found
  return modeModels[0];
};

// Function to get models for all three providers based on mode
export const getDefaultModels = (mode: 'fast' | 'smart'): string[] => {
  const providers = ['Anthropic', 'OpenAI', 'Google'];
  const models = providers.map(provider => {
    const model = getModelByProviderAndMode(provider, mode);
    return model?.id || '';
  });
  return models.filter(id => id !== '');
};