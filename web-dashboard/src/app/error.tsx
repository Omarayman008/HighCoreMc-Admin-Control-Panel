'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('GLOBAL ERROR BOUNDARY CAUGHT:', error);
  }, [error]);

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', background: '#000', color: 'red', height: '100vh' }}>
      <h2>Something went wrong!</h2>
      <p style={{ color: 'white', whiteSpace: 'pre-wrap' }}>{error.message}</p>
      <p style={{ color: 'gray', whiteSpace: 'pre-wrap' }}>{error.stack}</p>
      <button
        onClick={() => reset()}
        style={{ padding: '0.5rem 1rem', marginTop: '1rem', background: '#fff', color: '#000' }}
      >
        Try again
      </button>
    </div>
  );
}
