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

          {/* Affiche l'erreur réelle — pour debugging */}
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '4px',
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            maxWidth: '600px',
            textAlign: 'left',
          }}>
            <p style={{ color: '#991b1b', fontWeight: 600, fontSize: '12px', marginBottom: '0.5rem' }}>
              Détail de l&apos;erreur :
            </p>
            <code style={{ color: '#b91c1c', fontSize: '11px', wordBreak: 'break-all', display: 'block' }}>
              {error?.message || 'Unknown error'}
            </code>
            {error?.digest && (
              <code style={{ color: '#6b7280', fontSize: '10px', display: 'block', marginTop: '0.5rem' }}>
                Digest: {error.digest}
              </code>
            )}
          </div>

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
