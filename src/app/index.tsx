import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState({ haiku: "", sonnet: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{ conversation_id: string; prompt: string; model_name: string; model_response: string | null; created_at: string }>>([]);

  useEffect(() => {
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    fetchConversationHistory(newSessionId);
  }, []);

  const fetchConversationHistory = async (sid: string) => {
    const response = await fetch(`/api/conversation-history?sessionId=${sid}`);
    if (response.ok) {
      const history = await response.json();
      setConversationHistory(history);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) return;
    setIsLoading(true);
    setResult({ haiku: "", sonnet: "" });

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, sessionId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate response');
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(5));
              if (data.model === 'haiku') {
                setResult(prev => ({ ...prev, haiku: prev.haiku + data.content }));
              } else if (data.model === 'sonnet') {
                setResult(prev => ({ ...prev, sonnet: prev.sonnet + data.content }));
              } else if (data.type === 'history') {
                setConversationHistory(data.history);
              }
            } catch (error) {
              console.error('Error parsing JSON:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while generating the response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-20">
      <h1 className="text-10xl font-semibold mb-8 mt-6 text-center">Claude 3 Comparison</h1>
      
      {/* Display conversation history */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Conversation History</h2>
        {conversationHistory.map((entry, index) => (
          <div key={entry.conversation_id} className={`mb-4 p-4 rounded ${entry.model_name === 'user' ? 'bg-blue-100' : 'bg-green-100'}`}>
            <p><strong>{entry.model_name === 'user' ? 'You' : entry.model_name}:</strong> {entry.model_name === 'user' ? entry.prompt : entry.model_response}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="prompt">Enter your prompt:</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full"
                rows={4}
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-black inline-block"></span>
                  Generating...
                </>
              ) : (
                'Send Message'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex-grow flex flex-row gap-4 mb-4 w-full justify-center mt-4">
        <div className="rounded-lg border border-zinc-200 bg-white text-zinc-950 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 flex-1 flex flex-col w-full md:w-1/2">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-xl font-semibold leading-none tracking-tight">Claude 3 Haiku Response</h3>
          </div>
          <div className="p-6 pt-0 flex-grow">
            <Textarea
              value={result.haiku}
              readOnly
              className="h-full w-full resize-none text-sm"
              style={{ minHeight: '200px' }}
            />
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white text-zinc-950 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 flex-1 flex flex-col w-full md:w-1/2">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-xl font-semibold leading-none tracking-tight">Claude 3 Sonnet Response</h3>
          </div>
          <div className="p-6 pt-0 flex-grow">
            <Textarea
              value={result.sonnet}
              readOnly
              className="h-full w-full resize-none text-sm"
              style={{ minHeight: '200px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}