'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Mic, MessageSquare, Plus, Edit2, Trash2, UploadCloud, Check, X, ShieldAlert, Award, PlayCircle, CheckCircle2, XCircle, Circle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { logAction } from '@/lib/logger';
import CustomSelect from '@/components/CustomSelect';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ConfirmModal from '@/components/ConfirmModal';

export default function EventsTab() {
  const [events, setEvents] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Simulated Logged In User Context
  const [employees, setEmployees] = useState<any[]>([]);
  const [currentEmpId, setCurrentEmpId] = useState('');

  // Event Form State
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('written');
  const [eventDate, setEventDate] = useState('');
  const [maxSupervisors, setMaxSupervisors] = useState(1);
  const [points, setPoints] = useState(15);
  const [isPrivate, setIsPrivate] = useState(false);
  const [assignedStaff, setAssignedStaff] = useState<string[]>(['']);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);

  useEffect(() => {
    setAssignedStaff(prev => {
      const newArr = [...prev];
      while (newArr.length < maxSupervisors) newArr.push('');
      return newArr.slice(0, maxSupervisors);
    });
  }, [maxSupervisors]);

  // Confirm Modal Config
  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, type: 'danger'|'success'|'info', title: string, message: string, onConfirm: () => void}>({
    isOpen: false, type: 'danger', title: '', message: '', onConfirm: () => {}
  });

  // Report Submission State
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [roleDesc, setRoleDesc] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [attendanceRating, setAttendanceRating] = useState('excellent');

  useEffect(() => {
    const auth = localStorage.getItem('adminAuth');
    const isAdminLocal = localStorage.getItem('isAdmin') === 'true';
    if (auth === 'HighCoreadmin_@@' || isAdminLocal) setIsAdmin(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [eventsRes, supervisorsRes, empsRes] = await Promise.all([
        supabase.from('events').select('*').eq('section', 'dc').order('event_date', { ascending: true }),
        supabase.from('event_supervisors').select('*'),
        supabase.from('employees').select('id, name').order('name')
      ]);

      if (eventsRes.data) setEvents(eventsRes.data);
      if (supervisorsRes.data) setSupervisors(supervisorsRes.data);
      if (empsRes.data) {
        setEmployees(empsRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !desc.trim() || !type || !eventDate) {
      setConfirmConfig({
        isOpen: true,
        type: 'danger',
        title: 'Missing Fields',
        message: 'Please fill out all required fields.',
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    const loggedAdmin = localStorage.getItem('adminUsername') || 'Guest';

    const eventPayload = {
      title: isPrivate && !title.startsWith('[Private]') ? `[Private] ${title}` : title,
      description: desc,
      event_type: type,
      event_date: eventDate,
      max_supervisors: maxSupervisors,
      points: points,
      section: 'dc',
      created_by: loggedAdmin
    };

    let error;
    let createdEventId = null;
    
    if (editingEvent) {
      const { error: err } = await supabase.from('events').update(eventPayload).eq('id', editingEvent.id);
      error = err;
      createdEventId = editingEvent.id;
      if (!err) logAction('Update Event', 'Discord Events', `Updated event: ${title}`);
    } else {
      const { data, error: err } = await supabase.from('events').insert(eventPayload).select().single();
      error = err;
      if (data) {
        createdEventId = data.id;
        logAction('Create Event', 'Discord Events', `Created new event: ${title} (${isPrivate ? 'Private' : 'Public'})`);
      }
    }

    if (!error) {
      if (isPrivate && !editingEvent && createdEventId) {
        const supervisorInserts = assignedStaff.filter(id => id).map(empIdStr => {
          const emp = employees.find(e => e.id.toString() === empIdStr);
          return {
            event_id: createdEventId,
            emp_id: parseInt(empIdStr),
            emp_name: emp?.name || 'Unknown',
            claimed_at: new Date().toISOString(),
            attendance: 'voice',
            points_awarded: points,
            review_status: 'pending',
            report_submitted: false
          };
        });
        if (supervisorInserts.length > 0) {
          await supabase.from('event_supervisors').insert(supervisorInserts);
        }
      }

      setShowAddModal(false);
      fetchData();
      resetForm();
    } else {
      setConfirmConfig({
        isOpen: true,
        type: 'danger',
        title: editingEvent ? 'Error Updating Event' : 'Error Creating Event',
        message: error.message,
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const resetForm = () => {
    setTitle('');
    setDesc('');
    setType('written');
    setEventDate('');
    setMaxSupervisors(1);
    setPoints(15);
    setIsPrivate(false);
    setAssignedStaff(['']);
    setEditingEvent(null);
  };

  const openEditEvent = (ev: any) => {
    setEditingEvent(ev);
    setTitle(ev.title);
    setDesc(ev.description);
    setType(ev.event_type);
    setMaxSupervisors(ev.max_supervisors);
    setPoints(ev.points);
    if (ev.event_date) {
      setEventDate(new Date(ev.event_date).toISOString());
    }
    setIsPrivate(ev.title.startsWith('[Private]'));
    setShowAddModal(true);
  };

  const handleDeleteEvent = (id: number) => {
    setConfirmConfig({
      isOpen: true,
      type: 'danger',
      title: 'Delete Event',
      message: 'Are you sure you want to delete this event? All claims will be deleted.',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        await supabase.from('events').delete().eq('id', id);
        logAction('Delete Event', 'Discord Events', `Deleted event ID: ${id}`);
        fetchData();
      }
    });
  };

  const handleReserve = async (ev: any) => {
    if (!currentEmpId) return;

    const eventParts = supervisors.filter(s => s.event_id === ev.id);
    if (eventParts.length >= ev.max_supervisors) {
      setConfirmConfig({
        isOpen: true,
        type: 'danger',
        title: 'Event Full',
        message: 'This event has reached the maximum number of supervisors.',
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    if (eventParts.some(s => s.emp_id === parseInt(currentEmpId))) {
      setConfirmConfig({
        isOpen: true,
        type: 'info',
        title: 'Already Claimed',
        message: 'You have already claimed this event.',
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    if (ev.event_type === 'written') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const userClaims = supervisors.filter(s => s.emp_id === parseInt(currentEmpId));
      const recentWrittenClaims = userClaims.filter(s => {
        const associatedEvent = events.find(e => e.id === s.event_id);
        if (!associatedEvent || associatedEvent.event_type !== 'written') return false;
        if (!s.claimed_at) return false;
        return new Date(s.claimed_at).getTime() >= oneWeekAgo.getTime();
      });

      if (recentWrittenClaims.length >= 1) {
        setConfirmConfig({
          isOpen: true,
          type: 'danger',
          title: 'Limit Exceeded',
          message: 'You can only claim 1 written event per week.',
          onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        });
        return;
      }
    }

    const currentEmp = employees.find(e => e.id.toString() === currentEmpId);

    const { error } = await supabase.from('event_supervisors').insert({
      event_id: ev.id,
      emp_id: parseInt(currentEmpId),
      emp_name: currentEmp?.name || 'Unknown',
      claimed_at: new Date().toISOString(),
      attendance: 'voice',
      points_awarded: ev.points,
      review_status: 'pending',
      report_submitted: false
    });

    if (!error) {
      logAction('Claim Event', 'Discord Events', `User ${currentEmp?.name} claimed event: ${ev.title}`);
      fetchData();
    } else {
      setConfirmConfig({
        isOpen: true,
        type: 'danger',
        title: 'Error Reserving Event',
        message: error.message,
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !currentEmpId) return;

    const { error } = await supabase.from('event_supervisors')
      .update({
        report_submitted: true,
        report_text: roleDesc,
        report_image: evidenceUrl,
        attendance: attendanceRating,
        report_submitted_at: new Date().toISOString()
      })
      .eq('event_id', selectedEventId)
      .eq('emp_id', parseInt(currentEmpId));

    if (!error) {
      setShowReportModal(false);
      setRoleDesc('');
      setEvidenceUrl('');
      setAttendanceRating('excellent');
      fetchData();
    } else {
      setConfirmConfig({
        isOpen: true,
        type: 'danger',
        title: 'Error Submitting Report',
        message: error.message,
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const handleReviewReport = async (supervisorRowId: number, status: 'approved' | 'rejected', pointsToAward: number, empId: number) => {
    if (!isAdmin) return;

    const adminName = localStorage.getItem('adminUsername') || 'Guest';

    const { error } = await supabase.from('event_supervisors')
      .update({
        review_status: status,
        reviewed_by: adminName,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', supervisorRowId);

    if (!error) {
      if (status === 'approved' && pointsToAward > 0) {
        const { data: empData } = await supabase.from('employees').select('points, dc_points').eq('id', empId).maybeSingle();
        if (empData) {
          const currentTotal = empData.points || 0;
          const currentDc = empData.dc_points || 0;
          await supabase.from('employees').update({
            points: currentTotal + pointsToAward,
            dc_points: currentDc + pointsToAward
          }).eq('id', empId);

          const targetSupervisor = supervisors.find(s => s.id === supervisorRowId);
          const targetEvent = events.find(e => e.id === targetSupervisor?.event_id);

          await supabase.from('activity_log').insert({
            action_type: 'Event Supervisor Approved',
            details: `Approved supervisor report for ${targetSupervisor?.emp_name} on event ${targetEvent?.title || 'Unknown'} (+${pointsToAward} PTS)`,
            category: 'Events',
            user_name: adminName
          });
        }
      }
      fetchData();
    } else {
      setConfirmConfig({
        isOpen: true,
        type: 'danger',
        title: 'Error Reviewing Report',
        message: error.message,
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const getStatusLabel = (sRow: any) => {
    if (!sRow.report_submitted) {
      return { bg: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', text: 'Claimed' };
    }
    if (sRow.review_status === 'pending') {
      return { bg: 'rgba(250, 204, 21, 0.1)', color: '#facc15', text: 'Pending Review' };
    }
    if (sRow.review_status === 'approved') {
      return { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', text: 'Approved' };
    }
    return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', text: 'Rejected' };
  };

  return (
    <div>
      
      {/* Top Options */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--foreground)' }}>Discord Events</h2>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: '250px' }}>
            <CustomSelect 
              value={currentEmpId} 
              onChange={setCurrentEmpId} 
              options={[
                { value: '', label: 'All Employees (Select to Filter)' },
                ...employees.map(e => ({ value: e.id.toString(), label: e.name }))
              ]} 
              placeholder="Filter by Employee..." 
            />
          </div>

          {isAdmin && (
            <button
              onClick={() => { resetForm(); setShowAddModal(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#5865F2', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Plus size={16} /> New Event
            </button>
          )}
        </div>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading events...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {events.length === 0 && <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No events found.</div>}
          
          {events.map((ev) => {
            const evSupervisors = supervisors.filter(s => s.event_id === ev.id);
            const mySupervisorRow = evSupervisors.find(s => s.emp_id === parseInt(currentEmpId));
            const isFull = evSupervisors.length >= ev.max_supervisors;
            const isPast = new Date(ev.event_date).getTime() < new Date().getTime();

            return (
              <motion.div 
                key={ev.id} 
                initial="initial"
                animate="animate"
                whileHover="hover"
                variants={{ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.2 }}
                style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}
              >
                
                {/* Actions overlay */}
                {isAdmin && (
                  <motion.div 
                    variants={{ initial: { opacity: 0, y: -10 }, animate: { opacity: 0, y: -10 }, hover: { opacity: 1, y: 0 } }}
                    style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem', zIndex: 10 }}
                  >
                    <button onClick={() => openEditEvent(ev)} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.1)', color: 'var(--foreground)', border: 'none', borderRadius: '8px', cursor: 'pointer', backdropFilter: 'blur(5px)' }}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeleteEvent(ev.id)} style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', backdropFilter: 'blur(5px)' }}>
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                )}

                {/* Event Details */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                    {ev.event_type === 'written' ? <><MessageSquare size={14} /> Written</> : <><Mic size={14} /> Stage</>}
                  </div>

                  {ev.status && (
                    <div style={{ position: 'absolute', top: '1.5rem', left: '7rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: ev.status === 'CANCELLED' ? 'rgba(239, 68, 68, 0.2)' : ev.status === 'STARTED' ? 'rgba(250, 204, 21, 0.2)' : ev.status === 'FINISHED' ? 'rgba(156, 163, 175, 0.2)' : 'rgba(34, 197, 94, 0.2)', color: ev.status === 'CANCELLED' ? '#ef4444' : ev.status === 'STARTED' ? '#facc15' : ev.status === 'FINISHED' ? '#9ca3af' : '#22c55e', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {ev.status === 'OPEN' ? <><Circle size={14} /> OPEN</> : ev.status === 'CLOSED' ? <><XCircle size={14} /> CLOSED</> : ev.status === 'STARTED' ? <><PlayCircle size={14} /> STARTED</> : ev.status === 'FINISHED' ? <><CheckCircle2 size={14} /> FINISHED</> : ev.status === 'CANCELLED' ? <><X size={14} /> CANCELLED</> : ev.status}
                    </div>
                  )}
                  
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '0.5rem', paddingLeft: ev.status ? '13.5rem' : '6.5rem', paddingRight: '6.5rem' }}>{ev.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.5 }}>{ev.description}</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CalendarDays size={14} /> {new Date(ev.event_date).toLocaleString('en-GB')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#5865F2', fontWeight: 700 }}>
                      <Award size={14} /> {ev.points} PTS
                    </div>
                  </div>
                </div>

                {/* Claim details */}
                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>Supervisors ({evSupervisors.length}/{ev.max_supervisors})</span>
                    {!isPast && !mySupervisorRow && (
                      <button 
                        onClick={() => handleReserve(ev)}
                        disabled={isFull || !currentEmpId}
                        style={{ padding: '0.4rem 1rem', background: isFull ? 'rgba(255,255,255,0.05)' : '#5865F2', color: isFull ? 'var(--text-muted)' : '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: (isFull || !currentEmpId) ? 'not-allowed' : 'pointer' }}
                      >
                        {isFull ? 'Full' : 'Claim'}
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1 }}>
                    {evSupervisors.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>No supervisors assigned.</div>}
                    
                    {evSupervisors.map((p) => {
                      const st = getStatusLabel(p);
                      return (
                        <div key={p.id} style={{ display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '10px', borderLeft: `3px solid ${st.color}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{p.emp_name}</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: st.color, background: st.bg, padding: '0.2rem 0.6rem', borderRadius: '12px' }}>{st.text}</span>
                          </div>
                          
                          {/* Report Submission */}
                          {isPast && !p.report_submitted && p.emp_id === parseInt(currentEmpId) && (
                            <button onClick={() => { setSelectedEventId(ev.id); setShowReportModal(true); }} style={{ marginTop: '0.8rem', background: 'rgba(88, 101, 242, 0.1)', color: '#5865F2', border: '1px solid rgba(88, 101, 242, 0.2)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                              <UploadCloud size={16} /> Submit Report
                            </button>
                          )}

                          {/* Admin Review */}
                          {isAdmin && p.report_submitted && p.review_status === 'pending' && (
                            <div style={{ marginTop: '0.8rem', padding: '0.8rem', background: 'var(--background)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
                                <div><strong>Description:</strong> {p.report_text}</div>
                                <div><strong>Rating:</strong> {p.attendance.toUpperCase()}</div>
                                {p.report_image && <div style={{ marginTop: '0.3rem' }}><a href={p.report_image} target="_blank" rel="noreferrer" style={{ color: '#5865F2' }}>View Evidence</a></div>}
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => handleReviewReport(p.id, 'approved', ev.points, p.emp_id)} style={{ flex: 1, background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                                  <Check size={14} /> Approve
                                </button>
                                <button onClick={() => handleReviewReport(p.id, 'rejected', 0, p.emp_id)} style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                                  <X size={14} /> Reject
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>
      )}

      {/* Report Form Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              style={{ background: 'var(--background)', border: '1px solid var(--glass-border)', borderRadius: '20px', width: '100%', maxWidth: '550px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '1.5rem' }}>Submit Supervisor Report</h2>
              <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Role Description</label>
                  <textarea required value={roleDesc} onChange={e => setRoleDesc(e.target.value)} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)', minHeight: '100px' }} placeholder="Detail your tasks and responsibilities during this event..." />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Proof Link (Evidence Image/Video)</label>
                  <input type="url" required value={evidenceUrl} onChange={e => setEvidenceUrl(e.target.value)} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)' }} placeholder="https://..." />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Performance Evaluation</label>
                  <CustomSelect 
                    value={attendanceRating} 
                    onChange={setAttendanceRating}
                    options={[
                      { value: 'excellent', label: 'Excellent' },
                      { value: 'good', label: 'Good' },
                      { value: 'average', label: 'Average' }
                    ]}
                    placeholder="Select Rating"
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setShowReportModal(false)} style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--foreground)', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: '0.8rem', background: '#5865F2', border: 'none', color: '#fff', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>Submit Report</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Event Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '3vh', paddingBottom: '3vh', overflowY: 'auto' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              style={{ background: 'var(--background)', border: '1px solid var(--glass-border)', borderRadius: '16px', width: '100%', maxWidth: '450px', padding: '1.5rem', margin: 'auto' }}
            >
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '1rem' }}>{editingEvent ? 'Edit Discord Event' : 'Create Discord Event'}</h2>
              <form onSubmit={handleCreateEvent} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Event Title</label>
                  <input type="text" required value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--foreground)' }} placeholder="e.g. Community Q&A" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Description</label>
                  <textarea required value={desc} onChange={e => {
                    setDesc(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }} style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--foreground)', minHeight: '100px', resize: 'none', overflow: 'hidden' }} />
                </div>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Event Type</label>
                    <CustomSelect 
                      value={type} 
                      onChange={(val) => {
                        setType(val);
                        if (val === 'written') {
                          setMaxSupervisors(1);
                          setPoints(15);
                        } else {
                          setMaxSupervisors(2);
                          setPoints(55);
                        }
                      }}
                      options={[
                        { value: 'written', label: 'Written (15 pts)' },
                        { value: 'stage', label: 'Stage (55 pts)' }
                      ]}
                      placeholder="Select Type"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Date & Time</label>
                    <DatePicker 
                      selected={eventDate ? new Date(eventDate) : null}
                      onChange={(date: Date | null) => setEventDate(date ? date.toISOString() : '')}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      timeCaption="Time"
                      dateFormat="MMMM d, yyyy h:mm aa"
                      placeholderText="Select Date & Time"
                      customInput={<input style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--foreground)' }} />}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Max Supervisors (Max 5)</label>
                    <input type="number" min="1" max="5" value={maxSupervisors} onChange={e => setMaxSupervisors(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))} style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--foreground)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Points Awarded</label>
                    <input type="number" min="1" value={points} onChange={e => setPoints(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--foreground)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Event Visibility</label>
                    <CustomSelect 
                      value={isPrivate ? 'private' : 'public'}
                      onChange={(val) => setIsPrivate(val === 'private')}
                      options={[
                        { value: 'public', label: 'Public (Anyone can claim)' },
                        { value: 'private', label: 'Private (Assigned to specific staff)' }
                      ]}
                      placeholder="Select Visibility"
                    />
                  </div>
                </div>

                {isPrivate && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', background: 'rgba(236,72,153,0.05)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(236,72,153,0.2)' }}>
                    <label style={{ display: 'block', color: '#ec4899', fontSize: '0.85rem', fontWeight: 600 }}>Assign Supervisors ({maxSupervisors})</label>
                    <div style={{ maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingRight: '0.4rem' }}>
                      {assignedStaff.map((staffId, idx) => (
                        <div key={idx}>
                          <CustomSelect 
                            value={staffId}
                            onChange={(val) => {
                              const newArr = [...assignedStaff];
                              newArr[idx] = val;
                              setAssignedStaff(newArr);
                            }}
                            options={[
                              { value: '', label: `Select Staff ${idx + 1}` },
                              ...employees.map(e => ({ value: e.id.toString(), label: e.name }))
                            ]}
                            placeholder={`Select Staff ${idx + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => { setShowAddModal(false); resetForm(); }} style={{ flex: 1, padding: '0.6rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--foreground)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: '0.6rem', background: '#5865F2', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>{editingEvent ? 'Save Changes' : 'Create Event'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
