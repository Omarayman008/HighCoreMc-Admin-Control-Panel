'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Eye, Check, X, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import CustomSelect from '@/components/CustomSelect';
import ConfirmModal from '@/components/ConfirmModal';

export default function ReportsTab() {
  const [reports, setReports] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Form State
  const [reportType, setReportType] = useState('dc_event_report');
  const [empId, setEmpId] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingReport, setEditingReport] = useState<any | null>(null);

  // Confirm Modal Config
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
      const [reportsRes, empsRes] = await Promise.all([
        supabase.from('mc_reports').select('*').in('report_type', ['dc_event_report', 'dc_other']).order('created_at', { ascending: false }),
        supabase.from('employees').select('id, name').order('name')
      ]);

      if (reportsRes.data) {
        const mapped = reportsRes.data.map((r: any) => ({
          ...r,
          status: !r.reviewed ? 'pending' : r.rejected ? 'rejected' : 'approved'
        }));
        setReports(mapped);
      }
      if (empsRes.data) {
        setEmployees(empsRes.data);
        if (empsRes.data.length > 0) setEmpId(empsRes.data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empId) return;

    let finalEvidenceUrl = evidenceUrl;
    
    if (evidenceFile) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', evidenceFile);
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.url) {
          finalEvidenceUrl = data.url;
        } else {
          setConfirmConfig({
            isOpen: true,
            type: 'danger',
            title: 'Upload Error',
            message: data.error || 'Failed to upload file.',
            onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
          });
          setIsUploading(false);
          return;
        }
      } catch (err: any) {
        setConfirmConfig({
          isOpen: true,
          type: 'danger',
          title: 'Upload Error',
          message: err.message,
          onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        });
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const empData = employees.find(e => e.id.toString() === empId);

    const reportPayload = {
      emp_id: empId.toString(),
      emp_name: empData?.name || 'Unknown',
      report_type: reportType,
      title: title,
      description: desc,
      video_url: finalEvidenceUrl,
      points: 10
    };

    let error;
    if (editingReport) {
      const { error: err } = await supabase.from('mc_reports').update(reportPayload).eq('id', editingReport.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('mc_reports').insert(reportPayload);
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
        title: editingReport ? 'Error Updating Report' : 'Error Submitting Report',
        message: error.message,
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const resetForm = () => {
    setTitle('');
    setDesc('');
    setEvidenceUrl('');
    setEvidenceFile(null);
    setReportType('dc_event_report');
    setEditingReport(null);
  };

  const openEditReport = (r: any) => {
    setEditingReport(r);
    setReportType(r.report_type || 'dc_event_report');
    setEmpId(r.emp_id?.toString() || '');
    setTitle(r.title || '');
    setDesc(r.description || '');
    setEvidenceUrl(r.video_url || '');
    setShowAddModal(true);
  };

  const handleDelete = (id: number) => {
    setConfirmConfig({
      isOpen: true,
      type: 'danger',
      title: 'Delete Report',
      message: 'Are you sure you want to delete this report? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        await supabase.from('mc_reports').delete().eq('id', id);
        fetchData();
      }
    });
  };

  const handleReview = async (id: number, status: 'approved' | 'rejected', pointsToAward: number, targetEmpId: number) => {
    if (!isAdmin) return;

    const adminName = localStorage.getItem('adminUsername') || 'Guest';

    const { error } = await supabase
      .from('mc_reports')
      .update({
        reviewed: true,
        rejected: status === 'rejected',
        reviewed_by: adminName,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      setConfirmConfig({
        isOpen: true,
        type: 'danger',
        title: 'Error Reviewing Report',
        message: error.message,
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    if (status === 'approved' && pointsToAward > 0) {
      const { data: empData } = await supabase.from('employees').select('points, dc_points').eq('id', targetEmpId).maybeSingle();
      if (empData) {
        const currentTotal = empData.points || 0;
        const currentDc = empData.dc_points || 0;
        await supabase.from('employees').update({
          points: currentTotal + pointsToAward,
          dc_points: currentDc + pointsToAward
        }).eq('id', targetEmpId);

        const targetReport = reports.find(r => r.id === id);

        await supabase.from('activity_log').insert({
          action_type: 'Discord Report Approved',
          details: `Approved Discord report: ${targetReport?.title || 'Unknown'} for ${targetReport?.emp_name} (+${pointsToAward} PTS)`,
          category: 'Reports',
          user_name: adminName
        });
      }
    }

    fetchData();
  };

  return (
    <div>
      
      {/* Top Options */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--foreground)' }}>Discord Reports</h2>
        
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#5865F2', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', transition: 'transform 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Plus size={16} /> New Report
        </button>
      </div>

      {/* Reports List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading reports...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reports.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No reports found.</div>}
          
          {reports.map((report) => (
            <motion.div 
              key={report.id} 
              initial="initial"
              animate="animate"
              whileHover="hover"
              variants={{ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.2 }}
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}
            >
              
              {/* Overlay actions */}
              <motion.div 
                variants={{ initial: { opacity: 0, y: -10 }, animate: { opacity: 0, y: -10 }, hover: { opacity: 1, y: 0 } }}
                style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem', zIndex: 10 }}
              >
                <button onClick={() => openEditReport(report)} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.1)', color: 'var(--foreground)', border: 'none', borderRadius: '8px', cursor: 'pointer', backdropFilter: 'blur(5px)' }}>
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(report.id)} style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', backdropFilter: 'blur(5px)' }}>
                  <Trash2 size={16} />
                </button>
              </motion.div>

              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '12px' }}>
                  <FileText size={18} color="#5865F2" />
                </div>
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                      <div style={{ color: 'var(--foreground)', fontWeight: 700, fontSize: '1.1rem' }}>
                        {report.report_type === 'dc_event_report' ? 'Discord Event Report' : 'Other Discord Report'}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {report.emp_name} • {new Date(report.created_at).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', paddingRight: '2.8rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '20px', 
                        background: report.status === 'pending' ? 'rgba(250, 204, 21, 0.1)' : report.status === 'approved' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: report.status === 'pending' ? '#facc15' : report.status === 'approved' ? '#22c55e' : '#ef4444'
                      }}>
                        {report.status.toUpperCase()}
                      </span>

                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#5865F2' }}>
                        +10 PTS
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <div><strong>Title:</strong> {report.title}</div>
                <div style={{ marginTop: '0.5rem' }}><strong>Description:</strong> {report.description}</div>
                {report.video_url && <div style={{ marginTop: '0.5rem' }}><a href={report.video_url} target="_blank" rel="noreferrer" style={{ color: '#5865F2' }}>View Evidence / Link</a></div>}
              </div>

              {/* Card Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                {report.status === 'pending' ? (
                  <>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Waiting for review</div>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleReview(report.id, 'approved', report.points || 10, report.emp_id)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                          <Check size={14} /> Approve
                        </button>
                        <button onClick={() => handleReview(report.id, 'rejected', 0, report.emp_id)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                          <X size={14} /> Reject
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: report.status === 'approved' ? '#22c55e' : '#ef4444' }} />
                    Reviewed by <strong>{report.reviewed_by}</strong> on {report.reviewed_at ? new Date(report.reviewed_at).toLocaleDateString() : 'N/A'}
                  </div>
                )}
              </div>

            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit Report Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ background: 'var(--background)', border: '1px solid var(--glass-border)', borderRadius: '20px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '1.5rem' }}>{editingReport ? 'Edit Discord Report' : 'Submit Discord Report'}</h2>
              
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Report Type</label>
                  <CustomSelect 
                    value={reportType} 
                    onChange={setReportType}
                    options={[
                      { value: 'dc_event_report', label: 'Discord Event Report' },
                      { value: 'dc_other', label: 'Other Discord Report' }
                    ]}
                    placeholder="Select Type"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Employee Name</label>
                  <CustomSelect 
                    value={empId} 
                    onChange={setEmpId}
                    options={employees.map(e => ({ value: e.id.toString(), label: e.name }))}
                    placeholder="Select Employee"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Report Title</label>
                  <input type="text" required value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)' }} placeholder="e.g. Chat Raid Moderate" />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Description</label>
                  <textarea required value={desc} onChange={e => setDesc(e.target.value)} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)', minHeight: '100px', resize: 'vertical' }} placeholder="Provide a detailed description of your report..." />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Evidence File (Image/Video) or URL (Optional)</label>
                  <div style={{ position: 'relative', width: '100%', marginBottom: '0.5rem', cursor: 'pointer' }}>
                    <input type="file" accept="image/*,video/*" onChange={e => { if (e.target.files && e.target.files[0]) setEvidenceFile(e.target.files[0]); else setEvidenceFile(null); }} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 2 }} />
                    <div style={{ width: '100%', padding: '0.8rem', background: 'rgba(88, 101, 242, 0.1)', border: '1px dashed #5865F2', borderRadius: '10px', color: '#5865F2', textAlign: 'center', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>📁</span> {evidenceFile ? evidenceFile.name : 'Click to select an evidence file...'}
                    </div>
                  </div>
                  {!evidenceFile && <input type="url" value={evidenceUrl} onChange={e => setEvidenceUrl(e.target.value)} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--foreground)' }} placeholder="Or paste URL here: https://..." />}
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => { setShowAddModal(false); resetForm(); }} style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--foreground)', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={isUploading} style={{ flex: 1, padding: '0.8rem', background: '#5865F2', border: 'none', color: '#fff', borderRadius: '10px', fontWeight: 600, cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.7 : 1 }}>
                    {isUploading ? 'Uploading...' : editingReport ? 'Save Changes' : 'Submit Report'}
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
