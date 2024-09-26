import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// Define interfaces for Model and AIProvider
export interface Model {
  id: string;
  displayName: string;
  maxTokens: number;
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
      },
      {
        id: 'claude-3-sonnet-20240229',
        displayName: 'Claude 3 Sonnet',
        maxTokens: 1000,
      },
    ],
  },
  {
    name: 'OpenAI',
    clientName: 'openai',
    models: [
      {
        id: 'gpt-4o',
        displayName: 'GPT-4o',
        maxTokens: 1000,
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
      },
      {
        id: 'gemini-1.5-flash-002',
        displayName: 'Gemini 1.5 Flash',
        maxTokens: 1000,
      },
    ],
  },
];

// Function to get all available models
export const getAllModels = (): Model[] => {
  return aiProviders.flatMap(provider => provider.models);
};

// Function to get a specific model by its ID
export const getModelById = (id: string): Model | undefined => {
  return getAllModels().find(model => model.id === id);
};

// Function to get the provider for a specific model
export const getProviderForModel = (modelId: string): AIProvider | undefined => {
  return aiProviders.find(provider => provider.models.some(model => model.id === modelId));
};
