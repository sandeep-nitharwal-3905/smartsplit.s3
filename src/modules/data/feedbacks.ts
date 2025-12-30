import { supabase } from '../supabase/client';

export interface Feedback {
  id: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  message: string;
  rating?: number;
  created_at: string;
}

export async function submitFeedback(feedback: {
  message: string;
  rating?: number;
  user_name?: string;
  user_email?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const feedbackData: any = {
      message: feedback.message,
      rating: feedback.rating,
    };

    if (user) {
      feedbackData.user_id = user.id;
      // Fetch user profile for name and email
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        feedbackData.user_name = profile.name;
        feedbackData.user_email = profile.email;
      }
    } else {
      // Anonymous feedback
      feedbackData.user_name = feedback.user_name || 'Anonymous';
      feedbackData.user_email = feedback.user_email;
    }

    const { error } = await supabase
      .from('feedbacks')
      .insert([feedbackData]);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    return { success: false, error: error.message };
  }
}

export async function getAllFeedbacks(): Promise<Feedback[]> {
  try {
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    return [];
  }
}

export async function deleteFeedback(feedbackId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('feedbacks')
      .delete()
      .eq('id', feedbackId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting feedback:', error);
    return { success: false, error: error.message };
  }
}

export async function isAdmin(userId?: string): Promise<boolean> {
  if (!userId) return false;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (error) throw error;
    
    // Get admin emails from environment variable
    const adminEmailsStr = import.meta.env.VITE_ADMIN_EMAILS || 'sandeepscodes@gmail.com,admin@smartsplit.com';
    const adminEmails = adminEmailsStr.split(',').map((email: string) => email.trim());
    
    return adminEmails.includes(data?.email || '');
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}
