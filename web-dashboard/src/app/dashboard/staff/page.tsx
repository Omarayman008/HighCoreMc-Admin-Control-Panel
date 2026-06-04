'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Edit2, Trash2, Star, Briefcase, X, AlertCircle, Shield, Award, Search, TrendingUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Rank {
  name: string;
  emoji: string;
  min_pts: number;
  max_pts: number;
  color: string;
  sort_order: number;
}

interface JobTitle {
  title: string;
  is_main: boolean;
}

interface Employee {
  id: number;
  name: string;
  role: string;
  avatar: string;
  color: string;
  points: number;
  dc_points: number;
  mc_points: number;
  tickets: number;
  discord_id: string;
  job_titles: JobTitle[];
  rank_override: string | null;
  created_at: string;
}

// Custom Select Component to replace native dropdowns
const CustomSelect = ({ options, value, onChange, placeholder }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((o: any) => o.value === value);
  
  return (
    <div style={{ position: 'relative' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span style={{ color: selected ? 'var(--foreground)' : 'var(--text-muted)' }}>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={16} color="var(--text-muted)" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e293b', border: '1px solid var(--glass-border)', borderRadius: '10px', marginTop: '0.5rem', zIndex: 100, overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
          >
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {options.map((opt: any) => (
                <div
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  style={{ padding: '0.8rem 1rem', color: 'var(--foreground)', cursor: 'pointer', background: value === opt.value ? 'rgba(56, 189, 248, 0.1)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = value === opt.value ? 'rgba(56, 189, 248, 0.1)' : 'transparent'}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function StaffPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showJobsModal, setShowJobsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Selected Context
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);

  // Forms
  const [staffForm, setStaffForm] = useState({ name: '', role: '', discord_id: '', avatar: 'A', color: '#5C9EFF', points: 0, rank_override: '' });
  const [pointsForm, setPointsForm] = useState({ amount: 10, action: 'add', category: 'DC', note: '' });
  const [newJobTitle, setNewJobTitle] = useState('');

  const quickPoints = [
    { value: 10, label: 'Basic', action: 'add' },
    { value: 20, label: 'Medium', action: 'add' },
    { value: 35, label: 'Hard', action: 'add' },
    { value: 15, label: 'Special', action: 'add' },
    { value: 5, label: 'Warning', action: 'deduct' },
    { value: 10, label: 'Violation', action: 'deduct' }
  ];

  const colors = [
    { name: 'Gold', value: '#F59E0B' },
    { name: 'Green', value: '#3ECF8E' },
    { name: 'Blue', value: '#5C9EFF' },
    { name: 'Purple', value: '#818CF8' },
    { name: 'Red', value: '#FF5C5C' }
  ];

  useEffect(() => {
    const auth = localStorage.getItem('adminAuth');
    if (auth === 'HighCoreadmin_@@') setIsAdmin(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const { data: ranksData } = await supabase.from('ranks').select('*').order('sort_order', { ascending: true });
    if (ranksData) setRanks(ranksData);

    const { data: empsData } = await supabase.from('employees').select('*').order('points', { ascending: false });
    if (empsData) {
      // Normalize job_titles to array if null
      const normalized = empsData.map(e => ({
        ...e,
        job_titles: Array.isArray(e.job_titles) ? e.job_titles : []
      }));
      setEmployees(normalized);
    }
    setIsLoading(false);
  };

  const getRankForEmployee = (emp: Employee) => {
    if (emp.rank_override) {
      const found = ranks.find(r => r.name === emp.rank_override);
      if (found) return found;
    }
    const found = ranks.find(r => emp.points >= r.min_pts && emp.points <= r.max_pts);
    return found || ranks[0] || { name: 'No Rank', emoji: '🔰', color: '#888', min_pts: 0, max_pts: 100 };
  };

  const getNextRank = (emp: Employee) => {
    const current = getRankForEmployee(emp);
    const next = ranks.find(r => r.min_pts > current.max_pts);
    return next || current;
  };

  const getProgress = (emp: Employee) => {
    const current = getRankForEmployee(emp);
    const next = getNextRank(emp);
    if (current.name === next.name) return 100; // Max rank
    const range = next.min_pts - current.min_pts;
    const progress = emp.points - current.min_pts;
    return Math.min(100, Math.max(0, (progress / range) * 100));
  };

  const logActivity = async (action_type: string, details: string, category: string) => {
    const username = localStorage.getItem('adminUsername') || 'Admin';
    await supabase.from('activity_log').insert({ action_type, details, category, user_name: username });
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let finalPoints = editingEmployee ? editingEmployee.points : (staffForm.points || 0);
    if (staffForm.rank_override) {
      const rank = ranks.find(r => r.name === staffForm.rank_override);
      if (rank) {
        finalPoints = rank.min_pts;
      }
    }

    if (editingEmployee) {
      const { error } = await supabase.from('employees').update({
        name: staffForm.name,
        role: staffForm.role,
        discord_id: staffForm.discord_id,
        avatar: staffForm.avatar,
        color: staffForm.color,
        points: finalPoints,
        rank_override: null
      }).eq('id', editingEmployee.id);
      if (!error) {
        logActivity('Edit Staff', `Edited data for ${staffForm.name}`, 'Staff');
      }
    } else {
      const newId = Math.floor(100000000 + Math.random() * 900000000);
      const { error } = await supabase.from('employees').insert({
        id: newId,
        name: staffForm.name,
        role: staffForm.role,
        discord_id: staffForm.discord_id,
        avatar: staffForm.avatar,
        color: staffForm.color,
        points: finalPoints,
        rank_override: null,
        job_titles: []
      });
      if (!error) {
        logActivity('Add Staff', `Added new staff member ${staffForm.name}`, 'Staff');
      }
    }
    setShowStaffModal(false);
    fetchData();
    setIsSubmitting(false);
  };

  const handleDeleteStaff = async () => {
    if (!selectedEmpId) return;
    setIsSubmitting(true);
    const emp = employees.find(e => e.id === selectedEmpId);
    const { error } = await supabase.from('employees').delete().eq('id', selectedEmpId);
    if (!error && emp) {
      logActivity('Delete Staff', `Deleted staff member ${emp.name}`, 'Staff');
    }
    setShowDeleteModal(false);
    fetchData();
    setIsSubmitting(false);
  };

  const handleUpdatePoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) return;
    setIsSubmitting(true);
    const emp = employees.find(e => e.id === selectedEmpId);
    if (emp) {
      const diff = pointsForm.action === 'add' ? pointsForm.amount : -pointsForm.amount;
      const newPoints = Math.max(0, emp.points + diff);
      const newDc = pointsForm.category === 'DC' ? Math.max(0, emp.dc_points + diff) : emp.dc_points;
      const newMc = pointsForm.category === 'MC' ? Math.max(0, emp.mc_points + diff) : emp.mc_points;

      const { error } = await supabase.from('employees').update({ 
        points: newPoints,
        dc_points: newDc,
        mc_points: newMc
      }).eq('id', emp.id);

      if (!error) {
        logActivity('Update Points', `Successfully ${pointsForm.action === 'add' ? 'added' : 'deducted'} ${pointsForm.amount} points ${pointsForm.action === 'add' ? 'to' : 'from'} ${emp.name}. Reason: ${pointsForm.note}`, 'Points');
      }
    }
    setShowPointsModal(false);
    fetchData();
    setIsSubmitting(false);
  };

  const handleAddJobTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !newJobTitle.trim()) return;
    const emp = employees.find(e => e.id === selectedEmpId);
    if (!emp) return;

    const newJobs = [...(emp.job_titles || []), { title: newJobTitle.trim(), is_main: (emp.job_titles?.length || 0) === 0 }];
    const { error } = await supabase.from('employees').update({ job_titles: newJobs }).eq('id', emp.id);
    if (!error) {
      setNewJobTitle('');
      fetchData();
    }
  };

  const handleRemoveJobTitle = async (title: string) => {
    if (!selectedEmpId) return;
    const emp = employees.find(e => e.id === selectedEmpId);
    if (!emp) return;

    const newJobs = emp.job_titles.filter(j => j.title !== title);
    if (newJobs.length > 0 && !newJobs.some(j => j.is_main)) newJobs[0].is_main = true;
    await supabase.from('employees').update({ job_titles: newJobs }).eq('id', emp.id);
    fetchData();
  };

  const handleSetMainJobTitle = async (title: string) => {
    if (!selectedEmpId) return;
    const emp = employees.find(e => e.id === selectedEmpId);
    if (!emp) return;

    const newJobs = emp.job_titles.map(j => ({ ...j, is_main: j.title === title }));
    await supabase.from('employees').update({ job_titles: newJobs }).eq('id', emp.id);
    fetchData();
  };

  const filteredEmployees = employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (!isAdmin) return <div style={{ padding: '2rem', color: 'var(--foreground)' }}>You do not have permission to view this page.</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Users color="var(--primary)" size={32} /> Staff Management
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Manage staff data, points, ranks, and permissions.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search for a staff member..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--foreground)', outline: 'none' }}
            />
          </div>
          <button 
            onClick={() => { setEditingEmployee(null); setStaffForm({ name: '', role: '', discord_id: '', avatar: 'A', color: '#5C9EFF', points: 0, rank_override: '' }); setShowStaffModal(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary)', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 0 20px rgba(2, 72, 193, 0.4)' }}
          >
            <Plus size={20} /> New Staff
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--foreground)', textAlign: 'center', padding: '4rem' }}>Loading...</div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="desktop-only" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '1.2rem', color: 'var(--text-muted)', fontWeight: 600 }}>Staff Member</th>
                  <th style={{ padding: '1.2rem', color: 'var(--text-muted)', fontWeight: 600 }}>Rank</th>
                  <th style={{ padding: '1.2rem', color: 'var(--text-muted)', fontWeight: 600 }}>Points</th>
                  <th style={{ padding: '1.2rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tickets</th>
                  <th style={{ padding: '1.2rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredEmployees.map((emp, idx) => {
                    const rank = getRankForEmployee(emp);
                    const progress = getProgress(emp);
                    const mainJob = emp.job_titles?.find(j => j.is_main) || emp.job_titles?.[0];
                    const extraJobsCount = emp.job_titles?.length > 1 ? emp.job_titles.length - 1 : 0;

                    return (
                      <motion.tr 
                        key={emp.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                        style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Avatar & Name */}
                        <td style={{ padding: '1.2rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: `linear-gradient(135deg, ${emp.color}88, ${emp.color})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: `0 0 15px ${emp.color}40`, color: '#fff' }}>
                              {emp.avatar}
                            </div>
                            <div>
                              <div style={{ color: 'var(--foreground)', fontWeight: 700, fontSize: '1.1rem' }}>{emp.name}</div>
                              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{emp.role}</span>
                                {mainJob && (
                                  <span style={{ fontSize: '0.75rem', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)', padding: '0.1rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                                    {mainJob.title}
                                  </span>
                                )}
                                {extraJobsCount > 0 && (
                                  <span title="More Job Titles" style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '0.1rem 0.5rem', borderRadius: '6px', cursor: 'help' }}>
                                    +{extraJobsCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Rank */}
                        <td style={{ padding: '1.2rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: `${rank.color}15`, border: `1px solid ${rank.color}30`, padding: '0.4rem 0.8rem', borderRadius: '10px', width: 'fit-content', boxShadow: `0 0 10px ${rank.color}10` }}>
                            {rank.emoji?.startsWith('data:image') || rank.emoji?.startsWith('http') ? (
                              <img src={rank.emoji} alt="rank" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                            ) : (
                              <span>{rank.emoji}</span>
                            )}
                            <span style={{ color: rank.color, fontWeight: 700, fontSize: '0.95rem' }}>{rank.name}</span>
                          </div>
                        </td>

                        {/* Points */}
                        <td style={{ padding: '1.2rem', width: '30%' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                              <span style={{ color: 'var(--foreground)', fontWeight: 700 }}>{emp.points} <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>PTS</span></span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{Math.round(progress)}%</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                              <motion.div 
                                initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1 }}
                                style={{ height: '100%', background: `linear-gradient(90deg, var(--primary), ${rank.color})`, borderRadius: '4px', boxShadow: `0 0 10px ${rank.color}` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Tickets */}
                        <td style={{ padding: '1.2rem' }}>
                          <div style={{ color: 'var(--foreground)', fontWeight: 700, fontSize: '1.1rem' }}>{emp.tickets || 0}</div>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '1.2rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button onClick={() => { setSelectedEmpId(emp.id); setShowJobsModal(true); }} title="Job Titles" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}>
                              <Briefcase size={16} style={{ margin: 'auto' }} />
                            </button>
                            <button onClick={() => { setSelectedEmpId(emp.id); setPointsForm({...pointsForm, amount: 10, note: ''}); setShowPointsModal(true); }} title="Manage Points" style={{ background: 'rgba(250, 204, 21, 0.1)', border: '1px solid rgba(250, 204, 21, 0.2)', color: '#facc15', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(250, 204, 21, 0.2)' }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(250, 204, 21, 0.1)' }}>
                              <Star size={16} style={{ margin: 'auto' }} />
                            </button>
                            <button onClick={() => { setEditingEmployee(emp); setStaffForm({ name: emp.name, role: emp.role, discord_id: emp.discord_id || '', avatar: emp.avatar, color: emp.color, points: emp.points, rank_override: emp.rank_override || '' }); setShowStaffModal(true); }} title="Edit Staff" style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', color: '#38bdf8', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)' }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)' }}>
                              <Edit2 size={16} style={{ margin: 'auto' }} />
                            </button>
                            <button onClick={() => { setSelectedEmpId(emp.id); setShowDeleteModal(true); }} title="Delete Staff" style={{ background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.2)', color: '#f87171', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248, 113, 113, 0.2)' }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)' }}>
                              <Trash2 size={16} style={{ margin: 'auto' }} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
            {filteredEmployees.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No staff members match your search.</div>}
          </div>

          {/* Mobile Cards View */}
          <div className="mobile-only" style={{ display: 'none', flexDirection: 'column', gap: '1rem' }}>
            {filteredEmployees.map((emp) => {
               const rank = getRankForEmployee(emp);
               const progress = getProgress(emp);
               return (
                 <div key={emp.id} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: `linear-gradient(135deg, ${emp.color}88, ${emp.color})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: '#fff' }}>
                        {emp.avatar}
                      </div>
                      <div>
                        <div style={{ color: 'var(--foreground)', fontWeight: 800, fontSize: '1.2rem' }}>{emp.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{emp.role}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: `${rank.color}15`, border: `1px solid ${rank.color}30`, padding: '0.4rem 0.8rem', borderRadius: '10px', width: 'fit-content', marginBottom: '1.5rem' }}>
                      {rank.emoji?.startsWith('data:image') || rank.emoji?.startsWith('http') ? (
                        <img src={rank.emoji} alt="rank" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                      ) : (
                        <span>{rank.emoji}</span>
                      )}
                      <span style={{ color: rank.color, fontWeight: 700, fontSize: '0.95rem' }}>{rank.name}</span>
                    </div>
                    
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--foreground)', fontWeight: 700 }}>Points: {emp.points}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{Math.round(progress)}% to next rank</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} style={{ height: '100%', background: `linear-gradient(90deg, var(--primary), ${rank.color})` }} />
                      </div>
                    </div>

                    <div style={{ color: 'var(--foreground)', fontSize: '0.9rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '10px' }}>
                      Closed Tickets: <span style={{ fontWeight: 800 }}>{emp.tickets || 0}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
                      <button onClick={() => { setSelectedEmpId(emp.id); setShowJobsModal(true); }} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', padding: '0.8rem', borderRadius: '10px' }}><Briefcase size={18} style={{ margin: 'auto' }} /></button>
                      <button onClick={() => { setSelectedEmpId(emp.id); setPointsForm({...pointsForm, amount: 10, note: ''}); setShowPointsModal(true); }} style={{ flex: 1, background: 'rgba(250, 204, 21, 0.1)', border: '1px solid rgba(250, 204, 21, 0.2)', color: '#facc15', padding: '0.8rem', borderRadius: '10px' }}><Star size={18} style={{ margin: 'auto' }} /></button>
                      <button onClick={() => { setEditingEmployee(emp); setStaffForm({ name: emp.name, role: emp.role, discord_id: emp.discord_id || '', avatar: emp.avatar, color: emp.color, points: emp.points, rank_override: emp.rank_override || '' }); setShowStaffModal(true); }} style={{ flex: 1, background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '0.8rem', borderRadius: '10px' }}><Edit2 size={18} style={{ margin: 'auto' }} /></button>
                      <button onClick={() => { setSelectedEmpId(emp.id); setShowDeleteModal(true); }} style={{ flex: 1, background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.2)', color: '#f87171', padding: '0.8rem', borderRadius: '10px' }}><Trash2 size={18} style={{ margin: 'auto' }} /></button>
                    </div>
                 </div>
               )
            })}
          </div>
        </>
      )}

      {/* --- MODALS --- */}
      
      {/* 1. Add/Edit Staff Modal */}
      <AnimatePresence>
        {showStaffModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '2rem', borderRadius: '24px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
              <button onClick={() => setShowStaffModal(false)} type="button" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
              <h2 style={{ color: 'var(--foreground)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield color="var(--primary)" /> {editingEmployee ? 'Edit Staff Data' : 'Add New Staff'}
              </h2>
              <form onSubmit={handleSaveStaff} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>Name</label>
                  <input type="text" required value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>Job Title (Role)</label>
                  <input type="text" value={staffForm.role} onChange={e => setStaffForm({...staffForm, role: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)' }} />
                </div>
                {!editingEmployee && (
                  <div>
                    <label style={{ display: 'block', color: 'var(--foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>Initial Points</label>
                    <input type="number" required value={staffForm.points} onChange={e => setStaffForm({...staffForm, points: Number(e.target.value)})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)' }} />
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', color: 'var(--foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>Set Rank (Updates Points)</label>
                  <CustomSelect 
                    value={staffForm.rank_override} 
                    onChange={(val: string) => setStaffForm({...staffForm, rank_override: val})}
                    options={[
                      { value: '', label: '-- Auto by Points --' },
                      ...ranks.map(r => ({ 
                        value: r.name, 
                        label: (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {r.emoji.startsWith('data:image') ? <img src={r.emoji} alt={r.name} width={20} height={20} style={{ borderRadius: '4px' }} /> : <span>{r.emoji}</span>}
                            <span>{r.name}</span>
                          </div>
                        )
                      }))
                    ]}
                    placeholder="-- Auto by Points --"
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: 'var(--foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>Avatar Symbol</label>
                    <input type="text" required maxLength={2} value={staffForm.avatar} onChange={e => setStaffForm({...staffForm, avatar: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: 'var(--foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>Background Color</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', height: '45px' }}>
                      {colors.map(c => (
                        <div key={c.value} onClick={() => setStaffForm({...staffForm, color: c.value})} style={{ width: '30px', height: '30px', borderRadius: '50%', background: c.value, cursor: 'pointer', border: staffForm.color === c.value ? '2px solid white' : '2px solid transparent', transform: staffForm.color === c.value ? 'scale(1.1)' : 'scale(1)' }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>Discord ID (for tickets)</label>
                  <input type="text" value={staffForm.discord_id} onChange={e => setStaffForm({...staffForm, discord_id: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)' }} />
                </div>
                <button disabled={isSubmitting} type="submit" style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '1rem', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', marginTop: '1rem' }}>
                  {isSubmitting ? 'Saving...' : 'Save Data'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Points Modal */}
      <AnimatePresence>
        {showPointsModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '2.5rem', borderRadius: '24px', width: '100%', maxWidth: '500px', position: 'relative' }}>
              <button onClick={() => setShowPointsModal(false)} type="button" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
              <h2 style={{ color: 'var(--foreground)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Star color="#facc15" /> Manage Points
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Staff: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{employees.find(e=>e.id===selectedEmpId)?.name}</span></p>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {quickPoints.map((qp, idx) => (
                  <button 
                    key={idx} type="button"
                    onClick={() => setPointsForm({...pointsForm, amount: qp.value, action: qp.action as 'add' | 'deduct'})}
                    style={{ flex: '1 1 30%', background: qp.action === 'add' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)', border: `1px solid ${qp.action === 'add' ? '#34d399' : '#f87171'}`, color: qp.action === 'add' ? '#34d399' : '#f87171', padding: '0.8rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {qp.action === 'add' ? '+' : '-'}{qp.value} ({qp.label})
                  </button>
                ))}
              </div>

              <form onSubmit={handleUpdatePoints} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: 'var(--foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>Action</label>
                    <CustomSelect 
                      value={pointsForm.action}
                      onChange={(val: string) => setPointsForm({...pointsForm, action: val as 'add' | 'deduct'})}
                      options={[
                        { value: 'add', label: 'Add (+)' },
                        { value: 'deduct', label: 'Deduct (-)' }
                      ]}
                      placeholder="Select action"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: 'var(--foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>Points</label>
                    <input type="number" required min="1" value={pointsForm.amount} onChange={e => setPointsForm({...pointsForm, amount: Number(e.target.value)})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)' }} />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: 'var(--foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>Category</label>
                  <CustomSelect 
                    value={pointsForm.category}
                    onChange={(val: string) => setPointsForm({...pointsForm, category: val})}
                    options={[
                      { value: 'DC', label: 'Discord (DC)' },
                      { value: 'MC', label: 'Minecraft (MC)' }
                    ]}
                    placeholder="Select category"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>Reason / Note</label>
                  <input type="text" required value={pointsForm.note} onChange={e => setPointsForm({...pointsForm, note: e.target.value})} placeholder="e.g. Excellent response quality" style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)' }} />
                </div>
                <button disabled={isSubmitting} type="submit" style={{ background: pointsForm.action === 'add' ? '#34d399' : '#f87171', color: '#111835', border: 'none', padding: '1rem', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer', marginTop: '1rem' }}>
                  {isSubmitting ? 'Executing...' : 'Confirm Action'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Job Titles Modal */}
      <AnimatePresence>
        {showJobsModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '2rem', borderRadius: '24px', width: '100%', maxWidth: '500px', position: 'relative' }}>
              <button onClick={() => setShowJobsModal(false)} type="button" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
              <h2 style={{ color: 'var(--foreground)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Briefcase color="var(--primary)" /> Job Titles
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Manage additional titles for <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{employees.find(e=>e.id===selectedEmpId)?.name}</span></p>
              
              <form onSubmit={handleAddJobTitle} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input type="text" placeholder="New job title..." value={newJobTitle} onChange={e=>setNewJobTitle(e.target.value)} style={{ flex: 1, padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)' }} />
                <button type="submit" style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0 1rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}><Plus size={20} /></button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                {employees.find(e=>e.id===selectedEmpId)?.job_titles?.map((job, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: job.is_main ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${job.is_main ? 'var(--primary)' : 'var(--glass-border)'}`, padding: '0.8rem 1rem', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--foreground)', fontWeight: job.is_main ? 700 : 500 }}>
                      {job.is_main && <Award size={16} color="var(--primary)" />} {job.title}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {!job.is_main && <button onClick={() => handleSetMainJobTitle(job.title)} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '0.8rem' }}>Set as Main</button>}
                      <button onClick={() => handleRemoveJobTitle(job.title)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
                {(!employees.find(e=>e.id===selectedEmpId)?.job_titles || employees.find(e=>e.id===selectedEmpId)?.job_titles.length === 0) && (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No additional job titles.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '2rem', borderRadius: '24px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
              <AlertCircle size={48} color="#f87171" style={{ margin: '0 auto 1rem' }} />
              <h2 style={{ color: 'var(--foreground)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Confirm Deletion</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Are you sure you want to permanently delete staff member <span style={{ color: '#f87171', fontWeight: 700 }}>{employees.find(e=>e.id===selectedEmpId)?.name}</span>? This action cannot be undone.</p>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button disabled={isSubmitting} onClick={handleDeleteStaff} style={{ flex: 1, background: '#f87171', color: '#111835', border: 'none', padding: '0.8rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>
                  {isSubmitting ? 'Deleting...' : 'Yes, delete'}
                </button>
                <button onClick={() => setShowDeleteModal(false)} type="button" style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'var(--foreground)', border: 'none', padding: '0.8rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CSS for Responsive Design */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: flex !important; }
        }
      `}} />
    </div>
  );
}
