'use client';

import React, { useState } from 'react';
import { requestPasswordReset } from '../actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

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
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Check Your Email</h1>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded">
          Check your email for a password reset link. Don&apos;t forget to check your spam folder.
        </div>
        <Link href="/auth/login">
          <button className="bg-blue-500 text-white px-4 py-2 rounded">
            Back to Login
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-4">
      <h1 className="text-2xl font-bold">Reset Password</h1>
      <form action={handleSubmit} className="flex flex-col space-y-2 w-64">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
            {error}
          </div>
        )}
        <input
          type="email"
          name="email"
          placeholder="Enter your account email"
          className="border p-2 rounded"
          required
        />
        <button 
          type="submit" 
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Reset Email'}
        </button>
        <Link href="/auth/login" className="text-center text-sm text-blue-500 hover:underline">
          Back to Login
        </Link>
      </form>
    </div>
  );
}
