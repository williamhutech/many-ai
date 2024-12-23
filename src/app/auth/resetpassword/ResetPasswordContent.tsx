'use client';

import React, { useState } from 'react';
import { requestPasswordReset } from '../actions';

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
      <div className="flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Check Your Email</h1>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded text-sm">
          Check your email for a password reset link. Don&apos;t forget to check your spam folder.
        </div>
        <button
          onClick={() => onViewChange?.('login')}
          className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-4">
      <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
      <form action={handleSubmit} className="flex flex-col space-y-4 w-full max-w-sm">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
            {error}
          </div>
        )}
        <input
          type="email"
          name="email"
          placeholder="Enter your account email"
          className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button 
          type="submit" 
          className="bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Reset Email'}
        </button>
        <button
          onClick={() => onViewChange?.('login')}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          type="button"
        >
          Back to Login
        </button>
      </form>
    </div>
  );
} 