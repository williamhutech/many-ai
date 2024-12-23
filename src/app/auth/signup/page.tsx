'use client';

import React, { Suspense } from 'react';
import SignUpContent from './SignUpContent';

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <SignUpContent />
    </Suspense>
  );
}
