import { supabase } from '../supabase/client';
import { getUsers } from './users';
import type { Profile } from './types';

export const addFriend = async (userId: string, friendId: string) => {
  const { error } = await supabase.from('friendships').insert({ user_id: userId, friend_id: friendId });
  if (error) throw error;
};

export const getUserFriends = async (userId: string) => {
  const { data, error } = await supabase
    .from('friendships')
    .select('friend_id')
    .eq('user_id', userId);

  if (error) throw error;
  const friendIds = (data || []).map((row) => row.friend_id);
  if (!friendIds.length) return [] as Profile[];

  return getUsers(friendIds);
};
