import { supabase } from './supabase';

export function hasPermission(permission: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const auth = localStorage.getItem('adminAuth');

  // Hardcoded owner fallback (only if userPermissions is totally empty/missing or they need a backdoor, but generally rely on DB)
  // Removed `if (isAdmin) return true;` to strictly enforce DB permissions.

  try {
    const permsStr = localStorage.getItem('userPermissions');
    if (permsStr) {
      const perms = JSON.parse(permsStr);
      if (Array.isArray(perms)) {
        return perms.includes(permission) || perms.includes('*');
      }
    }
  } catch (e) {
    console.error(e);
  }
  return false;
}
