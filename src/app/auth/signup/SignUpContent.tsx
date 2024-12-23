'use client';

import React, { useState } from 'react';
import { signUp } from '../actions';
import { useRouter } from 'next/navigation';

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
    <div className="flex flex-col items-center justify-center space-y-6 p-4">
      <h1 className="text-2xl font-bold text-gray-900">Sign Up</h1>
      <form action={handleSubmit} className="flex flex-col space-y-4 w-full max-w-sm">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
            {error}
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
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <button
            onClick={() => onViewChange?.('login')}
            className="text-blue-600 hover:text-blue-700 font-medium"
            type="button"
          >
            Log In
          </button>
        </p>
      </div>
    </div>
  );
} 