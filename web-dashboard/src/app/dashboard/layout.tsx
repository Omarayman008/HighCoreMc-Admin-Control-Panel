'use client';

import { Home, Users, Settings, LogOut, BarChart2, Plus, UserPlus, Moon, Sun, Shield, Award, ChevronDown, Activity, Pickaxe, MessageSquare, Ticket, X as XIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import SettingsPage from './discord/management/settings/page';

// Custom Mouse Glow Component
function CursorGlow() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });

      const target = e.target as HTMLElement;
      if (target) {
        const computedStyle = window.getComputedStyle(target);
        setIsPointer(computedStyle.cursor === 'pointer' || target.tagName.toLowerCase() === 'button' || target.tagName.toLowerCase() === 'a');
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        transform: 'translate(-50%, -50%)',
        width: isPointer ? '60px' : '30px',
        height: isPointer ? '60px' : '30px',
        backgroundColor: isPointer ? 'rgba(56, 189, 248, 0.6)' : 'rgba(139, 92, 246, 0.4)',
        filter: 'blur(20px)',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 99999,
        transition: 'width 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), height 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.2s',
      }}
    />
  );
}

// Sidebar
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [theme, setTheme] = useState('dark');
  const [isMcOpen, setIsMcOpen] = useState(false);
  const [isDcOpen, setIsDcOpen] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [sidebarLogo, setSidebarLogo] = useState<any>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showSettingsOverlay, setShowSettingsOverlay] = useState(false);

  // Helper to check if user has a permission
  const hasPerm = useCallback((perm: string) => {
    if (userPermissions.includes('*')) return true;
    return userPermissions.includes(perm);
  }, [userPermissions]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        if (hasPerm('view_settings')) {
          setShowSettingsOverlay(prev => !prev);
        }
      }
      if (e.key === 'Escape') {
        setShowSettingsOverlay(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasPerm]);

  useEffect(() => {
    const checkAuth = async () => {
      const auth = localStorage.getItem('adminAuth');

      let adminPass = 'HighCoreadmin_@@';
      let modPass = 'HighCoremod_@@';
      let staffPass = 'HighCorestaff_@@';

      try {
        const { data } = await supabase.from('settings').select('value').eq('key', 'app_settings').maybeSingle();
        if (data && data.value) {
          const parsed = JSON.parse(data.value);
          if (parsed?.security?.adminPassword) adminPass = parsed.security.adminPassword;
          if (parsed?.security?.modPassword) modPass = parsed.security.modPassword;
          if (parsed?.security?.staffPassword) staffPass = parsed.security.staffPassword;
        }
      } catch (err) {
        console.error("Error loading settings for auth check:", err);
      }

      if (!auth || (auth !== adminPass && auth !== modPass && auth !== staffPass)) {
        const currentPath = window.location.pathname + window.location.search;
        router.push(`/?error=login_required&redirect_to=${encodeURIComponent(currentPath)}`);
      } else {
        setIsAuthorized(true);
        
        if (localStorage.getItem('preview_mode') === 'true') {
          setIsPreviewMode(true);
        }

        const permsStr = localStorage.getItem('userPermissions');
        if (permsStr) {
          try {
            setUserPermissions(JSON.parse(permsStr));
          } catch (e) {
            setUserPermissions([]);
          }
        }
      }
    };

    checkAuth();
  }, [pathname, router]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'light') document.body.classList.add('light-theme');

    // Auto-open MC or DC menu if we are in a sub-route
    if (pathname.includes('/minecraft')) {
      setIsMcOpen(true);
    }
    if (pathname.includes('/discord') && !pathname.includes('/discord/management')) {
      setIsDcOpen(true);
    }
    if (pathname.includes('/management')) {
      setIsManagementOpen(true);
    }

    fetchSettings();

    const handleSettingsUpdate = () => {
      fetchSettings();
    };
    window.addEventListener('app-settings-updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('app-settings-updated', handleSettingsUpdate);
    };
  }, [pathname]);

  useEffect(() => {
    if (!settings) return;

    const fontFamily = settings.appearance?.fontFamily || 'Tajawal';
    const borderRadius = settings.appearance?.borderRadius || 13;
    const darkColors = settings.appearance?.darkColors || {};
    const lightColors = settings.appearance?.lightColors || {};
    const colors = theme === 'dark' ? darkColors : lightColors;

    let fontLink = document.getElementById('dynamic-google-font');
    if (!fontLink) {
      fontLink = document.createElement('link');
      fontLink.id = 'dynamic-google-font';
      fontLink.setAttribute('rel', 'stylesheet');
      document.head.appendChild(fontLink);
    }
    const fontQueryName = fontFamily.replace(/\s+/g, '+');
    fontLink.setAttribute('href', `https://fonts.googleapis.com/css2?family=${fontQueryName}:wght@300;400;500;600;700&display=swap`);

    let styleEl = document.getElementById('dynamic-theme-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'dynamic-theme-styles';
      document.head.appendChild(styleEl);
    }

    styleEl.innerHTML = `
      :root {
        --font-family: '${fontFamily}', sans-serif;
        --border-radius: ${borderRadius}px;
        ${colors.primary ? `--primary: ${colors.primary};` : ''}
        ${colors.background ? `--background: ${colors.background};` : ''}
        ${colors.cards ? `--glass-bg: ${colors.cards};` : ''}
        ${colors.text ? `--foreground: ${colors.text};` : ''}
        ${colors.green ? `--green: ${colors.green};` : ''}
        ${colors.red ? `--red: ${colors.red};` : ''}
        ${colors.blue ? `--blue: ${colors.blue};` : ''}
        ${colors.purple ? `--purple: ${colors.purple};` : ''}
      }
      * {
        font-family: '${fontFamily}', sans-serif !important;
      }
    `;
  }, [settings, theme]);

  const fetchSettings = async () => {
    try {
      const DEFAULT_MAP: Record<string, Record<string, string>> = {
        tabs: {
          dashboard: 'Dashboard',
          employees: 'Staff',
          ranks: 'Ranks',
          minecraft: 'Minecraft',
          mcStatus: 'Server Status',
          mcStaff: 'MC Staff',
          discord: 'Discord',
          dcStatus: 'Server Status',
          dcStaff: 'DC Staff',
          forums: 'Forums',
          tickets: 'Tickets'
        },
        forumSubs: {
          wl: 'White List',
          teams: 'Teams',
          wlTitle: 'White List Forms',
          teamsTitle: 'Teams Forms'
        },
        cols: {
          name: 'Staff Name',
          rank: 'Rank',
          points: 'Points',
          tickets: 'Tickets'
        },
        btns: {
          addemp: 'Add Staff',
          addrank: 'Add Rank',
          addwl: 'Add White List',
          addteam: 'Add Team Forum',
          managetags: 'Manage Tags'
        },
        filters: {
          admins: 'All Admins',
          tags: 'All Tags',
          versions: 'All Versions',
          types: 'All Types',
          search: 'Search...'
        },
        forumCols: {
          admin: 'Admin',
          discord: 'Discord User & ID',
          mc: 'MC Username',
          version: 'Version',
          type: 'Type',
          tag: 'Tag',
          teamname: 'Team Name',
          color: 'Color',
          leader: 'Leader',
          action: 'Action'
        },
        login: {
          title: 'Opex System',
          welcome: 'Welcome Back',
          iconAdmin: 'ShieldAlert',
          textAdmin: 'Staff Manager',
          iconMod: 'Shield',
          textMod: 'Moderator',
          iconStaff: 'Users',
          textStaff: 'Staff'
        },
        tickets: {
          title: 'Manage Tickets',
          addBtn: 'Add Ticket',
          iconOpen: 'Clock',
          textOpen: 'Pending Review',
          iconClosed: 'CheckCircle',
          textClosed: 'Closed'
        }
      };

      const cleanArabicEmoji = (data: any): any => {
        if (!data || typeof data !== 'object') return data;
        const result = Array.isArray(data) ? [...data] : { ...data };
        
        if (typeof result.sysname === 'string' && /[\u0600-\u06FF]/.test(result.sysname)) {
          result.sysname = 'OPEX MC - DASHBOARD';
        }

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

      const { data: appData } = await supabase.from('settings').select('value').eq('key', 'app_settings').maybeSingle();
      if (appData && appData.value) {
        const parsed = JSON.parse(appData.value);
        setSettings(cleanArabicEmoji(parsed));
      }
      const { data: logoData } = await supabase.from('settings').select('value').eq('key', 'sidebar_logo').maybeSingle();
      if (logoData && logoData.value) {
        setSidebarLogo(JSON.parse(logoData.value));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminUsername');
    localStorage.removeItem('discordUser');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userPermissions');
    router.push('/');
  };

  const handleExitPreview = () => {
    localStorage.setItem('userPermissions', localStorage.getItem('preview_original_permissions') || '[]');
    localStorage.setItem('isAdmin', localStorage.getItem('preview_original_isAdmin') || 'false');
    localStorage.setItem('adminUsername', localStorage.getItem('preview_original_username') || 'Admin');
    localStorage.removeItem('preview_mode');
    localStorage.removeItem('preview_original_permissions');
    localStorage.removeItem('preview_original_isAdmin');
    localStorage.removeItem('preview_original_username');
    window.location.reload();
  };

  const navItems = [
    { name: settings?.tabs?.dashboard || 'Dashboard', icon: <Home size={20} />, path: '/dashboard', perm: 'view_dashboard' },
    { name: settings?.tabs?.employees || 'Staff', icon: <Users size={20} />, path: '/dashboard/staff', perm: 'view_employees' },
    { name: settings?.tabs?.ranks || 'Ranks', icon: <Award size={20} />, path: '/dashboard/ranks', perm: 'view_ranks' },
  ].filter(item => hasPerm(item.perm));

  if (isAuthorized === null) {
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
            borderTopColor: '#38bdf8',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ fontFamily: 'Tajawal, sans-serif' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Mouse Glow Animation */}
      <CursorGlow />

      {/* Background */}
      <div className="bg-gradient" />

      {/* Sidebar */}
      <aside style={{
        width: '260px',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(24px)',
        borderRight: '1px solid var(--glass-border)',
        padding: '2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        boxShadow: '10px 0 30px rgba(0,0,0,0.3)',
        zIndex: 10
      }}>
        <div style={{ padding: '0 1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>HighCore<span style={{ color: 'var(--primary)' }}>Mc</span></h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Admin Control Panel</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          {navItems.length > 0 && <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0.5rem 1rem 0.2rem' }}>General</div>}
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.8rem 1rem',
                  borderRadius: '12px',
                  color: isActive ? 'var(--foreground)' : 'var(--text-muted)',
                  background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                  border: `1px solid ${isActive ? 'var(--primary)' : 'transparent'}`,
                  transition: 'all 0.2s',
                  fontWeight: isActive ? 600 : 500,
                  boxShadow: isActive ? '0 0 15px rgba(139, 92, 246, 0.1)' : 'none'
                }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  {item.icon}
                  {item.name}
                </div>
              </Link>
            )
          })}

          {(hasPerm('view_mc_status') || hasPerm('view_mc_staff') || hasPerm('view_dc_status') || hasPerm('view_dc_staff') || hasPerm('view_forums') || hasPerm('view_tickets')) && (
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '1rem 1rem 0.2rem' }}>Servers</div>
          )}

          {/* Minecraft Collapsible Menu */}
          {(hasPerm('view_mc_status') || hasPerm('view_mc_staff')) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <div
              onClick={() => setIsMcOpen(!isMcOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.8rem 1rem',
                borderRadius: '12px',
                color: pathname.includes('/minecraft') ? '#55bb55' : 'var(--text-muted)',
                background: pathname.includes('/minecraft') ? 'rgba(85, 187, 85, 0.1)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: pathname.includes('/minecraft') ? 600 : 500,
              }}
              onMouseEnter={(e) => { if (!pathname.includes('/minecraft')) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={(e) => { if (!pathname.includes('/minecraft')) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Pickaxe size={20} />
                {settings?.tabs?.minecraft || 'Minecraft'}
              </div>
              <ChevronDown size={16} style={{ transform: isMcOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </div>

            {/* Sub-items */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '0.2rem', paddingLeft: '1rem',
              height: isMcOpen ? 'auto' : '0', overflow: 'hidden', opacity: isMcOpen ? 1 : 0, transition: 'all 0.3s ease-in-out'
            }}>
              {[
                { name: settings?.tabs?.mcStatus || 'Server Status', path: '/dashboard/minecraft/status', icon: <Activity size={16} />, perm: 'view_mc_status' },
                { name: settings?.tabs?.mcStaff || 'MC Staff', path: '/dashboard/minecraft/staff', icon: <Users size={16} />, perm: 'view_mc_staff' }
              ].filter(sub => hasPerm(sub.perm)).map(sub => {
                const isSubActive = pathname === sub.path;
                return (
                  <Link key={sub.path} href={sub.path} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem', borderRadius: '10px',
                      color: isSubActive ? '#55bb55' : 'var(--text-muted)',
                      background: isSubActive ? 'rgba(85, 187, 85, 0.15)' : 'transparent',
                      border: `1px solid ${isSubActive ? '#55bb55' : 'transparent'}`,
                      transition: 'all 0.2s', fontSize: '0.9rem', fontWeight: isSubActive ? 600 : 500
                    }}
                      onMouseEnter={(e) => { if (!isSubActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                      onMouseLeave={(e) => { if (!isSubActive) e.currentTarget.style.background = 'transparent' }}
                    >
                      <span>{sub.icon}</span>
                      {sub.name}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
          )}

          {/* Discord Collapsible Menu */}
          {(hasPerm('view_dc_status') || hasPerm('view_dc_staff') || hasPerm('view_forums') || hasPerm('view_tickets')) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <div
              onClick={() => setIsDcOpen(!isDcOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.8rem 1rem',
                borderRadius: '12px',
                color: (pathname.includes('/discord') && !pathname.includes('/discord/management')) ? '#5865F2' : 'var(--text-muted)',
                background: (pathname.includes('/discord') && !pathname.includes('/discord/management')) ? 'rgba(88, 101, 242, 0.1)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: (pathname.includes('/discord') && !pathname.includes('/discord/management')) ? 600 : 500,
              }}
              onMouseEnter={(e) => { if (!(pathname.includes('/discord') && !pathname.includes('/discord/management'))) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={(e) => { if (!(pathname.includes('/discord') && !pathname.includes('/discord/management'))) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="currentColor">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                </svg>
                {settings?.tabs?.discord || 'Discord'}
              </div>
              <ChevronDown size={16} style={{ transform: isDcOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </div>

            {/* Sub-items */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '0.2rem', paddingLeft: '1rem',
              height: isDcOpen ? 'auto' : '0', overflow: 'hidden', opacity: isDcOpen ? 1 : 0, transition: 'all 0.3s ease-in-out'
            }}>
              {[
                { name: settings?.tabs?.dcStatus || 'Server Status', path: '/dashboard/discord/status', icon: <Activity size={16} />, perm: 'view_dc_status' },
                { name: settings?.tabs?.dcStaff || 'DC Staff', path: '/dashboard/discord/staff', icon: <Users size={16} />, perm: 'view_dc_staff' },
                { name: settings?.tabs?.forums || 'Forums', path: '/dashboard/discord/forums', icon: <MessageSquare size={16} />, perm: 'view_forums' },
                { name: settings?.tickets?.tabName || 'Tickets', path: '/dashboard/discord/tickets', icon: <Ticket size={16} />, perm: 'view_tickets' }
              ].filter(sub => hasPerm(sub.perm)).map(sub => {
                const isSubActive = pathname === sub.path;
                return (
                  <Link key={sub.path} href={sub.path} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem', borderRadius: '10px',
                      color: isSubActive ? '#5865F2' : 'var(--text-muted)',
                      background: isSubActive ? 'rgba(88, 101, 242, 0.15)' : 'transparent',
                      border: `1px solid ${isSubActive ? '#5865F2' : 'transparent'}`,
                      transition: 'all 0.2s', fontSize: '0.9rem', fontWeight: isSubActive ? 600 : 500
                    }}
                      onMouseEnter={(e) => { if (!isSubActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                      onMouseLeave={(e) => { if (!isSubActive) e.currentTarget.style.background = 'transparent' }}
                    >
                      <span>{sub.icon}</span>
                      {sub.name}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
          )}

          {/* Management */}
          {(hasPerm('view_settings') || hasPerm('view_logs')) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: 'auto' }}>
              <div 
                onClick={() => setIsManagementOpen(!isManagementOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.8rem 1rem',
                  borderRadius: '12px',
                  color: pathname.includes('/management') ? '#EC4899' : 'var(--text-muted)',
                  background: pathname.includes('/management') ? 'rgba(236, 72, 153, 0.1)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontWeight: pathname.includes('/management') ? 600 : 500,
                }}
                onMouseEnter={(e) => { if (!pathname.includes('/management')) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={(e) => { if (!pathname.includes('/management')) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Shield size={20} />
                  Management
                </div>
                <ChevronDown size={16} style={{ transform: isManagementOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
              </div>

              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem',
                paddingLeft: '1rem',
                height: isManagementOpen ? 'auto' : '0',
                overflow: 'hidden',
                opacity: isManagementOpen ? 1 : 0,
                transition: 'all 0.3s ease-in-out'
              }}>
                {[
                  { name: 'Settings', path: '/dashboard/discord/management/settings', icon: <Settings size={16} />, perm: 'view_settings' },
                  { name: 'Logs', path: '/dashboard/discord/management/logs', icon: <Activity size={16} />, perm: 'view_logs' }
                ].filter(sub => hasPerm(sub.perm)).map(sub => {
                  const isSubActive = pathname === sub.path;
                  return (
                    <Link key={sub.path} href={sub.path} style={{ textDecoration: 'none' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem', borderRadius: '10px',
                        color: isSubActive ? '#EC4899' : 'var(--text-muted)',
                        background: isSubActive ? 'rgba(236, 72, 153, 0.15)' : 'transparent',
                        border: `1px solid ${isSubActive ? '#EC4899' : 'transparent'}`,
                        transition: 'all 0.2s', fontSize: '0.9rem', fontWeight: isSubActive ? 600 : 500
                      }}
                      onMouseEnter={(e) => { if (!isSubActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                      onMouseLeave={(e) => { if (!isSubActive) e.currentTarget.style.background = 'transparent' }}
                      >
                        <span>{sub.icon}</span>
                        {sub.name}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

        </nav>
      </aside>

      {/* Right Container: Header + Main Content */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100vh', overflow: 'hidden' }}>

        {/* Exit Preview Banner */}
        {isPreviewMode && (
          <div style={{ background: '#f87171', color: '#fff', zIndex: 9999, textAlign: 'center', padding: '0.6rem', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', boxShadow: '0 4px 15px rgba(248, 113, 113, 0.4)', flexShrink: 0 }}>
            You are currently in Staff Preview Mode.
            <button onClick={handleExitPreview} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(0,0,0,0.1)', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 800 }}>Exit Preview</button>
          </div>
        )}

        {/* Top Header */}
        <header style={{
          height: '80px',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid var(--glass-border)',
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          zIndex: 50,
          flexShrink: 0
        }}>
          {/* Header Left: Empty or future use */}
          <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
          </div>

          {/* Header Center: Logo Placeholder */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            {/* Logo Image will go here */}
          </div>

          {/* Header Right: Theme & Logout */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', flex: 1 }}>
            <button onClick={toggleTheme} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', padding: '0.6rem 1rem', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
            }} onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#fff'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#a1a1aa'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}>
              {theme === 'dark' ? <><Moon size={18} /> Dark</> : <><Sun size={18} /> Light</>}
            </button>

            <div onClick={handleLogout} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
            }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              <LogOut size={18} /> Logout
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto', zIndex: 1, direction: 'ltr' }}>
          {children}
        </main>
      </div>

      {/* Settings Overlay (Alt + X) */}
      <AnimatePresence>
        {showSettingsOverlay && (
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
            onClick={() => setShowSettingsOverlay(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                height: '100%',
                background: '#0f0f13',
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              <div style={{ padding: '1rem 2rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#fff' }}>
                  <Settings size={24} color="#EC4899" />
                  Quick Settings Overlay
                </h2>
                <button
                  onClick={() => setShowSettingsOverlay(false)}
                  style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '0.5rem', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <XIcon size={20} />
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', position: 'relative', background: '#0f0f13' }}>
                {/* Render the full settings page */}
                <SettingsPage />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
