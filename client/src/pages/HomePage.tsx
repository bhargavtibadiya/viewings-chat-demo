import { PropertyCard } from '@/components/marketplace/PropertyCard';
import { Button, CommandMenu, Loader, Skeleton } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { getPropertiesThunk } from '@/store/properties/properties.thunk';
import type { ListingType } from '@/store/types';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCommandPalette } from '@/hooks/use-command-palette';
import { formatListingType } from '@/utils/helpers/propertyFormatters';
import { cn } from '@/utils/helpers/cn';

export function HomePage(): React.ReactElement {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const properties = useAppSelector((state) => state.properties.properties);
  const loading = useAppSelector((state) => state.properties.getPropertiesLoading);
  const hasRequested = useAppSelector((state) => state.properties.hasRequestedProperties);
  const filters = useAppSelector((state) => state.properties.searchFilters);
  const [searchOpen, setSearchOpen] = useState(false);
  const [listingFilter, setListingFilter] = useState<ListingType | 'ALL'>('ALL');

  useCommandPalette(() => setSearchOpen((current) => !current), true);

  useEffect(() => {
    if (hasRequested || loading) return;
    dispatch(getPropertiesThunk(filters));
  }, [dispatch, filters, hasRequested, loading]);

  const filteredProperties = useMemo(() => {
    if (listingFilter === 'ALL') return properties;
    return properties.filter((property) => property.listingType === listingFilter);
  }, [listingFilter, properties]);

  const commandItems = useMemo(
    () =>
      properties.map((property) => ({
        id: property.id,
        label: property.title,
        description: `${property.suburb}, ${property.city} · ${property.bedrooms} bed`,
        meta: formatListingType(property.listingType),
        onSelect: () => navigate(`/properties/${property.id}`),
      })),
    [navigate, properties],
  );

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 border-b border-[var(--color-border-light)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-left">
          <p className="eyebrow text-[var(--color-text-muted)]">Marketplace</p>
          <h1 className="page-title-lg mt-1">Browse listings</h1>
          <p className="mt-1 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
            {filteredProperties.length} properties · Press ⌘K to search
          </p>
        </div>

        <div className="flex flex-wrap gap-1 sm:shrink-0">
          {(['ALL', 'RENTAL', 'SALE'] as const).map((type) => {
            const isActive = listingFilter === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setListingFilter(type)}
                className={cn(
                  'min-h-[26px] rounded-[var(--radius-sm)] px-2.5 py-1 text-[var(--text-2xs)] font-bold uppercase tracking-[0.06em] transition-colors',
                  isActive
                    ? 'filter-tab-active'
                    : 'border border-[var(--color-border-light)] bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]',
                )}
              >
                {type === 'ALL' ? 'All' : formatListingType(type)}
              </button>
            );
          })}
        </div>
      </section>

      {loading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={`home-skeleton-${index}`} variant="card" />
          ))}
        </div>
      )}

      {!loading && filteredProperties.length === 0 && (
        <div className="rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border-light)] bg-[var(--color-bg-surface)] p-8 text-center">
          <p className="font-display text-xl text-[var(--color-text-primary)]">No listings</p>
          <p className="mt-1 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
            Start the API and seed data, then refresh.
          </p>
          <Button className="mt-3" size="sm" onClick={() => dispatch(getPropertiesThunk(filters))}>
            Retry
          </Button>
        </div>
      )}

      {!loading && filteredProperties.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}

      <CommandMenu
        open={searchOpen}
        onOpenChange={setSearchOpen}
        items={commandItems}
        placeholder="Search by title, suburb, beds..."
      />

      {loading && hasRequested && (
        <div className="flex justify-center">
          <Loader label="Loading listings" size="sm" />
        </div>
      )}
    </div>
  );
}
