'use client';

import React, { Suspense } from 'react';
import SignUpContent from './SignUpContent';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
        <SignUpContent />
      </Suspense>
    </div>
  );
}
