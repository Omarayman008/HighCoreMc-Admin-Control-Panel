'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Clock, User, Search, AlertCircle, Calendar, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import CustomSelect from '@/components/CustomSelect';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [settings, setSettings] = useState<any>(null);

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
    if (auth === 'HighCoreadmin_@@') setIsAdmin(true);

    fetchData();
  }, [fetchData]);

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
              placeholder="Search by Ticket ID or Title..."
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
                  <th style={{ padding: '1rem' }}>Title</th>
                  <th style={{ padding: '1rem' }}>Handled By</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem' }}>Points Awarded</th>
                  <th style={{ padding: '1rem' }}>Response Time</th>
                  <th style={{ padding: '1rem' }}>Created At</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t, idx) => (
                  <tr key={t.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem', fontWeight: 700 }}>
                      <a 
                        href={`https://wano-mc.github.io/Promotions-system/transcripts/${t.ticket_id}.html`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#5865F2', textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                      >
                        #{t.ticket_id}
                      </a>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--foreground)' }}>{t.title || 'Support Request'}</td>
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
                    <td style={{ padding: '1rem', fontWeight: 700, color: t.pts > 0 ? '#10B981' : 'var(--text-muted)' }}>
                      {t.pts > 0 ? `+${t.pts} PTS` : '0 PTS'}
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
                  </tr>
                ))}
                {filteredTickets.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>No tickets logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
