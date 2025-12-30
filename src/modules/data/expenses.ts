import { supabase } from '../supabase/client';
import type { Expense } from './types';

const mapExpense = (row: any): Expense => {
  const splits = (row.expense_splits || []) as Array<{ user_id: string; amount_owed: number }>;
  const participants = splits.map((s) => s.user_id);
  const splitAmounts: Record<string, number> = {};
  splits.forEach((s) => {
    splitAmounts[s.user_id] = Number(s.amount_owed);
  });

  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    paidBy: row.paid_by,
    participants,
    groupId: row.group_id,
    createdAt: row.created_at,
    createdBy: row.created_by ?? undefined,
    // isSettlement is no longer stored in the DB; keep it optional
    // on the frontend only when needed.
    splitAmounts: Object.keys(splitAmounts).length ? splitAmounts : null,
  } as Expense;
};

export const createExpense = async (expenseData: Omit<Expense, 'id'>) => {
  const { participants, splitAmounts, groupId, ...rest } = expenseData;

  if (!groupId) {
    throw new Error('groupId is required when creating an expense');
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      description: rest.description,
      amount: rest.amount,
      paid_by: rest.paidBy,
      group_id: groupId,
      created_by: rest.createdBy,
    })
    .select('id')
    .single();

  if (error) throw error;
  const expenseId = data.id as string;

  // Compute per-user splits: use provided splitAmounts if present,
  // otherwise fall back to equal split among participants.
  if (!participants || participants.length === 0) {
    throw new Error('participants are required when creating an expense');
  }

  let effectiveSplits: Record<string, number> = {};
  if (splitAmounts && Object.keys(splitAmounts).length > 0) {
    effectiveSplits = splitAmounts;
  } else {
    const perPerson = rest.amount / participants.length;
    participants.forEach((userId) => {
      effectiveSplits[userId] = perPerson;
    });
  }

  const splitRows = Object.entries(effectiveSplits).map(([userId, amount]) => ({
    expense_id: expenseId,
    user_id: userId,
    amount_owed: amount,
  }));

  const { error: splitsError } = await supabase.from('expense_splits').insert(splitRows);
  if (splitsError) throw splitsError;

  return { id: expenseId };
};

export const updateExpense = async (expenseId: string, expenseData: Partial<Expense>) => {
  const { participants, splitAmounts, groupId, ...rest } = expenseData;

  // If participants or splits are provided, sync expense_splits
  // with the new distribution using a delete + upsert strategy
  if (participants && participants.length > 0) {
    // 1) Build the desired splits map
    let effectiveSplits: Record<string, number> = {};
    if (splitAmounts && Object.keys(splitAmounts).length > 0) {
      effectiveSplits = splitAmounts;
    } else if (rest.amount != null) {
      const uniqueParticipants = Array.from(new Set(participants));
      const perPerson = (rest.amount as number) / uniqueParticipants.length;
      uniqueParticipants.forEach((userId) => {
        effectiveSplits[userId] = perPerson;
      });
    }

    const newUserIds = Object.keys(effectiveSplits);

    // 2) Remove any old splits for users that are no longer in the expense
    // (so deselected participants are cleaned up)
    const { data: existingRows, error: existingError } = await supabase
      .from('expense_splits')
      .select('user_id')
      .eq('expense_id', expenseId);

    if (existingError) throw existingError;

    const existingUserIds = (existingRows || []).map((r: any) => r.user_id as string);
    const toDelete = existingUserIds.filter((uid) => !newUserIds.includes(uid));

    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('expense_splits')
        .delete()
        .eq('expense_id', expenseId)
        .in('user_id', toDelete);

      if (deleteError) throw deleteError;
    }

    // 3) Upsert desired splits to avoid unique-constraint errors even
    // if some rows already exist for this (expense_id, user_id)
    if (newUserIds.length > 0) {
      const splitRows = newUserIds.map((userId) => ({
        expense_id: expenseId,
        user_id: userId,
        amount_owed: effectiveSplits[userId],
      }));

      const { error: upsertError } = await supabase
        .from('expense_splits')
        .upsert(splitRows, { onConflict: 'expense_id,user_id' });

      if (upsertError) throw upsertError;
    }
  }

  // Finally, update the main expense row (description, amount, payer, group)
  // AFTER splits are in their final state so that realtime listeners
  // that react to changes on `expenses` see the latest splits when
  // they refetch via getGroupExpenses/getUserExpenses.
  const { error } = await supabase
    .from('expenses')
    .update({
      description: rest.description,
      amount: rest.amount,
      paid_by: rest.paidBy,
      group_id: groupId,
    })
    .eq('id', expenseId);

  if (error) throw error;
};

export const getGroupExpenses = async (groupId: string | null) => {
  if (!groupId) {
    return [] as Expense[];
  }

  const { data, error } = await supabase
    .from('expenses')
    .select('id, description, amount, paid_by, group_id, created_at, created_by, expense_splits ( user_id, amount_owed )')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapExpense);
};

export const onGroupExpensesChange = (groupId: string | null, callback: (expenses: Expense[]) => void) => {
  const channel = supabase
    .channel(`group-expenses-${groupId || 'personal'}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'expenses' },
      async (payload: any) => {
        const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE' | undefined;

        // For INSERT/UPDATE, the row lives in payload.new; for DELETE it lives in payload.old.
        const row = eventType === 'DELETE' ? (payload.old as any) : (payload.new as any);
        const affectedGroupId = row?.group_id ?? null;

        // Only react when the change belongs to the currently watched group.
        if ((groupId && affectedGroupId === groupId) || (!groupId && affectedGroupId === null)) {
          const expenses = await getGroupExpenses(groupId);
          callback(expenses);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const getUserExpenses = async (userId: string) => {
  // First find all expense_ids where the user has a split row
  const { data: splitRows, error: splitError } = await supabase
    .from('expense_splits')
    .select('expense_id')
    .eq('user_id', userId);

  if (splitError) throw splitError;
  const expenseIds = Array.from(new Set((splitRows || []).map((r: any) => r.expense_id)));

  if (!expenseIds.length) return [] as Expense[];

  const { data, error } = await supabase
    .from('expenses')
    .select('id, description, amount, paid_by, group_id, created_at, created_by, expense_splits ( user_id, amount_owed )')
    .in('id', expenseIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapExpense);
};

export const onUserExpensesChange = (userId: string, callback: (expenses: Expense[]) => void) => {
  const channel = supabase
    .channel(`user-expenses-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'expense_splits', filter: `user_id=eq.${userId}` },
      async () => {
        const expenses = await getUserExpenses(userId);
        callback(expenses);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
};

export const deleteExpense = async (expenseId: string) => {
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
  if (error) throw error;
};
