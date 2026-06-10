import { supabase } from './supabase';

export const logAction = async (action_type: string, category: string, details: string) => {
  try {
    const user_name = localStorage.getItem('adminUsername') || 'Administrator';
    await supabase.from('activity_log').insert({
      action_type,
      category,
      details,
      user_name
    });
  } catch (err) {
    console.error('Failed to log action', err);
  }
};
