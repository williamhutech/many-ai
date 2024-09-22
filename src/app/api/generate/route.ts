import { NextResponse } from 'next/server';
import { aiProviders, getProviderForModel, getModelById } from '@/config/models';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';

// Initialize Supabase client for logging responses
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Initialize AI clients at the top level
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!anthropicApiKey || !openaiApiKey) {
  throw new Error('Missing AI API keys');
}

const anthropicClient = new Anthropic({
  apiKey: anthropicApiKey,
});

const openaiClient = new OpenAI({
  apiKey: openaiApiKey,
});

// Map client names to instances
const aiClients = {
  anthropic: anthropicClient,
  openai: openaiClient,
};

type MessageParam = { role: 'user' | 'assistant'; content: string };

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
        modelStream = await (client as Anthropic).messages.stream({
          model: model.id,
          max_tokens: model.maxTokens,
          messages: history.map((msg: { role: string; content: string }) => ({ role: msg.role, content: msg.content })),
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
      }

      // Log the full JSON response for all models
      const fullResponse = {
        model: model.id,
        prompt: prompt,
        response: modelResponse,
      };
      console.log(`Full JSON response for ${model.id}:`, JSON.stringify(fullResponse, null, 2));

      // Log response in Supabase
      try {
        await supabase.from('verzero_log').insert({
          id: crypto.randomUUID(),
          session_id: sessionId,
          conversation_id: crypto.randomUUID(),
          prompt,
          model_name: model.id,
          model_response: modelResponse.replace(/\n/g, '\n\n').trim(),
          created_at: new Date().toISOString(),
        });
        console.log(`Response saved to Supabase for model: ${model.id}`);
      } catch (error) {
        console.error(`Error saving response to Supabase for model ${model.id}:`, error);
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