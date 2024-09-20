"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function SDKPlayground() {
  // State management for the application
  const [models, setModels] = useState(['sonnet', 'haiku', 'gpt-4o']);
  const [input, setInput] = useState('');
  const [results, setResults] = useState(['', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [haikuHistory, setHaikuHistory] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [sonnetHistory, setSonnetHistory] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [gpt4oHistory, setGpt4oHistory] = useState<
    Array<{ role: string; content: string }>
  >([]);

  // Initialize session and clear history on component mount
  useEffect(() => {
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    localStorage.removeItem('haikuHistory');
    localStorage.removeItem('sonnetHistory');
    localStorage.removeItem('gpt4History');
    setHaikuHistory([]);
    setSonnetHistory([]);
    setGpt4oHistory([]);
  }, []);

  // Handle model selection change
  const handleModelChange = (index: number, value: string) => {
    const newModels = [...models];
    newModels[index] = value;
    setModels(newModels);
  };

  // Handle form submission and fetch responses from models
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) return;
    setIsLoading(true);
    const newResults = ['', '', ''];

    const fetchModelResponse = async (index: number) => {
      try {
        console.log(`Sending request for model: ${models[index]}`);
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: input,
            sessionId,
            haikuHistory,
            sonnetHistory,
            gpt4oHistory,
            selectedModel: models[index],
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate response');
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let modelResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  modelResponse += data.content;
                  setResults(prevResults => {
                    const newResults = [...prevResults];
                    newResults[index] = modelResponse;
                    return newResults;
                  });
                } else if (data.error) {
                  throw new Error(data.error);
                }
              } catch (error) {
                console.error('Error parsing JSON:', error);
              }
            }
          }
        }

        // Update conversation history
        const historyUpdate = { role: 'assistant', content: modelResponse };
        if (models[index] === 'haiku') {
          setHaikuHistory(prev => [...prev, { role: 'user', content: input }, historyUpdate]);
          localStorage.setItem('haikuHistory', JSON.stringify([...haikuHistory, { role: 'user', content: input }, historyUpdate]));
        } else if (models[index] === 'sonnet') {
          setSonnetHistory(prev => [...prev, { role: 'user', content: input }, historyUpdate]);
          localStorage.setItem('sonnetHistory', JSON.stringify([...sonnetHistory, { role: 'user', content: input }, historyUpdate]));
        } else if (models[index] === 'gpt-4o') {
          setGpt4oHistory(prev => [...prev, { role: 'user', content: input }, historyUpdate]);
          localStorage.setItem('gpt4oHistory', JSON.stringify([...gpt4oHistory, { role: 'user', content: input }, historyUpdate]));
        }
      } catch (error) {
        console.error(`Error fetching response for ${models[index]}:`, error);
        setResults(prevResults => {
          const newResults = [...prevResults];
          newResults[index] = `Error: ${error instanceof Error ? error.message : 'Failed to fetch response'}`;
          return newResults;
        });
      }
    };

    // Fetch responses from all models simultaneously
    await Promise.all(models.map((_, index) => fetchModelResponse(index)));

    setIsLoading(false);
  };

  // Render the user interface
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b border-border px-6 py-4">
        <h1 className="text-lg font-semibold">Claude 3 Comparison</h1>
      </header>
      <main className="flex-1 container mx-auto p-6 overflow-hidden">
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <Card key={index} className="flex flex-col h-full max-h-[calc(100vh-200px)]">
              <CardHeader className="flex items-center justify-between p-4">
                <CardTitle className="text-base font-medium">
                  Model {index + 1}
                </CardTitle>
                <Select
                  value={models[index]}
                  onValueChange={(value) => handleModelChange(index, value)}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sonnet">Claude 3 Sonnet</SelectItem>
                    <SelectItem value="haiku">Claude 3 Haiku</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex-1 max-h-[calc(100vh-300px)] overflow-y-auto">
                <Textarea
                  value={results[index]}
                  className="h-full w-full"
                  aria-placeholder="Response will appear here..."
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <footer className="bg-white border-t border-border px-6 py-4">
        <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4">
          <div className="w-full flex items-end space-x-4">
            <div className="flex-1">
              <Input
                id="message-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="w-full"
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent inline-block"></span>
                  Generating...
                </>
              ) : (
                'Send'
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 text-center">
            AI can make mistakes. Check important info.
          </p>
        </form>
      </footer>
    </div>
  );
}