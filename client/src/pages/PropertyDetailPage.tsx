import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BedDouble, Bath, Car, MapPin, MessageSquare, ParkingCircle } from 'lucide-react';
import { Badge, Button, Card, Loader, Skeleton } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { getPropertyByIdThunk } from '@/store/properties/properties.thunk';
import { clearPropertyDetail } from '@/store/properties/properties.slice';
import {
  formatListingPrice,
  formatListingType,
} from '@/utils/helpers/propertyFormatters';

export function PropertyDetailPage(): React.ReactElement {
  const { propertyId = '' } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const property = useAppSelector((state) => state.properties.property);
  const loading = useAppSelector((state) => state.properties.getPropertyByIdLoading);

  useEffect(() => {
    if (propertyId.length === 0) return;
    dispatch(getPropertyByIdThunk({ propertyId }));
    return () => {
      dispatch(clearPropertyDetail());
    };
  }, [dispatch, propertyId]);

  if (loading || !property) {
    return (
      <div className="space-y-4">
        <Skeleton variant="heading" height="1.75rem" width="40%" />
        <Skeleton variant="custom" height="240px" />
        <Skeleton lines={3} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <Link
            to="/"
            aria-label="Back to listings"
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-light)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] no-underline transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-primary)] hover:no-underline"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          </Link>
          <div className="min-w-0">
            <h1 className="page-title-lg">{property.title}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
              <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
              <span>{property.addressLine}, {property.suburb}, {property.city}</span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:pt-0.5">
          <Badge variant="ghost" status="neutral" size="xs">
            {formatListingType(property.listingType)}
          </Badge>
          <span className="text-[var(--text-lg)] font-bold text-[var(--color-primary)]">
            {formatListingPrice(property)}
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border-light)] bg-[var(--color-bg-secondary)]">
            <div className="aspect-[16/9] max-h-[360px]">
              {property.heroImageUrl ? (
                <img
                  src={property.heroImageUrl}
                  alt={property.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[200px] items-center justify-center text-[var(--text-sm)] text-[var(--color-text-muted)]">
                  No image available
                </div>
              )}
            </div>
          </div>

          <Card padding="sm" className="space-y-3">
            <p className="section-label !mb-3 !pb-2">Description</p>
            <p className="text-[var(--text-sm)] leading-relaxed text-[var(--color-text-secondary)]">
              {property.description}
            </p>
          </Card>

          {property.attributes.length > 0 && (
            <Card padding="sm">
              <p className="section-label !mb-3 !pb-2">Features</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {property.attributes.map((attribute) => (
                  <div
                    key={attribute.key}
                    className="rounded-[var(--radius-sm)] border border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] px-3 py-2"
                  >
                    <p className="text-[var(--text-2xs)] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                      {attribute.key.replaceAll('_', ' ')}
                    </p>
                    <p className="mt-0.5 text-[var(--text-sm)] text-[var(--color-text-primary)]">
                      {attribute.value === null ? 'Not specified' : String(attribute.value)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <aside className="lg:sticky lg:top-[4.5rem] lg:self-start">
          <Card padding="sm" className="space-y-3">
            <p className="section-label !mb-3 !pb-2">Quick facts</p>
            <dl className="space-y-2.5 text-[var(--text-sm)]">
              <FactRow icon={<BedDouble className="h-3.5 w-3.5" />} label="Bedrooms" value={String(property.bedrooms)} />
              <FactRow icon={<Bath className="h-3.5 w-3.5" />} label="Bathrooms" value={String(property.bathrooms)} />
              <FactRow icon={<ParkingCircle className="h-3.5 w-3.5" />} label="Parking" value={String(property.parking)} />
              <FactRow icon={<Car className="h-3.5 w-3.5" />} label="Available" value={property.availableFrom ?? 'Ask agent'} />
            </dl>
            <Button
              variant="primary"
              fullWidth
              size="sm"
              leftIcon={<MessageSquare className="h-3.5 w-3.5" strokeWidth={1.5} />}
              onClick={() => navigate(`/chat/${property.id}`)}
            >
              Chat with AI
            </Button>
          </Card>
        </aside>
      </div>

      {loading && <Loader label="Loading property" size="sm" />}
    </div>
  );
}

interface FactRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function FactRow({ icon, label, value }: FactRowProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
        {icon}
        <span className="text-[var(--text-2xs)] font-bold uppercase tracking-[0.08em]">{label}</span>
      </dt>
      <dd className="font-semibold text-[var(--color-text-primary)]">{value}</dd>
    </div>
  );
}
