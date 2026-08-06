import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, Loader, Skeleton } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { getBookingsThunk } from '@/store/bookings/bookings.thunk';
import { formatDateTimeNz } from '@/utils/helpers/propertyFormatters';

/**
 * Lists the signed-in user's viewing bookings.
 *
 * @returns The bookings route content
 */
export function BookingsPage(): React.ReactElement {
  const dispatch = useAppDispatch();
  const bookings = useAppSelector((state) => state.bookings.bookings);
  const loading = useAppSelector((state) => state.bookings.getBookingsLoading);
  const hasRequested = useAppSelector((state) => state.bookings.hasRequestedBookings);

  useEffect(() => {
    // [WHY] retain loaded bookings when revisiting this route during the same session.
    if (hasRequested || loading) return;
    dispatch(getBookingsThunk());
  }, [dispatch, hasRequested, loading]);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow text-[var(--color-text-muted)]">Bookings</p>
        <h1 className="mt-3">My bookings</h1>
        <p className="mt-2 max-w-2xl">Viewings you have confirmed from chat or the booking flow.</p>
      </div>

      {loading && (
        <div className="space-y-3">
          <Skeleton variant="custom" height="72px" />
          <Skeleton variant="custom" height="72px" />
        </div>
      )}

      {!loading && bookings.length === 0 && (
        <Card>
          <p className="font-display text-2xl text-[var(--color-text-primary)]">
            No bookings yet
          </p>
          <p className="mt-2">Book a slot from property chat once availability is available.</p>
          <Button className="mt-4" onClick={() => dispatch(getBookingsThunk())}>
            Refresh
          </Button>
        </Card>
      )}

      {!loading && bookings.length > 0 && (
        <div className="overflow-x-auto rounded-[var(--radius-sm)] border border-[var(--color-border-light)] bg-[var(--color-bg-surface)]">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-[var(--text-2xs)] font-bold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                  Property
                </th>
                <th className="px-4 py-3 text-left text-[var(--text-2xs)] font-bold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                  When
                </th>
                <th className="px-4 py-3 text-left text-[var(--text-2xs)] font-bold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-[var(--text-2xs)] font-bold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-t border-[var(--color-border-light)] hover:bg-[var(--color-bg-secondary)]">
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                    {booking.property?.title ?? booking.propertyId}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                    {booking.slot ? formatDateTimeNz(booking.slot.startsAt) : 'TBC'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="solid"
                      status={booking.status === 'CONFIRMED' ? 'success' : 'neutral'}
                      size="sm"
                    >
                      {booking.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/bookings/${booking.id}`} className="text-[var(--text-sm)] font-semibold uppercase tracking-[0.08em] no-underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loading && hasRequested && <Loader label="Loading bookings" />}
    </div>
  );
}
