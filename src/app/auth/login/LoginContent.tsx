'use client';

import React, { useState, useEffect } from 'react';
import { signInWithPassword } from '../actions';
import { useRouter, useSearchParams } from 'next/navigation';

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
      router.replace('/dashboard');
    }
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-4">
      <h1 className="text-2xl font-bold text-gray-900">Log In</h1>
      <form action={handleSubmit} className="flex flex-col space-y-4 w-full max-w-sm">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded text-sm">
            {success}
          </div>
        )}
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button 
          type="submit" 
          className="bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      <div className="space-y-2 text-center">
        <p className="text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <button
            onClick={() => onViewChange?.('signup')}
            className="text-blue-600 hover:text-blue-700 font-medium"
            type="button"
          >
            Sign Up
          </button>
        </p>
        <p className="text-sm">
          <button
            onClick={() => onViewChange?.('resetpassword')}
            className="text-blue-600 hover:text-blue-700 font-medium"
            type="button"
          >
            Forgot your password?
          </button>
        </p>
      </div>
    </div>
  );
} 