import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  align?: 'left' | 'right';
}

const PRESET_COLORS = [
  '#5865F2',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#0EA5E9',
  '#6366F1',
  '#06B6D4',
  '#F97316',
  '#14B8A6',
  '#64748B'
];

export default function CustomColorPicker({ value, onChange, align = 'right' }: CustomColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hexInput, setHexInput] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHexInput(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHexChange = (val: string) => {
    setHexInput(val);
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      onChange(val);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem',
          padding: '0.6rem 0.8rem',
          background: 'rgba(0,0,0,0.3)',
          border: isOpen ? '1px solid #5865F2' : '1px solid var(--glass-border)',
          borderRadius: '10px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          height: '43px'
        }}
      >
        <span style={{ 
          display: 'inline-block', 
          width: '20px', 
          height: '20px', 
          borderRadius: '5px', 
          background: value, 
          border: '1px solid rgba(255,255,255,0.2)',
          flexShrink: 0
        }} />
        <span style={{ fontSize: '0.9rem', color: 'var(--foreground)', fontFamily: 'monospace', fontWeight: 600 }}>
          {value.toUpperCase()}
        </span>
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
              left: align === 'left' ? 0 : 'auto',
              right: align === 'right' ? 0 : 'auto',
              width: '260px',
              background: 'var(--background)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              zIndex: 150,
              padding: '1rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.8rem'
            }}
          >
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Preset Colors</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {PRESET_COLORS.map((color) => (
                <div
                  key={color}
                  onClick={() => {
                    onChange(color);
                    setIsOpen(false);
                  }}
                  style={{
                    height: '32px',
                    borderRadius: '6px',
                    background: color,
                    cursor: 'pointer',
                    border: value === color ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)',
                    transition: 'transform 0.1s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              ))}
            </div>

            <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0.2rem 0' }} />

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Custom HEX</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="text"
                value={hexInput}
                onChange={e => handleHexChange(e.target.value)}
                placeholder="#HEXCODE"
                maxLength={7}
                style={{
                  width: '100%',
                  padding: '0.4rem 0.6rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '6px',
                  color: 'var(--foreground)',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
