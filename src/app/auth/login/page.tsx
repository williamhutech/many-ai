'use client';

import React, { Suspense } from 'react';
import LoginContent from './LoginContent';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
