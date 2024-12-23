'use client';

import React, { useState } from 'react';
import { signUp } from '../actions';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SignUpContentProps {
  onViewChange?: (view: 'login' | 'signup' | 'resetpassword') => void;
}

export default function SignUpContent({ onViewChange }: SignUpContentProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await signUp(formData);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.success) {
      router.replace('/dashboard');
    }
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-4 w-full">
      <h1 className="text-2xl font-semibold tracking-tight">Sign Up</h1>
      <form action={handleSubmit} className="flex flex-col space-y-4 w-full max-w-sm">
        {error && (
          <div className="bg-destructive/15 border border-destructive/30 text-destructive px-4 py-2 rounded-md text-sm">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <input
            type="email"
            name="email"
            placeholder="Email"
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2",
              "text-sm ring-offset-background",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-gray-200",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
            required
          />
        </div>
        <div className="space-y-2">
          <input
            type="password"
            name="password"
            placeholder="Password"
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2",
              "text-sm ring-offset-background",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-gray-200",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
            required
          />
        </div>
        <button 
          type="submit" 
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background",
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "h-10 px-4 py-2"
          )}
          disabled={loading}
        >
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
      <div className="text-center text-sm">
        <p className="text-muted-foreground">
          Already have an account?{' '}
          <button
            onClick={() => onViewChange?.('login')}
            className="text-primary underline-offset-4 hover:underline font-medium"
            type="button"
          >
            Log In
          </button>
        </p>
      </div>
    </div>
  );
} 