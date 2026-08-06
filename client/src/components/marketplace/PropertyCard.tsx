import { Link, useNavigate } from 'react-router-dom';
import { BedDouble, Bath, Car, MessageSquare, MapPin } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import type { IProperty } from '@/store/types';
import { formatListingPrice, formatListingType } from '@/utils/helpers/propertyFormatters';
import { cn } from '@/utils/helpers/cn';

interface PropertyCardProps {
  property: IProperty;
}

/**
 * Renders a marketplace listing with a direct path into its property chat.
 *
 * @param props - The listing data to summarize
 * @returns A linked property card and chat action
 */
export function PropertyCard({ property }: PropertyCardProps): React.ReactElement {
  const navigate = useNavigate();

  return (
    <article
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border-light)] bg-[var(--color-bg-surface)] shadow-[var(--shadow-card)] transition-[border-color,box-shadow] duration-200',
        'hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-sm)]',
      )}
    >
      <Link
        to={`/properties/${property.id}`}
        className="block flex-1 no-underline hover:no-underline"
      >
        <div className="aspect-[16/10] overflow-hidden bg-[var(--color-bg-secondary)]">
          {property.heroImageUrl ? (
            <img
              src={property.heroImageUrl}
              alt={property.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[var(--text-sm)] text-[var(--color-text-muted)]">
              No image
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 p-3">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="ghost" status="neutral" size="xs">
              {formatListingType(property.listingType)}
            </Badge>
            <span className="text-[var(--text-sm)] font-bold text-[var(--color-primary)]">
              {formatListingPrice(property)}
            </span>
          </div>

          <h3 className="font-display text-lg font-semibold not-italic leading-snug text-[var(--color-text-primary)]">
            {property.title}
          </h3>

          <p className="flex items-center gap-1.5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
            <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            <span className="truncate">{property.suburb}, {property.city}</span>
          </p>

          <div className="flex items-center gap-3 text-[var(--text-xs)] text-[var(--color-text-muted)]">
            <span className="inline-flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" strokeWidth={1.5} />
              {property.bedrooms}
            </span>
            <span className="inline-flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" strokeWidth={1.5} />
              {property.bathrooms}
            </span>
            {property.parking > 0 && (
              <span className="inline-flex items-center gap-1">
                <Car className="h-3.5 w-3.5" strokeWidth={1.5} />
                {property.parking}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="border-t border-[var(--color-border-light)] p-3">
        <Button
          variant="primary"
          size="sm"
          fullWidth
          leftIcon={<MessageSquare className="h-3.5 w-3.5" strokeWidth={1.5} />}
          onClick={() => navigate(`/chat/${property.id}`)}
        >
          Chat with AI
        </Button>
      </div>
    </article>
  );
}
