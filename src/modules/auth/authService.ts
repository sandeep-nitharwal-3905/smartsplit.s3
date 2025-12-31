import { supabase } from '../supabase/client';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  providerData: { providerId: string }[];
  metadata: { creationTime: string };
}

const normalizeUser = (user: any | null): AuthUser | null => {
  if (!user) return null;

  const providerRaw = user.app_metadata?.provider || 'email';
  const provider = providerRaw === 'google' ? 'google.com' : providerRaw;
  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || null;

  return {
    uid: user.id,
    email: user.email,
    displayName,
    emailVerified: Boolean(user.email_confirmed_at),
    providerData: [{ providerId: provider }],
    metadata: {
      creationTime: user.created_at,
    },
  };
};

export const signUpUser = async (email: string, password: string, name?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${window.location.origin}/`,
      // This tells Supabase to send confirmation email
      // If you want to skip email confirmation for testing, go to Supabase Dashboard > Authentication > Settings > 
      // and disable "Enable email confirmations"
    },
  });

  if (error) throw error;
  
  // Check if email confirmation is required
  if (data.user && !data.session) {
    console.log('Email confirmation required. Email sent to:', email);
  }
  
  return { user: normalizeUser(data.user), session: data.session };
};

export const signInUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { user: normalizeUser(data.user) };
};

export const signInWithGoogle = async () => {
  // Get the current origin dynamically - works for both localhost and production
  const redirectUrl = `${window.location.origin}/`;
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    },
  });
  if (error) throw error;
  return data;
};

export const sendVerificationEmail = async (email: string) => {
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) throw error;
  return true;
};

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(normalizeUser(session?.user) || null);
  });
  return () => data.subscription.unsubscribe();
};

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/`,
  });
  if (error) throw error;
  return true;
};

export const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
  return true;
};

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return normalizeUser(data.user) || null;
};
