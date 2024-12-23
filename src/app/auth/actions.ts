'use server';

import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AuthError } from '@supabase/supabase-js';

const supabase = createServerClient();
if (!supabase) {
  throw new Error('Failed to initialize Supabase client');
}
const supabaseClient = supabase;

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const { error, data } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      data: {
        created_at: new Date().toISOString(),
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    return { success: true, user: data.user };
  }

  return { error: 'Signup failed' };
}

export async function signInWithPassword(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const { error, data } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    return { success: true, user: data.user };
  }

  return { error: 'Login failed' };
}

// LOGOUT
export async function signOut() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    console.error('Error logging out:', error.message);
  }
  redirect('/');
}

// SEND RESET PASSWORD EMAIL
export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string;
  if (!email) {
    return { error: 'Email is required' };
  }

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/updatepassword`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// UPDATE PASSWORD
export async function updatePassword(formData: FormData, accessToken: string, refreshToken: string) {
  const password = formData.get('password') as string;

  if (!password) {
    return { error: 'Password is required' };
  }

  const supabase = createServerClient();
  if (!supabase) {
    return { error: 'Failed to initialize Supabase client' };
  }

  // Set the session with both tokens
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionError) {
    return { error: sessionError.message };
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
