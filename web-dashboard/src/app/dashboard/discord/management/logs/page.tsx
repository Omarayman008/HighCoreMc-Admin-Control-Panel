'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  RefreshCw,
  Download,
  Trash2,
  Search,
  ShieldAlert,
  Clock,
  User,
  SlidersHorizontal
} from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import CustomSelect from '@/components/CustomSelect';
import { supabase } from '@/lib/supabase';

interface ActivityLog {
  id: number;
  action_type: string;
  category: string;
  details: string;
  user_name: string;
  created_at: string;
}

// Translate Arabic Logs
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

// Main Page
export default function LogsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAction, setSelectedAction] = useState('All');

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'danger' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  // Initial Load
  useEffect(() => {
    const auth = localStorage.getItem('adminAuth');
    if (auth === 'HighCoreadmin_@@') setIsAdmin(true);
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Timestamp Formatter
  const formatTimestamp = (dateStr: string) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // Export CSV
  const handleExport = () => {
    const headers = ['Timestamp', 'Operator', 'Action', 'Category', 'Details'];
    const csvRows = [headers.join(',')];

    filteredLogs.forEach(log => {
      const values = [
        formatTimestamp(log.created_at),
        log.user_name || 'System',
        log.action_type || '',
        log.category || '',
        log.details || ''
      ];
      const escaped = values.map(val => {
        const formatted = String(val).replace(/"/g, '""');
        return `"${formatted}"`;
      });
      csvRows.push(escaped.join(','));
    });

    const csvString = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `activity_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Purge Old Logs
  const handlePurgeLogs = async () => {
    setIsSubmitting(true);
    try {
      let autoClearDays = 30;
      const { data: settingsData } = await supabase.from('settings').select('value').eq('key', 'app_settings').maybeSingle();
      if (settingsData && settingsData.value) {
        const parsed = JSON.parse(settingsData.value);
        if (parsed.logs && parsed.logs.autoClearDays) {
          autoClearDays = parsed.logs.autoClearDays;
        }
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - autoClearDays);

      const { error } = await supabase
        .from('activity_log')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;

      await supabase.from('activity_log').insert({
        action_type: 'Purge Logs',
        category: 'Maintenance',
        details: `Deleted activity logs older than ${autoClearDays} days.`,
        user_name: localStorage.getItem('adminUsername') || 'Administrator'
      });

      setAlertModal({
        isOpen: true,
        title: 'Success',
        message: `Purged log history older than ${autoClearDays} days.`,
        type: 'success'
      });
      fetchLogs();
    } catch (err: any) {
      console.error(err);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Error purging logs: ' + err.message,
        type: 'danger'
      });
    } finally {
      setIsSubmitting(false);
      setShowDeleteModal(false);
    }
  };

  // Filter Categories & Actions
  const rawCategories = Array.from(new Set(logs.map(l => l.category).filter(Boolean)));
  const rawActions = Array.from(new Set(logs.map(l => l.action_type).filter(Boolean)));

  const categoryOptions = [{ value: 'All', label: 'All Categories' }];
  const seenCategories = new Set<string>();
  rawCategories.forEach(c => {
    const label = translateArabicLog(c);
    if (!seenCategories.has(label)) {
      seenCategories.add(label);
      categoryOptions.push({ value: c, label });
    }
  });

  const actionOptions = [{ value: 'All', label: 'All Action Types' }];
  const seenActions = new Set<string>();
  rawActions.forEach(a => {
    const label = translateArabicLog(a);
    if (!seenActions.has(label)) {
      seenActions.add(label);
      actionOptions.push({ value: a, label });
    }
  });

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      (log.user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.action_type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'All' ||
      translateArabicLog(log.category) === translateArabicLog(selectedCategory);
    const matchesAction = selectedAction === 'All' ||
      translateArabicLog(log.action_type) === translateArabicLog(selectedAction);

    return matchesSearch && matchesCategory && matchesAction;
  });

  // Auth Guard
  if (!isAdmin && !isLoading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--foreground)' }}>
        <ShieldAlert size={48} color="#EF4444" style={{ margin: '0 auto 1.5rem' }} />
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)' }}>You do not have the required permissions to view this page.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Activity color="var(--primary)" size={32} /> Activity Logs
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Audit trail documenting database adjustments, security actions, and system updates.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--glass-border)', color: 'var(--foreground)', padding: '0.6rem 1.2rem',
              borderRadius: '10px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            onClick={handleExport}
            disabled={filteredLogs.length === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--glass-border)', color: 'var(--foreground)', padding: '0.6rem 1.2rem',
              borderRadius: '10px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
          >
            <Download size={18} />
            Export
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239,68,68,0.1)',
              border: '1px solid #ef4444', color: '#ef4444', padding: '0.6rem 1.2rem',
              borderRadius: '10px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
          >
            <Trash2 size={18} />
            Purge History
          </button>
        </div>
      </div>

      {/* Filters Container */}
      <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '1.2rem 1.5rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--foreground)', fontWeight: 700, fontSize: '0.95rem' }}>
          <SlidersHorizontal size={16} /> Filters
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search operator name, details, action..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '2.8rem', background: 'rgba(0,0,0,0.2)' }}
            />
          </div>

          <div>
            <CustomSelect
              value={selectedCategory}
              onChange={val => setSelectedCategory(val)}
              placeholder="All Categories"
              options={categoryOptions}
            />
          </div>

          <div>
            <CustomSelect
              value={selectedAction}
              onChange={val => setSelectedAction(val)}
              placeholder="All Action Types"
              options={actionOptions}
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: '16px', background: 'var(--glass-bg)' }}>
          {isLoading ? (
            <div style={{ color: 'var(--foreground)', textAlign: 'center', padding: '4rem' }}>Loading logs data...</div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem' }}>No log history matching active filter query.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--glass-border)', position: 'sticky', top: 0, zIndex: 10 }}>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}><Clock size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />Time</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}><User size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />User</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Action</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--foreground)', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                      {formatTimestamp(log.created_at)}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#ffb93d', fontWeight: 600 }}>
                      {log.user_name || 'System'}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600 }}>
                      {translateArabicLog(log.action_type)}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {translateArabicLog(log.category || 'General')}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--foreground)', lineHeight: 1.4 }}>
                      {translateArabicLog(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Purge Activity Logs"
        message="Are you sure you want to clear system logs older than the threshold setting? This maintenance task cannot be undone."
        onConfirm={handlePurgeLogs}
        onCancel={() => setShowDeleteModal(false)}
        confirmText="Clear History"
        cancelText="Cancel"
        type="danger"
      />

      <ConfirmModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        onConfirm={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        onCancel={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        confirmText="OK"
        cancelText=""
        type={alertModal.type}
      />

    </div>
  );
}

