'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { updatePassword } from '../actions';
import { cn } from '@/lib/utils';

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
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 p-4 w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Password Updated</h1>
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-2 rounded-md text-sm w-full text-center">
          Password updated successfully! You may close this window and log in with your new password.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 p-4 w-full max-w-sm">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-4 w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">Set New Password</h1>
      <form action={handleSubmit} className="flex flex-col space-y-4 w-full max-w-sm">
        {error && (
          <div className="bg-destructive/15 border border-destructive/30 text-destructive px-4 py-2 rounded-md text-sm w-full">
            {error}
          </div>
        )}
        <div className="space-y-2 w-full">
          <input
            type="password"
            name="password"
            placeholder="New password"
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
        <div className="w-full">
          <button 
            type="submit" 
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background",
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:pointer-events-none disabled:opacity-50",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "h-10 px-4 py-2 w-full"
            )}
            disabled={updating}
          >
            {updating ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
        <UpdatePasswordContent />
      </Suspense>
    </div>
  );
}
