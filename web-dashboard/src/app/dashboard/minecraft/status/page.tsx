'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Users, Zap, Wifi, RefreshCw, Server, AlertCircle, Pickaxe } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function MinecraftStatusPage() {
  const [statusData, setStatusData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/mc-status');
      if (res.ok) {
        const liveData = await res.json();
        setStatusData(liveData);
      } else {
        // Mock data if failed
        setStatusData({
          serverStatus: 'Offline',
          playersOnline: '0',
          maxPlayers: '100',
          peakPlayers: '0',
          serverPing: '--',
          serverName: "HighCore Mc",
          serverIP: "95.156.225.24:26641",
          version: "1.20.4",
          totalLogins: '0',
          uptime: "--",
          health: "100%",
          tps: 20.0,
          memory_used: "2.1GB",
          memory_total: "8GB"
        });
      }
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Failed to fetch MC status:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Auto-refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (!statusData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
        <RefreshCw className="animate-spin" size={32} />
      </div>
    );
  }

  const isOnline = statusData.serverStatus === 'Online' || statusData.serverStatus === 'Open';

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Pickaxe size={32} /> Minecraft Server
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Real-time server status and analytics.</p>
        </div>
        <button 
          onClick={fetchStatus}
          disabled={isLoading}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', 
            color: 'var(--text-muted)', padding: '0.6rem 1rem', borderRadius: '10px', 
            cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
            opacity: isLoading ? 0.7 : 1
          }}
          onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.color = '#55bb55'; e.currentTarget.style.borderColor = '#55bb55'; } }}
          onMouseLeave={e => { if (!isLoading) { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; } }}
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Status Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ background: isOnline ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '0.8rem', borderRadius: '12px' }}>
              <Server size={24} color={isOnline ? "#22c55e" : "#ef4444"} />
            </div>
          </div>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Server Status</h3>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: isOnline ? '#22c55e' : '#ef4444' }}>
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </motion.div>

        {/* Players Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '0.8rem', borderRadius: '12px' }}>
              <Users size={24} color="#38bdf8" />
            </div>
          </div>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Players Online</h3>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--foreground)' }}>
            {statusData.playersOnline} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {statusData.maxPlayers}</span>
          </div>
        </motion.div>

        {/* Peak Players Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '0.8rem', borderRadius: '12px' }}>
              <Activity size={24} color="#a855f7" />
            </div>
          </div>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Peak Players</h3>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--foreground)' }}>
            {statusData.peakPlayers}
          </div>
        </motion.div>

        {/* Ping Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(250, 204, 21, 0.1)', padding: '0.8rem', borderRadius: '12px' }}>
              <Wifi size={24} color="#facc15" />
            </div>
          </div>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Server Ping</h3>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--foreground)' }}>
            {statusData.serverPing}
          </div>
        </motion.div>
      </div>

      {/* Details Grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Server size={20} color="#55bb55" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--foreground)' }}>Server Details</h2>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1px', background: 'var(--glass-border)' }}>
          {/* Items */}
          {[
            { label: 'Server Name', value: statusData.serverName },
            { label: 'Server IP', value: statusData.serverIP },
            { label: 'Version', value: statusData.version || '1.20.x' },
            { label: 'Total Logins', value: statusData.totalLogins?.toLocaleString() },
            { label: 'Uptime', value: statusData.uptime },
            { label: 'Health', value: statusData.health },
            { label: 'TPS', value: statusData.tps?.toFixed(1) || '20.0' },
            { label: 'Memory Usage', value: statusData.memory_used && statusData.memory_total ? `${statusData.memory_used} / ${statusData.memory_total}` : 'Optimized' }
          ].map((detail, i) => (
            <div key={i} style={{ flex: '1 1 300px', background: 'var(--glass-bg)', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{detail.label}</span>
              <span style={{ color: 'var(--foreground)', fontWeight: 700 }}>{detail.value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Footer Update Time */}
      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <RefreshCw size={14} />
        Last Updated: {lastUpdate ? lastUpdate.toLocaleString('en-GB') : 'N/A'}
      </div>

    </div>
  );
}
