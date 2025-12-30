import { supabase } from '../supabase/client';
import type { Group } from './types';

export const createGroup = async (groupData: Omit<Group, 'id'>) => {
  const { members, ...groupPayload } = groupData;

  const { data, error } = await supabase
    .from('groups')
    .insert({
      name: groupPayload.name,
      created_by: groupPayload.createdBy,
    })
    .select('id')
    .single();

  if (error) throw error;
  const groupId = data.id;

  if (members && members.length) {
    // The database trigger auto_add_creator_as_member already inserts the
    // group creator into group_members. To avoid violating the unique
    // (group_id, user_id) constraint, skip the creator here and de-duplicate.
    const filteredMembers = Array.from(
      new Set(members.filter((userId) => userId !== groupPayload.createdBy))
    );

    if (!filteredMembers.length) {
      return { id: groupId };
    }

    const memberRows = filteredMembers.map((userId) => ({ group_id: groupId, user_id: userId }));
    const { error: memberError } = await supabase.from('group_members').insert(memberRows);
    if (memberError) throw memberError;
  }

  return { id: groupId };
};

export const getUserGroups = async (userId: string) => {
  const { data: memberships, error: memberError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId);

  if (memberError) throw memberError;
  const groupIds = (memberships || []).map((m) => m.group_id);
  if (!groupIds.length) return [] as Group[];

  const { data: memberRows, error: memberRowsError } = await supabase
    .from('group_members')
    .select('group_id, user_id')
    .in('group_id', groupIds);

  if (memberRowsError) throw memberRowsError;
  const memberMap = new Map<string, string[]>();
  (memberRows || []).forEach((row) => {
    const arr = memberMap.get(row.group_id) || [];
    arr.push(row.user_id);
    memberMap.set(row.group_id, arr);
  });

  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .in('id', groupIds);

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    members: memberMap.get(row.id) || [],
    createdBy: row.created_by,
    createdAt: row.created_at,
  } as Group));
};

export const onUserGroupsChange = (userId: string, callback: (groups: Group[]) => void) => {
  const channel = supabase
    .channel(`groups-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'group_members', filter: `user_id=eq.${userId}` },
      async () => {
        const groups = await getUserGroups(userId);
        callback(groups);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const getGroup = async (groupId: string) => {
  const { data, error } = await supabase.from('groups').select('*').eq('id', groupId).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: members, error: memberError } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId);
  if (memberError) throw memberError;

  return {
    id: data.id,
    name: data.name,
    members: (members || []).map((m) => m.user_id),
    createdBy: data.created_by,
    createdAt: data.created_at,
  } as Group;
};

export const updateGroup = async (groupId: string, groupData: Partial<Group>) => {
  if (groupData.name) {
    const { error } = await supabase.from('groups').update({ name: groupData.name }).eq('id', groupId);
    if (error) throw error;
  }

  if (groupData.members) {
    const { data: existingMembers, error: fetchError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);
    if (fetchError) throw fetchError;

    const existingIds = new Set((existingMembers || []).map((m) => m.user_id));
    const incomingIds = new Set(groupData.members);

    const toAdd = groupData.members.filter((id) => !existingIds.has(id));
    const toRemove = Array.from(existingIds).filter((id) => !incomingIds.has(id));

    if (toAdd.length) {
      const rows = toAdd.map((userId) => ({ group_id: groupId, user_id: userId }));
      const { error } = await supabase.from('group_members').insert(rows);
      if (error) throw error;
    }

    if (toRemove.length) {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .in('user_id', toRemove);
      if (error) throw error;
    }
  }
};

export const deleteGroup = async (groupId: string) => {
  const { error } = await supabase.from('groups').delete().eq('id', groupId);
  if (error) throw error;
};
