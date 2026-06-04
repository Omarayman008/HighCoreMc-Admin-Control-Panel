'use client';

import { useState } from 'react';
import { Calendar, CheckSquare, FileText } from 'lucide-react';
import EventsTab from './components/EventsTab';
import TasksTab from './components/TasksTab';
import ReportsTab from './components/ReportsTab';

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState<'events' | 'tasks' | 'reports'>('events');

  const tabs = [
    { id: 'events', label: 'Events', icon: <Calendar size={18} /> },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={18} /> },
    { id: 'reports', label: 'Reports', icon: <FileText size={18} /> }
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--foreground)' }}>Discord Staff</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Manage events, tasks, and reports for the Discord moderation team</p>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--glass-bg)', padding: '0.3rem', borderRadius: '14px', border: '1px solid var(--glass-border)', width: 'fit-content' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === tab.id ? '#5865F2' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
        {activeTab === 'events' && <EventsTab />}
        {activeTab === 'tasks' && <TasksTab />}
        {activeTab === 'reports' && <ReportsTab />}
      </div>

    </div>
  );
}
