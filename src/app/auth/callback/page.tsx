'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        if (next) {
          router.replace(next);
        } else {
          router.replace('/');
        }
      } else {
        router.replace('/auth/login');
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        if (next) {
          router.replace(next);
        } else {
          router.replace('/dashboard');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase.auth, next]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse">Processing...</div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <CallbackContent />
    </Suspense>
  );
}