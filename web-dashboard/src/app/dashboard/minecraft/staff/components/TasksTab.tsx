'use client';

// Header
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Plus, Clock, User, CheckCircle, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import CustomSelect from '@/components/CustomSelect';
import ConfirmModal from '@/components/ConfirmModal';

// Component
export default function TasksTab() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [completedPoints, setCompletedPoints] = useState<number | null>(null);

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [points, setPoints] = useState(10);
  const [daysLimit, setDaysLimit] = useState(7);
  const [isPrivate, setIsPrivate] = useState(false);
  const [assignedTo, setAssignedTo] = useState('');
  const [editingTask, setEditingTask] = useState<any | null>(null);

  const [employees, setEmployees] = useState<any[]>([]);
  const [currentEmpId, setCurrentEmpId] = useState('');

  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, type: 'danger'|'success'|'info', title: string, message: string, onConfirm: () => void}>({
    isOpen: false, type: 'danger', title: '', message: '', onConfirm: () => {}
  });

  useEffect(() => {
    const auth = localStorage.getItem('adminAuth');
    const isAdminLocal = localStorage.getItem('isAdmin') === 'true';
    if (auth === 'HighCoreadmin_@@' || isAdminLocal) setIsAdmin(true);

    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tasksRes, empsRes, compRes] = await Promise.all([
        supabase.from('mc_tasks').select('*, employees(name)').eq('status', 'active').order('created_at', { ascending: false }),
        supabase.from('employees').select('id, name').order('name'),
        supabase.from('mc_completions').select('*')
      ]);

      if (tasksRes.data) setTasks(tasksRes.data);
      if (empsRes.data) {
        setEmployees(empsRes.data);
        if (empsRes.data.length > 0) setCurrentEmpId(empsRes.data[0].id.toString());
      }
      if (compRes.data) setCompletions(compRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !desc.trim() || !points || !daysLimit) {
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

    const taskPayload = {
      title,
      description: desc,
      points,
      days_limit: daysLimit,
      created_by: loggedAdmin,
      is_private: isPrivate,
      assigned_to: isPrivate ? assignedTo : null
    };

    let error;
    if (editingTask) {
      const { error: err } = await supabase.from('mc_tasks').update(taskPayload).eq('id', editingTask.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('mc_tasks').insert(taskPayload);
      error = err;
    }

    if (!error) {
      setShowAddModal(false);
      fetchData();
      resetForm();
    } else {
      setConfirmConfig({
        isOpen: true,
        type: 'danger',
        title: editingTask ? 'Error Updating Task' : 'Error Creating Task',
        message: error.message,
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const resetForm = () => {
    setTitle('');
    setDesc('');
    setPoints(10);
    setDaysLimit(7);
    setIsPrivate(false);
    setAssignedTo('');
    setEditingTask(null);
  };

  const openEditTask = (task: any) => {
    setEditingTask(task);
    setTitle(task.title);
    setDesc(task.description);
    setPoints(task.points);
    setDaysLimit(task.days_limit);
    setIsPrivate(task.is_private || false);
    setAssignedTo(task.assigned_to || '');
    setShowAddModal(true);
  };

  const handleCompleteTask = (task: any) => {
    if (!currentEmpId) return;

    const currentEmp = employees.find(e => e.id.toString() === currentEmpId);
    const loggedAdmin = localStorage.getItem('adminUsername') || 'Guest';

    setConfirmConfig({
      isOpen: true,
      type: 'success',
      title: 'Complete Task',
      message: 'Confirm you have finished this task and claim your points.',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));

        const { error } = await supabase.from('mc_completions').insert({
          task_id: task.id,
          emp_id: parseInt(currentEmpId)
        });

        if (!error) {
          const { data: empData } = await supabase.from('employees').select('points, mc_points').eq('id', currentEmpId).maybeSingle();
          if (empData) {
            const currentTotal = empData.points || 0;
            const currentMc = empData.mc_points || 0;

            await supabase.from('employees').update({
              points: currentTotal + task.points,
              mc_points: currentMc + task.points
            }).eq('id', currentEmpId);

            await supabase.from('activity_log').insert({
              action_type: 'MC Task Completed',
              details: `${currentEmp?.name || 'Unknown'} completed Minecraft task: ${task.title} (+${task.points} PTS)`,
              category: 'Tasks',
              user_name: loggedAdmin
            });

            setCompletedPoints(task.points);
            setTimeout(() => setCompletedPoints(null), 3000);
            fetchData();
          }
        } else {
          setConfirmConfig({
            isOpen: true,
            type: 'danger',
            title: 'Error Completing Task',
            message: error.message,
            onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
          });
        }
      }
    });
  };

  const handleDeleteTask = (taskId: number) => {
    setConfirmConfig({
      isOpen: true,
      type: 'danger',
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task? This cannot be undone.',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        await supabase.from('mc_tasks').delete().eq('id', taskId);
        fetchData();
      }
    });
  };

  const getDaysRemaining = (createdAt: string, daysLimitVal: number) => {
    const created = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    const remaining = daysLimitVal - diffDays;
    return remaining > 0 ? remaining : 0;
  };

  return (
    <div style={{ position: 'relative' }}>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {completedPoints !== null && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '1rem', background: '#1e293b', border: '1px solid rgba(85, 187, 85, 0.3)', borderRadius: '16px', padding: '1.2rem 1.5rem', boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ background: 'rgba(85, 187, 85, 0.1)', color: '#55bb55', padding: '0.6rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={24} />
            </div>
            <div>
              <h4 style={{ color: 'var(--foreground)', fontSize: '1rem', fontWeight: 700, margin: 0, marginBottom: '0.2rem' }}>Task Completed!</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>You earned <span style={{ color: '#55bb55', fontWeight: 800 }}>+{completedPoints}</span> points.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header options */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--foreground)' }}>Available Tasks</h2>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: '250px' }}>
            <CustomSelect 
              value={currentEmpId} 
              onChange={setCurrentEmpId} 
              options={[
                { value: '', label: 'Simulate User As...' },
                ...employees.map(e => ({ value: e.id.toString(), label: e.name }))
              ]} 
              placeholder="Simulate User As..." 
            />
          </div>

          {isAdmin && (
            <button
              onClick={() => { resetForm(); setShowAddModal(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#55bb55', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Plus size={16} /> New Task
            </button>
          )}
        </div>
      </div>

      {/* Tasks Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading tasks...</div>
      ) : (
        <>
          {(() => {
            const privateAssigned = tasks.filter(t => t.is_private && t.assigned_to === currentEmpId && !completions.some(c => c.task_id === t.id && c.emp_id === parseInt(currentEmpId)));
            if (privateAssigned.length > 0) {
              return (
                <div style={{ marginBottom: '1.5rem', background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.3)', padding: '1rem', borderRadius: '12px', color: '#ec4899', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div style={{ background: '#ec4899', width: '8px', height: '8px', borderRadius: '50%', boxShadow: '0 0 10px #ec4899' }}></div>
                  تنبيه: لديك {privateAssigned.length} مهمة خاصة معينة لك بانتظار إنجازها!
                </div>
              );
            }
            return null;
          })()}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {tasks.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>No active tasks available.</div>}
          
          {tasks.filter(t => !t.is_private || isAdmin || t.assigned_to === currentEmpId).map((task) => {
            const hasCompleted = completions.some(c => c.task_id === task.id && c.emp_id === parseInt(currentEmpId));
            const remaining = getDaysRemaining(task.created_at, task.days_limit);
            const isExpired = remaining <= 0;

            return (
              <motion.div 
                key={task.id} 
                initial="initial"
                animate="animate"
                whileHover="hover"
                variants={{ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.2 }}
                style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}
              >
                
                {/* Actions overlay */}
                {isAdmin && (
                  <motion.div 
                    variants={{ initial: { opacity: 0, y: -10 }, animate: { opacity: 0, y: -10 }, hover: { opacity: 1, y: 0 } }}
                    style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem', zIndex: 10 }}
                  >
                    <button onClick={() => openEditTask(task)} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.1)', color: 'var(--foreground)', border: 'none', borderRadius: '8px', cursor: 'pointer', backdropFilter: 'blur(5px)' }}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeleteTask(task.id)} style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', backdropFilter: 'blur(5px)' }}>
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                )}

                {/* Content */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', paddingRight: '4rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckSquare size={18} color={task.is_private ? "#EC4899" : "#55bb55"} /> 
                    {task.title}
                    {task.is_private && <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(236,72,153,0.1)', color: '#ec4899', borderRadius: '10px', border: '1px solid rgba(236,72,153,0.2)' }}>Private</span>}
                  </h3>
                  <div style={{ background: 'rgba(85, 187, 85, 0.1)', color: '#55bb55', padding: '0.3rem 0.8rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.9rem' }}>
                    +{task.points}
                  </div>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1, lineHeight: 1.6 }}>
                  {task.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: isExpired ? '#ef4444' : '#eab308' }}>
                    <Clock size={14} /> {isExpired ? 'Expired' : `${remaining} days left`}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}>
                    <User size={14} /> {task.is_private ? `For: ${employees.find(e => e.id.toString() === task.assigned_to)?.name || 'Unknown'}` : `By: ${task.created_by || 'Admin'}`}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(() => {
                    const isAssignedPerson = task.is_private ? task.assigned_to === currentEmpId : true;
                    const isDisabled = hasCompleted || isExpired || !currentEmpId || !isAssignedPerson;
                    return (
                      <button 
                        onClick={() => handleCompleteTask(task)}
                        disabled={isDisabled}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: isDisabled ? 'rgba(255,255,255,0.05)' : '#55bb55', color: isDisabled ? 'var(--text-muted)' : '#fff', border: 'none', padding: '0.8rem', borderRadius: '10px', fontWeight: 600, cursor: isDisabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                      >
                        <CheckCircle size={18} /> {hasCompleted ? 'Completed' : 'Complete Task'}
                      </button>
                    );
                  })()}
                </div>

              </motion.div>
            );
          })}
          </div>
        </>
      )}

      {/* Add / Edit Task Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ background: 'var(--background)', border: '1px solid var(--glass-border)', borderRadius: '20px', width: '100%', maxWidth: '500px', padding: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '1.5rem' }}>{editingTask ? 'Edit Minecraft Task' : 'Add New Minecraft Task'}</h2>
              
              <form onSubmit={handleCreateTask} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Task Title</label>
                  <input type="text" required value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)' }} placeholder="e.g. Build Spawn Area" />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Detailed Description</label>
                  <textarea required value={desc} onChange={e => setDesc(e.target.value)} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)', minHeight: '100px', resize: 'vertical' }} placeholder="Explain what needs to be done..." />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Points</label>
                    <input type="number" min="1" required value={points} onChange={e => setPoints(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Duration (Days)</label>
                    <input type="number" min="1" required value={daysLimit} onChange={e => setDaysLimit(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Task Type</label>
                    <CustomSelect
                      value={isPrivate ? 'private' : 'public'}
                      onChange={(val) => setIsPrivate(val === 'private')}
                      options={[
                        { value: 'public', label: 'Public (All Staff)' },
                        { value: 'private', label: 'Private (Specific Staff)' }
                      ]}
                      placeholder="Select Type"
                      activeColor="#55bb55"
                      activeBg="rgba(85, 187, 85, 0.15)"
                    />
                  </div>
                  {isPrivate && (
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Assign To</label>
                      <CustomSelect
                        value={assignedTo}
                        onChange={setAssignedTo}
                        options={[
                          { value: '', label: 'Select Staff Member' },
                          ...employees.map(e => ({ value: e.id.toString(), label: e.name }))
                        ]}
                        placeholder="Select Staff"
                        activeColor="#55bb55"
                        activeBg="rgba(85, 187, 85, 0.15)"
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => { setShowAddModal(false); resetForm(); }} style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--foreground)', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: '0.8rem', background: '#55bb55', border: 'none', color: '#fff', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>
                    {editingTask ? 'Save Changes' : 'Publish Task'}
                  </button>
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
