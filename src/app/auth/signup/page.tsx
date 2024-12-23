'use client';

import React, { useState } from 'react';
import { signUp } from '../actions';
import { useRouter } from 'next/navigation';

interface SignUpPageProps {
  onViewChange?: (view: 'login' | 'signup') => void;
}

export default function SignUpPage({ onViewChange }: SignUpPageProps) {
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
      <h1 className="text-2xl font-bold">Sign Up</h1>

      <form action={handleSubmit} className="flex flex-col space-y-2 w-64">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
            {error}
          </div>
        )}
        
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="border p-2 rounded"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="border p-2 rounded"
          required
        />
        <button 
          type="submit" 
          className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
          disabled={loading}
        >
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => onViewChange?.('login')}
              className="text-blue-500 hover:underline"
              type="button"
            >
              Log In
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
