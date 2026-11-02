import { useEffect, useState } from 'react';
import { CalendarDays, Clock3, MapPin, RefreshCw, User, UserCheck, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Booking, EligibleProvider, supabase, formatPrice } from '@/lib/supabase';

export default function BookingsPage() {
  const location = useLocation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(location.state?.created ? 'Your booking request was sent.' : '');
  const [assigningId, setAssigningId] = useState('');
  const [eligibleProviders, setEligibleProviders] = useState<EligibleProvider[]>([]);
  const [showAssignFor, setShowAssignFor] = useState('');

  const loadBookings = async () => {
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase
      .from('bookings')
      .select('id, reference, service_id, location, scheduled_date, start_time, duration_hours, details, status, created_at, hourly_rate, currency, estimated_total, provider_id, confirmed_at, service_categories(name, slug), provider_profiles(display_name, service_area)')
      .order('scheduled_date', { ascending: true })
      .order('start_time', { ascending: true });
    if (queryError) {
      setError('We could not load your bookings. Please try again.');
    } else {
      setBookings((data || []) as unknown as Booking[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadBookings();
  }, []);

  const cancel = async (id: string) => {
    setWorkingId(id);
    setError('');
    setNotice('');
    const { data, error: cancelError } = await supabase.rpc('cancel_booking', { p_booking_id: id });
    setWorkingId('');
    if (cancelError || data !== true) {
      setError('We could not cancel this booking request. It may already be in progress.');
      return;
    }
    setBookings((current) => current.map((booking) => booking.id === id ? { ...booking, status: 'cancelled' as const } : booking));
    setNotice('Booking request cancelled.');
  };

  const checkEligible = async (bookingId: string) => {
    if (showAssignFor === bookingId) {
      setShowAssignFor('');
      setEligibleProviders([]);
      return;
    }
    setAssigningId(bookingId);
    setShowAssignFor(bookingId);
    setEligibleProviders([]);
    const { data, error: rpcError } = await supabase.rpc('get_eligible_providers', { p_booking_id: bookingId });
    setAssigningId('');
    if (rpcError) {
      setError('We could not check available providers. Please try again.');
      setShowAssignFor('');
      return;
    }
    setEligibleProviders((data || []) as EligibleProvider[]);
  };

  const assignProvider = async (bookingId: string, providerId: string) => {
    setAssigningId(bookingId);
    setError('');
    const { data, error: rpcError } = await supabase.rpc('assign_provider', {
      p_booking_id: bookingId,
      p_provider_id: providerId,
    });
    setAssigningId('');
    if (rpcError || data !== true) {
      setError('We could not assign this provider. They may no longer be available.');
      return;
    }
    setNotice('Provider assigned. Your booking is now confirmed.');
    setShowAssignFor('');
    setEligibleProviders([]);
    void loadBookings();
  };

  return (
    <main className="relative min-h-screen px-6 py-10 md:px-10 md:py-16">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <Link to="/" className="flex items-center gap-2 text-sm text-ivory-muted hover:text-ivory transition-colors">Back to Hourhand</Link>
          <div className="flex items-center gap-4">
            <Link to="/provider" className="text-sm text-ivory-muted hover:text-lime transition-colors">Provider dashboard</Link>
            <Link to="/book" className="px-4 py-2.5 rounded-full bg-lime text-charcoal text-sm font-medium hover:bg-lime-dark transition-colors">New booking</Link>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div><p className="text-xs uppercase tracking-[0.2em] text-lime">Your account</p><h1 className="font-display text-4xl md:text-6xl text-ivory mt-4">My bookings.</h1><p className="text-ivory-dim mt-4">Keep track of requests and cancel before they are confirmed.</p></div>
          <button type="button" onClick={() => void loadBookings()} className="flex items-center gap-2 text-sm text-ivory-muted hover:text-ivory transition-colors"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>
        {notice && <p className="mt-8 p-4 rounded-xl bg-lime/10 border border-lime/20 text-sm text-lime">{notice}</p>}
        {error && <p className="mt-8 p-4 rounded-xl bg-red-400/10 border border-red-300/20 text-sm text-red-200">{error}</p>}
        {loading ? <div className="mt-12 text-ivory-muted">Loading your bookings\u2026</div> : bookings.length === 0 ? <div className="mt-12 glass border border-charcoal-border rounded-2xl p-10 text-center"><p className="text-ivory text-lg">No bookings yet.</p><p className="text-sm text-ivory-muted mt-2">When you are ready, request help by the hour.</p><Link to="/book" className="inline-flex mt-6 px-5 py-3 bg-lime text-charcoal rounded-full text-sm font-medium">Book a service</Link></div> : <div className="mt-10 space-y-4">{bookings.map((booking) => <article key={booking.id} className="glass border border-charcoal-border rounded-2xl p-5 md:p-6"><div className="flex flex-col md:flex-row md:items-start justify-between gap-5"><div className="flex-1"><div className="flex items-center gap-3"><h2 className="text-lg font-medium text-ivory">{booking.service_categories?.name || 'Service booking'}</h2><Status status={booking.status} /></div><p className="mt-1 text-xs text-ivory-muted">Reference {booking.reference}</p><div className="mt-4 space-y-2 text-sm text-ivory-dim"><p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-lime" />{booking.location}</p><p className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-lime" />{booking.scheduled_date}</p><p className="flex items-center gap-2"><Clock3 className="w-4 h-4 text-lime" />{booking.start_time.slice(0, 5)} \u00b7 {booking.duration_hours} hour{booking.duration_hours === 1 ? '' : 's'}</p></div><div className="mt-3 pt-3 border-t border-charcoal-border/50 flex items-center justify-between"><span className="text-sm text-ivory-muted">Estimated total</span><span className="text-sm text-lime font-medium">{formatPrice(booking.estimated_total, booking.currency)}</span></div>{booking.provider_profiles && <div className="mt-3 flex items-center gap-2 text-sm text-ivory-dim"><UserCheck className="w-4 h-4 text-lime" /> Provider: {booking.provider_profiles.display_name || 'Assigned provider'}</div>}</div><div className="flex flex-col gap-2 md:items-end">{(booking.status === 'requested' || booking.status === 'confirmed') && <button type="button" onClick={() => void cancel(booking.id)} disabled={workingId === booking.id} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-charcoal-border text-sm text-ivory-dim hover:text-red-200 hover:border-red-300/40 transition-colors disabled:opacity-50"><X className="w-4 h-4" />{workingId === booking.id ? 'Cancelling\u2026' : 'Cancel request'}</button>}{booking.status === 'requested' && <button type="button" onClick={() => void checkEligible(booking.id)} disabled={assigningId === booking.id} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-charcoal-border text-sm text-ivory-dim hover:text-lime hover:border-lime/30 transition-colors disabled:opacity-50"><User className="w-4 h-4" />{assigningId === booking.id ? 'Checking\u2026' : 'Find available providers'}</button>}</div></div>{showAssignFor === booking.id && <div className="mt-4 pt-4 border-t border-charcoal-border/50">{eligibleProviders.length === 0 ? <p className="text-sm text-ivory-muted">{assigningId === booking.id ? 'Searching\u2026' : 'No approved providers are available for this time slot. Your request remains pending.'}</p> : <div><p className="text-sm text-ivory-dim mb-3">Available providers:</p><div className="space-y-2">{eligibleProviders.map((provider) => <button key={provider.provider_id} type="button" onClick={() => void assignProvider(booking.id, provider.provider_id)} disabled={assigningId === booking.id} className="w-full text-left p-3 rounded-lg border border-charcoal-border glass-light hover:border-lime/30 transition-all disabled:opacity-50"><p className="text-sm text-ivory font-medium">{provider.display_name || 'Provider'}</p>{provider.service_area && <p className="text-xs text-ivory-muted mt-1">{provider.service_area}</p>}</button>)}</div><p className="text-xs text-ivory-muted mt-2">Assigning a provider confirms the booking. You can still cancel after assignment.</p></div>}</div>}</article>)}</div>}
      </div>
    </main>
  );
}

function Status({ status }: { status: Booking['status'] }) {
  const label = status === 'requested' ? 'Requested' : status === 'confirmed' ? 'Confirmed' : status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={`px-2.5 py-1 rounded-full text-xs ${status === 'cancelled' || status === 'rejected' ? 'bg-red-300/10 text-red-200' : status === 'confirmed' ? 'bg-lime/10 text-lime' : 'bg-ivory/10 text-ivory-muted'}`}>{label}</span>;
}
