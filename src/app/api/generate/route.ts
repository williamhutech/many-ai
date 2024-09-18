import { NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

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

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type MessageParam = { role: "user" | "assistant"; content: string };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const prompt = searchParams.get('prompt');
  const historyParam = searchParams.get('history');
  const history = historyParam ? JSON.parse(decodeURIComponent(historyParam)) : [];

  if (!prompt) {
    return new Response('Prompt is required', { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const writeChunk = async (model: string, content: string) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify({ model, content })}\n\n`));
  };

  const processStream = async (model: string, stream: AsyncIterable<Anthropic.MessageStreamEvent>) => {
    let fullResponse = '';
    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        if ('text' in event.delta) {
          fullResponse += event.delta.text;
          await writeChunk(model, event.delta.text);
        }
      }
    }
    return fullResponse;
  };

  const streamResponse = async () => {
    try {
      const messages = [...history, { role: "user", content: prompt }];
      const [haikuStream, sonnetStream] = await Promise.all([
        anthropic.messages.stream({
          model: "claude-3-haiku-20240307",
          max_tokens: 1000,
          messages,
        }),
        anthropic.messages.stream({
          model: "claude-3-sonnet-20240229",
          max_tokens: 1000,
          messages,
        })
      ]);

      const [haikuResponse, sonnetResponse] = await Promise.all([
        processStream('haiku', haikuStream),
        processStream('sonnet', sonnetStream)
      ]);

      // Add system responses to history
      messages.push({ role: "assistant", content: `Haiku: ${haikuResponse}` });
      messages.push({ role: "assistant", content: `Sonnet: ${sonnetResponse}` });

      await writer.close();
    } catch (error) {
      console.error('Error:', error);
      await writer.abort();
    }
  };

  streamResponse();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export async function POST(req: Request) {
  console.log('POST request received');
  const { prompt, sessionId, haikuHistory, sonnetHistory } = await req.json();
  console.log('Received prompt:', prompt, 'sessionId:', sessionId);

  if (!prompt || !sessionId) {
    return new Response(JSON.stringify({ error: 'Prompt and Session ID are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const writeChunk = async (model: string, content: string) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify({ model, content })}\n\n`));
  };

  const streamResponse = async () => {
    try {
      const haikuMessages = [...haikuHistory, { role: 'user', content: prompt }];
      const sonnetMessages = [...sonnetHistory, { role: 'user', content: prompt }];
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

      // Store the responses in Supabase
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

  streamResponse();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

async function* zip(...iterables: AsyncIterable<unknown>[]) {
  const iterators = iterables.map(i => i[Symbol.asyncIterator]());
  while (true) {
    const results = await Promise.all(iterators.map(i => i.next()));
    if (results.some(r => r.done)) return;
    yield Promise.all(results.map(r => r.value));
  }
}

console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);