'use client';
import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#f8fafc', fontFamily: 'Tajawal, sans-serif' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(60px)' }} />
      </div>
      <div style={{ zIndex: 1, textAlign: 'center' }}>
        <h1 style={{ fontSize: '8rem', fontWeight: 900, margin: 0, background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 10px 30px rgba(129, 140, 248, 0.3)' }}>404</h1>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: '1rem 0 2rem', color: '#e2e8f0' }}>Page Not Found</h2>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 3rem', lineHeight: 1.6 }}>The page you are looking for doesn't exist or has been moved. Please check the URL or go back to the dashboard.</p>
        <Link href="/dashboard" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.8rem', background: '#6366f1', color: 'white', padding: '1rem 2rem', borderRadius: '16px', fontWeight: 700, fontSize: '1.1rem', boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)', transition: 'all 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <Home size={20} /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
