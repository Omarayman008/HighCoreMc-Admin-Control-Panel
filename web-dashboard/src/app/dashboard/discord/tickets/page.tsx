'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Clock, User, Search, AlertCircle, Calendar, Check, X, Edit2, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import CustomSelect from '@/components/CustomSelect';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  // Review & Assessment
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [reviewForm, setReviewForm] = useState({ emp_id: '', pts: 0, status: 'closed', response_time: 'N/A' });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAdmin, setFilterAdmin] = useState('');

  const DEFAULT_MAP: Record<string, Record<string, string>> = {
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

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ticketsRes, empsRes, settingsRes] = await Promise.all([
        supabase.from('tickets').select('*').order('created_at', { ascending: false }),
        supabase.from('employees').select('id, name'),
        supabase.from('settings').select('value').eq('key', 'app_settings').maybeSingle()
      ]);

      if (settingsRes.data?.value) {
        const parsed = JSON.parse(settingsRes.data.value);
        setSettings(cleanArabicEmoji(parsed));
      }

      if (empsRes.data) {
        setEmployees(empsRes.data);
      }

      if (ticketsRes.data) {
        const empsMap = new Map(empsRes.data?.map(e => [e.id.toString(), e.name]) || []);
        const mapped = ticketsRes.data.map(t => ({
          ...t,
          emp_name: t.emp_id ? empsMap.get(t.emp_id.toString()) || 'Unknown' : 'Unassigned'
        }));
         setTickets(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const auth = localStorage.getItem('adminAuth');
    const isAdminLocal = localStorage.getItem('isAdmin') === 'true';
    if (auth === 'HighCoreadmin_@@' || isAdminLocal) setIsAdmin(true);
    fetchData();
  }, [fetchData]);

  const handleOpenReview = (t: any) => {
    setSelectedTicket(t);
    setReviewForm({
      emp_id: t.emp_id ? t.emp_id.toString() : '',
      pts: t.pts || 0,
      status: t.status || 'closed',
      response_time: t.response_time || 'N/A'
    });
    setShowReviewModal(true);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setIsSubmitting(true);
    try {
      const oldEmpId = selectedTicket.emp_id;
      const oldPts = selectedTicket.pts || 0;
      const newEmpId = reviewForm.emp_id ? parseInt(reviewForm.emp_id) : null;
      const newPts = reviewForm.pts || 0;

      if (oldEmpId && oldPts !== 0) {
        const { data: oldEmp } = await supabase.from('employees').select('points, dc_points').eq('id', oldEmpId).maybeSingle();
        if (oldEmp) {
          const updPts = (oldEmp.points || 0) - oldPts;
          const updDc = (oldEmp.dc_points || 0) - oldPts;
          await supabase.from('employees').update({ points: updPts, dc_points: updDc }).eq('id', oldEmpId);
        }
      }

      if (newEmpId && newPts !== 0) {
        const { data: newEmp } = await supabase.from('employees').select('points, dc_points').eq('id', newEmpId).maybeSingle();
        if (newEmp) {
          const updPts = (newEmp.points || 0) + newPts;
          const updDc = (newEmp.dc_points || 0) + newPts;
          await supabase.from('employees').update({ points: updPts, dc_points: updDc }).eq('id', newEmpId);
        }
      }

      if (oldEmpId !== newEmpId) {
        if (oldEmpId) {
          const { data: oldEmp } = await supabase.from('employees').select('tickets').eq('id', oldEmpId).maybeSingle();
          if (oldEmp) {
            await supabase.from('employees').update({ tickets: Math.max(0, (oldEmp.tickets || 0) - 1) }).eq('id', oldEmpId);
          }
        }
        if (newEmpId) {
          const { data: newEmp } = await supabase.from('employees').select('tickets').eq('id', newEmpId).maybeSingle();
          if (newEmp) {
            await supabase.from('employees').update({ tickets: (newEmp.tickets || 0) + 1 }).eq('id', newEmpId);
          }
        }
      }

      await supabase.from('tickets').update({
        emp_id: newEmpId,
        pts: newPts,
        status: reviewForm.status,
        response_time: reviewForm.response_time
      }).eq('id', selectedTicket.id);

      const adminName = localStorage.getItem('adminUsername') || 'Administrator';
      await supabase.from('activity_log').insert({
        action_type: 'Review Ticket',
        category: 'Tickets',
        details: `Reviewed ticket #${selectedTicket.ticket_id} (Points: ${newPts} PTS)`,
        user_name: adminName
      });

      setShowReviewModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch =
      t.ticket_id?.toLowerCase().includes(search.toLowerCase()) ||
      t.title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !filterStatus || t.status === filterStatus;
    const matchesAdmin = !filterAdmin || t.emp_name === filterAdmin;

    return matchesSearch && matchesStatus && matchesAdmin;
  });

  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem', color: 'var(--foreground)' }}>
        <AlertCircle size={48} color="#ef4444" />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)' }}>You do not have permission to view ticket logs.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Ticket size={32} color={settings?.tickets?.colorHeader || '#5865F2'} />
          {settings?.tickets?.title || 'Ticket Logs'}
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Track and review support tickets handled by staff members</p>
      </div>

      <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
        
        {/* Search & Filters */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by Ticket ID or Type..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--foreground)', outline: 'none' }}
            />
          </div>

          <div style={{ minWidth: '160px' }}>
            <CustomSelect
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'open', label: 'Open' },
                { value: 'closed', label: 'Closed' }
              ]}
              placeholder="All Statuses"
              activeColor="#5865F2"
              activeBg="rgba(88, 101, 242, 0.15)"
            />
          </div>

          <div style={{ minWidth: '180px' }}>
            <CustomSelect
              value={filterAdmin}
              onChange={setFilterAdmin}
              options={[
                { value: '', label: 'All Staff' },
                ...employees.map(e => ({ value: e.name, label: e.name }))
              ]}
              placeholder="All Staff"
              activeColor="#5865F2"
              activeBg="rgba(88, 101, 242, 0.15)"
            />
          </div>
        </div>

        {isLoading ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>Loading tickets...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem' }}>Ticket ID</th>
                  <th style={{ padding: '1rem' }}>Type</th>
                  <th style={{ padding: '1rem' }}>Handled By</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem' }}>Points Awarded</th>
                  <th style={{ padding: '1rem' }}>Response Time</th>
                  <th style={{ padding: '1rem' }}>Created At</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t, idx) => (
                  <tr key={t.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem', fontWeight: 700 }}>
                      <a 
                        href={t.transcript_url || `https://highcoremc-production.up.railway.app/view/transcript/${(t.ticket_id || '').replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#5865F2', textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                      >
                        #{t.ticket_id}
                      </a>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        color: '#818CF8',
                        textTransform: 'uppercase',
                        border: '1px solid rgba(99, 102, 241, 0.2)'
                      }}>
                        {t.title || 'Support Request'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--foreground)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={14} color="var(--text-muted)" />
                        {t.emp_name}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        padding: '0.25rem 0.6rem',
                        borderRadius: '20px',
                        background: t.status === 'open' 
                          ? (settings?.tickets?.colorOpen ? settings.tickets.colorOpen + '15' : 'rgba(250, 204, 21, 0.1)') 
                          : (settings?.tickets?.colorClosed ? settings.tickets.colorClosed + '15' : 'rgba(16, 185, 129, 0.1)'),
                        color: t.status === 'open' 
                          ? (settings?.tickets?.colorOpen || '#F59E0B') 
                          : (settings?.tickets?.colorClosed || '#10B981'),
                        border: `1px solid ${t.status === 'open' 
                          ? (settings?.tickets?.colorOpen ? settings.tickets.colorOpen + '30' : 'rgba(250, 204, 21, 0.2)') 
                          : (settings?.tickets?.colorClosed ? settings.tickets.colorClosed + '30' : 'rgba(16, 185, 129, 0.2)')}`
                      }}>
                        {t.status === 'open' 
                          ? (settings?.tickets?.textOpen || 'OPEN') 
                          : (settings?.tickets?.textClosed || 'CLOSED')}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: t.pts > 0 ? '#10B981' : (t.pts < 0 ? '#EF4444' : 'var(--text-muted)') }}>
                      {t.pts > 0 ? `+${t.pts} PTS` : (t.pts < 0 ? `${t.pts} PTS` : '0 PTS')}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock size={14} />
                        {t.response_time || 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calendar size={14} />
                        {new Date(t.created_at).toLocaleDateString('en-GB')}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <button
                        onClick={() => handleOpenReview(t)}
                        title="Review Ticket"
                        style={{
                          background: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.2)',
                          color: '#38bdf8',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)' }}
                      >
                        <Edit2 size={12} />
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredTickets.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>No tickets logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedTicket && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <form
            onSubmit={handleSaveReview}
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '16px',
              padding: '2rem',
              width: '450px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Star size={22} color="var(--primary)" /> Review & Assess Ticket
            </h3>
            
            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Ticket ID</label>
                <input
                  type="text"
                  className="input-field"
                  value={`#${selectedTicket.ticket_id}`}
                  style={{ background: 'rgba(255,255,255,0.03)', opacity: 0.7 }}
                  disabled
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Status</label>
                <CustomSelect
                  value={reviewForm.status}
                  onChange={val => setReviewForm(prev => ({ ...prev, status: val }))}
                  options={[
                    { value: 'open', label: 'Open' },
                    { value: 'closed', label: 'Closed' }
                  ]}
                  placeholder="Select Status"
                  activeColor="var(--primary)"
                  activeBg="rgba(139, 92, 246, 0.15)"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Handled By Staff *</label>
              <CustomSelect
                value={reviewForm.emp_id}
                onChange={val => setReviewForm(prev => ({ ...prev, emp_id: val }))}
                options={[
                  { value: '', label: 'Unassigned' },
                  ...employees.map(e => ({ value: e.id.toString(), label: e.name }))
                ]}
                placeholder="Select Staff Member"
                activeColor="var(--primary)"
                activeBg="rgba(139, 92, 246, 0.15)"
              />
            </div>

            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Points Awarded</label>
                <input
                  type="number"
                  className="input-field"
                  value={reviewForm.pts}
                  onChange={e => {
                    const val = e.target.value;
                    setReviewForm(prev => ({ ...prev, pts: val === '' ? 0 : parseInt(val) || 0 }));
                  }}
                  style={{ background: 'rgba(0,0,0,0.2)' }}
                  min="0"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Response Time</label>
                <input
                  type="text"
                  className="input-field"
                  value={reviewForm.response_time}
                  onChange={e => setReviewForm(prev => ({ ...prev, response_time: e.target.value }))}
                  style={{ background: 'rgba(0,0,0,0.2)' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                disabled={isSubmitting}
                style={{
                  padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid var(--glass-border)',
                  background: 'transparent', color: 'var(--foreground)', cursor: 'pointer', fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none',
                  background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 700
                }}
              >
                {isSubmitting ? 'Saving...' : 'Save Assessment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
