import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import AnimatedBackground from '@/components/AnimatedBackground';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import BookingPreview from '@/components/BookingPreview';
import TrustSection from '@/components/TrustSection';
import FinalCTA from '@/components/FinalCTA';
import AuthPage from '@/components/AuthPage';
import BookingPage from '@/components/BookingPage';
import BookingsPage from '@/components/BookingsPage';
import ProviderDashboard from '@/components/ProviderDashboard';
import { supabase } from '@/lib/supabase';

function App() {
  const [selectedLocation, setSelectedLocation] = useState('');

  return (
    <BrowserRouter>
      <AppShell selectedLocation={selectedLocation} onLocationResolved={setSelectedLocation} />
    </BrowserRouter>
  );
}

function AppShell({ selectedLocation, onLocationResolved }: { selectedLocation: string; onLocationResolved: (location: string) => void }) {
  return (
    <div className="relative min-h-screen bg-charcoal text-ivory">
      <AnimatedBackground />
      <Navigation />
      <Routes>
        <Route path="/" element={<main className="relative z-10"><Hero onLocationResolved={onLocationResolved} /><Services /><BookingPreview initialLocation={selectedLocation} /><TrustSection /><FinalCTA /></main>} />
        <Route path="/auth" element={<main className="relative z-10"><AuthPage /></main>} />
        <Route element={<RequireAuth />}>
          <Route path="/book" element={<main className="relative z-10"><BookingPage /></main>} />
          <Route path="/bookings" element={<main className="relative z-10"><BookingsPage /></main>} />
          <Route path="/provider" element={<main className="relative z-10"><ProviderDashboard /></main>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function RequireAuth() {
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <main className="relative z-10 min-h-screen flex items-center justify-center text-ivory-muted">Checking your account…</main>;
  if (!session) return <Navigate to="/auth" replace state={{ from: `${location.pathname}${location.search}` }} />;
  return <Outlet />;
}

export default App;
