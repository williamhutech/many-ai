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
  models: Model[];
}

// Define the available AI providers and their models
export const aiProviders: AIProvider[] = [
  {
    name: 'Anthropic',
    clientName: 'anthropic',
    models: [
      {
        id: 'claude-3-haiku-20240307',
        displayName: 'Claude 3 Haiku',
        maxTokens: 1000,
        enabled: true,
      },
      {
        id: 'claude-3-5-sonnet-20240620',
        displayName: 'Claude 3.5 Sonnet',
        maxTokens: 1000,
        enabled: true,
      },
    ],
  },
  {
    name: 'OpenAI',
    clientName: 'openai',
    models: [
      {
        id: 'gpt-4o-2024-08-06',
        displayName: 'GPT 4o',
        maxTokens: 1000,
        enabled: true,
      },
      {
        id: 'gpt-4o-mini-2024-07-18',
        displayName: 'GPT 4o Mini',
        maxTokens: 1000,
        enabled: true,
      },
    ],
  },
  {
    name: 'Google',
    clientName: 'google',
    models: [
      {
        id: 'gemini-1.5-pro-002',
        displayName: 'Gemini 1.5 Pro',
        maxTokens: 1000,
        enabled: true,
      },
      {
        id: 'gemini-1.5-flash-002',
        displayName: 'Gemini 1.5 Flash',
        maxTokens: 1000,
        enabled: true,
      },
    ],
  },
  {
    name: 'DeepInfra',
    clientName: 'deepinfra',
    models: [
      {
        id: 'meta-llama/Llama-3.2-90B-Vision-Instruct',
        displayName: 'Llama 3.2 90B - DI',
        maxTokens: 1000,
        enabled: false,
      },
      {
        id: 'meta-llama/Llama-3.2-11B-Vision-Instruct',
        displayName: 'Llama 3.2 11B - DI',
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
    models: [
      {
        id: 'llama-3.1-70b-versatile',
        displayName: 'Llama 3.1 70B ULTRA',
        maxTokens: 1000,
        enabled: false,
      },
      {
        id: 'llama-3.2-90b-text-preview',
        displayName: 'Llama 3.2 90B ULTRA',
        maxTokens: 1000,
        enabled: false,
      },
      {
        id: 'llama-3.2-11b-text-preview',
        displayName: 'Llama 3.2 11B ULTRA',
        maxTokens: 1000,
        enabled: false,
      },
    ],
  },
  {
    name: 'Together AI',
    clientName: 'together',
    models: [
      {
        id: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
        displayName: 'Llama 3.2 90B',
        maxTokens: 1000,
        enabled: true,
      },
      {
        id: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
        displayName: 'Llama 3.2 11B',
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