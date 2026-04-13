import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@smartsplit.app';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

const getBearerToken = (authorizationHeader: string | undefined) => {
  if (!authorizationHeader) return null;
  const [type, token] = authorizationHeader.split(' ');
  if (type?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
};

const buildSubscription = (row: any) => ({
  endpoint: row.endpoint,
  keys: {
    p256dh: row.p256dh,
    auth: row.auth,
  },
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return res.status(500).json({ error: 'Supabase server environment variables are not configured.' });
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    return res.status(500).json({ error: 'VAPID keys are not configured.' });
  }

  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token.' });
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey);
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid access token.' });
  }

  const { recipientUserIds, title, body, url } = req.body || {};

  if (!Array.isArray(recipientUserIds) || recipientUserIds.length === 0) {
    return res.status(400).json({ error: 'recipientUserIds must be a non-empty array.' });
  }

  const distinctRecipients = Array.from(
    new Set(recipientUserIds.filter((id: unknown) => typeof id === 'string' && id !== user.id))
  );

  if (!distinctRecipients.length) {
    return res.status(200).json({ delivered: 0, skipped: 0, message: 'No valid recipients.' });
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: subscriptions, error: subscriptionError } = await adminClient
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth, user_id')
    .in('user_id', distinctRecipients);

  if (subscriptionError) {
    return res.status(500).json({ error: subscriptionError.message });
  }

  const payload = JSON.stringify({
    title: title || 'SmartSplit update',
    body: body || 'You have a new notification.',
    url: typeof url === 'string' ? url : '/#dashboard',
    icon: '/logo.png',
    badge: '/logo.png',
  });

  let delivered = 0;
  const staleSubscriptionIds: string[] = [];

  for (const row of subscriptions || []) {
    try {
      await webpush.sendNotification(buildSubscription(row), payload);
      delivered += 1;
    } catch (error: any) {
      const statusCode = error?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        staleSubscriptionIds.push(row.id);
      }
    }
  }

  if (staleSubscriptionIds.length > 0) {
    await adminClient.from('push_subscriptions').delete().in('id', staleSubscriptionIds);
  }

  return res.status(200).json({
    delivered,
    attempted: subscriptions?.length || 0,
    cleaned: staleSubscriptionIds.length,
  });
}
