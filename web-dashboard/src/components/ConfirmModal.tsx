import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'success' | 'info';
}

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  type = 'danger'
}: ConfirmModalProps) {
  
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm]);
  
  const colors = {
    danger: { bg: 'rgba(239, 68, 68, 0.1)', icon: '#ef4444', btn: '#ef4444' },
    success: { bg: 'rgba(85, 187, 85, 0.1)', icon: '#55bb55', btn: '#55bb55' },
    info: { bg: 'rgba(2, 72, 193, 0.1)', icon: 'var(--primary)', btn: 'var(--primary)' }
  };

  const currentTheme = colors[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} style={{ background: 'var(--background)', border: '1px solid var(--glass-border)', borderRadius: '20px', width: '100%', maxWidth: '400px', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            
            <div style={{ background: currentTheme.bg, color: currentTheme.icon, padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
              {type === 'danger' && <AlertTriangle size={32} />}
              {type === 'success' && <CheckCircle size={32} />}
              {type === 'info' && <Info size={32} />}
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '1rem' }}>{title}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.5 }}>{message}</p>
            
            <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
              {cancelText && (
                <button onClick={onCancel} style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--foreground)', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  {cancelText}
                </button>
              )}
              <button onClick={onConfirm} style={{ flex: 1, padding: '0.8rem', background: currentTheme.btn, border: 'none', color: '#fff', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.filter='brightness(1.1)'} onMouseLeave={e => e.currentTarget.style.filter='brightness(1)'}>
                {confirmText}
              </button>
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
