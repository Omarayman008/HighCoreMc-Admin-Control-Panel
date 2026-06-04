import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Option {
  value: string;
  label: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  activeColor?: string;
  activeBg?: string;
}

export default function CustomSelect({ 
  value, 
  onChange, 
  options, 
  placeholder = 'Select...', 
  disabled = false,
  activeColor = '#55bb55',
  activeBg = 'rgba(85, 187, 85, 0.15)'
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [containerRef]);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '0.8rem 1rem',
          background: 'rgba(0,0,0,0.3)',
          border: isOpen ? `1px solid ${activeColor}` : '1px solid var(--glass-border)',
          borderRadius: '10px',
          color: 'var(--foreground)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: isOpen ? `0 0 0 2px ${activeColor}33` : 'none'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: 'calc(100% - 24px)' }}>
          {selectedOption ? selectedOption.label : <span style={{ color: 'var(--text-muted)' }}>{placeholder}</span>}
        </span>
        <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 5px)',
              left: 0,
              width: '100%',
              background: 'var(--background)',
              border: '1px solid var(--glass-border)',
              borderRadius: '10px',
              zIndex: 50,
              maxHeight: '250px',
              overflowY: 'auto',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
            }}
          >
            {options.map((opt) => (
              <div 
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  padding: '0.8rem 1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: value === opt.value ? activeBg : 'transparent',
                  color: value === opt.value ? activeColor : 'var(--foreground)',
                  transition: 'background 0.2s',
                  borderBottom: '1px solid rgba(255,255,255,0.02)'
                }}
                onMouseEnter={e => {
                  if (value !== opt.value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={e => {
                  if (value !== opt.value) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', width: '100%' }}>
                  {opt.label}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
