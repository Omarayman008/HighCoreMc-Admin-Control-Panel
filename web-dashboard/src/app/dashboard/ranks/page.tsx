'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Award, Plus, Edit2, Trash2, X, AlertCircle, Shield, CheckCircle2, GripVertical, Image as ImageIcon, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Rank {
  id: number;
  name: string;
  emoji: string;
  min_pts: number;
  max_pts: number | null;
  color: string;
  sort_order: number;
  badge_class: string;
  perks: string;
}

interface Employee {
  id: number;
  points: number;
  rank_override: string | null;
}

// Custom Select Component
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
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
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
                  <div className={opt.value} style={{ padding: '0.2rem 0.5rem' }}>{opt.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function RanksPage() {
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals
  const [showRankModal, setShowRankModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [editingRank, setEditingRank] = useState<Rank | null>(null);
  const [rankForm, setRankForm] = useState({ name: '', emoji: '🏅', min_pts: 0, max_pts: '' as number | string, color: '#60A5FA', badge_class: 'rank-4', perks: '' });
  const [rankToDelete, setRankToDelete] = useState<number | null>(null);

  const badgeClasses = [
    { value: 'rank-1', label: 'Rank 1 (Gold/Purple)' },
    { value: 'rank-2', label: 'Rank 2 (Cyan)' },
    { value: 'rank-3', label: 'Rank 3 (Orange)' },
    { value: 'rank-4', label: 'Rank 4 (Blue)' },
    { value: 'rank-5', label: 'Rank 5 (Purple)' },
    { value: 'rank-admin', label: 'Rank Admin (Glowing Gold)' }
  ];

  const colors = ['#FCD34D', '#A78BFA', '#22D3EE', '#FB923C', '#60A5FA', '#A855F7', '#34D399', '#F87171', '#94A3B8'];

  useEffect(() => {
    const auth = localStorage.getItem('adminAuth');
    const isAdminLocal = localStorage.getItem('isAdmin') === 'true';
    if (auth === 'HighCoreadmin_@@' || isAdminLocal) setIsAdmin(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const { data: rData } = await supabase.from('ranks').select('*').order('sort_order', { ascending: true });
    if (rData) setRanks(rData);

    const { data: eData } = await supabase.from('employees').select('*');
    if (eData) setEmployees(eData);
    
    setIsLoading(false);
  };

  const getEmpCountForRank = (rank: Rank) => {
    return employees.filter(emp => {
      if (emp.rank_override === rank.name) return true;
      if (emp.rank_override) return false;
      const max = rank.max_pts !== null ? rank.max_pts : Infinity;
      return emp.points >= rank.min_pts && emp.points <= max;
    }).length;
  };

  const handleSaveRank = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const maxPts = rankForm.max_pts === '' ? null : Number(rankForm.max_pts);
    
    if (editingRank) {
      await supabase.from('ranks').update({
        name: rankForm.name,
        emoji: rankForm.emoji,
        min_pts: rankForm.min_pts,
        max_pts: maxPts,
        color: rankForm.color,
        badge_class: rankForm.badge_class,
        perks: rankForm.perks
      }).eq('id', editingRank.id);
    } else {
      const newOrder = ranks.length > 0 ? Math.max(...ranks.map(r => r.sort_order || 0)) + 1 : 1;
      await supabase.from('ranks').insert({
        name: rankForm.name,
        emoji: rankForm.emoji,
        min_pts: rankForm.min_pts,
        max_pts: maxPts,
        color: rankForm.color,
        sort_order: newOrder,
        badge_class: rankForm.badge_class,
        perks: rankForm.perks
      });
    }
    
    setShowRankModal(false);
    fetchData();
    setIsSubmitting(false);
  };

  const handleDeleteRank = async () => {
    if (!rankToDelete) return;
    setIsSubmitting(true);
    await supabase.from('ranks').delete().eq('id', rankToDelete);
    setShowDeleteModal(false);
    fetchData();
    setIsSubmitting(false);
  };

  const handleReorder = async (newOrder: Rank[]) => {
    setRanks(newOrder);
    // Update all sort_orders in DB
    const updates = newOrder.map((r, idx) => ({
      id: r.id,
      sort_order: idx + 1
    }));
    
    // Supabase doesn't support bulk update easily without rpc, so we loop
    for (const update of updates) {
      await supabase.from('ranks').update({ sort_order: update.sort_order }).eq('id', update.id);
    }
  };



  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRankForm({ ...rankForm, emoji: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '2rem' }}>
          <Award color="var(--primary)" size={32} /> Ranks System
        </h1>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(17,24,53,0.8)', backdropFilter: 'blur(8px)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '24px' }}>
          <div style={{ textAlign: 'center', background: 'var(--glass-bg)', padding: '3rem', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
            <Shield size={64} color="#facc15" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ color: 'var(--foreground)', fontSize: '1.5rem', fontWeight: 800 }}>Restricted Access</h2>
            <p style={{ color: 'var(--text-muted)' }}>This section is for the Ranks Manager only.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Award color="var(--primary)" size={32} /> Ranks System
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Drag to reorder, edit perks, and manage progression limits.</p>
        </div>
        <button 
          onClick={() => { setEditingRank(null); setRankForm({ name: '', emoji: '🏅', min_pts: 0, max_pts: '', color: '#60A5FA', badge_class: 'rank-4', perks: '' }); setShowRankModal(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary)', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 0 20px rgba(2, 72, 193, 0.4)' }}
        >
          <Plus size={20} /> New Rank
        </button>
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--foreground)', textAlign: 'center', padding: '4rem' }}>Loading ranks...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Reorder.Group axis="y" values={ranks} onReorder={handleReorder} style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }} layoutScroll>
            {ranks.map((rank) => (
              <Reorder.Item 
                key={rank.id} 
                value={rank}
                layoutId={`rank-${rank.id}`}
                style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', cursor: 'grab' }}
                whileDrag={{ scale: 1.02, zIndex: 50, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(99,102,241,0.4)' }}
              >
                <div style={{ color: 'var(--text-muted)', cursor: 'grab' }} title="Drag to reorder"><GripVertical size={24} /></div>
                
                <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${rank.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0, overflow: 'hidden' }}>
                  {rank.emoji.startsWith('data:image') || rank.emoji.startsWith('http') ? (
                    <img src={rank.emoji} alt="rank icon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : rank.emoji}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <div className={`rank-badge ${rank.badge_class}`}>{rank.name}</div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Range: <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{rank.min_pts}</span> – <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{rank.max_pts === null || rank.max_pts > 900000 ? '∞' : rank.max_pts}</span> PTS
                    </div>
                    <div style={{ background: 'rgba(2, 72, 193, 0.1)', padding: '0.3rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', color: '#60a5fa' }}>
                      <Users size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      <span style={{ fontWeight: 700 }}>{getEmpCountForRank(rank)}</span> Staff
                    </div>
                  </div>
                  {rank.perks && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <CheckCircle2 size={16} color="#34d399" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span>{rank.perks}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={(e) => { e.stopPropagation(); setEditingRank(rank); setRankForm({ name: rank.name, emoji: rank.emoji, min_pts: rank.min_pts, max_pts: rank.max_pts === null ? '' : rank.max_pts, color: rank.color, badge_class: rank.badge_class || 'rank-4', perks: rank.perks || '' }); setShowRankModal(true); }} style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', color: '#38bdf8', width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}><Edit2 size={18} style={{ margin: 'auto' }} /></button>
                  <button onClick={(e) => { e.stopPropagation(); setRankToDelete(rank.id); setShowDeleteModal(true); }} disabled={ranks.length <= 1} style={{ background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.2)', color: '#f87171', width: '40px', height: '40px', borderRadius: '12px', cursor: ranks.length <= 1 ? 'not-allowed' : 'pointer', opacity: ranks.length <= 1 ? 0.5 : 1, transition: 'all 0.2s' }}><Trash2 size={18} style={{ margin: 'auto' }} /></button>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      )}

      {/* --- MODALS --- */}
      
      {/* 1. Add/Edit Rank Modal */}
      <AnimatePresence>
        {showRankModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '2rem', borderRadius: '24px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
              <button onClick={() => setShowRankModal(false)} type="button" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
              <h2 style={{ color: 'var(--foreground)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award color="var(--primary)" /> {editingRank ? 'Edit Rank' : 'Create New Rank'}
              </h2>
              
              <form onSubmit={handleSaveRank} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: 'var(--foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>Rank Name</label>
                    <input type="text" required value={rankForm.name} onChange={e => setRankForm({...rankForm, name: e.target.value})} placeholder="e.g. Staff Manager" style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>Icon</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input type="text" value={rankForm.emoji.startsWith('data:') ? 'Image' : rankForm.emoji} onChange={e => setRankForm({...rankForm, emoji: e.target.value})} style={{ width: '80px', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)', textAlign: 'center' }} />
                      <label style={{ background: 'rgba(255,255,255,0.1)', padding: '0.8rem', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Upload Image">
                        <ImageIcon size={20} color="var(--text-muted)" />
                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                      </label>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: 'var(--foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>Minimum Points</label>
                    <input type="number" required value={rankForm.min_pts} onChange={e => setRankForm({...rankForm, min_pts: Number(e.target.value)})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: 'var(--foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>Maximum Points</label>
                    <input type="number" value={rankForm.max_pts} onChange={e => setRankForm({...rankForm, max_pts: e.target.value})} placeholder="Leave blank for infinite (∞)" style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: 'var(--foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>Badge Design</label>
                    <CustomSelect 
                      value={rankForm.badge_class}
                      onChange={(val: string) => setRankForm({...rankForm, badge_class: val})}
                      options={badgeClasses}
                      placeholder="Select badge style"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>Theme Color</label>
                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', height: '45px', flexWrap: 'wrap' }}>
                      {colors.map(c => (
                        <div key={c} onClick={() => setRankForm({...rankForm, color: c})} style={{ width: '25px', height: '25px', borderRadius: '50%', background: c, cursor: 'pointer', border: rankForm.color === c ? '2px solid white' : '2px solid transparent', transform: rankForm.color === c ? 'scale(1.1)' : 'scale(1)' }} />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', color: 'var(--foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>Perks & Benefits</label>
                  <textarea value={rankForm.perks} onChange={e => setRankForm({...rankForm, perks: e.target.value})} placeholder="e.g. ✓ Has permission to manage tickets" rows={3} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)', resize: 'vertical' }} />
                </div>

                <button disabled={isSubmitting} type="submit" style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '1rem', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', marginTop: '1rem' }}>
                  {isSubmitting ? 'Saving...' : 'Save Rank'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '2rem', borderRadius: '24px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
              <AlertCircle size={48} color="#f87171" style={{ margin: '0 auto 1rem' }} />
              <h2 style={{ color: 'var(--foreground)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Confirm Deletion</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Are you sure you want to permanently delete <span style={{ color: '#f87171', fontWeight: 700 }}>{ranks.find(r=>r.id===rankToDelete)?.name}</span>? Staff in this rank will be reassigned.</p>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button disabled={isSubmitting} onClick={handleDeleteRank} style={{ flex: 1, background: '#f87171', color: '#111835', border: 'none', padding: '0.8rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>
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
    </div>
  );
}
