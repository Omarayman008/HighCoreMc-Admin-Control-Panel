'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Star, Radio, Ticket, TrendingUp, Trophy, Activity, Megaphone, Plus, X, Send, Pin, Edit2, Trash2, UserPlus, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { supabase } from '@/lib/supabase';
import ConfirmModal from '@/components/ConfirmModal';

export default function Dashboard() {
  const translateArabicLog = (text: string) => {
    if (!text) return '';
    let res = text;
    const mappings: Record<string, string> = {
      'حذف إداري': 'Delete Staff',
      'إداريين': 'Staff',
      'إضافة إداري': 'Add Staff',
      'تحديث إداري': 'Update Staff',
      'إعدادات': 'Settings',
      'تسجيل دخول': 'Login',
      'خروج': 'Logout'
    };
    if (mappings[res]) return mappings[res];
    
    if (res.includes('تم حذف الإداري')) {
      res = res.replace('تم حذف الإداري', 'Deleted staff member');
    }
    if (res.includes('تم إضافة الإداري')) {
      res = res.replace('تم إضافة الإداري', 'Added staff member');
    }
    if (res.includes('تم تحديث الإداري')) {
      res = res.replace('تم تحديث الإداري', 'Updated staff member');
    }
    
    res = res.replace(/[\u0600-\u06FF]/g, '');
    res = res.replace(/[🔵🟡🟢✅]/g, '');
    res = res.replace(/\s+/g, ' ').trim();
    return res || 'System Log';
  };

  const [username, setUsername] = useState('Administrator');
  const [totalPlayers, setTotalPlayers] = useState<number>(0);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [onlineStaff, setOnlineStaff] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [ticketsToday, setTicketsToday] = useState<number>(0);
  const [totalTicketsAllTime, setTotalTicketsAllTime] = useState<number>(0);
  const [activities, setActivities] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAnnId, setEditingAnnId] = useState<number | null>(null);

  // Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, type: 'danger'|'success'|'info', title: string, message: string, onConfirm: () => void}>({
    isOpen: false, type: 'danger', title: '', message: '', onConfirm: () => {}
  });

  // New Staff Modal State
  const [employees, setEmployees] = useState<any[]>([]);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffDiscordId, setNewStaffDiscordId] = useState('');
  const [newStaffPoints, setNewStaffPoints] = useState(0);

  // Points Modal State
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [pointsAmount, setPointsAmount] = useState<number>(0);
  const [pointsAction, setPointsAction] = useState<'add'|'deduct'>('add');
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const [chartType, setChartType] = useState<'bar'|'area'>('bar');

  const fetchAnnouncements = async () => {
    const { data } = await supabase.from('settings').select('value').eq('key', 'announcements').maybeSingle();
    if (data && data.value) {
      try {
        let parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        parsed.sort((a: any, b: any) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setAnnouncements(parsed.slice(0, 4));
      } catch(e) { console.error(e); }
    } else {
      setAnnouncements([]);
    }
  };

  useEffect(() => {
    const user = localStorage.getItem('adminUsername');
    if (user) setUsername(user);

    async function fetchData() {
      try {
        // 1. Total Players
        const { count: whitelistCount } = await supabase.from('whitelist').select('*', { count: 'exact', head: true });
        setTotalPlayers(whitelistCount || 0);

        // 2. Employees (Points & Leaderboard)
        const { data: emps } = await supabase.from('employees').select('*').order('points', { ascending: false });
        let sumPts = 0;
        if (emps) {
          setEmployees(emps);
          sumPts = emps.reduce((acc: number, curr: any) => acc + (curr.points || 0), 0);
          setTotalPoints(sumPts);
          setLeaderboard(emps.slice(0, 6)); // Top 6 for chart
        }

        // 3. Online Staff
        const { data: setting } = await supabase.from('settings').select('value').eq('key', 'dc_status').single();
        if (setting && setting.value) {
          const dcData = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
          setOnlineStaff(dcData.onlineStaff || 0);
        }

        // 4. Tickets (Today & All Time)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const { count: countToday } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).gte('created_at', startOfDay.toISOString());
        setTicketsToday(countToday || 0);

        const { count: countAll } = await supabase.from('tickets').select('*', { count: 'exact', head: true });
        setTotalTicketsAllTime(countAll || 0);

        // 5. Activities from activity_log
        const { data: actsData } = await supabase.from('activity_log')
            .select('*')
            .in('category', ['Points', 'Ranks', 'Reports', 'Events', 'Tasks', 'Announcements'])
            .order('created_at', { ascending: false })
            .limit(5);
        if (actsData && actsData.length > 0) {
          setActivities(actsData);
        } else {
          setActivities([{ id: 1, action_type: 'Dashboard Initialized', created_at: new Date().toISOString(), user_name: 'System', details: 'Dashboard loaded successfully.' }]);
        }

        // 6. Announcements
        await fetchAnnouncements();

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    }
    fetchData();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('employees').insert({
      id: Date.now(),
      name: newStaffName,
      discord_id: newStaffDiscordId,
      points: newStaffPoints,
      role: 'Admin',
      avatar: '⭐',
      color: '#0248c1'
    });
    if (!error) {
      setShowStaffModal(false);
      setNewStaffName('');
      setNewStaffDiscordId('');
      setNewStaffPoints(0);
      const { data } = await supabase.from('employees').select('*').order('points', { ascending: false });
      if (data) { setEmployees(data); setLeaderboard(data.slice(0, 6)); }
    }
    setIsSubmitting(false);
  };

  const handleUpdatePoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || pointsAmount <= 0) return;
    setIsSubmitting(true);
    const emp = employees.find(e => e.id === Number(selectedEmployeeId));
    if (emp) {
      const newPoints = pointsAction === 'add' ? emp.points + pointsAmount : Math.max(0, emp.points - pointsAmount);
      const { error } = await supabase.from('employees').update({ points: newPoints }).eq('id', emp.id);
      if (!error) {
        const reason = 'Admin adjustment';
        await supabase.from('activity_log').insert({ 
          action_type: 'Update Points', 
          details: `Successfully ${pointsAction === 'add' ? 'added' : 'deducted'} ${pointsAmount} points to ${emp.name}. Reason: ${reason}`, 
          category: 'Points', 
          user_name: username,
          created_at: new Date().toISOString()
        });

        // Re-fetch activities to update UI
        const { data: actsData } = await supabase.from('activity_log')
            .select('*')
            .in('category', ['Points', 'Ranks', 'Reports', 'Events', 'Tasks', 'Announcements'])
            .order('created_at', { ascending: false })
            .limit(5);
        if (actsData) setActivities(actsData);

        setShowPointsModal(false);
        setPointsAmount(0);
        setSelectedEmployeeId(null);
        const { data } = await supabase.from('employees').select('*').order('points', { ascending: false });
        if (data) { setEmployees(data); setLeaderboard(data.slice(0, 6)); }
      }
    }
    setIsSubmitting(false);
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    setIsSubmitting(true);
    
    const { data, error } = await supabase.from('settings').select('value').eq('key', 'announcements').maybeSingle();
    let parsed = [];
    if (data && data.value) {
      try { parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value; } catch(e){}
    }

    if (editingAnnId) {
      parsed = parsed.map((a: any) => a.id === editingAnnId ? { ...a, action_type: annTitle, details: annContent } : a);
    } else {
      parsed.push({
        id: Date.now(),
        action_type: annTitle,
        details: annContent,
        user_name: username,
        created_at: new Date().toISOString(),
        pinned: false
      });

      // Add to Recent Activities (only on creation)
      const { data: actsData } = await supabase.from('settings').select('value').eq('key', 'activities').maybeSingle();
      let activitiesArray = [];
      if (actsData && actsData.value) {
        try { activitiesArray = typeof actsData.value === 'string' ? JSON.parse(actsData.value) : actsData.value; } catch(e){}
      }
      activitiesArray.unshift({
        id: Date.now() + 1,
        action_type: 'published a new announcement',
        details: `📢 ${annTitle}`,
        user_name: username,
        created_at: new Date().toISOString()
      });
      if (activitiesArray.length > 10) activitiesArray = activitiesArray.slice(0, 10);
      await supabase.from('settings').upsert({ key: 'activities', value: JSON.stringify(activitiesArray) }, { onConflict: 'key' });
      setActivities(activitiesArray.slice(0, 5));
    }
    await supabase.from('settings').upsert({ key: 'announcements', value: JSON.stringify(parsed) }, { onConflict: 'key' });

    setAnnTitle('');
    setAnnContent('');
    setEditingAnnId(null);
    setShowModal(false);
    setIsSubmitting(false);
    fetchAnnouncements();
  };

  const handleDeleteAnnouncement = (id: number) => {
    setConfirmConfig({
      isOpen: true,
      type: 'danger',
      title: 'Delete Announcement',
      message: 'Are you sure you want to delete this announcement?',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        const { data } = await supabase.from('settings').select('value').eq('key', 'announcements').maybeSingle();
        if (data && data.value) {
          let parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
          parsed = parsed.filter((a: any) => a.id !== id);
          await supabase.from('settings').upsert({ key: 'announcements', value: JSON.stringify(parsed) }, { onConflict: 'key' });
          fetchAnnouncements();
        }
      }
    });
  };

  const handlePinAnnouncement = async (ann: any) => {
    const { data } = await supabase.from('settings').select('value').eq('key', 'announcements').maybeSingle();
    if (data && data.value) {
      let parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
      parsed = parsed.map((a: any) => a.id === ann.id ? { ...a, pinned: !a.pinned } : a);
      await supabase.from('settings').upsert({ key: 'announcements', value: JSON.stringify(parsed) }, { onConflict: 'key' });
      fetchAnnouncements();
    }
  };

  const avgPoints = totalTicketsAllTime > 0 ? (totalPoints / totalTicketsAllTime).toFixed(1) : '0';

  const stats = [
    { title: 'Total Players', value: totalPlayers.toLocaleString(), icon: <Users size={24} color="#60a5fa" />, trend: 'Live from Supabase' },
    { title: 'Total Points', value: totalPoints.toLocaleString(), icon: <Star size={24} color="#facc15" />, trend: 'All admins combined' },
    { title: 'Online Staff', value: onlineStaff.toString(), icon: <Radio size={24} color="#34d399" />, trend: '' },
  ];

  const quickStats = [
    { label: 'Tickets Today', value: ticketsToday.toString(), icon: <Ticket size={18} /> },
    { label: 'Avg Points/Ticket', value: avgPoints, icon: <TrendingUp size={18} /> },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem', position: 'relative' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Control Panel</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Welcome back, <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{username}</span>!</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setShowPointsModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid var(--primary)', color: 'var(--foreground)', padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 0 15px rgba(139, 92, 246, 0.1)'
          }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <Plus size={18} color="var(--primary)" /> Points
          </button>
          <button onClick={() => setShowStaffModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid #34d399', color: 'var(--foreground)', padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 0 15px rgba(52, 211, 153, 0.1)'
          }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <UserPlus size={18} color="#34d399" /> New Staff
          </button>
        </div>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Row 1: Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ scale: 1.02, translateY: -5 }}
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '20px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)',
                cursor: 'default',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.05, transform: 'scale(3)' }}>
                {stat.icon}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '0.25rem', fontWeight: 500 }}>{stat.title}</p>
                  <h3 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--foreground)' }}>{stat.value}</h3>
                </div>
                <motion.div 
                  whileHover={{ rotate: 15, scale: 1.1 }}
                  style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '14px' }}
                >
                  {stat.icon}
                </motion.div>
              </div>
              <div style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: 600, zIndex: 1 }}>
                {stat.trend}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Row 2: Quick Stats & Announcements */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
          {/* Quick Stats */}
          <motion.div
            variants={itemVariants}
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)' }}
          >
            <h3 style={{ color: 'var(--foreground)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', fontWeight: 700 }}>
              <Activity size={20} color="var(--primary)" /> Quick Stats
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {quickStats.map((qs, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ scale: 1.02, background: 'rgba(139, 92, 246, 0.1)' }}
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '1.2rem', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid var(--glass-border)', transition: 'background 0.3s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {qs.icon} {qs.label}
                  </div>
                  <div style={{ color: 'var(--foreground)', fontWeight: 800, fontSize: '1.2rem' }}>{qs.value}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Announcements */}
          <motion.div
            variants={itemVariants}
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)', position: 'relative' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', fontWeight: 700 }}>
                <Megaphone size={20} color="#facc15" /> Announcements
              </h3>
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }} 
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setAnnTitle(''); setAnnContent(''); setEditingAnnId(null); setShowModal(true);
                }}
                style={{ background: 'var(--primary)', color: 'var(--foreground)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 15px rgba(139, 92, 246, 0.5)' }}
              >
                <Plus size={20} />
              </motion.button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <AnimatePresence>
                {announcements.length > 0 ? announcements.map((ann, idx) => {
                  const isPinned = ann.pinned;
                  return (
                    <motion.div 
                      key={ann.id || idx} 
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: idx * 0.1 }}
                      whileHover="hover"
                      style={{ position: 'relative', padding: '1.2rem', borderLeft: isPinned ? '4px solid #facc15' : '4px solid var(--primary)', background: isPinned ? 'linear-gradient(90deg, rgba(250, 204, 21, 0.1) 0%, transparent 100%)' : 'linear-gradient(90deg, rgba(139,92,246,0.1) 0%, transparent 100%)', borderRadius: '0 16px 16px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                        <h4 style={{ color: 'var(--foreground)', fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {isPinned && <Pin size={16} color="#facc15" fill="#facc15" />}
                          {ann.action_type}
                        </h4>
                        <span style={{ color: '#71717a', fontSize: '0.8rem', background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.6rem', borderRadius: '10px' }}>
                          {new Date(ann.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>{ann.details}</p>
                      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: isPinned ? '#facc15' : 'var(--primary)', fontWeight: 600 }}>By: {ann.user_name}</div>
                      
                      {/* Action Buttons */}
                      <motion.div
                        style={{ position: 'absolute', right: '0.5rem', bottom: '0.5rem', display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.5)', padding: '0.3rem', borderRadius: '12px', backdropFilter: 'blur(5px)' }}
                      >
                        <motion.button whileHover={{ scale: 1.1, color: 'var(--foreground)' }} onClick={() => handlePinAnnouncement(ann)} style={{ background: 'none', border: 'none', color: isPinned ? '#facc15' : 'var(--text-muted)', cursor: 'pointer', padding: '0.4rem' }} title={isPinned ? "Unpin" : "Pin"}>
                          <Pin size={18} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1, color: '#60a5fa' }} onClick={() => { setAnnTitle(ann.action_type); setAnnContent(ann.details); setEditingAnnId(ann.id); setShowModal(true); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.4rem' }} title="Edit">
                          <Edit2 size={18} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1, color: '#ef4444' }} onClick={() => handleDeleteAnnouncement(ann.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.4rem' }} title="Delete">
                          <Trash2 size={18} />
                        </motion.button>
                      </motion.div>
                    </motion.div>
                  );
                }) : (
                  <p style={{ color: '#71717a', textAlign: 'center', padding: '2rem 0' }}>No announcements yet. Click + to add one.</p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Row 3: Leaderboard, Activities, Chart */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
          
          {/* Leaderboard */}
          <motion.div
            variants={itemVariants}
            style={{ flex: '1 1 300px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)' }}
          >
            <h3 style={{ color: 'var(--foreground)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', fontWeight: 700 }}>
              <Trophy size={20} color="#facc15" /> Leaderboard
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {leaderboard.slice(0, 5).map((user, idx) => {
                const rank = idx + 1;
                return (
                  <motion.div 
                    key={user.id || idx} 
                    whileHover={{ scale: 1.03, x: 5 }}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem', 
                      background: rank === 1 ? 'linear-gradient(to right, rgba(250, 204, 21, 0.15), rgba(0,0,0,0.2))' : 'rgba(0,0,0,0.2)', 
                      border: rank === 1 ? '1px solid rgba(250, 204, 21, 0.4)' : '1px solid var(--glass-border)',
                      borderRadius: '16px', cursor: 'pointer'
                    }}
                  >
                    <div style={{ 
                      width: '36px', height: '36px', borderRadius: '50%', 
                      background: rank === 1 ? 'var(--accent)' : user.color || 'var(--card-bg)', 
                      color: rank === 1 ? '#111835' : 'var(--foreground)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
                      boxShadow: rank === 1 ? '0 0 15px rgba(248, 214, 19, 0.5)' : 'none'
                    }}>
                      {user.avatar || user.name?.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: rank === 1 ? 'var(--accent)' : 'var(--foreground)', fontWeight: 700 }}>{user.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{user.tickets || 0} tickets</div>
                    </div>
                    <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.1rem' }}>
                      {user.points || 0} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>PTS</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Chart - Real Data from Leaderboard */}
          <motion.div
            variants={itemVariants}
            style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                <TrendingUp size={20} color="#60a5fa" /> Points Distribution
              </h3>
              <button 
                onClick={() => setChartType(chartType === 'bar' ? 'area' : 'bar')}
                style={{ background: 'var(--glass-highlight)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.4rem 0.8rem', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--glass-highlight)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                {chartType === 'bar' ? <Activity size={16} /> : <BarChart2 size={16} />}
                {chartType === 'bar' ? 'Area Chart' : 'Bar Chart'}
              </button>
            </div>
            <div style={{ width: '100%', flex: 1, minHeight: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={leaderboard} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'var(--glass-highlight)' }}
                      contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', backdropFilter: 'blur(10px)', color: 'var(--foreground)' }} 
                    />
                    <Bar dataKey="points" radius={[6, 6, 0, 0]}>
                      {leaderboard.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--accent)' : index === 1 ? 'var(--primary)' : 'var(--glass-highlight)'} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <AreaChart data={leaderboard} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ stroke: 'var(--glass-border)', strokeWidth: 2, fill: 'transparent' }}
                      contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', backdropFilter: 'blur(10px)', color: 'var(--foreground)' }} 
                    />
                    <Area type="monotone" dataKey="points" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorPts)" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Recent Activities */}
          <motion.div
            variants={itemVariants}
            style={{ flex: '1 1 300px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)' }}
          >
            <h3 style={{ color: 'var(--foreground)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', fontWeight: 700 }}>
              <Radio size={20} color="#ec4899" /> Recent Activities
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', background: 'rgba(255,255,255,0.1)' }}></div>
              
              <AnimatePresence>
                {activities.length > 0 ? activities.map((act, idx) => (
                  <motion.div 
                    key={act.id || idx} 
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                    whileHover={{ x: 5 }}
                    style={{ display: 'flex', gap: '1rem', position: 'relative', paddingLeft: '1.5rem', cursor: 'default' }}
                  >
                    <div style={{ position: 'absolute', left: '3px', top: '6px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }}></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: 'var(--foreground)', fontSize: '0.95rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{act.user_name || 'System'}</span> {translateArabicLog(act.action_type)}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.3rem', fontWeight: 500 }}>
                        {new Date(act.created_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {act.details && (
                      <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.95rem', background: 'var(--glass-highlight)', padding: '0.2rem 0.6rem', borderRadius: '8px', height: 'fit-content' }}>
                        {translateArabicLog(act.details)}
                      </div>
                    )}
                  </motion.div>
                )) : (
                  <p style={{ color: 'var(--text-muted)', paddingLeft: '1.5rem' }}>No recent activities.</p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>
      </motion.div>

      {/* Staff Modal */}
      <AnimatePresence>
        {showStaffModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowStaffModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} onClick={(e) => e.stopPropagation()} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '2.5rem', borderRadius: '24px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative' }}>
              <button onClick={() => setShowStaffModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
              <h2 style={{ color: 'var(--foreground)', fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><UserPlus color="#34d399" /> Add New Staff</h2>
              <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>Staff Name</label>
                  <input type="text" required value={newStaffName} onChange={e => setNewStaffName(e.target.value)} style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--foreground)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>Discord ID</label>
                  <input type="text" value={newStaffDiscordId} onChange={e => setNewStaffDiscordId(e.target.value)} style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--foreground)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>Initial Points</label>
                  <input type="number" required value={newStaffPoints} onChange={e => setNewStaffPoints(Number(e.target.value))} style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--foreground)' }} />
                </div>
                <button disabled={isSubmitting} type="submit" style={{ background: '#34d399', color: 'var(--foreground)', border: 'none', padding: '1rem', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem' }}>{isSubmitting ? 'Saving...' : 'Add Staff'}</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Points Modal */}
      <AnimatePresence>
        {showPointsModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowPointsModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} onClick={(e) => e.stopPropagation()} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '2.5rem', borderRadius: '24px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative' }}>
              <button onClick={() => setShowPointsModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
              <h2 style={{ color: 'var(--foreground)', fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus color="var(--primary)" /> Manage Points</h2>
              <form onSubmit={handleUpdatePoints} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', color: 'var(--foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>Select Staff</label>
                  <div 
                    onClick={() => setIsStaffDropdownOpen(!isStaffDropdownOpen)}
                    style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.3)', border: isStaffDropdownOpen ? '1px solid var(--primary)' : '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'border 0.3s' }}
                  >
                    {selectedEmployeeId ? employees.find(e => e.id === selectedEmployeeId)?.name + ' (' + employees.find(e => e.id === selectedEmployeeId)?.points + ' pts)' : 'Select staff...'}
                    <motion.div animate={{ rotate: isStaffDropdownOpen ? 180 : 0 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg></motion.div>
                  </div>
                  <AnimatePresence>
                    {isStaffDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.5rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', backdropFilter: 'blur(10px)', zIndex: 10, maxHeight: '200px', overflowY: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                      >
                        {employees.map(e => (
                          <div 
                            key={e.id} 
                            onClick={() => { setSelectedEmployeeId(e.id); setIsStaffDropdownOpen(false); }}
                            style={{ padding: '0.8rem 1rem', borderRadius: '8px', cursor: 'pointer', color: 'var(--foreground)', background: selectedEmployeeId === e.id ? 'var(--primary)' : 'transparent', fontWeight: selectedEmployeeId === e.id ? 700 : 500, transition: 'all 0.2s' }}
                            onMouseEnter={(ev) => { if (selectedEmployeeId !== e.id) ev.currentTarget.style.background = 'var(--glass-highlight)' }}
                            onMouseLeave={(ev) => { if (selectedEmployeeId !== e.id) ev.currentTarget.style.background = 'transparent' }}
                          >
                            {e.name} <span style={{ color: selectedEmployeeId === e.id ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>({e.points} pts)</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', color: 'var(--foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>Action</label>
                  <div 
                    onClick={() => setIsActionDropdownOpen(!isActionDropdownOpen)}
                    style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.3)', border: isActionDropdownOpen ? '1px solid var(--primary)' : '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'border 0.3s' }}
                  >
                    {pointsAction === 'add' ? 'Add Points (+)' : 'Deduct Points (-)'}
                    <motion.div animate={{ rotate: isActionDropdownOpen ? 180 : 0 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg></motion.div>
                  </div>
                  <AnimatePresence>
                    {isActionDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.5rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', backdropFilter: 'blur(10px)', zIndex: 10, padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                      >
                        <div 
                          onClick={() => { setPointsAction('add'); setIsActionDropdownOpen(false); }}
                          style={{ padding: '0.8rem 1rem', borderRadius: '8px', cursor: 'pointer', color: 'var(--foreground)', background: pointsAction === 'add' ? 'var(--primary)' : 'transparent', fontWeight: pointsAction === 'add' ? 700 : 500, transition: 'all 0.2s' }}
                          onMouseEnter={(ev) => { if (pointsAction !== 'add') ev.currentTarget.style.background = 'var(--glass-highlight)' }}
                          onMouseLeave={(ev) => { if (pointsAction !== 'add') ev.currentTarget.style.background = 'transparent' }}
                        >
                          Add Points (+)
                        </div>
                        <div 
                          onClick={() => { setPointsAction('deduct'); setIsActionDropdownOpen(false); }}
                          style={{ padding: '0.8rem 1rem', borderRadius: '8px', cursor: 'pointer', color: 'var(--foreground)', background: pointsAction === 'deduct' ? 'var(--primary)' : 'transparent', fontWeight: pointsAction === 'deduct' ? 700 : 500, transition: 'all 0.2s' }}
                          onMouseEnter={(ev) => { if (pointsAction !== 'deduct') ev.currentTarget.style.background = 'var(--glass-highlight)' }}
                          onMouseLeave={(ev) => { if (pointsAction !== 'deduct') ev.currentTarget.style.background = 'transparent' }}
                        >
                          Deduct Points (-)
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>Amount</label>
                  <input type="number" required min="1" value={pointsAmount} onChange={e => setPointsAmount(Number(e.target.value))} style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--foreground)' }} />
                </div>
                <button disabled={isSubmitting} type="submit" style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '1rem', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem' }}>{isSubmitting ? 'Saving...' : 'Confirm'}</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Announcements Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '2.5rem', borderRadius: '24px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative' }}
            >
              <button 
                onClick={() => setShowModal(false)}
                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
              
              <h2 style={{ color: 'var(--foreground)', fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Megaphone color="#facc15" /> {editingAnnId ? 'Edit Announcement' : 'New Announcement'}
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{editingAnnId ? 'Modify the details of your announcement.' : 'Broadcast a message to all staff members on the dashboard.'}</p>
              
              <form onSubmit={handleAddAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>Title</label>
                  <input 
                    type="text" required value={annTitle} onChange={e => setAnnTitle(e.target.value)}
                    placeholder="e.g. Server Maintenance"
                    style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--foreground)', outline: 'none', fontSize: '1rem', transition: 'border 0.3s' }}
                    onFocus={(e) => e.target.style.border = '1px solid var(--primary)'}
                    onBlur={(e) => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>Message Content</label>
                  <textarea 
                    required value={annContent} onChange={e => setAnnContent(e.target.value)}
                    placeholder="Enter the announcement details here..."
                    style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--foreground)', outline: 'none', fontSize: '1rem', minHeight: '120px', resize: 'vertical', transition: 'border 0.3s' }}
                    onFocus={(e) => e.target.style.border = '1px solid var(--primary)'}
                    onBlur={(e) => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
                  />
                </div>
                
                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  disabled={isSubmitting}
                  type="submit"
                  style={{ background: 'var(--primary)', color: 'var(--foreground)', border: 'none', padding: '1rem', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem', opacity: isSubmitting ? 0.7 : 1, boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)' }}
                >
                  {isSubmitting ? 'Saving...' : <><Send size={18} /> {editingAnnId ? 'Save Changes' : 'Publish Announcement'}</>}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
}
