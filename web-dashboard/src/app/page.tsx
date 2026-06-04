'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck, Lock, LogIn } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import { supabase } from '@/lib/supabase';
import './globals.css';

export default function Login() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [settings, setSettings] = useState<any>(null);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean, type: 'danger' | 'success' | 'info', title: string, message: string, onConfirm: () => void }>({
    isOpen: false, type: 'danger', title: '', message: '', onConfirm: () => { }
  });
  const [redirectTo, setRedirectTo] = useState('/dashboard');
  const [isLoggingInDiscord, setIsLoggingInDiscord] = useState(false);
  const callbackCalled = useRef(false);

  const DEFAULT_MAP: Record<string, Record<string, string>> = {
    login: {
      title: 'HighCoreMc',
      welcome: 'Welcome Back',
      iconAdmin: 'ShieldAlert',
      textAdmin: 'Staff Manager',
      iconMod: 'Shield',
      textMod: 'Moderator',
      iconStaff: 'Users',
      textStaff: 'Staff'
    }
  };

  const cleanArabicEmoji = (data: any): any => {
    if (!data || typeof data !== 'object') return data;
    const result = Array.isArray(data) ? [...data] : { ...data };
    for (const groupKey in data) {
      const groupVal = data[groupKey];
      if (typeof groupVal === 'object' && groupVal !== null) {
        result[groupKey] = { ...groupVal };
        for (const key in groupVal) {
          const val = groupVal[key];
          if (typeof val === 'string') {
            const hasArabic = /[\u0600-\u06FF]/.test(val);
            const hasEmojiSphere = /[🔵🟡🟢✅]/.test(val);
            if (hasArabic || hasEmojiSphere) {
              if (DEFAULT_MAP[groupKey] && DEFAULT_MAP[groupKey][key] !== undefined) {
                result[groupKey][key] = DEFAULT_MAP[groupKey][key];
              }
            }
          }
        }
      }
    }
    return result;
  };

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data } = await supabase.from('settings').select('value').eq('key', 'app_settings').maybeSingle();
        if (data && data.value) {
          const parsed = JSON.parse(data.value);
          setSettings(cleanArabicEmoji(parsed));
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSettings();

    const params = new URLSearchParams(window.location.search);
    const redir = params.get('redirect_to');
    if (redir) {
      setRedirectTo(redir);
    }

    const err = params.get('error');
    if (err === 'login_required') {
      setConfirmConfig({
        isOpen: true,
        type: 'danger',
        title: 'Authentication Required',
        message: 'Please log in first to access this page.',
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
    }

    const code = params.get('code');
    if (code && !callbackCalled.current) {
      callbackCalled.current = true;
      handleDiscordCallback(code);
    }
  }, []);

  // Discord OAuth Logic
  const handleDiscordLogin = () => {
    const DISCORD_CLIENT_ID = '1508870031562244176';
    const REDIRECT_URI = 'https://admin.highcores.com/';

    localStorage.setItem('redirect_to', redirectTo);

    const params = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'identify guilds.members.read',
    });

    window.location.href = `https://discord.com/oauth2/authorize?${params.toString()}`;
  };

  const handleDiscordCallback = async (code: string) => {
    setIsLoggingInDiscord(true);
    try {
      window.history.replaceState({}, document.title, window.location.pathname);

      const response = await fetch('/discord/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to authenticate with Discord');
      }

      const data = await response.json();

      const { data: settingsData } = await supabase.from('settings').select('*');
      const appRow = settingsData?.find(s => s.key === 'app_settings');
      const rolesRow = settingsData?.find(s => s.key === 'admin_roles_permissions');

      let adminPass = 'HighCoreadmin_@@';
      let modPass = 'HighCoremod_@@';
      let staffPass = 'HighCorestaff_@@';

      if (appRow?.value) {
        const parsed = JSON.parse(appRow.value);
        if (parsed?.security?.adminPassword) adminPass = parsed.security.adminPassword;
        if (parsed?.security?.modPassword) modPass = parsed.security.modPassword;
        if (parsed?.security?.staffPassword) staffPass = parsed.security.staffPassword;
      }

      let dashboardRoles = [];
      let rolePermissions: Record<string, string[]> = {};

      if (rolesRow?.value) {
        const parsed = JSON.parse(rolesRow.value);
        dashboardRoles = parsed.roles || [];
        rolePermissions = parsed.permissions || {};
      }

      const userDiscordRoleIds = data.guild.roles.map((r: any) => r.id);

      const hasBaseStaffRole = userDiscordRoleIds.includes('1487195816220430406');
      if (!hasBaseStaffRole) {
        throw new Error('Access Denied: You are not a staff member.');
      }

      const matchingRoles = dashboardRoles.filter((r: any) => r.enabled && userDiscordRoleIds.includes(r.id));
      if (matchingRoles.length === 0) {
        throw new Error('Access Denied: You do not have any authorized administrative roles.');
      }

      matchingRoles.sort((a: any, b: any) => a.priority - b.priority);
      const highestRole = matchingRoles[0];
      const permissions = rolePermissions[highestRole.id] || [];

      let authVal = staffPass;
      let roleName = 'Staff';

      const hasAdminPerm = permissions.includes('view_settings') || permissions.includes('view_logs') || permissions.includes('edit_settings');
      const hasModPerm = permissions.includes('review_reports') || permissions.includes('edit_whitelist') || permissions.includes('add_points');

      if (hasAdminPerm) {
        authVal = adminPass;
        roleName = 'Administrator';
      } else if (hasModPerm) {
        authVal = modPass;
        roleName = 'Moderator';
      }

      const displayName = data.guild.nickname || data.user.globalName || data.user.username;
      const jobTitles = matchingRoles.map((r: any, idx: number) => ({
        title: r.name,
        is_main: idx === 0
      }));

      const { data: existingEmp } = await supabase
        .from('employees')
        .select('*')
        .eq('discord_id', data.user.id)
        .maybeSingle();

      let currentRankOverride = null;
      if (existingEmp && existingEmp.section) {
        try {
          const parsed = JSON.parse(existingEmp.section);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            currentRankOverride = parsed.rank_override || null;
          }
        } catch (err) {}
      }

      const sectionData = JSON.stringify({
        job_titles: jobTitles,
        rank_override: currentRankOverride
      });

      if (existingEmp) {
        await supabase
          .from('employees')
          .update({
            name: displayName,
            role: highestRole.name,
            section: sectionData
          })
          .eq('discord_id', data.user.id);
      } else {
        const newId = Math.floor(100000000 + Math.random() * 900000000);
        await supabase
          .from('employees')
          .insert({
            id: newId,
            name: displayName,
            discord_id: data.user.id,
            points: 0,
            dc_points: 0,
            mc_points: 0,
            tickets: 0,
            role: highestRole.name,
            avatar: displayName.charAt(0).toUpperCase() || 'S',
            color: highestRole.color || '#F4B942',
            section: sectionData
          });
      }

      localStorage.setItem('adminAuth', authVal);
      localStorage.setItem('adminUsername', displayName);
      localStorage.setItem('discordUser', JSON.stringify(data.user));
      localStorage.setItem('isAdmin', authVal === adminPass ? 'true' : 'false');
      localStorage.setItem('userPermissions', JSON.stringify(permissions));

      await supabase.from('activity_log').insert({
        action_type: 'Discord Login',
        category: 'Auth',
        details: `Logged in via Discord as ${data.user.username} (${roleName}).`,
        user_name: displayName
      });

      const targetRedir = localStorage.getItem('redirect_to') || redirectTo || '/dashboard';
      localStorage.removeItem('redirect_to');
      router.push(targetRedir);
    } catch (err: any) {
      console.error(err);
      setConfirmConfig({
        isOpen: true,
        type: 'danger',
        title: 'Discord Authentication Failed',
        message: err.message || 'An error occurred during Discord login.',
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
    } finally {
      setIsLoggingInDiscord(false);
    }
  };

  const handleRoleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    let isCorrect = false;
    let authVal = '';
    let username = '';

    const adminPass = settings?.security?.adminPassword || 'HighCoreadmin_@@';
    const modPass = settings?.security?.modPassword || 'HighCoremod_@@';
    const staffPass = settings?.security?.staffPassword || 'HighCorestaff_@@';

    if (selectedRole === 'administrator') {
      isCorrect = password === adminPass;
      authVal = adminPass;
      username = 'Guest';
    } else if (selectedRole === 'moderator') {
      isCorrect = password === modPass;
      authVal = modPass;
      username = 'Guest';
    } else if (selectedRole === 'staff') {
      isCorrect = password === staffPass;
      authVal = staffPass;
      username = 'Guest';
    }

    if (isCorrect) {
      let perms: string[] = [];
      if (selectedRole === 'administrator') {
        perms = ['*'];
      } else if (selectedRole === 'moderator') {
        perms = [
          'view_dashboard', 'view_employees', 'view_forums', 'view_tickets',
          'add_points', 'remove_points', 'review_reports', 'add_whitelist',
          'edit_whitelist', 'submit_report'
        ];
      } else if (selectedRole === 'staff') {
        perms = [
          'view_dashboard', 'claim_event', 'complete_task', 'submit_report'
        ];
      }
      localStorage.setItem('adminAuth', authVal);
      localStorage.setItem('adminUsername', username);
      localStorage.setItem('isAdmin', selectedRole === 'administrator' ? 'true' : 'false');
      localStorage.setItem('userPermissions', JSON.stringify(perms));
      router.push(redirectTo || '/dashboard');
    } else {
      setConfirmConfig({
        isOpen: true,
        type: 'danger',
        title: 'Authentication Failed',
        message: 'Invalid password! Please try again.',
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const roles = [
    { id: 'administrator', name: settings?.login?.textAdmin || 'Staff Manager', icon: <ShieldAlert size={20} style={{ color: settings?.login?.colorAdmin || '#ffd93d' }} /> },
    { id: 'moderator', name: settings?.login?.textMod || 'Moderator', icon: <Shield size={20} style={{ color: settings?.login?.colorMod || '#51cf66' }} /> },
    { id: 'staff', name: settings?.login?.textStaff || 'Staff', icon: <ShieldCheck size={20} style={{ color: settings?.login?.colorStaff || '#4dabf7' }} /> },
  ];

  if (isLoggingInDiscord) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100%', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255,255,255,0.1)',
            borderTopColor: '#5865F2',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ fontFamily: 'Tajawal, sans-serif' }}>Logging in with Discord...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Background */}
      <div className="bg-gradient" />

      <div className="container">
        <motion.div
          className="glass-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div>
            <h1 className="title">{settings?.login?.title || 'Opex System'}</h1>
            <p className="subtitle">{settings?.login?.welcome || 'Welcome Back'}</p>
          </div>

          {/* Roles Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`btn ${selectedRole === role.id ? 'active' : ''}`}
              >
                {role.icon}
                {role.name}
              </button>
            ))}
          </div>

          {/* Password Field Animation */}
          <AnimatePresence>
            {selectedRole && (
              <motion.form
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: '0.5rem' }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleRoleLogin}
                style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="#9ca3af" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    placeholder={`Enter password`}
                    className="input-field"
                    style={{ paddingLeft: '2.8rem' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  <LogIn size={20} />
                  Login
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="divider">OR</div>

          {/* Discord Login */}
          <button className="btn btn-discord" onClick={handleDiscordLogin}>
            <svg width="24" height="24" viewBox="0 0 127.14 96.36" fill="currentColor">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.12,53,91.08,65.69,84.69,65.69Z" />
            </svg>
            Continue with Discord
          </button>
        </motion.div>
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}
