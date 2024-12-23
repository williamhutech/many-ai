'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { updatePassword } from '../actions';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

function UpdatePasswordContent() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const handleRecoveryToken = async () => {
      try {
        if (window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (error || !data.session) {
              setError('Invalid or expired reset link. Please request a new one.');
              setTimeout(() => {
                router.replace('/auth/resetpassword');
              }, 3000);
              return;
            }
          } else {
            setError('Invalid reset link. Please request a new one.');
            setTimeout(() => {
              router.replace('/auth/resetpassword');
            }, 3000);
            return;
          }
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            router.replace('/auth/login');
            return;
          }
        }
      } catch (err) {
        setError('An error occurred. Please try again.');
        setTimeout(() => {
          router.replace('/auth/resetpassword');
        }, 3000);
        return;
      }
      setLoading(false);
    };

    handleRecoveryToken();
  }, [router, supabase.auth]);

  async function handleSubmit(formData: FormData) {
    setUpdating(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError('No active session found');
      setUpdating(false);
      return;
    }

    const result = await updatePassword(
      formData, 
      session.access_token,
      session.refresh_token
    );
    
    if (result.error) {
      setError(result.error);
      setUpdating(false);
    } else if (result.success) {
      setSuccess(true);
      await supabase.auth.signOut();
      setTimeout(() => {
        router.replace('/auth/login?message=Password updated successfully');
      }, 2000);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-4">
          Password updated successfully! Redirecting to login...
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-4">
      <h1 className="text-2xl font-bold">Set a New Password</h1>
      <form action={handleSubmit} className="flex flex-col space-y-2 w-64">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
            {error}
          </div>
        )}
        <input
          type="password"
          name="password"
          placeholder="New password"
          className="border p-2 rounded"
          required
        />
        <button 
          type="submit" 
          className="bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors"
          disabled={updating}
        >
          {updating ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <UpdatePasswordContent />
    </Suspense>
  );
}
