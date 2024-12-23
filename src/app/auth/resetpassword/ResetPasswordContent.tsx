'use client';

import React, { useState } from 'react';
import { requestPasswordReset } from '../actions';
import { cn } from '@/lib/utils';

interface ResetPasswordContentProps {
  onViewChange?: (view: 'login' | 'signup' | 'resetpassword') => void;
}

export default function ResetPasswordContent({ onViewChange }: ResetPasswordContentProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await requestPasswordReset(formData);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.success) {
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 p-4 w-full">
        <h1 className="text-2xl font-semibold tracking-tight">Check Your Email</h1>
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-2 rounded-md text-sm">
          Check your email for a password reset link. Don&apos;t forget to check your spam folder.
        </div>
        <button
          onClick={() => onViewChange?.('login')}
          className="text-primary underline-offset-4 hover:underline font-medium text-sm"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-4 w-full">
      <h1 className="text-2xl font-semibold tracking-tight">Reset Password</h1>
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
            placeholder="Enter your account email"
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
          {loading ? 'Sending...' : 'Send Reset Email'}
        </button>
        <button
          onClick={() => onViewChange?.('login')}
          className="text-primary underline-offset-4 hover:underline font-medium text-sm"
          type="button"
        >
          Back to Login
        </button>
      </form>
    </div>
  );
} 