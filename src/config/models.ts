import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import TogetherClient from 'together-ai';

// Define interfaces for Model and AIProvider
export interface Model {
  id: string;
  displayName: string;
  maxTokens: number;
  enabled: boolean; // Add this line
}

export interface AIProvider {
  name: string;
  clientName: string; // Name to identify the client
  nickname: string; // Add this line
  models: Model[];
}

// Define the available AI providers and their models
export const aiProviders: AIProvider[] = [
  {
    name: 'Anthropic',
    clientName: 'anthropic',
    nickname: 'Claude', // Add this line
    models: [
      {
        id: 'claude-3-haiku-20240307',
        displayName: 'Claude Haiku 3 [FAST]',
        maxTokens: 1000,
        enabled: true,
      },
      {
        id: 'claude-3-5-sonnet-20240620',
        displayName: 'Claude Sonnet 3.5 [Smart]',
        maxTokens: 1000,
        enabled: true,
      },
    ],
  },
  {
    name: 'OpenAI',
    clientName: 'openai',
    nickname: 'ChatGPT', // Add this line
    models: [
      {
        id: 'gpt-4o-2024-08-06',
        displayName: 'ChatGPT 4o [Smart]',
        maxTokens: 1000,
        enabled: true,
      },
      {
        id: 'gpt-4o-mini-2024-07-18',
        displayName: 'ChatGPT 4o [FAST]',
        maxTokens: 1000,
        enabled: true,
      },
    ],
  },
  {
    name: 'Google',
    clientName: 'google',
    nickname: 'Gemini', // Add this line
    models: [
      {
        id: 'gemini-1.5-pro-002',
        displayName: 'Gemini 1.5 [Smart]',
        maxTokens: 1000,
        enabled: true,
      },
      {
        id: 'gemini-1.5-flash-002',
        displayName: 'Gemini 1.5 [FAST]',
        maxTokens: 1000,
        enabled: true,
      },
    ],
  },
  {
    name: 'DeepInfra',
    clientName: 'deepinfra',
    nickname: 'Llama', // Add this line
    models: [
      {
        id: 'meta-llama/Llama-3.2-90B-Vision-Instruct',
        displayName: 'Llama 3.2 [Smart]',
        maxTokens: 1000,
        enabled: false,
      },
      {
        id: 'meta-llama/Llama-3.2-11B-Vision-Instruct',
        displayName: 'Llama 3.2 [FAST]',
        maxTokens: 1000,
        enabled: false,
      },
      {
        id: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
        displayName: 'Llama 3.1 70B - DI',
        maxTokens: 1000,
        enabled: false,
      },
    ],
  },
  {
    name: 'Groq',
    clientName: 'groq',
    nickname: 'Llama', // Add this line
    models: [
      {
        id: 'llama-3.2-90b-text-preview',
        displayName: 'Llama 3.2 [ULTRA Smart]',
        maxTokens: 1000,
        enabled: true,
      },
      {
        id: 'llama-3.2-11b-text-preview',
        displayName: 'Llama 3.2 [ULTRA FAST]',
        maxTokens: 1000,
        enabled: true,
      },
    ],
  },
  {
    name: 'Together AI',
    clientName: 'together',
    nickname: 'Llama', // Add this line
    models: [
      {
        id: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
        displayName: 'Llama 3.2 [Smart]',
        maxTokens: 1000,
        enabled: true,
      },
      {
        id: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
        displayName: 'Llama 3.2 [FAST]',
        maxTokens: 1000,
        enabled: true,
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