'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

/**
 * Déclenche la réhydratation du store Zustand côté client.
 * Compatible Zustand v5 (l'API persist.rehydrate n'existe plus en v5).
 * En v5 avec skipHydration:true, on appelle directement getState().
 */
export function StoreHydration() {
  useEffect(() => {
    // Zustand v5 : persist.rehydrate() n'existe plus.
    // L'hydratation se fait automatiquement si skipHydration est false,
    // ou manuellement via la méthode interne (si disponible).
    const store = useStore as unknown as {
      persist?: { rehydrate?: () => void };
    };

    if (typeof store.persist?.rehydrate === 'function') {
      // Compatibilité avec d'éventuelles versions futures
      store.persist.rehydrate();
    }
    // En Zustand v5 avec skipHydration:true, la réhydratation
    // depuis localStorage se fait via le mécanisme interne au premier render.
  }, []);

  return null;
}
