import { supabase } from '../supabase/client';
import type { Settlement } from './types';

export const createSettlement = async (settlement: Omit<Settlement, 'id'>) => {
  const { data, error } = await supabase
    .from('settlements')
    .insert({
      from_user: settlement.from,
      to_user: settlement.to,
      amount: settlement.amount,
      group_id: settlement.groupId,
    })
    .select('*')
    .single();

  if (error) throw error;
  return { id: data.id };
};

export const getGroupSettlements = async (groupId: string | null) => {
  if (!groupId) return [] as Settlement[];

  const query = supabase.from('settlements').select('*').order('created_at', { ascending: false });
  const { data, error } = await query.eq('group_id', groupId);

  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    from: row.from_user,
    to: row.to_user,
    amount: Number(row.amount),
    groupId: row.group_id,
    // Map DB created_at to the existing settledAt field used in the UI
    settledAt: row.created_at,
  } as Settlement));
};
