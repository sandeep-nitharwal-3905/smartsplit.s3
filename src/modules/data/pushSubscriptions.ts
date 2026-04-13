import { supabase } from '../supabase/client';

interface PushSubscriptionKeys {
  p256dh?: string;
  auth?: string;
}

interface PushSubscriptionJSON {
  endpoint: string;
  keys?: PushSubscriptionKeys;
}

export const upsertPushSubscription = async (userId: string, subscription: PushSubscription) => {
  const json = subscription.toJSON() as PushSubscriptionJSON;
  if (!json.endpoint) {
    throw new Error('Invalid push subscription endpoint.');
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh || null,
      auth: json.keys?.auth || null,
      user_agent: navigator.userAgent,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,endpoint' }
  );

  if (error) throw error;
};

export const deletePushSubscription = async (userId: string, endpoint: string) => {
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint);

  if (error) throw error;
};
