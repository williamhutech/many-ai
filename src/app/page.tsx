"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function Home() {
  // State variables for managing the application's data and UI
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState({ haiku: "", sonnet: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [haikuHistory, setHaikuHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [sonnetHistory, setSonnetHistory] = useState<Array<{ role: string; content: string }>>([]);

  // Effect to initialize session and load conversation history
  useEffect(() => {
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    const storedHaikuHistory = localStorage.getItem('haikuHistory');
    const storedSonnetHistory = localStorage.getItem('sonnetHistory');
    if (storedHaikuHistory) setHaikuHistory(JSON.parse(storedHaikuHistory));
    if (storedSonnetHistory) setSonnetHistory(JSON.parse(storedSonnetHistory));
  }, []);

  // Function to handle form submission and API interaction
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) return;
    setIsLoading(true);
    setResult({ haiku: "", sonnet: "" });

    try {
      // Send request to the API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, sessionId, haikuHistory, sonnetHistory }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate response');
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Process the streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let haikuResponse = "";
      let sonnetResponse = "";

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
                haikuResponse += data.content;
                setResult(prev => ({ ...prev, haiku: haikuResponse }));
              } else if (data.model === 'sonnet') {
                sonnetResponse += data.content;
                setResult(prev => ({ ...prev, sonnet: sonnetResponse }));
              }
            } catch (error) {
              console.error('Error parsing JSON:', error);
            }
          }
        }
      }

      // Update conversation histories
      setHaikuHistory(prev => [...prev, { role: 'user', content: prompt }, { role: 'assistant', content: haikuResponse }]);
      setSonnetHistory(prev => [...prev, { role: 'user', content: prompt }, { role: 'assistant', content: sonnetResponse }]);

      // Store updated histories in localStorage
      localStorage.setItem('haikuHistory', JSON.stringify(haikuHistory));
      localStorage.setItem('sonnetHistory', JSON.stringify(sonnetHistory));

    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while generating the response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render the UI components
  return (
    <div className="container mx-auto p-20">
      <h1 className="text-10xl font-semibold mb-8 mt-6 text-center">Claude 3 Comparison</h1>
      <Card>
        <CardContent className="pt-6">
          {/* Form for user input */}
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

      {/* Display area for AI responses */}
      <div className="flex-grow flex flex-row gap-4 mb-4 w-full justify-center mt-4">
        {/* Haiku response display */}
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
        {/* Sonnet response display */}
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