import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { CommandMenu } from '@/components/ui';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/pages/LoginPage';
import { HomePage } from '@/pages/HomePage';
import { PropertyDetailPage } from '@/pages/PropertyDetailPage';
import { ChatPage } from '@/pages/ChatPage';
import { BookingsPage } from '@/pages/BookingsPage';
import { BookingDetailPage } from '@/pages/BookingDetailPage';
import { ListerQuestionsPage } from '@/pages/ListerQuestionsPage';
import { DemoPage } from '@/pages/DemoPage';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { meThunk } from '@/store/auth/auth.thunk';
import { useCommandPalette } from '@/hooks/use-command-palette';
import { useSessionStatus } from '@/hooks/use-session-status';
import { formatListingType } from '@/utils/helpers/propertyFormatters';
import { getPropertiesThunk } from '@/store/properties/properties.thunk';

/**
 * Restores the authenticated profile after persisted state has rehydrated.
 *
 * @returns Nothing visible; renders null while initiating profile restoration
 */
function AuthBootstrap(): null {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const hasRequestedMe = useAppSelector((state) => state.auth.hasRequestedMe);

  useEffect(() => {
    if (!token || hasRequestedMe) return;
    dispatch(meThunk());
  }, [dispatch, hasRequestedMe, token]);

  return null;
}

/**
 * Renders authenticated routes and global property search controls.
 *
 * @returns The shared authenticated application layout
 */
function AuthenticatedLayout(): React.ReactElement {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const sessionStatus = useSessionStatus();
  const properties = useAppSelector((state) => state.properties.properties);
  const hasRequestedProperties = useAppSelector((state) => state.properties.hasRequestedProperties);
  const [searchOpen, setSearchOpen] = useState(false);

  useCommandPalette(() => setSearchOpen((current) => !current), true);

  useEffect(() => {
    // [WHY] The command palette needs all properties before users can navigate from search.
    if (sessionStatus !== 'ready' || hasRequestedProperties) return;
    dispatch(getPropertiesThunk());
  }, [dispatch, hasRequestedProperties, sessionStatus]);

  const commandItems = useMemo(
    () =>
      properties.map((property) => ({
        id: property.id,
        label: property.title,
        description: `${property.suburb}, ${property.city}`,
        meta: formatListingType(property.listingType),
        onSelect: () => navigate(`/properties/${property.id}`),
      })),
    [navigate, properties],
  );

  return (
    <>
      <AppShell onOpenSearch={() => setSearchOpen(true)} />
      <CommandMenu open={searchOpen} onOpenChange={setSearchOpen} items={commandItems} />
    </>
  );
}

/**
 * Defines the application's public and authenticated browser routes.
 *
 * @returns The root browser router and route tree
 */
export function AppRouter(): React.ReactElement {
  return (
    <BrowserRouter>
      <AuthBootstrap />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AuthenticatedLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/properties/:propertyId" element={<PropertyDetailPage />} />
          <Route path="/chat/:propertyId" element={<ChatPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/bookings/:bookingId" element={<BookingDetailPage />} />
          <Route path="/lister/questions" element={<ListerQuestionsPage />} />
          <Route path="/demo" element={<DemoPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
