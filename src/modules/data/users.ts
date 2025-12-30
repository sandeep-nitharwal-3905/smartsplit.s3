import { supabase } from '../supabase/client';
import type { Profile } from './types';

export const upsertProfile = async (profile: Profile) => {
  const { error } = await supabase.from('profiles').upsert({
    id: profile.id,
    email: profile.email,
    name: profile.name,
  });
  if (error) throw error;
};

export const getUserByEmail = async (email: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('email', email)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;
  return data ? ({
    id: data.id,
    email: data.email,
    name: data.name,
    createdAt: data.created_at,
  } as Profile) : null;
};

export const getUsers = async (userIds: string[]) => {
  if (userIds.length === 0) return [] as Profile[];

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds);

  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
  } as Profile));
};
