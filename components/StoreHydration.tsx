'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

export function StoreHydration() {
  useEffect(() => {
    useStore.persist.rehydrate();
  }, []);

  return null;
}
