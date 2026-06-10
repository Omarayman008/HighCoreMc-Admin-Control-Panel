'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Save,
  RefreshCw,
  Eye,
  Shield,
  Users,
  Award,
  Moon,
  Sun,
  Type,
  Palette,
  FileText,
  Layout,
  Ticket,
  Clipboard,
  ShieldAlert,
  ShieldCheck,
  Key,
  Activity,
  Image as ImageIcon,
  GripVertical,
  Trash2,
  Plus,
  Check,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import CustomColorPicker from '@/components/CustomColorPicker';
import CustomSelect from '@/components/CustomSelect';
import ConfirmModal from '@/components/ConfirmModal';


// Defaults
const DEFAULT_APP_SETTINGS = {
  sysname: 'OPEX MC - DASHBOARD',
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
    textStaff: 'Staff',
    bgColor: '#0a0e1a',
    colorAdmin: '#ffd93d',
    colorMod: '#51cf66',
    colorStaff: '#4dabf7'
  },
  tickets: {
    title: 'Manage Tickets',
    addBtn: 'Add Ticket',
    iconOpen: 'Clock',
    textOpen: 'Pending Review',
    iconClosed: 'CheckCircle',
    textClosed: 'Closed',
    colorOpen: '#ffd93d',
    colorClosed: '#51cf66',
    colorHeader: '#ffd93d',
    colorBtn: '#ffd93d'
  },
  tasks: {
    generalIcon: 'Clipboard',
    dcIcon: 'MessageSquare',
    mcIcon: 'Pickaxe',
    specialIcon: 'Lock',
    generalLabel: 'General Task',
    dcLabel: 'Discord Task',
    mcLabel: 'Minecraft Task',
    specialLabel: 'Special Task',
    addBtn: 'Add Task'
  },
  events: {
    textIcon: 'MessageSquare',
    stageIcon: 'Volume2',
    reservedLabel: 'Reserved',
    submittedLabel: 'Submitted',
    approvedLabel: 'Approved',
    rejectedLabel: 'Rejected'
  },
  reports: {
    monitoringLabel: 'Monitoring Report',
    glitchLabel: 'Glitch Report',
    specialLabel: 'Special Report',
    statusPending: 'Pending',
    statusApproved: 'Approved',
    statusRejected: 'Rejected',
    evidenceLabel: 'Evidence URL',
    notesLabel: 'Review Note'
  },
  security: {
    adminPassword: 'HighCoreadmin_@@',
    modPassword: 'HighCoremod_@@',
    staffPassword: 'HighCorestaff_@@'
  },
  logs: {
    autoClearDays: 30,
    logActions: {
      auth: true,
      settings: true,
      ticket: true,
      employee: true,
      rank: true
    }
  },
  appearance: {
    fontFamily: 'Tajawal',
    fontSizeTitle: 14,
    fontSizeBody: 13,
    fontSizeSmall: 11,
    borderRadius: 13,
    darkColors: {
      primary: '#6366F1',
      background: '#0D0D0D',
      cards: '#1C1C1C',
      text: '#F0F0F0',
      green: '#3ECF8E',
      red: '#FF5C5C',
      blue: '#5C9EFF',
      purple: '#818CF8'
    },
    lightColors: {
      background: '#F8FAFC',
      cards: '#FFFFFF',
      fields: '#F1F5F9',
      text: '#1A202C',
      secondary: '#64748B',
      primary: '#6366F1'
    }
  }
};

// Roles Defaults
const DEFAULT_ADMIN_ROLES = [
  { id: '1487152572207861870', name: 'High Perm', color: '#ff0000', priority: 1, enabled: true },
  { id: '1500454904211177582', name: 'High Manager', color: '#ff4400', priority: 2, enabled: true },
  { id: '1499356853912731769', name: 'Minecraft Manager', color: '#ff8800', priority: 3, enabled: true },
  { id: '1503737842923212951', name: 'Discord Manager', color: '#e67e22', priority: 4, enabled: true },
  { id: '1487152641028128979', name: 'Server Partners', color: '#f1c40f', priority: 5, enabled: true },
  { id: '1487152873048641677', name: 'Dc Developer', color: '#2ecc71', priority: 6, enabled: true },
  { id: '1499356296573354034', name: 'MC Developer', color: '#27ae60', priority: 7, enabled: true },
  { id: '1487152897773797637', name: 'Department Manager', color: '#1abc9c', priority: 8, enabled: true },
  { id: '1487152904824422521', name: 'DC Leader', color: '#3498db', priority: 9, enabled: true },
  { id: '1487152907848646787', name: 'Moderator', color: '#2980b9', priority: 10, enabled: true },
  { id: '1487152911472394401', name: 'Helper', color: '#9b59b6', priority: 11, enabled: true },
  { id: '1487152913422749980', name: 'Guardian', color: '#8e44ad', priority: 12, enabled: true },
  { id: '1487152917763981574', name: 'DC Department', color: '#e91e63', priority: 13, enabled: true },
  { id: '1487152923824885860', name: 'MC Leader', color: '#ff00ff', priority: 14, enabled: true },
  { id: '1487152926827876462', name: 'Reference', color: '#00ff00', priority: 15, enabled: true },
  { id: '1487195243391614997', name: 'Ancient', color: '#00ccff', priority: 16, enabled: true },
  { id: '1487195244230475958', name: 'Supreme', color: '#34d399', priority: 17, enabled: true },
  { id: '1487195245509742682', name: 'Vanguard', color: '#60a5fa', priority: 18, enabled: true },
  { id: '1487195246608646275', name: 'MC Department', color: '#a78bfa', priority: 19, enabled: true },
  { id: '1487195247430602852', name: 'Hype Manager', color: '#f43f5e', priority: 20, enabled: true },
  { id: '1487230361543901224', name: 'Media Manager', color: '#ec4899', priority: 21, enabled: true },
  { id: '1487195248059879555', name: 'Hype Events', color: '#d946ef', priority: 22, enabled: true },
  { id: '1487230245487644712', name: 'Hype Department', color: '#8b5cf6', priority: 23, enabled: true },
  { id: '1487195249817423902', name: 'Trial Staff', color: '#94a3b8', priority: 24, enabled: true },
  { id: '1487195816220430406', name: 'Staff', color: '#64748b', priority: 25, enabled: true }
];

