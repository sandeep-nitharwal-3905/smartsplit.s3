import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmailsStr = process.env.VITE_ADMIN_EMAILS || 'sandeepscodes@gmail.com,admin@smartsplit.com';
const adminEmails = adminEmailsStr.split(',').map((email) => email.trim().toLowerCase());

const getBearerToken = (authorizationHeader: string | undefined) => {
  if (!authorizationHeader) return null;
  const [type, token] = authorizationHeader.split(' ');
  if (type?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
};

const isAdminEmail = (email: string | null | undefined) => Boolean(email && adminEmails.includes(email.toLowerCase()));

export default async function handler(req: any, res: any) {
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return res.status(500).json({ error: 'Supabase server environment variables are not configured.' });
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

  if (authError || !user || !isAdminEmail(user.email)) {
    return res.status(403).json({ error: 'Forbidden.' });
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

  if (req.method === 'GET') {
    const { data, error } = await adminClient.from('feedbacks').select('*').order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ feedbacks: data || [] });
  }

  if (req.method === 'DELETE') {
    const feedbackId = typeof req.query?.id === 'string' ? req.query.id : req.body?.id;

    if (!feedbackId) {
      return res.status(400).json({ error: 'Missing feedback id.' });
    }

    const { error } = await adminClient.from('feedbacks').delete().eq('id', feedbackId);
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}