import { NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import OpenAI from 'openai';

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

// Initialize OpenAI client for AI model interactions
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  throw new Error('Missing OpenAI API key');
}
const openai = new OpenAI({
  apiKey: openaiApiKey,
});

// Initialize Anthropic client for AI model interactions
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
if (!anthropicApiKey) {
  throw new Error('Missing Anthropic API key');
}
const anthropic = new Anthropic({
  apiKey: anthropicApiKey,
});

type MessageParam = { role: 'user' | 'assistant'; content: string };

export async function POST(req: Request) {
  const { prompt, sessionId, haikuHistory, sonnetHistory, gpt4oHistory, selectedModel } = await req.json();

  // Validate input to ensure necessary data is provided
  if (!prompt || !sessionId || !selectedModel) {
    return new Response(JSON.stringify({ error: 'Prompt, Session ID, and Selected Model are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

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
      let messages: MessageParam[] = [];
      let modelName = '';
      let modelStream;

      // Set up the model stream based on the selected model
      if (selectedModel === 'haiku' || selectedModel === 'sonnet') {
        messages = selectedModel === 'haiku' ? [...haikuHistory, { role: 'user', content: prompt }] : [...sonnetHistory, { role: 'user', content: prompt }];
        modelName = selectedModel === 'haiku' ? 'claude-3-haiku-20240307' : 'claude-3-sonnet-20240229';
        modelStream = await anthropic.messages.stream({
          model: modelName,
          max_tokens: 1000,
          messages,
        });
      } else if (selectedModel === 'gpt-4o') {
        messages = [...gpt4oHistory, { role: 'user', content: prompt }];
        modelName = 'gpt-4o';
        modelStream = await openai.chat.completions.create({
          model: modelName,
          messages,
          stream: true,
        });
      } else {
        throw new Error(`Unsupported model: ${selectedModel}`);
      }

      let modelResponse = '';

      // Process the stream based on the model type
      if (selectedModel === 'gpt-4o') {
        for await (const chunk of modelStream) {
          if ('choices' in chunk && chunk.choices[0]?.delta?.content) {
            modelResponse += chunk.choices[0].delta.content;
            await writeChunk(chunk.choices[0].delta.content);
          }
        }
      } else {
        for await (const event of modelStream) {
          if ('type' in event && event.type === 'content_block_delta' && 'delta' in event && 'text' in event.delta) {
            modelResponse += event.delta.text;
            await writeChunk(event.delta.text);
          }
        }
      }

      // Log the full JSON response for all models
      const fullResponse = {
        model: modelName,
        prompt: prompt,
        response: modelResponse,
      };
      console.log(`Full JSON response for ${modelName}:`, JSON.stringify(fullResponse, null, 2));

      // Log response in Supabase
      try {
        await supabase.from('verzero_log').insert({
          id: crypto.randomUUID(),
          session_id: sessionId,
          conversation_id: crypto.randomUUID(),
          prompt,
          model_name: modelName,
          model_response: modelResponse.replace(/\n/g, '\n\n').trim(),
          created_at: new Date().toISOString(),
        });
        console.log(`Response saved to Supabase for model: ${modelName}`);
      } catch (error) {
        console.error(`Error saving response to Supabase for model ${modelName}:`, error);
      }

      await writer.close();
    } catch (error) {
      console.error('Error in streamResponse:', error);
      await writer.write(encoder.encode(`data: ${JSON.stringify({ error: 'An error occurred during processing' })}\n\n`));
      await writer.close();
    }
  };

  // Start the streaming process
  streamResponse().catch((error) => {
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