const PERMISSIONS_GROUPS = [
  {
    category: 'Tabs',
    permissions: [
      { key: 'view_dashboard', label: 'view_dashboard', desc: 'View Dashboard' },
      { key: 'view_employees', label: 'view_employees', desc: 'View Staff Members' },
      { key: 'view_ranks', label: 'view_ranks', desc: 'View Ranks' },
      { key: 'view_forums', label: 'view_forums', desc: 'View Forums' },
      { key: 'view_tickets', label: 'view_tickets', desc: 'View Tickets' },
      { key: 'view_settings', label: 'view_settings', desc: 'View Settings' },
      { key: 'view_logs', label: 'view_logs', desc: 'View Activity Logs' }
    ]
  },
  {
    category: 'Staff Members',
    permissions: [
      { key: 'add_employee', label: 'add_employee', desc: 'Add New Staff' },
      { key: 'edit_employee', label: 'edit_employee', desc: 'Edit Staff Data' },
      { key: 'delete_employee', label: 'delete_employee', desc: 'Delete Staff Member' },
      { key: 'add_points', label: 'add_points', desc: 'Add Points' },
      { key: 'remove_points', label: 'remove_points', desc: 'Deduct Points' },
      { key: 'manage_job_titles', label: 'manage_job_titles', desc: 'Manage Job Titles' },
      { key: 'staff_preview', label: 'staff_preview', desc: 'Staff Preview' }
    ]
  },
  {
    category: 'Tasks',
    permissions: [
      { key: 'create_task', label: 'create_task', desc: 'Create New Task' },
      { key: 'edit_task', label: 'edit_task', desc: 'Edit Tasks' },
      { key: 'delete_task', label: 'delete_task', desc: 'Delete Tasks' },
      { key: 'complete_task', label: 'complete_task', desc: 'Complete Tasks' }
    ]
  },
  {
    category: 'Events',
    permissions: [
      { key: 'create_event', label: 'create_event', desc: 'Create New Event' },
      { key: 'edit_event', label: 'edit_event', desc: 'Edit Events' },
      { key: 'delete_event', label: 'delete_event', desc: 'Delete Events' },
      { key: 'claim_event', label: 'claim_event', desc: 'Reserve Event / Participate' },
      { key: 'review_reports', label: 'review_reports', desc: 'Review Event Reports' }
    ]
  },
  {
    category: 'Forums',
    permissions: [
      { key: 'add_whitelist', label: 'add_whitelist', desc: 'Add Whitelist Application' },
      { key: 'edit_whitelist', label: 'edit_whitelist', desc: 'Edit Whitelist Applications' },
      { key: 'delete_whitelist', label: 'delete_whitelist', desc: 'Delete Whitelist Application' },
      { key: 'add_team', label: 'add_team', desc: 'Add Team' },
      { key: 'edit_team', label: 'edit_team', desc: 'Edit Teams' },
      { key: 'delete_team', label: 'delete_team', desc: 'Delete Teams' },
      { key: 'manage_tags', label: 'manage_tags', desc: 'Manage Forums Tags' }
    ]
  },
  {
    category: 'Tickets',
    permissions: [
      { key: 'review_tickets', label: 'review_tickets', desc: 'Review Tickets' }
    ]
  },
  {
    category: 'Reports',
    permissions: [
      { key: 'submit_report', label: 'submit_report', desc: 'Submit Report' },
      { key: 'review_dc_reports', label: 'review_dc_reports', desc: 'Review Discord Reports' },
      { key: 'review_mc_reports', label: 'review_mc_reports', desc: 'Review Minecraft Reports' }
    ]
  },
  {
    category: 'Minecraft',
    permissions: [
      { key: 'view_mc_status', label: 'view_mc_status', desc: 'View MC Server Status' },
      { key: 'view_mc_staff', label: 'view_mc_staff', desc: 'View MC Staff List' },
      { key: 'manage_mc_reports', label: 'manage_mc_reports', desc: 'Manage MC Reports' },
      { key: 'manage_mc_tasks', label: 'manage_mc_tasks', desc: 'Manage MC Tasks' },
      { key: 'manage_mc_events', label: 'manage_mc_events', desc: 'Manage MC Events' }
    ]
  },
  {
    category: 'Discord',
    permissions: [
      { key: 'view_dc_status', label: 'view_dc_status', desc: 'View DC Server Status' },
      { key: 'view_dc_staff', label: 'view_dc_staff', desc: 'View DC Staff List' },
      { key: 'manage_dc_reports', label: 'manage_dc_reports', desc: 'Manage DC Reports' },
      { key: 'manage_dc_tasks', label: 'manage_dc_tasks', desc: 'Manage DC Tasks' },
      { key: 'manage_dc_events', label: 'manage_dc_events', desc: 'Manage DC Events' }
    ]
  },
  {
    category: 'Settings & System',
    permissions: [
      { key: 'edit_settings', label: 'edit_settings', desc: 'Edit General Settings' },
      { key: 'edit_colors', label: 'edit_colors', desc: 'Edit System Colors' },
      { key: 'edit_passwords', label: 'edit_passwords', desc: 'Edit Passwords' },
      { key: 'manage_roles', label: 'manage_roles', desc: 'Manage Administrative Roles' },
      { key: 'reset_settings', label: 'reset_settings', desc: 'Reset All Settings' }
    ]
  }
];

const TOTAL_PERMISSIONS = PERMISSIONS_GROUPS.reduce((acc, g) => acc + g.permissions.length, 0);

