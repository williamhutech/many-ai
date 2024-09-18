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
    persistSession: false
  }
});

// Initialize Anthropic client for AI model interactions
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type MessageParam = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  console.log('POST request received');
  const { prompt, sessionId, haikuHistory, sonnetHistory } = await req.json();
  console.log('Received prompt:', prompt, 'sessionId:', sessionId);

  // Validate input to ensure necessary data is provided
  if (!prompt || !sessionId) {
    return new Response(JSON.stringify({ error: 'Prompt and Session ID are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Set up streaming response
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Helper function to write chunks of data to the stream
  const writeChunk = async (model: string, content: string) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify({ model, content })}\n\n`));
  };

  const streamResponse = async () => {
    try {
      // Prepare messages for both Haiku and Sonnet models
      const haikuMessages = [...haikuHistory, { role: 'user', content: prompt }];
      const sonnetMessages = [...sonnetHistory, { role: 'user', content: prompt }];

      // Stream responses from both models concurrently
      const [haikuStream, sonnetStream] = await Promise.all([
        anthropic.messages.stream({
          model: "claude-3-haiku-20240307",
          max_tokens: 1000,
          messages: haikuMessages,
        }),
        anthropic.messages.stream({
          model: "claude-3-sonnet-20240229",
          max_tokens: 1000,
          messages: sonnetMessages,
        })
      ]);

      let haikuResponse = "";
      let sonnetResponse = "";

      // Process and stream both responses simultaneously
      for await (const [haikuEvent, sonnetEvent] of zip(haikuStream, sonnetStream)) {
        if (haikuEvent.type === 'content_block_delta' && 'text' in haikuEvent.delta) {
          haikuResponse += haikuEvent.delta.text;
          await writeChunk('haiku', haikuEvent.delta.text);
        }
        if (sonnetEvent.type === 'content_block_delta' && 'text' in sonnetEvent.delta) {
          sonnetResponse += sonnetEvent.delta.text;
          await writeChunk('sonnet', sonnetEvent.delta.text);
        }
      }

      // Log responses in Supabase for analysis and tracking
      try {
        const [haikuResult, sonnetResult] = await Promise.all([
          supabase.from('verzero_log').insert({
            id: crypto.randomUUID(),
            session_id: sessionId,
            conversation_id: crypto.randomUUID(),
            prompt: prompt,
            model_name: 'claude-3-haiku-20240307',
            model_response: haikuResponse,
            created_at: new Date().toISOString()
          }),
          supabase.from('verzero_log').insert({
            id: crypto.randomUUID(),
            session_id: sessionId,
            conversation_id: crypto.randomUUID(),
            prompt: prompt,
            model_name: 'claude-3-sonnet-20240229',
            model_response: sonnetResponse,
            created_at: new Date().toISOString()
          })
        ]);

        if (haikuResult.error) {
          throw new Error(`Error inserting haiku response: ${haikuResult.error.message}`);
        }
        if (sonnetResult.error) {
          throw new Error(`Error inserting sonnet response: ${sonnetResult.error.message}`);
        }

        console.log('Successfully inserted responses into Supabase');
      } catch (error) {
        console.error('Error inserting responses into Supabase:', error);
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
      'Connection': 'keep-alive',
    },
  });
}

// Helper function to process multiple async iterables concurrently
async function* zip(...iterables: AsyncIterable<unknown>[]) {
  const iterators = iterables.map(i => i[Symbol.asyncIterator]());
  while (true) {
    const results = await Promise.all(iterators.map(i => i.next()));
    if (results.some(r => r.done)) return;
    yield Promise.all(results.map(r => r.value));
  }
}

// Debug logging for Supabase environment variables
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);