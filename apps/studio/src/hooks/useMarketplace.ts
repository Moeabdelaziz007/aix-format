'use client';

import { useQuery } from '@tanstack/react-query';
import { getMarketplaceItems, MarketplaceItem } from '../lib/marketplace-api';
import { useState, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export const useMarketplace = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [type, setType] = useState(searchParams.get('type') || 'all');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const filters = useMemo(() => ({
    search,
    type,
  }), [search, type]);

  const { data: items, isLoading, error } = useQuery({
    queryKey: ['marketplace', filters],
    queryFn: () => getMarketplaceItems(filters),
  });

  const updateFilters = (newFilters: { q?: string; type?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newFilters.q !== undefined) {
      if (newFilters.q) params.set('q', newFilters.q);
      else params.delete('q');
      setSearch(newFilters.q);
    }
    if (newFilters.type !== undefined) {
      if (newFilters.type !== 'all') params.set('type', newFilters.type);
      else params.delete('type');
      setType(newFilters.type);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return {
    items,
    isLoading,
    error,
    search,
    setSearch,
    type,
    setType: (t: string) => updateFilters({ type: t }),
    view,
    setView,
    updateFilters,
  };
};
