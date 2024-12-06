import 'dotenv/config'
import { NextResponse } from 'next/server';
import { aiProviders, getProviderForModel, getModelById } from '@/config/models';
import { createServerClient } from '@/lib/supabase/server'; // Updated import
import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { Groq } from 'groq-sdk';
import TogetherClient from 'together-ai';
import { randomUUID } from 'crypto';

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

const googleClient = new GoogleGenerativeAI(googleApiKey);

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
  history.push({ role: 'user', content: prompt.trim() });

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
        // Convert history to Anthropic's expected format
        const anthropicMessages = history.map((msg: { role: string; content: string }) => {
          if (msg.role === 'user') {
            return { role: 'user', content: msg.content };
          } else {
            return { role: 'assistant', content: msg.content };
          }
        });

        modelStream = await (client as Anthropic).messages.stream({
          model: model.id,
          max_tokens: model.maxTokens,
          system: "You are a helpful AI assistant. Maintain context of the conversation and reference previous exchanges when relevant.",
          messages: anthropicMessages,
        });

        for await (const event of modelStream) {
          if ('delta' in event && 'text' in event.delta) {
            modelResponse += event.delta.text;
            await writeChunk(event.delta.text);
          }
        }
      } else if (provider.clientName === 'openai') {
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
      } else if (provider.clientName === 'google') {
        const model = googleClient.getGenerativeModel({ model: selectedModel });
        const chat = model.startChat({
          history: history.map((msg: { role: string; content: string }) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: msg.content,
          })),
        });

        const result = await chat.sendMessageStream(prompt);

        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          modelResponse += chunkText;
          await writeChunk(chunkText);
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
      } else if (provider.clientName === 'gemini-1.5-flash-002') {
        const fusionModel = googleClient.getGenerativeModel({ model: selectedModel });
        const fusionChat = fusionModel.startChat({
          history: history.map((msg: { role: string; content: string }) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: msg.content,
          })),
        });

        const fusionResult = await fusionChat.sendMessageStream(prompt);

        for await (const chunk of fusionResult.stream) {
          const chunkText = chunk.text();
          modelResponse += chunkText;
          await writeChunk(chunkText);
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

      await writer.close();
    } catch (error) {
      console.error('Error in streamResponse:', error);
      let errorMessage = 'An error occurred during processing';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      await writer.write(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`));
      await writer.close();
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
