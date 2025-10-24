import 'dotenv/config'
import { NextResponse } from 'next/server';
import { aiProviders, getProviderForModel, getModelById } from '@/config/models';
import { createServerClient } from '@/lib/supabase/server'; // Updated import
import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import { Groq } from 'groq-sdk';
import TogetherClient from 'together-ai';
import { randomUUID } from 'crypto';

// Add this interface at the top of the file, after the imports
interface StreamError extends Error {
  code?: string;
}

// Initialize Supabase client
const supabase = createServerClient();
if (supabase) {
  console.log('Supabase client initialized successfully');
} else {
  console.error('Failed to initialize Supabase client');
}

// Initialize AI clients at the top level
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;
const googleApiKey = process.env.GOOGLE_API_KEY;
const deepInfraApiKey = process.env.DEEP_INFRA_API_KEY;;
const groqApiKey = process.env.GROQ_API_KEY;
const togetherApiKey = process.env.TOGETHER_API_KEY;

if (!anthropicApiKey || !openaiApiKey || !googleApiKey || !deepInfraApiKey || !groqApiKey || !togetherApiKey) {
  throw new Error('Missing AI API keys');
}

const anthropicClient = new Anthropic({
  apiKey: anthropicApiKey,
});

const openaiClient = new OpenAI({
  apiKey: openaiApiKey,
});

const googleClient = new GoogleGenAI({ apiKey: googleApiKey });

// Add Meta-Llama client
const deepInfraClient = new OpenAI({
  baseURL: 'https://api.deepinfra.com/v1/openai',
  apiKey: deepInfraApiKey,
});

const groqClient = new Groq({
  apiKey: groqApiKey,
});

// Add Together AI client
const togetherClient = new TogetherClient({
  apiKey: togetherApiKey,
});

// Map client names to instances
const aiClients = {
  anthropic: anthropicClient,
  openai: openaiClient,
  google: googleClient,
  deepinfra: deepInfraClient,
  groq: groqClient,
  together: togetherClient,
};

type MessageParam = { role: 'user' | 'assistant'; content: string };

type CompletionParams = {
  messages: MessageParam[];
  model: string;
  stream: boolean;
};

type CompletionResponse = {
  choices: Array<{
    delta: {
      content?: string;
    };
  }>;
};

interface LogEntry {
  id: string;
  session_id: string;
  conversation_id: string;
  prompt: string;
  model_name: string;
  model_response: string;
  created_at: string;
}

