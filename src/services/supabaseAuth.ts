import type { AuthError, Session } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import type { AppAuthUser } from '../types';

export function mapSessionToAppUser(session: Session): AppAuthUser {
  const u = session.user;
  const email = u.email ?? null;
  return {
    id: u.id,
    email,
    displayName: email || (u.user_metadata?.full_name as string) || (u.user_metadata?.name as string) || 'LifeOS account',
    provider: 'supabase',
  };
}

function humanizeAuthError(error: AuthError): string {
  const msg = error.message || '';
  if (/invalid login credentials|invalid email or password/i.test(msg)) {
    return 'Invalid email or password.';
  }
  if (/email not confirmed|confirm your email/i.test(msg)) {
    return 'Confirm your email address first, then try signing in.';
  }
  if (/user already registered|already been registered/i.test(msg)) {
    return 'An account with this email already exists. Try signing in.';
  }
  if (/password should be at least/i.test(msg)) {
    return msg;
  }
  return msg || 'Something went wrong. Please try again.';
}

export async function supabaseSignInWithPassword(email: string, password: string): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw new Error(humanizeAuthError(error));
  if (!data.session) throw new Error('No session returned. Check your email confirmation settings.');
  return data.session;
}

export type SignUpResult = { session: Session | null; needsEmailConfirmation: boolean };

export async function supabaseSignUp(email: string, password: string): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw new Error(humanizeAuthError(error));
  return {
    session: data.session,
    needsEmailConfirmation: !data.session,
  };
}

export async function supabaseSignOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}
