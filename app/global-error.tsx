'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#fafaf9' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '1.5rem' }}>
            Moudestar
          </p>
          <h1 style={{ fontSize: '2rem', fontWeight: 300, marginBottom: '1rem', color: '#111' }}>
            Une erreur est survenue
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '2rem', maxWidth: '400px' }}>
            Le service est temporairement indisponible. Veuillez réessayer dans quelques instants.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={reset}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#111',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              Réessayer
            </button>
            <Link href="/" style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              color: '#111',
              border: '1px solid #e5e7eb',
              fontSize: '11px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}>
              Accueil
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
