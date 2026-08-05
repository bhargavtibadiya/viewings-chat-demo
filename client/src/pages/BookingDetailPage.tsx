import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, Loader, Skeleton } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { cancelBookingThunk, getBookingByIdThunk } from '@/store/bookings/bookings.thunk';
import { clearBookingDetail } from '@/store/bookings/bookings.slice';
import { formatDateTimeNz } from '@/utils/helpers/propertyFormatters';
import { useToast } from '@/components/ui';

export function BookingDetailPage(): React.ReactElement {
  const { bookingId = '' } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { show } = useToast();
  const booking = useAppSelector((state) => state.bookings.booking);
  const loading = useAppSelector((state) => state.bookings.getBookingByIdLoading);
  const cancelLoading = useAppSelector((state) => state.bookings.cancelBookingLoading);

  useEffect(() => {
    if (bookingId.length === 0) return undefined;
    dispatch(getBookingByIdThunk({ bookingId }));
    return () => {
      dispatch(clearBookingDetail());
    };
  }, [bookingId, dispatch]);

  const handleCancel = async (): Promise<void> => {
    if (!booking) return;
    const result = await dispatch(cancelBookingThunk({ bookingId: booking.id }));
    if (cancelBookingThunk.fulfilled.match(result)) {
      show({
        title: 'Booking cancelled',
        description: 'The slot should be available again.',
        variant: 'success',
      });
    }
  };

  if (loading || !booking) {
    return (
      <div className="space-y-4">
        <Skeleton variant="heading" width="50%" />
        <Skeleton variant="card" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/bookings" className="text-[var(--text-sm)] uppercase tracking-[0.08em] no-underline">
          Back to bookings
        </Link>
        <p className="eyebrow mt-4 text-[var(--color-text-muted)]">Confirmation</p>
        <h1 className="mt-3">Booking detail</h1>
      </div>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge
            variant="solid"
            status={booking.status === 'CONFIRMED' ? 'success' : 'neutral'}
          >
            {booking.status}
          </Badge>
          <span className="text-[var(--text-sm)] text-[var(--color-text-muted)]">Ref {booking.id.slice(0, 8)}</span>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <Detail label="Property" value={booking.property?.title ?? booking.propertyId} />
          <Detail
            label="Viewing time"
            value={booking.slot ? formatDateTimeNz(booking.slot.startsAt) : 'To be confirmed'}
          />
          <Detail label="Contact" value={booking.contactName} />
          <Detail label="Email" value={booking.contactEmail} />
          {booking.contactPhone && <Detail label="Phone" value={booking.contactPhone} />}
        </dl>

        {booking.notes && (
          <div>
            <p className="text-[var(--text-xs)] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
              Notes
            </p>
            <p className="mt-1">{booking.notes}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          {booking.property && (
            <Button variant="secondary" onClick={() => navigate(`/properties/${booking.propertyId}`)}>
              View property
            </Button>
          )}
          {booking.status === 'CONFIRMED' && (
            <Button variant="destructive" loading={cancelLoading} onClick={() => void handleCancel()}>
              Cancel booking
            </Button>
          )}
        </div>
      </Card>

      {loading && <Loader label="Loading booking" />}
    </div>
  );
}

interface DetailProps {
  label: string;
  value: string;
}

function Detail({ label, value }: DetailProps): React.ReactElement {
  return (
    <div>
      <dt className="text-[var(--text-xs)] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
        {label}
      </dt>
      <dd className="mt-1 text-[var(--color-text-primary)]">{value}</dd>
    </div>
  );
}