// Main Component
export default function SettingsPage() {
  const [hasAccess, setHasAccess] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const permsStr = localStorage.getItem('userPermissions');
      if (permsStr) {
        try {
          const perms = JSON.parse(permsStr);
          return perms.includes('view_settings') || perms.includes('*');
        } catch (e) {
          return false;
        }
      }
    }
    return false;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Accordions
  const [activeGroup, setActiveGroup] = useState<string | null>('appearance');
  const [appearanceTab, setAppearanceTab] = useState<'general' | 'colors' | 'fonts'>('general');
  const [contentTab, setContentTab] = useState<'texts' | 'icons' | 'login'>('texts');
  const [functionsTab, setFunctionsTab] = useState<'tickets' | 'tasks' | 'events' | 'reports'>('tickets');
  const [systemTab, setSystemTab] = useState<'roles' | 'fixed_roles' | 'security' | 'logs'>('roles');

  // Form State
  const [appSettings, setAppSettings] = useState<any>(DEFAULT_APP_SETTINGS);
  const [adminRoles, setAdminRoles] = useState<any[]>([]);
  const [textSearch, setTextSearch] = useState('');

  // Custom States
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [showAddRoleModal, setShowAddRoleModal] = useState<boolean>(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleId, setNewRoleId] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#6366f1');
  const [isSyncing, setIsSyncing] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Dialog State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'success' | 'info';
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => { }
  });

  const showConfirm = (title: string, message: string, type: 'danger' | 'success' | 'info', onConfirm: () => void, confirmText = 'Confirm', cancelText = 'Cancel') => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type,
      confirmText,
      cancelText,
      onConfirm: () => {
        onConfirm();
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const showAlert = (title: string, message: string, type: 'success' | 'danger' | 'info') => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type,
      confirmText: 'OK',
      cancelText: '',
      onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  // Initial Load
  useEffect(() => {
    // Initial load
    fetchData();
  }, []);

  const cleanArabicEmoji = (data: any, defaults: any): any => {
    if (!data || typeof data !== 'object') return data;
    const result = Array.isArray(data) ? [...data] : { ...data };
    for (const key in data) {
      const val = data[key];
      const defaultVal = defaults ? defaults[key] : undefined;
      if (typeof val === 'string') {
        const hasArabic = /[\u0600-\u06FF]/.test(val);
        const hasEmojiSphere = /[🔵🟡🟢✅]/.test(val);
        if (hasArabic || hasEmojiSphere) {
          result[key] = defaultVal !== undefined ? defaultVal : val;
        }
      } else if (typeof val === 'object' && val !== null) {
        result[key] = cleanArabicEmoji(val, defaultVal);
      }
    }
    return result;
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: settingsData } = await supabase.from('settings').select('*');

      const appRow = settingsData?.find(s => s.key === 'app_settings');
      if (appRow?.value) {
        const parsed = typeof appRow.value === 'string' ? JSON.parse(appRow.value) : appRow.value;
        const cleaned = cleanArabicEmoji(parsed, DEFAULT_APP_SETTINGS);
        const mergedSettings = { ...DEFAULT_APP_SETTINGS };
        Object.keys(DEFAULT_APP_SETTINGS).forEach((groupKey) => {
          if (typeof (DEFAULT_APP_SETTINGS as any)[groupKey] === 'object' && (DEFAULT_APP_SETTINGS as any)[groupKey] !== null) {
            mergedSettings[groupKey] = { ...(DEFAULT_APP_SETTINGS as any)[groupKey] };
            if (cleaned[groupKey]) {
              Object.keys((DEFAULT_APP_SETTINGS as any)[groupKey]).forEach((fieldKey) => {
                if (cleaned[groupKey][fieldKey] !== undefined) {
                  mergedSettings[groupKey][fieldKey] = cleaned[groupKey][fieldKey];
                }
              });
            }
          } else {
            if (cleaned[groupKey] !== undefined) {
              mergedSettings[groupKey] = cleaned[groupKey];
            }
          }
        });
        setAppSettings(mergedSettings);
      }

      const { data: rolesData, error: rolesErr } = await supabase.from('roles').select('*').order('priority', { ascending: true });
      if (rolesData && rolesData.length > 0) {
        const sorted = rolesData.sort((a: any, b: any) => a.priority - b.priority);
        setAdminRoles(sorted);
        const perms: Record<string, string[]> = {};
        sorted.forEach((r: any) => {
          perms[r.id] = Array.isArray(r.permissions) ? r.permissions : [];
        });
        setRolePermissions(perms);
        setSelectedRoleId(sorted[0].id);
      } else {
        setAdminRoles([]);
        setRolePermissions({});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // State Updaters
  const updateAppField = (path: string[], value: any) => {
    setAppSettings((prev: any) => {
      const updated = { ...prev };
      let current = updated;
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = { ...current[path[i]] };
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return updated;
    });
  };

  const updateRoleField = (index: number, field: string, value: any) => {
    setAdminRoles((prev: any[]) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRoleIdChange = (index: number, oldId: string, newId: string) => {
    setAdminRoles((prev: any[]) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], id: newId };
      return updated;
    });
    setRolePermissions(prev => {
      const updated = { ...prev };
      if (updated[oldId]) {
        updated[newId] = updated[oldId];
        delete updated[oldId];
      }
      return updated;
    });
    if (selectedRoleId === oldId) {
      setSelectedRoleId(newId);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;

    const updatedRoles = [...adminRoles];
    const item = updatedRoles[draggedIdx];
    updatedRoles.splice(draggedIdx, 1);
    updatedRoles.splice(index, 0, item);

    const reordered = updatedRoles.map((role, i) => ({
      ...role,
      priority: i + 1
    }));

    setAdminRoles(reordered);
    setDraggedIdx(index);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const togglePermission = (roleId: string, permissionKey: string) => {
    setRolePermissions(prev => {
      const rolePerms = prev[roleId] || [];
      const updated = rolePerms.includes(permissionKey)
        ? rolePerms.filter(k => k !== permissionKey)
        : [...rolePerms, permissionKey];
      return { ...prev, [roleId]: updated };
    });
  };

  const selectAllPermissions = (roleId: string) => {
    const allKeys = PERMISSIONS_GROUPS.flatMap(g => g.permissions.map(p => p.key));
    setRolePermissions(prev => ({ ...prev, [roleId]: allKeys }));
  };

  const deselectAllPermissions = (roleId: string) => {
    setRolePermissions(prev => ({ ...prev, [roleId]: [] }));
  };

  const handleSyncRoles = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/discord/roles');
      if (!res.ok) throw new Error('Failed to fetch Discord roles');
      const discordRoles = await res.json();

      setAdminRoles(prev => {
        const updated = prev.map(role => {
          const dRole = discordRoles.find((r: any) => r.id === role.id);
          if (dRole) {
            const hexColor = dRole.color === 0 ? '#95a5a6' : '#' + dRole.color.toString(16).padStart(6, '0');
            return {
              ...role,
              name: dRole.name,
              color: hexColor
            };
          }
          return role;
        });
        return updated;
      });

      showAlert('Success', 'Synchronized successfully with Discord server!', 'success');
    } catch (err: any) {
      console.error(err);
      showAlert('Sync Error', err.message, 'danger');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddRole = (name: string, id: string, color: string) => {
    if (!name || !id) {
      showAlert('Warning', 'Please fill out all fields.', 'info');
      return;
    }
    if (adminRoles.some(r => r.id === id)) {
      showAlert('Error', 'A role with this Discord ID already exists.', 'danger');
      return;
    }
    const newRole = {
      id: crypto.randomUUID(),
      name,
      discord_roles: [id],
      priority: adminRoles.length + 1,
      is_fixed: false
    };
    setAdminRoles(prev => [...prev, newRole]);
    const basicPerms = [
      'view_dashboard', 'view_employees', 'view_ranks', 'view_tasks', 'view_forums', 'view_events', 'view_reports',
      'complete_task', 'claim_event', 'submit_report', 'view_mc_status', 'view_mc_staff', 'view_dc_status', 'view_dc_staff'
    ];
    setRolePermissions(prev => ({
      ...prev,
      [id]: basicPerms
    }));
    setSelectedRoleId(id);
    setShowAddRoleModal(false);
    setNewRoleName('');
    setNewRoleId('');
    setNewRoleColor('#6366f1');
  };

  const handlePreviewRole = (role: any) => {
    try {
      const allPerms = role.permissions || [];
      if (allPerms.length === 0) {
        alert("This role doesn't have any permissions enabled!");
        return;
      }
      localStorage.setItem('preview_original_permissions', localStorage.getItem('userPermissions') || '[]');
      localStorage.setItem('preview_original_isAdmin', localStorage.getItem('isAdmin') || 'false');
      localStorage.setItem('preview_original_username', localStorage.getItem('adminUsername') || 'Admin');
      
      localStorage.setItem('preview_mode', 'true');
      localStorage.setItem('userPermissions', JSON.stringify(allPerms));
      localStorage.setItem('isAdmin', 'false');
      localStorage.setItem('adminUsername', '[Role Preview] ' + role.name);
      
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Failed to enter preview mode");
    }
  };

  const handleDeleteRole = (id: string) => {
    const roleToDelete = adminRoles.find(r => r.id === id);
    if (roleToDelete?.is_fixed) {
      showAlert('Error', 'Fixed roles cannot be deleted.', 'danger');
      return;
    }
    showConfirm(
      'Delete Role',
      'Are you sure you want to delete this role? This will remove all its permission mappings.',
      'danger',
      async () => {
        await supabase.from('roles').delete().eq('id', id);
        setAdminRoles(prev => {
          const filtered = prev.filter(r => r.id !== id);
          return filtered.map((r, i) => ({ ...r, priority: i + 1 }));
        });
        setRolePermissions(prev => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
        if (selectedRoleId === id) {
          setSelectedRoleId(null);
        }
      }
    );
  };

  const resetDarkColors = () => {
    updateAppField(['appearance', 'darkColors'], DEFAULT_APP_SETTINGS.appearance.darkColors);
  };

  const resetLightColors = () => {
    updateAppField(['appearance', 'lightColors'], DEFAULT_APP_SETTINGS.appearance.lightColors);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const { error: appErr } = await supabase.from('settings').update({
        value: JSON.stringify(appSettings)
      }).eq('key', 'app_settings');

      if (appErr) throw appErr;

      const rolesToUpsert = adminRoles.map((r, index) => ({
        id: r.id,
        name: r.name,
        discord_roles: Array.isArray(r.discord_roles) ? r.discord_roles : [],
        priority: index + 1,
        permissions: rolePermissions[r.id] || [],
        is_fixed: r.is_fixed || false,
        department_type: r.department_type || 'ALL'
      }));
      const { error: rolesErr } = await supabase.from('roles').upsert(rolesToUpsert);
      if (rolesErr) throw rolesErr;

      await supabase.from('activity_log').insert({
        action_type: 'Update Settings',
        category: 'Settings',
        details: 'System preferences and security policies updated.',
        user_name: localStorage.getItem('adminUsername') || 'Administrator'
      });

      window.dispatchEvent(new Event('app-settings-updated'));
      showAlert('Success', 'All settings saved successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      showAlert('Error', 'Error saving settings: ' + err.message, 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  // Auth Guard
  if (!hasAccess) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--foreground)' }}>
        <ShieldAlert size={48} color="#EF4444" style={{ margin: '0 auto 1.5rem' }} />
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)' }}>You do not have the required permissions to view this page.</p>
      </div>
    );
  }

  // Text Translation Keys
  const translationKeys = Object.keys(appSettings).reduce((acc: any[], key: string) => {
    if (key !== 'appearance' && key !== 'login' && key !== 'tickets' && key !== 'tasks' && key !== 'events' && key !== 'reports' && key !== 'security' && key !== 'logs' && typeof appSettings[key] === 'object') {
      Object.keys(appSettings[key]).forEach(subKey => {
        acc.push({ category: key, key: subKey, val: appSettings[key][subKey] });
      });
    }
    return acc;
  }, []);

  const filteredTranslations = translationKeys.filter(t =>
    t.key.toLowerCase().includes(textSearch.toLowerCase()) ||
    String(t.val || '').toLowerCase().includes(textSearch.toLowerCase())
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', overflowY: 'auto', height: '100%' }}>

      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Settings color="var(--primary)" size={32} /> Settings Management
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Customize themes, languages, functionality parameters, and staff credentials.</p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'linear-gradient(135deg, var(--primary), #a855f7)',
            color: 'white',
            padding: '0.8rem 1.5rem',
            borderRadius: '12px',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(2, 72, 193, 0.4)',
            opacity: isSaving ? 0.7 : 1
          }}
        >
          {isSaving ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
          Save All Settings
        </button>
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--foreground)', textAlign: 'center', padding: '4rem' }}>Loading system preferences...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Group 1: Appearance */}
          <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', overflow: activeGroup === 'appearance' ? 'visible' : 'hidden' }}>
            <div
              onClick={() => setActiveGroup(activeGroup === 'appearance' ? null : 'appearance')}
              style={{ padding: '1.2rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <Palette size={22} color="#a855f7" />
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--foreground)' }}>Appearance Settings</span>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{activeGroup === 'appearance' ? '▲' : '▼'}</span>
            </div>

            <AnimatePresence>
              {activeGroup === 'appearance' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  style={{ borderTop: '1px solid var(--glass-border)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                >
                  <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem' }}>
                    <button onClick={() => setAppearanceTab('general')} style={{ background: appearanceTab === 'general' ? 'rgba(168,85,247,0.15)' : 'transparent', color: appearanceTab === 'general' ? '#a855f7' : 'var(--text-muted)', padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>General Settings</button>
                    <button onClick={() => setAppearanceTab('colors')} style={{ background: appearanceTab === 'colors' ? 'rgba(168,85,247,0.15)' : 'transparent', color: appearanceTab === 'colors' ? '#a855f7' : 'var(--text-muted)', padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Color Styling</button>
                    <button onClick={() => setAppearanceTab('fonts')} style={{ background: appearanceTab === 'fonts' ? 'rgba(168,85,247,0.15)' : 'transparent', color: appearanceTab === 'fonts' ? '#a855f7' : 'var(--text-muted)', padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Font Typography</button>
                  </div>

                  {appearanceTab === 'general' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>System Identifier / Title</label>
                        <input type="text" className="input-field" style={{ background: 'rgba(0,0,0,0.2)', maxWidth: '400px' }} value={appSettings.sysname} onChange={e => updateAppField(['sysname'], e.target.value)} />
                      </div>

                      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                        <h4 style={{ color: 'var(--foreground)', fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>General Nav Tabs</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.2rem' }}>
                          {Object.keys(appSettings.tabs).map((tabKey) => (
                            <div key={tabKey}>
                              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{tabKey}</label>
                              <input type="text" className="input-field" style={{ background: 'rgba(0,0,0,0.2)' }} value={appSettings.tabs[tabKey]} onChange={e => updateAppField(['tabs', tabKey], e.target.value)} />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                        <div>
                          <h4 style={{ color: 'var(--foreground)', fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>Forums Navigation Labels</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                            {Object.keys(appSettings.forumSubs).map((subKey) => (
                              <div key={subKey}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{subKey}</label>
                                <input type="text" className="input-field" style={{ background: 'rgba(0,0,0,0.2)' }} value={appSettings.forumSubs[subKey]} onChange={e => updateAppField(['forumSubs', subKey], e.target.value)} />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 style={{ color: 'var(--foreground)', fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>Dashboard Buttons</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                            {Object.keys(appSettings.btns).map((btnKey, idx) => {
                              const isLastOdd = idx === Object.keys(appSettings.btns).length - 1 && Object.keys(appSettings.btns).length % 2 !== 0;
                              return (
                                <div key={btnKey} style={isLastOdd ? { gridColumn: '1 / -1' } : {}}>
                                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{btnKey}</label>
                                  <input type="text" className="input-field" style={{ background: 'rgba(0,0,0,0.2)' }} value={appSettings.btns[btnKey]} onChange={e => updateAppField(['btns', btnKey], e.target.value)} />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {appearanceTab === 'colors' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <h4 style={{ color: 'var(--foreground)', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Moon size={18} /> Dark Theme Palette</h4>
                          <button onClick={resetDarkColors} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--foreground)', padding: '0.4rem 0.8rem', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Reset Default</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem' }}>
                          {Object.keys(appSettings.appearance.darkColors).map((cKey) => (
                            <div key={cKey}>
                              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'capitalize' }}>{cKey}</label>
                              <CustomColorPicker value={appSettings.appearance.darkColors[cKey]} onChange={val => updateAppField(['appearance', 'darkColors', cKey], val)} align="left" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <h4 style={{ color: 'var(--foreground)', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Sun size={18} /> Light Theme Palette</h4>
                          <button onClick={resetLightColors} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--foreground)', padding: '0.4rem 0.8rem', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Reset Default</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem' }}>
                          {Object.keys(appSettings.appearance.lightColors).map((cKey) => (
                            <div key={cKey}>
                              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'capitalize' }}>{cKey}</label>
                              <CustomColorPicker value={appSettings.appearance.lightColors[cKey]} onChange={val => updateAppField(['appearance', 'lightColors', cKey], val)} align="left" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {appearanceTab === 'fonts' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Font Typography Family</label>
                          <CustomSelect
                            value={appSettings.appearance.fontFamily}
                            onChange={val => updateAppField(['appearance', 'fontFamily'], val)}
                            activeColor="var(--primary)"
                            activeBg="rgba(99, 102, 241, 0.15)"
                            options={[
                              { value: 'Tajawal', label: 'Tajawal (Default)' },
                              { value: 'Cairo', label: 'Cairo' },
                              { value: 'IBM Plex Sans Arabic', label: 'IBM Plex Sans Arabic' },
                              { value: 'Noto Kufi Arabic', label: 'Noto Noto Kufi Arabic' },
                              { value: 'Readex Pro', label: 'Readex Pro' },
                              { value: 'Rubik', label: 'Rubik' }
                            ]}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Titles Size (px)</label>
                          <input 
                            type="number" 
                            className="input-field" 
                            style={{ background: 'rgba(0,0,0,0.2)' }} 
                            value={appSettings.appearance.fontSizeTitle} 
                            onChange={e => {
                              const val = e.target.value;
                              updateAppField(['appearance', 'fontSizeTitle'], val === '' ? '' : (parseInt(val) || 0));
                            }} 
                            onBlur={e => {
                              if (e.target.value === '') updateAppField(['appearance', 'fontSizeTitle'], 14);
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Body Size (px)</label>
                          <input 
                            type="number" 
                            className="input-field" 
                            style={{ background: 'rgba(0,0,0,0.2)' }} 
                            value={appSettings.appearance.fontSizeBody} 
                            onChange={e => {
                              const val = e.target.value;
                              updateAppField(['appearance', 'fontSizeBody'], val === '' ? '' : (parseInt(val) || 0));
                            }} 
                            onBlur={e => {
                              if (e.target.value === '') updateAppField(['appearance', 'fontSizeBody'], 13);
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Labels / Small Size (px)</label>
                          <input 
                            type="number" 
                            className="input-field" 
                            style={{ background: 'rgba(0,0,0,0.2)' }} 
                            value={appSettings.appearance.fontSizeSmall} 
                            onChange={e => {
                              const val = e.target.value;
                              updateAppField(['appearance', 'fontSizeSmall'], val === '' ? '' : (parseInt(val) || 0));
                            }} 
                            onBlur={e => {
                              if (e.target.value === '') updateAppField(['appearance', 'fontSizeSmall'], 11);
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Interface Corners Radius (px)</label>
                          <input 
                            type="number" 
                            className="input-field" 
                            style={{ background: 'rgba(0,0,0,0.2)' }} 
                            value={appSettings.appearance.borderRadius} 
                            onChange={e => {
                              const val = e.target.value;
                              updateAppField(['appearance', 'borderRadius'], val === '' ? '' : (parseInt(val) || 0));
                            }} 
                            onBlur={e => {
                              if (e.target.value === '') updateAppField(['appearance', 'borderRadius'], 13);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Group 2: Content */}
          <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', overflow: activeGroup === 'content' ? 'visible' : 'hidden' }}>
            <div
              onClick={() => setActiveGroup(activeGroup === 'content' ? null : 'content')}
              style={{ padding: '1.2rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <FileText size={22} color="#0EA5E9" />
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--foreground)' }}>Content Customization</span>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{activeGroup === 'content' ? '▲' : '▼'}</span>
            </div>

            <AnimatePresence>
              {activeGroup === 'content' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  style={{ borderTop: '1px solid var(--glass-border)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                >
                  <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem' }}>
                    <button onClick={() => setContentTab('texts')} style={{ background: contentTab === 'texts' ? 'rgba(14,165,233,0.15)' : 'transparent', color: contentTab === 'texts' ? '#0EA5E9' : 'var(--text-muted)', padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>System Translations</button>
                    <button onClick={() => setContentTab('icons')} style={{ background: contentTab === 'icons' ? 'rgba(14,165,233,0.15)' : 'transparent', color: contentTab === 'icons' ? '#0EA5E9' : 'var(--text-muted)', padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Element Icons</button>
                    <button onClick={() => setContentTab('login')} style={{ background: contentTab === 'login' ? 'rgba(14,165,233,0.15)' : 'transparent', color: contentTab === 'login' ? '#0EA5E9' : 'var(--text-muted)', padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Login Interface</button>
                  </div>

                  {contentTab === 'texts' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <input type="text" className="input-field" placeholder="Search dictionary fields..." value={textSearch} onChange={e => setTextSearch(e.target.value)} />
                      </div>

                      <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: '12px', background: 'rgba(0,0,0,0.2)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--glass-border)' }}>
                              <th style={{ padding: '0.8rem 1.2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Key</th>
                              <th style={{ padding: '0.8rem 1.2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Translation (English)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredTranslations.map((t) => (
                              <tr key={`${t.category}-${t.key}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '0.8rem 1.2rem', fontSize: '0.85rem', color: '#38bdf8', fontFamily: 'monospace' }}>{t.key}</td>
                                <td style={{ padding: '0.8rem 1.2rem' }}>
                                  <input type="text" style={{ width: '100%', padding: '0.4rem 0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white', fontSize: '0.85rem' }} value={appSettings[t.category][t.key]} onChange={e => updateAppField([t.category, t.key], e.target.value)} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {contentTab === 'icons' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Players Card Icon Name</label>
                          <input type="text" className="input-field" value={appSettings.login.iconStaff} onChange={e => updateAppField(['login', 'iconStaff'], e.target.value)} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Points Card Icon Name</label>
                          <input type="text" className="input-field" value={appSettings.login.iconAdmin} onChange={e => updateAppField(['login', 'iconAdmin'], e.target.value)} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Active Employees Card Icon Name</label>
                          <input type="text" className="input-field" value={appSettings.login.iconMod} onChange={e => updateAppField(['login', 'iconMod'], e.target.value)} />
                        </div>
                      </div>
                    </div>
                  )}

                  {contentTab === 'login' && (
                    <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Logo Source (Image URL or Lucide Icon Name)</label>
                            <input type="text" className="input-field" value={appSettings.login.logo || 'KeyRound'} onChange={e => updateAppField(['login', 'logo'], e.target.value)} placeholder="e.g. Shield, Lock, or http://..." />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Login Page Header Title</label>
                            <input type="text" className="input-field" value={appSettings.login.title} onChange={e => updateAppField(['login', 'title'], e.target.value)} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Login Welcome Message</label>
                            <input type="text" className="input-field" value={appSettings.login.welcome} onChange={e => updateAppField(['login', 'welcome'], e.target.value)} />
                          </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.2rem' }}>
                          <h4 style={{ color: 'var(--foreground)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.8rem' }}>Login Roles UI Labeling</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Staff Manager Label</label>
                              <input type="text" className="input-field" value={appSettings.login.textAdmin} onChange={e => updateAppField(['login', 'textAdmin'], e.target.value)} />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Moderator Label</label>
                              <input type="text" className="input-field" value={appSettings.login.textMod} onChange={e => updateAppField(['login', 'textMod'], e.target.value)} />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Staff Label</label>
                              <input type="text" className="input-field" value={appSettings.login.textStaff} onChange={e => updateAppField(['login', 'textStaff'], e.target.value)} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Login Preview */}
                      <div style={{ background: 'radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '3rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'center', alignItems: 'center', position: 'relative', width: '100%', minHeight: '480px' }}>
                        <div style={{ position: 'absolute', top: '1rem', left: '1.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>Interface Preview</div>
                        
                        <div style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(24px)', border: '1px solid var(--glass-border)', borderRadius: '28px', padding: '2.5rem 2rem', width: '100%', maxWidth: '340px', boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.8)', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                          <div>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: 700, textAlign: 'center', background: 'linear-gradient(to right, #ffffff, #c4b5fd, #7dd3fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em', margin: '0 0 0.25rem 0' }}>{appSettings.login.title}</h3>
                            <p style={{ textAlign: 'center', color: '#a1a1aa', fontSize: '0.85rem', margin: 0 }}>{appSettings.login.welcome}</p>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '14px', fontSize: '0.95rem', color: '#d4d4d8' }}>
                              <ShieldAlert size={20} style={{ color: appSettings.login.colorAdmin || '#ffd93d' }} /> {appSettings.login.textAdmin}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '14px', fontSize: '0.95rem', color: '#d4d4d8' }}>
                              <Shield size={20} style={{ color: appSettings.login.colorMod || '#51cf66' }} /> {appSettings.login.textMod}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '14px', fontSize: '0.95rem', color: '#d4d4d8' }}>
                              <ShieldCheck size={20} style={{ color: appSettings.login.colorStaff || '#4dabf7' }} /> {appSettings.login.textStaff}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', margin: '0.5rem 0', color: '#71717a', fontSize: '0.75rem', fontWeight: 500, width: '100%' }}>
                            <div style={{ flex: 1, borderBottom: '1px solid var(--glass-border)' }} />
                            <span style={{ padding: '0 0.5rem' }}>OR</span>
                            <div style={{ flex: 1, borderBottom: '1px solid var(--glass-border)' }} />
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '0.8rem 1rem', borderRadius: '14px', background: 'linear-gradient(135deg, var(--discord), #6370f4)', color: 'white', fontWeight: 600, fontSize: '0.95rem', width: '100%' }}>
                            <svg width="18" height="18" viewBox="0 0 127.14 96.36" fill="currentColor">
                              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
                            </svg>
                            Continue with Discord
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Group 3: Functions */}
          <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', overflow: activeGroup === 'functions' ? 'visible' : 'hidden' }}>
            <div
              onClick={() => setActiveGroup(activeGroup === 'functions' ? null : 'functions')}
              style={{ padding: '1.2rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <Ticket size={22} color="#10B981" />
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--foreground)' }}>System Functionality</span>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{activeGroup === 'functions' ? '▲' : '▼'}</span>
            </div>

            <AnimatePresence>
              {activeGroup === 'functions' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  style={{ borderTop: '1px solid var(--glass-border)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Tickets Tab Custom Title</label>
                      <input type="text" className="input-field" value={appSettings.tickets.tabName} onChange={e => updateAppField(['tickets', 'tabName'], e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Tickets Header Title</label>
                      <input type="text" className="input-field" value={appSettings.tickets.title} onChange={e => updateAppField(['tickets', 'title'], e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Add Ticket Button Text</label>
                      <input type="text" className="input-field" value={appSettings.tickets.addBtn} onChange={e => updateAppField(['tickets', 'addBtn'], e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Pending Review Text</label>
                      <input type="text" className="input-field" value={appSettings.tickets.textOpen} onChange={e => updateAppField(['tickets', 'textOpen'], e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Closed Ticket Text</label>
                      <input type="text" className="input-field" value={appSettings.tickets.textClosed} onChange={e => updateAppField(['tickets', 'textClosed'], e.target.value)} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Group 4: System */}
          <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', overflow: activeGroup === 'system' ? 'visible' : 'hidden' }}>
            <div
              onClick={() => setActiveGroup(activeGroup === 'system' ? null : 'system')}
              style={{ padding: '1.2rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <Shield size={22} color="#EF4444" />
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--foreground)' }}>System Settings & Roles</span>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{activeGroup === 'system' ? '▲' : '▼'}</span>
            </div>

            <AnimatePresence>
              {activeGroup === 'system' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  style={{ borderTop: '1px solid var(--glass-border)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                >
                  <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem' }}>
                    <button onClick={() => setSystemTab('fixed_roles')} style={{ background: systemTab === 'fixed_roles' ? 'rgba(239,68,68,0.15)' : 'transparent', color: systemTab === 'fixed_roles' ? '#EF4444' : 'var(--text-muted)', padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Fixed Roles</button>
                    <button onClick={() => setSystemTab('roles')} style={{ background: systemTab === 'roles' ? 'rgba(239,68,68,0.15)' : 'transparent', color: systemTab === 'roles' ? '#EF4444' : 'var(--text-muted)', padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Administrative Roles</button>
                    <button onClick={() => setSystemTab('security')} style={{ background: systemTab === 'security' ? 'rgba(239,68,68,0.15)' : 'transparent', color: systemTab === 'security' ? '#EF4444' : 'var(--text-muted)', padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Passwords Settings</button>
                    <button onClick={() => setSystemTab('logs')} style={{ background: systemTab === 'logs' ? 'rgba(239,68,68,0.15)' : 'transparent', color: systemTab === 'logs' ? '#EF4444' : 'var(--text-muted)', padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Logs Cleanup</button>
                  </div>

                  {(systemTab === 'roles' || systemTab === 'fixed_roles') && (
                    <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', minHeight: '500px', flexWrap: 'wrap' }}>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', height: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ color: 'var(--foreground)', fontWeight: 700, fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <Users size={18} color="var(--primary)" /> {systemTab === 'fixed_roles' ? 'Fixed Roles' : 'Roles'} ({adminRoles.filter(r => systemTab === 'fixed_roles' ? r.is_fixed : !r.is_fixed).length})
                          </h4>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => setShowAddRoleModal(true)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                background: 'rgba(16,185,129,0.15)', color: '#10B981',
                                padding: '0.4rem 0.8rem', borderRadius: '8px', border: 'none',
                                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700
                              }}
                            >
                              <Plus size={14} /> Add Role
                            </button>
                            <button
                              onClick={handleSyncRoles}
                              disabled={isSyncing}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                background: 'rgba(56,189,248,0.15)', color: '#38bdf8',
                                padding: '0.4rem 0.8rem', borderRadius: '8px', border: 'none',
                                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700
                              }}
                            >
                              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} /> Sync
                            </button>
                          </div>
                        </div>

                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem',
                          flex: 1,
                          minHeight: 0,
                          overflowY: 'auto',
                          paddingRight: '0.5rem',
                          paddingBottom: '1rem' // Provides scroll room
                        }}>
                          {adminRoles
                            .map((role, idx) => ({ role, idx }))
                            .filter(({ role }) => systemTab === 'fixed_roles' ? role.is_fixed : !role.is_fixed)
                            .map(({ role, idx }, visibleIdx) => {
                            const isSelected = selectedRoleId === role.id;
                            return (
                              <div
                                key={role.id || idx}
                                draggable
                                onDragStart={(e) => handleDragStart(e, idx)}
                                onDragOver={(e) => handleDragOver(e, idx)}
                                onDragEnd={handleDragEnd}
                                onClick={() => setSelectedRoleId(role.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.8rem',
                                  padding: '0.8rem 1rem',
                                  background: isSelected
                                    ? 'rgba(139, 92, 246, 0.15)'
                                    : 'rgba(255, 255, 255, 0.02)',
                                  border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--glass-border)'}`,
                                  borderRadius: '12px',
                                  cursor: 'grab',
                                  transition: 'all 0.2s',
                                  opacity: draggedIdx === idx ? 0.5 : 1
                                }}
                              >
                                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                                  <GripVertical size={16} />
                                </span>

                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: '0.2rem' }}>
                                  <input
                                    type="text"
                                    value={role.name}
                                    onClick={e => e.stopPropagation()}
                                    onChange={e => updateRoleField(idx, 'name', e.target.value)}
                                    disabled={role.is_fixed}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: role.is_fixed ? 'var(--primary)' : 'var(--foreground)',
                                      fontWeight: 700,
                                      fontSize: '0.9rem',
                                      padding: 0,
                                      outline: 'none',
                                      width: '100%',
                                      opacity: role.is_fixed ? 0.8 : 1
                                    }}
                                  />
                                  <input
                                    type="text"
                                    value={(role.discord_roles && role.discord_roles[0]) || ''}
                                    onClick={e => e.stopPropagation()}
                                    onChange={e => {
                                      const updatedRoles = [...adminRoles];
                                      updatedRoles[idx].discord_roles = [e.target.value];
                                      setAdminRoles(updatedRoles);
                                    }}
                                    placeholder={role.is_fixed ? "Link Discord Role ID (Optional)" : "Discord Role ID"}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: 'var(--text-muted)',
                                      fontSize: '0.75rem',
                                      fontFamily: 'monospace',
                                      padding: 0,
                                      outline: 'none',
                                      width: '100%'
                                    }}
                                  />
                                </div>

                                <span style={{
                                  fontSize: '0.75rem',
                                  color: 'var(--text-muted)',
                                  fontWeight: 600,
                                  background: 'rgba(255,255,255,0.05)',
                                  padding: '0.15rem 0.4rem',
                                  borderRadius: '5px'
                                }}>
                                  #{visibleIdx + 1}
                                </span>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateRoleField(idx, 'enabled', !role.enabled);
                                  }}
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: role.enabled ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                                    color: role.enabled ? '#10B981' : 'var(--text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  <span style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    background: role.enabled ? '#10B981' : '#64748B'
                                  }} />
                                </button>

                                <div onClick={e => e.stopPropagation()} style={{ width: '130px', flexShrink: 0 }}>
                                  <CustomColorPicker
                                    value={role.color || '#6366f1'}
                                    onChange={val => updateRoleField(idx, 'color', val)}
                                    align="right"
                                  />
                                </div>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePreviewRole(role);
                                    }}
                                    title="Preview Dashboard as this Role"
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: '#a78bfa',
                                      cursor: 'pointer',
                                      padding: '0.4rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      opacity: 0.7,
                                      transition: 'opacity 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                    onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
                                  >
                                    <Eye size={16} />
                                  </button>
                                  {!role.is_fixed ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteRole(role.id);
                                      }}
                                      style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#EF4444',
                                        cursor: 'pointer',
                                        padding: '0.4rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        opacity: 0.7,
                                        transition: 'opacity 0.2s'
                                      }}
                                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                      onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  ) : (
                                    <div style={{ width: '32px' }} />
                                  )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div style={{
                        background: 'rgba(0,0,0,0.15)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.2rem',
                        height: '100%'
                      }}>
                        {selectedRoleId ? (
                          (() => {
                            const selectedRole = adminRoles.find(r => r.id === selectedRoleId);
                            if (!selectedRole) return null;
                            const roleKeys = rolePermissions[selectedRole.id] || [];

                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', height: '100%' }}>
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  borderBottom: '1px solid var(--glass-border)',
                                  paddingBottom: '1rem'
                                }}>
                                  <div>
                                    <h5 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                      <Shield size={18} color={selectedRole.color} />
                                      Permissions: {selectedRole.name}
                                    </h5>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', margin: 0 }}>
                                      {roleKeys.length} / {TOTAL_PERMISSIONS} Permissions Enabled
                                    </p>
                                  </div>

                                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                      onClick={() => selectAllPermissions(selectedRole.id)}
                                      style={{
                                        padding: '0.35rem 0.7rem', borderRadius: '6px', border: '1px solid var(--glass-border)',
                                        background: 'rgba(255,255,255,0.03)', color: 'var(--foreground)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600
                                      }}
                                    >
                                      Select All
                                    </button>
                                    <button
                                      onClick={() => deselectAllPermissions(selectedRole.id)}
                                      style={{
                                        padding: '0.35rem 0.7rem', borderRadius: '6px', border: '1px solid var(--glass-border)',
                                        background: 'rgba(255,255,255,0.03)', color: 'var(--foreground)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600
                                      }}
                                    >
                                      Deselect All
                                    </button>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.8rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem', flexWrap: 'wrap' }}>
                                  <button onClick={() => {
                                      const idx = adminRoles.findIndex(r => r.id === selectedRole.id);
                                      if (idx !== -1) updateRoleField(idx, 'department_type', 'ALL');
                                  }} style={{ background: (!selectedRole.department_type || selectedRole.department_type === 'ALL') ? 'rgba(239,68,68,0.15)' : 'transparent', color: (!selectedRole.department_type || selectedRole.department_type === 'ALL') ? '#EF4444' : 'var(--text-muted)', padding: '0.4rem 1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>ALL (Both)</button>
                                  
                                  <button onClick={() => {
                                      const idx = adminRoles.findIndex(r => r.id === selectedRole.id);
                                      if (idx !== -1) updateRoleField(idx, 'department_type', 'DC');
                                  }} style={{ background: selectedRole.department_type === 'DC' ? 'rgba(239,68,68,0.15)' : 'transparent', color: selectedRole.department_type === 'DC' ? '#EF4444' : 'var(--text-muted)', padding: '0.4rem 1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>DC Department</button>
                                  
                                  <button onClick={() => {
                                      const idx = adminRoles.findIndex(r => r.id === selectedRole.id);
                                      if (idx !== -1) updateRoleField(idx, 'department_type', 'MC');
                                  }} style={{ background: selectedRole.department_type === 'MC' ? 'rgba(239,68,68,0.15)' : 'transparent', color: selectedRole.department_type === 'MC' ? '#EF4444' : 'var(--text-muted)', padding: '0.4rem 1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>MC Department</button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '0.5rem', paddingBottom: '1rem' }}>
                                  {PERMISSIONS_GROUPS.map((group, groupIdx) => {
                                    const groupKeys = group.permissions.map(p => p.key);
                                    const enabledCount = groupKeys.filter(k => roleKeys.includes(k)).length;

                                    return (
                                      <details
                                        key={groupIdx}
                                        style={{
                                          background: 'rgba(0,0,0,0.15)',
                                          border: '1px solid var(--glass-border)',
                                          borderRadius: '10px',
                                          overflow: 'hidden',
                                          flexShrink: 0
                                        }}
                                      >
                                        <summary style={{
                                          padding: '0.8rem 1rem',
                                          color: 'var(--foreground)',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          userSelect: 'none'
                                        }}>
                                          <span style={{ fontSize: '0.85rem' }}>{group.category}</span>
                                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.4rem', borderRadius: '5px' }}>
                                            {enabledCount} / {groupKeys.length}
                                          </span>
                                        </summary>

                                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.1)' }}>
                                          {group.permissions.map(p => {
                                            const isChecked = roleKeys.includes(p.key);
                                            return (
                                              <label
                                                key={p.key}
                                                style={{
                                                  display: 'flex',
                                                  alignItems: 'flex-start',
                                                  gap: '0.8rem',
                                                  color: isChecked ? 'white' : 'var(--text-muted)',
                                                  cursor: 'pointer',
                                                  fontSize: '0.8rem',
                                                  userSelect: 'none'
                                                }}
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={isChecked}
                                                  onChange={() => togglePermission(selectedRole.id, p.key)}
                                                  style={{ marginTop: '0.2rem', cursor: 'pointer' }}
                                                />
                                                <div>
                                                  <div style={{ fontWeight: 600, fontFamily: 'monospace', color: isChecked ? '#38bdf8' : 'var(--text-muted)' }}>{p.key}</div>
                                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{p.desc}</div>
                                                </div>
                                              </label>
                                            );
                                          })}
                                        </div>
                                      </details>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Select a role from the left list to manage permissions.
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {systemTab === 'security' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Staff Manager Password</label>
                        <input type="text" className="input-field" value={appSettings.security.adminPassword} onChange={e => updateAppField(['security', 'adminPassword'], e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Moderator Password</label>
                        <input type="text" className="input-field" value={appSettings.security.modPassword} onChange={e => updateAppField(['security', 'modPassword'], e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Staff Password</label>
                        <input type="text" className="input-field" value={appSettings.security.staffPassword} onChange={e => updateAppField(['security', 'staffPassword'], e.target.value)} />
                      </div>
                    </div>
                  )}

                  {systemTab === 'logs' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Clear System Logs Automatically (Older than X days)</label>
                        <input 
                          type="number" 
                          className="input-field" 
                          style={{ background: 'rgba(0,0,0,0.2)', maxWidth: '200px' }} 
                          value={appSettings.logs.autoClearDays} 
                          onChange={e => {
                            const val = e.target.value;
                            updateAppField(['logs', 'autoClearDays'], val === '' ? '' : (parseInt(val) || 0));
                          }} 
                          onBlur={e => {
                            if (e.target.value === '') updateAppField(['logs', 'autoClearDays'], 30);
                          }}
                        />
                      </div>

                      <div>
                        <h4 style={{ color: 'var(--foreground)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.8rem' }}>Actions to Log</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
                          {Object.keys(appSettings.logs.logActions).map((actKey) => (
                            <label key={actKey} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--foreground)', cursor: 'pointer', fontSize: '0.9rem' }}>
                              <input type="checkbox" checked={appSettings.logs.logActions[actKey]} onChange={e => updateAppField(['logs', 'logActions', actKey], e.target.checked)} style={{ cursor: 'pointer' }} />
                              Log {actKey} activities
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      )}

      {/* Add Role Modal */}
      {showAddRoleModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddRole(newRoleName, newRoleId, newRoleColor);
            }}
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '16px',
              padding: '2rem',
              width: '400px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Award size={22} color="var(--primary)" /> Add New Role
            </h3>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Role Name *</label>
              <input
                type="text"
                className="input-field"
                value={newRoleName}
                onChange={e => setNewRoleName(e.target.value)}
                placeholder="e.g. Event Manager"
                style={{ background: 'rgba(0,0,0,0.2)' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Discord Role ID *</label>
              <input
                type="text"
                className="input-field"
                value={newRoleId}
                onChange={e => setNewRoleId(e.target.value)}
                placeholder="e.g. 1481234567890123456"
                style={{ background: 'rgba(0,0,0,0.2)' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Role Color</label>
              <CustomColorPicker value={newRoleColor} onChange={setNewRoleColor} align="left" />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldAlert size={16} color="#eab308" style={{ flexShrink: 0 }} />
              <span>Important: Please make sure the Role ID is correct. The role will be initialized with basic Staff permissions.</span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowAddRoleModal(false)}
                style={{
                  padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid var(--glass-border)',
                  background: 'transparent', color: 'var(--foreground)', cursor: 'pointer', fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none',
                  background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 700
                }}
              >
                Add Role
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