export async function POST(req: Request) {
  const { prompt, sessionId, conversationHistories, selectedModel } = await req.json();

  // Validate input to ensure necessary data is provided
  if (!prompt || !sessionId || !selectedModel) {
    return new Response(JSON.stringify({ error: 'Prompt, Session ID, and Selected Model are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get the model and provider from the configuration
  const model = getModelById(selectedModel);
  const provider = getProviderForModel(selectedModel);

  if (!model || !provider) {
    return new Response(JSON.stringify({ error: `Unsupported model: ${selectedModel}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const client = aiClients[provider.clientName as keyof typeof aiClients];
  if (!client) {
    return new Response(JSON.stringify({ error: `Unsupported provider: ${provider.name}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  // Retrieve conversation history for the selected model and filter out empty messages
  const history = (conversationHistories?.[selectedModel] || []).filter((msg: MessageParam) => msg.content.trim() !== '');

  // If this is the first message and model has a prePrompt, add it to the prompt
  const finalPrompt = history.length === 0 && model.prePrompt 
    ? `${model.prePrompt}\n\n${prompt.trim()}`
    : prompt.trim();

  // Add the user's message to history
  history.push({ role: 'user', content: finalPrompt });

  // Set up streaming response
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Helper function to write chunks of data to the stream
  const writeChunk = async (content: string) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
  };

  const streamResponse = async () => {
    try {
      let modelStream;
      let modelResponse = '';

      // Initialize the model stream dynamically
      if (provider.clientName === 'anthropic') {
        // Convert history to Anthropic's expected format and ensure proper message structure
        const anthropicMessages = history.map((msg: { role: string; content: string }) => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

        // Create the stream with proper message history
        modelStream = await (client as Anthropic).messages.stream({
          model: model.id,
          max_tokens: model.maxTokens,
          messages: anthropicMessages,
          system: "You are a helpful AI assistant. Maintain context of the conversation and reference previous exchanges when relevant."
        });

        // After getting the response, add it to history
        let fullResponse = '';
        for await (const chunk of modelStream) {
          if (chunk.type === 'content_block_delta' && 'text' in chunk.delta) {
            fullResponse += chunk.delta.text;
            await writeChunk(chunk.delta.text);
          }
        }
        
        // Add the assistant's response to history
        history.push({ 
          role: 'assistant', 
          content: fullResponse 
        });
      } else if (provider.clientName === 'openai') {
        modelStream = await (client as OpenAI).chat.completions.create({
          model: model.id,
          messages: history,
          stream: true,
        });

        let fullResponse = '';
        for await (const chunk of modelStream) {
          if ('choices' in chunk && chunk.choices[0]?.delta?.content) {
            const content = chunk.choices[0].delta.content;
            fullResponse += content;
            modelResponse += content;
            await writeChunk(content);
          }
        }

        // Add the assistant's response to history
        history.push({ 
          role: 'assistant', 
          content: fullResponse 
        });
      } else if (provider.clientName === 'google') {
        // Get model configuration once
        const modelConfig = getModelById(selectedModel);
        if (!modelConfig) {
          throw new Error('Model configuration not found');
        }

        // Optimize history format for Gemini (new SDK uses same format)
        const geminiHistory = history.map((msg: { role: string; content: string }) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));

        try {
          // Use new SDK's generateContentStream
          const response = await googleClient.models.generateContentStream({
            model: selectedModel,
            contents: geminiHistory,
            config: {
              maxOutputTokens: modelConfig.maxTokens,
              temperature: 0.7,
              candidateCount: 1,
              topK: 40,
              topP: 0.8,
            }
          });

          let fullResponse = '';

          // New SDK: iterate directly over response instead of response.stream
          for await (const chunk of response) {
            const chunkText = chunk.text;
            if (chunkText) {
              fullResponse += chunkText;
              modelResponse += chunkText;
              await writeChunk(chunkText);
            }
          }

          // Add response to history
          history.push({
            role: 'assistant',
            content: fullResponse
          });
        } catch (error) {
          console.error('Gemini streaming error:', error);
          throw error;
        }
      } else if (provider.clientName === 'deepinfra') {
        modelStream = await (client as OpenAI).chat.completions.create({
          model: model.id,
          messages: history,
          stream: true,
        });

        for await (const chunk of modelStream) {
          if ('choices' in chunk && chunk.choices[0]?.delta?.content) {
            modelResponse += chunk.choices[0].delta.content;
            await writeChunk(chunk.choices[0].delta.content);
          }
        }
      } else if (provider.clientName === 'together') {
        modelStream = await (client as TogetherClient).chat.completions.create({
          model: model.id,
          messages: history,
          stream: true,
        });

        for await (const chunk of modelStream) {
          if ('choices' in chunk && chunk.choices[0]?.delta?.content) {
            modelResponse += chunk.choices[0].delta.content;
            await writeChunk(chunk.choices[0].delta.content);
          }
        }
      } else if (provider.clientName === 'groq') {
        modelStream = await (client as Groq).chat.completions.create({
          model: model.id,
          messages: history,
          stream: true,
        });

        for await (const chunk of modelStream) {
          if (chunk.choices[0]?.delta?.content) {
            modelResponse += chunk.choices[0].delta.content;
            await writeChunk(chunk.choices[0].delta.content);
          }
        }
      }

      // Save the response to Supabase
      if (supabase) {
        try {
          const { error } = await supabase.from('verone_log').insert({
            id: randomUUID(),
            session_id: sessionId,
            conversation_id: randomUUID(),
            prompt,
            model_name: model.id,
            model_response: modelResponse.replace(/\n/g, '\n\n').trim(),
            created_at: new Date().toISOString(),
          });

          if (error) {
            console.error('Error inserting data into Supabase:', error);
          } else {
            console.log(`Response saved to Supabase for model: ${model.id}`);
          }
        } catch (error) {
          console.error(`Error saving response to Supabase for model ${model.id}:`, error);
          if (error instanceof Error) {
            console.error('Error details:', error.message);
          }
        }
      } else {
        console.error('Supabase client is not initialized');
      }

      try {
        await writer.close();
      } catch (closeError) {
        if (
          closeError instanceof TypeError && 
          (closeError as StreamError).code === 'ERR_INVALID_STATE'
        ) {
          console.log('Stream was already closed');
        } else {
          console.error('Error closing stream:', closeError);
        }
      }
    } catch (error) {
      console.error('Error in streamResponse:', error);
      let errorMessage = 'An error occurred during processing';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      try {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`));
        await writer.close();
      } catch (closeError) {
        if (
          closeError instanceof TypeError && 
          (closeError as StreamError).code === 'ERR_INVALID_STATE'
        ) {
          console.log('Stream was already closed');
        } else {
          console.error('Error closing stream:', closeError);
        }
      }
    }
  };

  // Start the streaming process
  streamResponse().catch(error => {
    console.error('Error in streamResponse:', error);
  });

  // Return the stream as the response
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
