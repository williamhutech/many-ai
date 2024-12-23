'use client';

import React, { useState, useEffect } from 'react';
import { signInWithPassword } from '../actions';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface LoginContentProps {
  onViewChange?: (view: 'login' | 'signup' | 'resetpassword') => void;
}

export default function LoginContent({ onViewChange }: LoginContentProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setSuccess(message);
    }
  }, [searchParams]);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await signInWithPassword(formData);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.success) {
      setSuccess('Login successful!');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-4 w-full">
      <h1 className="text-2xl font-semibold tracking-tight">Log In</h1>
      <form action={handleSubmit} className="flex flex-col space-y-4 w-full max-w-sm">
        {error && (
          <div className="bg-destructive/15 border border-destructive/30 text-destructive px-4 py-2 rounded-md text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-2 rounded-md text-sm">
            {success}
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
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      <div className="space-y-2 text-center text-sm">
        <p className="text-muted-foreground">
          Don&apos;t have an account?{' '}
          <button
            onClick={() => onViewChange?.('signup')}
            className="text-primary underline-offset-4 hover:underline font-medium"
            type="button"
          >
            Sign Up
          </button>
        </p>
        <button
          onClick={() => onViewChange?.('resetpassword')}
          className="text-primary underline-offset-4 hover:underline font-medium text-xs"
          type="button"
        >
          Forgot your password?
        </button>
      </div>
    </div>
  );
} 