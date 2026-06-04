'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CheckSquare, CalendarDays } from 'lucide-react';
import ReportsTab from './components/ReportsTab';
import TasksTab from './components/TasksTab';
import EventsTab from './components/EventsTab';

export default function McStaffPage() {
  const [activeTab, setActiveTab] = useState<'reports' | 'tasks' | 'events'>('reports');

  const tabs = [
    { id: 'reports', label: 'Reports', icon: <FileText size={18} /> },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={18} /> },
    { id: 'events', label: 'Events', icon: <CalendarDays size={18} /> }
  ];

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          MC Staff
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage reports, tasks, and events for Minecraft staff.</p>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.8rem 1.5rem',
              borderRadius: '12px',
              background: activeTab === tab.id ? 'rgba(85, 187, 85, 0.15)' : 'var(--glass-bg)',
              border: `1px solid ${activeTab === tab.id ? '#55bb55' : 'var(--glass-border)'}`,
              color: activeTab === tab.id ? '#55bb55' : 'var(--text-muted)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.background = 'var(--glass-bg)' }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: '500px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'reports' && <ReportsTab />}
            {activeTab === 'tasks' && <TasksTab />}
            {activeTab === 'events' && <EventsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
