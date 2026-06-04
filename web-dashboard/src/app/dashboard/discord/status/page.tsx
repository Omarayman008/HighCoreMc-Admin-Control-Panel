'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Ticket, CheckCircle, RefreshCw, Layers, Hash, ShieldAlert, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function DiscordStatus() {
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStatus = useCallback(async (showIndicator = true) => {
    if (showIndicator) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'dc_status')
        .maybeSingle();

      if (error) throw error;

      if (data && data.value) {
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        setStatus(parsed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    const interval = setInterval(() => {
      fetchStatus(false);
    }, 16000);

    return () => clearInterval(interval);
  }, [fetchStatus]);

  const stats = [
    {
      title: 'Members Online',
      value: status?.onlineMembers || 0,
      icon: <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block', boxShadow: '0 0 10px #10B981' }} />,
      color: '#10B981'
    },
    {
      title: 'Total Members',
      value: status?.totalMembers || 0,
      icon: <Users size={24} color="#5865F2" />,
      color: '#5865F2'
    },
    {
      title: 'Open Tickets',
      value: status?.openTickets || 0,
      icon: <Ticket size={24} color="#F59E0B" />,
      color: '#F59E0B'
    },
    {
      title: 'Closed Tickets',
      value: status?.closedTickets || 0,
      icon: <CheckCircle size={24} color="#10B981" />,
      color: '#10B981'
    }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--foreground)' }}>Discord Status</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Real-time statistics for HighCore Mc Discord server</p>
        </div>
        <button
          onClick={() => fetchStatus(true)}
          disabled={isLoading || isRefreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            color: 'var(--foreground)',
            padding: '0.6rem 1.2rem',
            borderRadius: '10px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#5865F2'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
        >
          <RefreshCw size={16} className={(isLoading || isRefreshing) ? 'spin-animation' : ''} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading server status...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05, y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.25)', borderColor: stat.color }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
                style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '20px',
                  padding: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>{stat.title}</span>
                  <h3 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--foreground)' }}>{stat.value}</h3>
                </div>
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {stat.icon}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '24px',
              padding: '2rem',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
            }}
          >
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--foreground)' }}>
              Server Statistics
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <motion.div whileHover={{ scale: 1.02, y: -3, borderColor: '#5865F2' }} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--glass-border)', transition: 'all 0.2s' }}>
                <div style={{ padding: '0.6rem', background: 'rgba(88, 101, 242, 0.1)', borderRadius: '10px' }}>
                  <Users size={20} color="#5865F2" />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Server Name</div>
                  <div style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: '1rem', marginTop: '0.2rem' }}>HighCore Mc</div>
                </div>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02, y: -3, borderColor: '#ec4899' }} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--glass-border)', transition: 'all 0.2s' }}>
                <div style={{ padding: '0.6rem', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '10px' }}>
                  <ShieldAlert size={20} color="#ec4899" />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Boost Level</div>
                  <div style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: '1rem', marginTop: '0.2rem' }}>Level {status?.boostLevel || 0} ({status?.boostCount || 0} Boosts)</div>
                </div>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02, y: -3, borderColor: '#3b82f6' }} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--glass-border)', transition: 'all 0.2s' }}>
                <div style={{ padding: '0.6rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px' }}>
                  <Hash size={20} color="#3b82f6" />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Channels</div>
                  <div style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: '1rem', marginTop: '0.2rem' }}>{status?.totalChannels || 0}</div>
                </div>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02, y: -3, borderColor: '#a855f7' }} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--glass-border)', transition: 'all 0.2s' }}>
                <div style={{ padding: '0.6rem', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '10px' }}>
                  <Layers size={20} color="#a855f7" />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Roles</div>
                  <div style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: '1rem', marginTop: '0.2rem' }}>{status?.totalRoles || 0}</div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {status?.lastUpdated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', paddingLeft: '0.5rem' }}>
              <Clock size={14} />
              <span>Last updated: {new Date(status.lastUpdated).toLocaleString('en-GB')}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
