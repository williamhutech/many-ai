import { NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

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

// Initialize Anthropic client for AI model interactions
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type MessageParam = { role: 'user' | 'assistant'; content: string };

export async function POST(req: Request) {
  const { prompt, sessionId, haikuHistory, sonnetHistory, selectedModel } = await req.json();

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
      // Prepare messages based on selected model
      let messages: MessageParam[] = [];
      let modelName = '';

      if (selectedModel === 'haiku') {
        messages = [...haikuHistory, { role: 'user', content: prompt }];
        modelName = 'claude-3-haiku-20240307';
      } else if (selectedModel === 'sonnet') {
        messages = [...sonnetHistory, { role: 'user', content: prompt }];
        modelName = 'claude-3-sonnet-20240229';
      } else {
        // Handle other models if needed
        return;
      }

      // Stream response from the selected model
      const modelStream = await anthropic.messages.stream({
        model: modelName,
        max_tokens: 1000,
        messages,
      });

      let modelResponse = '';

      // Process and stream the response
      for await (const event of modelStream) {
        if (event.type === 'content_block_delta' && 'text' in event.delta) {
          modelResponse += event.delta.text;
          await writeChunk(event.delta.text);
        }
      }

      // Log response in Supabase for analysis and tracking
      try {
        const { error } = await supabase.from('verzero_log').insert({
          id: crypto.randomUUID(),
          session_id: sessionId,
          conversation_id: crypto.randomUUID(),
          prompt,
          model_name: modelName,
          model_response: modelResponse.replace(/\n/g, '\n\n').trim(),
          created_at: new Date().toISOString(),
        });

        if (error) {
          throw new Error(`Error inserting response: ${error.message}`);
        }

        console.log('Successfully inserted response into Supabase');
      } catch (error) {
        console.error('Error inserting response into Supabase:', error);
      }

      await writer.close();
    } catch (error) {
      console.error('Error:', error);
      await writer.abort();
    }
  };

  // Start the streaming process
  streamResponse();

  // Return the stream as the response
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}