'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Trash2, Tag, Users, User, ArrowUpDown, Shield, Settings, X, Check, Edit2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ConfirmModal from '@/components/ConfirmModal';
import CustomSelect from '@/components/CustomSelect';
import CustomColorPicker from '@/components/CustomColorPicker';

const getCleanLabel = (val: string) => {
  if (!val) return '';
  const lower = val.toLowerCase().trim();
  if (lower.includes('java')) return 'Java';
  if (lower.includes('bedrock')) return 'Bedrock';
  if (lower.includes('education')) return 'Education';
  if (lower.includes('original') || lower.includes('اصليه') || lower.includes('أصــلــية') || lower.includes('أصلية')) return 'Original';
  if (lower.includes('krack') || lower.includes('crack') || lower.includes('كراك')) return 'Krack';
  return val;
};

const getCleanTag = (tag: string) => {
  if (!tag) return '';
  const trimmed = tag.trim();
  if (trimmed === 'مقبول') return 'Approved';
  return trimmed;
};

export default function ForumsPage() {
  const [activeTab, setActiveTab] = useState<'whitelist' | 'teams'>('whitelist');
  const [employees, setEmployees] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Lists
  const [whitelist, setWhitelist] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  // Selected item contexts
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [filterAdmin, setFilterAdmin] = useState('');
  const [filterVersion, setFilterVersion] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Whitelist Form State
  const [wlForm, setWlForm] = useState({
    admin: '',
    discord: '',
    mc: '',
    version: 'Java',
    type: 'Original',
    team: '',
    tag: 'Under Review'
  });

  // Team Form State
  const [teamForm, setTeamForm] = useState({
    admin: '',
    name: '',
    color: '#5865F2',
    leader: '',
    member2: '',
    member3: '',
    member4: '',
    tag: ''
  });

  // Tag Management Form State
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#5865F2');

  // Confirm Modal Config
  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, type: 'danger'|'success'|'info', title: string, message: string, onConfirm: () => void}>({
    isOpen: false, type: 'danger', title: '', message: '', onConfirm: () => {}
  });

  const defaultTags = [
    { name: 'Approved', color: '#10B981' },
    { name: 'Rejected', color: '#EF4444' },
    { name: 'Under Review', color: '#F59E0B' },
    { name: 'VIP', color: '#8B5CF6' }
  ];

  const fetchTags = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('settings').select('value').eq('key', 'whitelist_tags').maybeSingle();
      if (data && data.value) {
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        setTags(parsed);
      } else {
        setTags(defaultTags);
      }
    } catch (err) {
      console.error(err);
      setTags(defaultTags);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [wlRes, teamsRes, empsRes] = await Promise.all([
        supabase.from('whitelist').select('*').order('created_at', { ascending: false }),
        supabase.from('teams').select('*').order('created_at', { ascending: false }),
        supabase.from('employees').select('id, name').order('name')
      ]);

      if (wlRes.data) setWhitelist(wlRes.data);
      if (teamsRes.data) setTeams(teamsRes.data);
      if (empsRes.data) {
        setEmployees(empsRes.data);
        if (empsRes.data.length > 0) {
          setWlForm(prev => ({ ...prev, admin: empsRes.data[0].name }));
          setTeamForm(prev => ({ ...prev, admin: empsRes.data[0].name }));
        }
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

    fetchTags();
    fetchData();
  }, [fetchTags, fetchData]);

  const resetForms = () => {
    setEditingItem(null);
    setWlForm({
      admin: employees[0]?.name || '',
      discord: '',
      mc: '',
      version: 'Java',
      type: 'Original',
      team: '',
      tag: tags[0]?.name || 'Under Review'
    });
    setTeamForm({
      admin: employees[0]?.name || '',
      name: '',
      color: '#5865F2',
      leader: '',
      member2: '',
      member3: '',
      member4: '',
      tag: tags[0]?.name || ''
    });
  };

  const calculateWLPoints = (discord: string) => {
    const hasDiscordId = /\d{17,20}/.test(discord);
    return hasDiscordId ? 5 : 2;
  };

  const calculateTeamPoints = (leader: string, m2: string, m3: string, m4: string) => {
    const hasLeaderId = /\d{17,20}/.test(leader);
    const members = [leader, m2, m3, m4].filter(m => m?.trim());

    if (!hasLeaderId) return -2;
    if (members.length >= 3) return 10;
    if (members.length >= 2) return 7;
    return -2;
  };

  const handleSaveWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const calcPoints = calculateWLPoints(wlForm.discord);
    const loggedAdmin = localStorage.getItem('adminUsername') || 'Guest';

    const payload = {
      admin: wlForm.admin,
      discord: wlForm.discord,
      mc: wlForm.mc,
      version: wlForm.version,
      type: wlForm.type,
      team: wlForm.team,
      tag: wlForm.tag,
      modified_at: new Date().toISOString()
    };

    let error;
    if (editingItem) {
      const { error: err } = await supabase.from('whitelist').update(payload).eq('id', editingItem.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('whitelist').insert({
        ...payload,
        created_at: new Date().toISOString()
      });
      error = err;

      // Update points for admin
      if (!error) {
        const { data: empData } = await supabase.from('employees').select('points, dc_points').eq('name', wlForm.admin).maybeSingle();
        if (empData) {
          const newPts = (empData.points || 0) + calcPoints;
          const newDc = (empData.dc_points || 0) + calcPoints;
          await supabase.from('employees').update({ points: newPts, dc_points: newDc }).eq('name', wlForm.admin);

          await supabase.from('activity_log').insert({
            action_type: 'Whitelist Added',
            details: `Registered player ${wlForm.mc} under admin ${wlForm.admin} (+${calcPoints} PTS)`,
            category: 'Forums',
            user_name: loggedAdmin
          });
        }
        
      }
    }

    setIsSubmitting(false);
    if (!error) {
      setShowAddModal(false);
      fetchData();
      resetForms();
    } else {
      setConfirmConfig({
        isOpen: true,
        type: 'danger',
        title: 'Error',
        message: error.message,
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const calcPoints = calculateTeamPoints(teamForm.leader, teamForm.member2, teamForm.member3, teamForm.member4);
    const loggedAdmin = localStorage.getItem('adminUsername') || 'Guest';

    const payload = {
      admin: teamForm.admin,
      name: teamForm.name,
      color: teamForm.color,
      leader: teamForm.leader,
      member2: teamForm.member2,
      member3: teamForm.member3,
      member4: teamForm.member4,
      tag: teamForm.tag,
      team_name: teamForm.name,
      modified_at: new Date().toISOString()
    };

    let error;
    if (editingItem) {
      const { error: err } = await supabase.from('teams').update(payload).eq('id', editingItem.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('teams').insert({
        ...payload,
        created_at: new Date().toISOString()
      });
      error = err;

      // Update points
      if (!error) {
        const { data: empData } = await supabase.from('employees').select('points, dc_points').eq('name', teamForm.admin).maybeSingle();
        if (empData) {
          const newPts = Math.max(0, (empData.points || 0) + calcPoints);
          const newDc = Math.max(0, (empData.dc_points || 0) + calcPoints);
          await supabase.from('employees').update({ points: newPts, dc_points: newDc }).eq('name', teamForm.admin);

          await supabase.from('activity_log').insert({
            action_type: 'Team Added',
            details: `Registered team ${teamForm.name} under admin ${teamForm.admin} (${calcPoints >= 0 ? '+' : ''}${calcPoints} PTS)`,
            category: 'Forums',
            user_name: loggedAdmin
          });
        }
      }
    }

    setIsSubmitting(false);
    if (!error) {
      setShowAddModal(false);
      fetchData();
      resetForms();
    } else {
      setConfirmConfig({
        isOpen: true,
        type: 'danger',
        title: 'Error',
        message: error.message,
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    if (activeTab === 'whitelist') {
      setWlForm({
        admin: item.admin || '',
        discord: item.discord || '',
        mc: item.mc || '',
        version: getCleanLabel(item.version) || 'Java',
        type: getCleanLabel(item.type) || 'Original',
        team: item.team || '',
        tag: getCleanTag(item.tag) || 'Under Review'
      });
    } else {
      setTeamForm({
        admin: item.admin || '',
        name: item.name || '',
        color: item.color || '#5865F2',
        leader: item.leader || '',
        member2: item.member2 || '',
        member3: item.member3 || '',

        member4: item.member4 || '',
        tag: getCleanTag(item.tag) || ''
      });
    }
    setShowAddModal(true);
  };

  const openDelete = (id: number) => {
    setSelectedId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedId) return;
    setIsSubmitting(true);
    const table = activeTab === 'whitelist' ? 'whitelist' : 'teams';
    const { error } = await supabase.from(table).delete().eq('id', selectedId);
    setIsSubmitting(false);
    if (!error) {
      setShowDeleteModal(false);
      fetchData();
    } else {
      setShowDeleteModal(false);
      setConfirmConfig({
        isOpen: true,
        type: 'danger',
        title: 'Delete Failed',
        message: error.message || 'An error occurred while deleting this entry.',
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    const newTag = { name: newTagName.trim(), color: newTagColor };
    const updatedTags = [...tags, newTag];

    const { error } = await supabase.from('settings').upsert({
      key: 'whitelist_tags',
      value: JSON.stringify(updatedTags),
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' });

    if (!error) {
      setTags(updatedTags);
      setNewTagName('');
    }
  };

  const handleDeleteTag = async (name: string) => {
    const updatedTags = tags.filter(t => t.name !== name);
    const { error } = await supabase.from('settings').upsert({
      key: 'whitelist_tags',
      value: JSON.stringify(updatedTags),
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' });

    if (!error) {
      setTags(updatedTags);
    }
  };

  // Filters logic
  const filteredWhitelist = whitelist.filter(item => {
    const matchesSearch =
      item.mc?.toLowerCase().includes(search.toLowerCase()) ||
      item.discord?.toLowerCase().includes(search.toLowerCase());
    const matchesAdmin = !filterAdmin || item.admin === filterAdmin;
    const matchesVersion = !filterVersion || getCleanLabel(item.version) === filterVersion;
    const matchesType = !filterType || getCleanLabel(item.type) === filterType;
    const matchesTag = !filterTag || getCleanTag(item.tag) === filterTag;
    const matchesTeam = !filterTeam || item.team === filterTeam;

    return matchesSearch && matchesAdmin && matchesVersion && matchesType && matchesTag && matchesTeam;
  }).sort((a, b) => {
    const tA = new Date(a.created_at).getTime();
    const tB = new Date(b.created_at).getTime();


    
    return sortOrder === 'desc' ? tB - tA : tA - tB;
  });

  const filteredTeams = teams.filter(item => {
    const matchesSearch =
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.leader?.toLowerCase().includes(search.toLowerCase());
    const matchesAdmin = !filterAdmin || item.admin === filterAdmin;
    const matchesTag = !filterTag || getCleanTag(item.tag) === filterTag;

    return matchesSearch && matchesAdmin && matchesTag;
  }).sort((a, b) => {
    const tA = new Date(a.created_at).getTime();
    const tB = new Date(b.created_at).getTime();
    return sortOrder === 'desc' ? tB - tA : tA - tB;
  });

  return (
    <div className="main-content" style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--glass-bg)', padding: '0.3rem', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
          <button
            onClick={() => { setActiveTab('whitelist'); setSearch(''); }}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'whitelist' ? '#5865F2' : 'transparent',
              color: activeTab === 'whitelist' ? 'white' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <User size={16} />
            Whitelist
          </button>
          <button
            onClick={() => { setActiveTab('teams'); setSearch(''); }}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'teams' ? '#5865F2' : 'transparent',
              color: activeTab === 'teams' ? 'white' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Users size={16} />
            Teams
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <button
            onClick={() => setShowTagsModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              color: 'var(--foreground)',
              padding: '0.6rem 1.2rem',
              borderRadius: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#5865F2'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
          >
            <Settings size={16} />
            Manage Tags
          </button>
          <button
            onClick={() => { resetForms(); setShowAddModal(true); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#5865F2',
              border: 'none',
              color: 'white',
              padding: '0.6rem 1.4rem',
              borderRadius: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(88, 101, 242, 0.4)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Plus size={18} />
            {activeTab === 'whitelist' ? 'New Whitelist' : 'New Team'}
          </button>
        </div>
      </div>

      {/* Main Panel */}
      <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
        
        {/* Search & Filters */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', flex: '1 1 250px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={activeTab === 'whitelist' ? 'Search by Minecraft / Discord...' : 'Search by Team / Leader...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--foreground)', outline: 'none' }}
            />
          </div>

          <div style={{ minWidth: '180px' }}>
            <CustomSelect
              value={filterAdmin}
              onChange={setFilterAdmin} 
              options={[
                { value: '', label: 'All Admins' },
                ...employees.map(e => ({ value: e.name, label: e.name }))
              ]}
              placeholder="All Admins"
              activeColor="#5865F2"
              activeBg="rgba(88, 101, 242, 0.15)"
            />
          </div>

          {activeTab === 'whitelist' && (
            <>
              <div style={{ minWidth: '160px' }}>
                <CustomSelect
                  value={filterVersion}
                  onChange={setFilterVersion}
                  options={[
                    { value: '', label: 'All Versions' },
                    { value: 'Java', label: 'Java' },
                    { value: 'Bedrock', label: 'Bedrock' },
                    { value: 'Education', label: 'Education' }
                  ]}
                  placeholder="All Versions"
                  activeColor="#5865F2"
                  activeBg="rgba(88, 101, 242, 0.15)"
                />
              </div>

              <div style={{ minWidth: '150px' }}>
                <CustomSelect
                  value={filterType}
                  onChange={setFilterType}
                  options={[
                    { value: '', label: 'All Types' },
                    { value: 'Original', label: 'Original' },
                    { value: 'Krack', label: 'Krack' }
                  ]}
                  placeholder="All Types"
                  activeColor="#5865F2"
                  activeBg="rgba(88, 101, 242, 0.15)"
                />
              </div>
            </>
          )}

          <div style={{ minWidth: '180px' }}>
            <CustomSelect
              value={filterTag}
              onChange={setFilterTag}
              options={[
                { value: '', label: 'All Tags' },
                ...tags.map(t => ({
                  value: t.name,
                  label: (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: t.color || '#888' }} />
                      {t.name}
                    </span>
                  )
                }))
              ]}
              placeholder="All Tags"
              activeColor="#5865F2"
              activeBg="rgba(88, 101, 242, 0.15)"
            />
          </div>

          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.15)', color: 'var(--foreground)', cursor: 'pointer' }}
          >
            <ArrowUpDown size={16} />
            {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
          </button>
        </div>

        {/* Content Table */}
        {isLoading ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>Loading data...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            {activeTab === 'whitelist' ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '1rem' }}>Minecraft Name</th>
                    <th style={{ padding: '1rem' }}>Discord Info</th>
                    <th style={{ padding: '1rem' }}>Admin</th>
                    <th style={{ padding: '1rem' }}>Version / Type</th>
                    <th style={{ padding: '1rem' }}>Team</th>
                    <th style={{ padding: '1rem' }}>Tag</th>
                    {isAdmin && <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredWhitelist.map((item) => {
                    const cleanTag = getCleanTag(item.tag);
                    const tagObj = tags.find(t => t.name === cleanTag) || { color: '#888888' };
                    const teamColor = teams.find(t => t.name.toLowerCase() === item.team?.toLowerCase())?.color || '#5865F2';
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--foreground)' }}>{item.mc}</td>
                        <td style={{ padding: '1rem' }}>
                          {item.discord ? (
                            <span style={{ 
                              fontSize: '0.8rem', 
                              fontWeight: 600, 
                              padding: '0.25rem 0.75rem', 
                              borderRadius: '20px', 
                              background: 'rgba(88, 101, 242, 0.1)', 
                              color: '#a5b4fc', 
                              border: '1px solid rgba(88, 101, 242, 0.25)',
                              display: 'inline-block',
                              whiteSpace: 'nowrap',
                              maxWidth: '220px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }} title={item.discord}>
                              {item.discord}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>None</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--foreground)' }}>{item.admin}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '6px', marginRight: '0.4rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                            {getCleanLabel(item.version)}
                          </span>
                          <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            {getCleanLabel(item.type)}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {item.team && item.team.toLowerCase() !== 'none' ? (
                            <span style={{ 
                              fontSize: '0.8rem', 
                              fontWeight: 700, 
                              padding: '0.25rem 0.75rem', 
                              borderRadius: '20px', 
                              background: `${teamColor}15`, 
                              color: teamColor, 
                              border: `1px solid ${teamColor}30`,
                              display: 'inline-block'
                            }}>
                              {item.team}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>None</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {cleanTag && cleanTag.toLowerCase() !== 'no tag' && cleanTag.toLowerCase() !== 'none' ? (
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '20px', background: `${tagObj.color}15`, color: tagObj.color, border: `1px solid ${tagObj.color}30` }}>
                              {cleanTag}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>None</span>
                          )}
                        </td>
                        {isAdmin && (
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              <button onClick={() => openEdit(item)} style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: 'none', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer' }}>
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => openDelete(item.id)} style={{ background: 'rgba(248, 113, 113, 0.1)', color: '#f87171', border: 'none', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer' }}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {filteredWhitelist.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No whitelist entries found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '1rem' }}>Team Name</th>
                    <th style={{ padding: '1rem' }}>Leader</th>
                    <th style={{ padding: '1rem' }}>Members</th>
                    <th style={{ padding: '1rem' }}>Admin</th>
                    <th style={{ padding: '1rem' }}>Tag</th>
                    {isAdmin && <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.map((item) => {
                    const cleanTag = getCleanTag(item.tag);
                    const tagObj = tags.find(t => t.name === cleanTag) || { color: '#888888' };
                    const membersList = [item.member2, item.member3, item.member4].filter(m => m?.trim());
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '1rem', fontWeight: 700 }}>
                          <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: item.color || '#5865F2', marginRight: '0.5rem' }} />
                          <span style={{ color: 'var(--foreground)' }}>{item.name}</span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {item.leader ? (
                            <span style={{ 
                              fontSize: '0.8rem', 
                              fontWeight: 700, 
                              padding: '0.25rem 0.75rem', 
                              borderRadius: '20px', 
                              background: `${item.color || '#5865F2'}15`, 
                              color: item.color || '#5865F2', 
                              border: `1px solid ${item.color || '#5865F2'}30`,
                              display: 'inline-block'
                            }}>
                              {item.leader}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>None</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {membersList.length > 0 ? (
                              membersList.map((member, idx) => (
                                <span key={idx} style={{ 
                                  fontSize: '0.8rem', 
                                  fontWeight: 700, 
                                  padding: '0.2rem 0.6rem', 
                                  borderRadius: '20px', 
                                  background: `${item.color || '#5865F2'}15`, 
                                  color: item.color || '#5865F2', 
                                  border: `1px solid ${item.color || '#5865F2'}30`,
                                  whiteSpace: 'nowrap'
                                }}>
                                  {member}
                                </span>
                              ))
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>None</span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--foreground)' }}>{item.admin}</td>
                        <td style={{ padding: '1rem' }}>
                          {cleanTag && cleanTag.toLowerCase() !== 'no tag' && cleanTag.toLowerCase() !== 'none' ? (
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '20px', background: `${tagObj.color}15`, color: tagObj.color, border: `1px solid ${tagObj.color}30` }}>
                              {cleanTag}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>None</span>
                          )}
                        </td>
                        {isAdmin && (
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              <button onClick={() => openEdit(item)} style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: 'none', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer' }}>
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => openDelete(item.id)} style={{ background: 'rgba(248, 113, 113, 0.1)', color: '#f87171', border: 'none', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer' }}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {filteredTeams.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No teams found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Whitelist / Team Form Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ background: 'var(--background)', border: '1px solid var(--glass-border)', borderRadius: '20px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
              <button onClick={() => setShowAddModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
              
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '1.5rem' }}>
                {editingItem ? `Edit ${activeTab === 'whitelist' ? 'Whitelist' : 'Team'}` : `Register New ${activeTab === 'whitelist' ? 'Whitelist' : 'Team'}`}
              </h2>

              {activeTab === 'whitelist' ? (
                <form onSubmit={handleSaveWhitelist} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Admin</label>
                    <CustomSelect
                      value={wlForm.admin}
                      onChange={val => setWlForm({ ...wlForm, admin: val })}
                      options={employees.map(e => ({ value: e.name, label: e.name }))}
                      placeholder="Select Admin"
                      activeColor="#5865F2"
                      activeBg="rgba(88, 101, 242, 0.15)"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Discord User Name (With ID)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Omar#1234 | 123456789"
                      value={wlForm.discord}
                      onChange={e => setWlForm({ ...wlForm, discord: e.target.value })}
                      style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#5865F2' }}>
                      Points awarded: {calculateWLPoints(wlForm.discord)} PTS
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Minecraft Username</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. OmarMC"
                      value={wlForm.mc}
                      onChange={e => setWlForm({ ...wlForm, mc: e.target.value })}
                      style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)' }}
                    />
                  </div>

                  <div className="responsive-flex" style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Version</label>
                      <CustomSelect
                        value={wlForm.version}
                        onChange={val => setWlForm({ ...wlForm, version: val })}
                        options={[
                          { value: 'Java', label: 'Java' },
                          { value: 'Bedrock', label: 'Bedrock' },
                          { value: 'Education', label: 'Education' }
                        ]}
                        placeholder="Select Version"
                        activeColor="#5865F2"
                        activeBg="rgba(88, 101, 242, 0.15)"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Type</label>
                      <CustomSelect
                        value={wlForm.type}
                        onChange={val => setWlForm({ ...wlForm, type: val })}
                        options={[
                          { value: 'Original', label: 'Original' },
                          { value: 'Krack', label: 'Krack' }
                        ]}
                        placeholder="Select Type"
                        activeColor="#5865F2"
                        activeBg="rgba(88, 101, 242, 0.15)"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Team Name (Optional)</label>
                    <input
                      type="text"
                      value={wlForm.team}
                      onChange={e => setWlForm({ ...wlForm, team: e.target.value })}
                      style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tag</label>
                    <CustomSelect
                      value={wlForm.tag}
                      onChange={val => setWlForm({ ...wlForm, tag: val })}
                      options={tags.map(t => ({
                        value: t.name,
                        label: (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: t.color || '#888' }} />
                            {t.name}
                          </span>
                        )
                      }))}
                      placeholder="Select Tag"
                      activeColor="#5865F2"
                      activeBg="rgba(88, 101, 242, 0.15)"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--foreground)', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '0.8rem', background: '#5865F2', border: 'none', color: '#fff', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSaveTeam} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Admin</label>
                    <CustomSelect
                      value={teamForm.admin}
                      onChange={val => setTeamForm({ ...teamForm, admin: val })}
                      options={employees.map(e => ({ value: e.name, label: e.name }))}
                      placeholder="Select Admin"
                      activeColor="#5865F2"
                      activeBg="rgba(88, 101, 242, 0.15)"
                    />
                  </div>

                  <div className="responsive-flex" style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 3 }}>
                      <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Team Name</label>
                      <input
                        type="text"
                        required
                        value={teamForm.name}
                        onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
                        style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Color</label>
                      <CustomColorPicker
                        value={teamForm.color}
                        onChange={val => setTeamForm({ ...teamForm, color: val })}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Leader Name (With ID)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. LeaderMC | 123456789"
                      value={teamForm.leader}
                      onChange={e => setTeamForm({ ...teamForm, leader: e.target.value })}
                      style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#5865F2' }}>
                      Points awarded: {calculateTeamPoints(teamForm.leader, teamForm.member2, teamForm.member3, teamForm.member4)} PTS
                    </span>
                  </div>

                  <div className="responsive-flex" style={{ display: 'flex', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Member 2</label>
                      <input
                        type="text"
                        value={teamForm.member2}
                        onChange={e => setTeamForm({ ...teamForm, member2: e.target.value })}
                        style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Member 3</label>
                      <input
                        type="text"
                        value={teamForm.member3}
                        onChange={e => setTeamForm({ ...teamForm, member3: e.target.value })}
                        style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Member 4</label>
                    <input
                      type="text"
                      value={teamForm.member4}
                      onChange={e => setTeamForm({ ...teamForm, member4: e.target.value })}
                      style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tag</label>
                    <CustomSelect
                      value={teamForm.tag}
                      onChange={val => setTeamForm({ ...teamForm, tag: val })}
                      options={[
                        { value: '', label: 'No Tag' },
                        ...tags.map(t => ({
                          value: t.name,
                          label: (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: t.color || '#888' }} />
                              {t.name}
                            </span>
                          )
                        }))
                      ]}
                      placeholder="Select Tag"
                      activeColor="#5865F2"
                      activeBg="rgba(88, 101, 242, 0.15)"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--foreground)', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '0.8rem', background: '#5865F2', border: 'none', color: '#fff', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manage Tags Modal */}
      <AnimatePresence>
        {showTagsModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ background: 'var(--background)', border: '1px solid var(--glass-border)', borderRadius: '20px', width: '100%', maxWidth: '450px', maxHeight: '80vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
              <button onClick={() => setShowTagsModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>

              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Tag size={20} color="#5865F2" />
                Manage Tags
              </h2>

              <form onSubmit={handleAddTag} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  required
                  placeholder="New Tag Name"
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  style={{ flex: 3, padding: '0.7rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)' }}
                />
                <div style={{ flex: 1.5 }}>
                  <CustomColorPicker
                    value={newTagColor}
                    onChange={setNewTagColor}
                  />
                </div>
                <button type="submit" style={{ flex: 1.5, background: '#5865F2', border: 'none', color: 'white', padding: '0.7rem 0.5rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
                  Add
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto' }}>
                {tags.map((tag, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '0.7rem 1rem', borderRadius: '12px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '20px', background: `${tag.color}15`, color: tag.color, border: `1px solid ${tag.color}30` }}>
                      {tag.name}
                    </span>
                    <button onClick={() => handleDeleteTag(tag.name)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title={`Delete ${activeTab === 'whitelist' ? 'Whitelist Entry' : 'Team'}`}
        message="Are you sure you want to delete this entry? This action cannot be undone."
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Global Status/Error Modal */}
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
