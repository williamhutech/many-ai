'use client';

import React from 'react';
import Link from 'next/link';

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Check Your Email</h1>
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded">
        We&apos;ve sent you a confirmation email. Please check your inbox and follow the instructions.
      </div>
      <Link href="/auth/login" className="mt-4 text-blue-500 hover:underline">
        Back to Login
      </Link>
    </div>
  );
}
