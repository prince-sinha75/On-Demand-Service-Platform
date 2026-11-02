import { useEffect, useState, type FormEvent } from 'react';
import { CalendarDays, Check, Clock3, Plus, RefreshCw, ShieldCheck, Trash2, UserRound, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Booking, ProviderAvailability, ProviderProfile, ProviderService, ServiceCategory, supabase } from '@/lib/supabase';

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ProviderDashboard() {
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [providerServices, setProviderServices] = useState<ProviderService[]>([]);
  const [availability, setAvailability] = useState<ProviderAvailability[]>([]);
  const [assignedBookings, setAssignedBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [profileForm, setProfileForm] = useState({ displayName: '', bio: '', serviceArea: '' });
  const [availabilityForm, setAvailabilityForm] = useState({ weekday: 1, startTime: '08:00', endTime: '17:00' });

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    const [{ data: profileData, error: profileError }, { data: serviceData, error: serviceError }] = await Promise.all([
      supabase.from('provider_profiles').select('id, user_id, display_name, bio, service_area, is_approved, is_active, created_at, updated_at').maybeSingle(),
      supabase.from('service_categories').select('id, slug, name, description, kind, active, hourly_rate, currency').eq('active', true).order('name'),
    ]);
    if (profileError || serviceError) {
      setError('We could not load your provider dashboard. Please try again.');
      setLoading(false);
      return;
    }
    const nextProfile = profileData as ProviderProfile | null;
    setProfile(nextProfile);
    setServices((serviceData || []) as ServiceCategory[]);
    if (!nextProfile) {
      setLoading(false);
      return;
    }
    setProfileForm({ displayName: nextProfile.display_name || '', bio: nextProfile.bio || '', serviceArea: nextProfile.service_area || '' });
    const [{ data: providerServiceData, error: providerServiceError }, { data: availabilityData, error: availabilityError }, { data: bookingData, error: bookingError }] = await Promise.all([
      supabase.from('provider_services').select('id, provider_id, service_id, created_at').eq('provider_id', nextProfile.id),
      supabase.from('provider_availability').select('id, provider_id, weekday, start_time, end_time, is_active, created_at').eq('provider_id', nextProfile.id).order('weekday').order('start_time'),
      supabase.from('bookings').select('id, reference, service_id, location, scheduled_date, start_time, duration_hours, details, status, created_at, hourly_rate, currency, estimated_total, provider_id, confirmed_at, service_categories(name, slug)').eq('provider_id', nextProfile.id).order('scheduled_date').order('start_time'),
    ]);
    if (providerServiceError || availabilityError || bookingError) {
      setError('Some provider information could not be loaded. Please refresh and try again.');
    }
    setProviderServices((providerServiceData || []) as ProviderService[]);
    setAvailability((availabilityData || []) as ProviderAvailability[]);
    setAssignedBookings((bookingData || []) as unknown as Booking[]);
    setLoading(false);
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const createProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profileForm.displayName.trim() || !profileForm.serviceArea.trim()) {
      setError('Add your name and service area to continue.');
      return;
    }
    setSaving(true);
    setError('');
    const { data, error: insertError } = await supabase.from('provider_profiles').insert({
      display_name: profileForm.displayName.trim(),
      bio: profileForm.bio.trim(),
      service_area: profileForm.serviceArea.trim(),
    }).select('id, user_id, display_name, bio, service_area, is_approved, is_active, created_at, updated_at').maybeSingle();
    setSaving(false);
    if (insertError || !data) {
      setError('We could not create your provider profile. Please try again.');
      return;
    }
    setProfile(data as ProviderProfile);
    setNotice('Your provider profile was submitted for review.');
  };

  const updateProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError('');
    const { data, error: updateError } = await supabase.from('provider_profiles').update({
      display_name: profileForm.displayName.trim(),
      bio: profileForm.bio.trim(),
      service_area: profileForm.serviceArea.trim(),
    }).eq('id', profile.id).select('id, user_id, display_name, bio, service_area, is_approved, is_active, created_at, updated_at').maybeSingle();
    setSaving(false);
    if (updateError || !data) {
      setError('We could not save your profile. Please try again.');
      return;
    }
    setProfile(data as ProviderProfile);
    setNotice('Provider profile updated.');
  };

  const toggleActive = async () => {
    if (!profile) return;
    setSaving(true);
    const { error: updateError } = await supabase.from('provider_profiles').update({ is_active: !profile.is_active }).eq('id', profile.id);
    setSaving(false);
    if (updateError) {
      setError('We could not update your availability status.');
      return;
    }
    setProfile({ ...profile, is_active: !profile.is_active });
  };

  const addService = async (serviceId: string) => {
    if (!profile) return;
    const { data, error: insertError } = await supabase.from('provider_services').insert({ provider_id: profile.id, service_id: serviceId }).select('id, provider_id, service_id, created_at').maybeSingle();
    if (insertError || !data) {
      setError('We could not add that service. It may already be on your profile.');
      return;
    }
    setProviderServices((current) => [...current, data as ProviderService]);
  };

  const removeService = async (id: string) => {
    const { error: deleteError } = await supabase.from('provider_services').delete().eq('id', id);
    if (deleteError) {
      setError('We could not remove that service.');
      return;
    }
    setProviderServices((current) => current.filter((service) => service.id !== id));
  };

  const addAvailability = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;
    const { data, error: insertError } = await supabase.from('provider_availability').insert({
      provider_id: profile.id,
      weekday: availabilityForm.weekday,
      start_time: availabilityForm.startTime,
      end_time: availabilityForm.endTime,
    }).select('id, provider_id, weekday, start_time, end_time, is_active, created_at').maybeSingle();
    if (insertError || !data) {
      setError('We could not add that availability window. Check the times and try again.');
      return;
    }
    setAvailability((current) => [...current, data as ProviderAvailability].sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time)));
  };

  const removeAvailability = async (id: string) => {
    const { error: deleteError } = await supabase.from('provider_availability').delete().eq('id', id);
    if (deleteError) {
      setError('We could not remove that availability window.');
      return;
    }
    setAvailability((current) => current.filter((entry) => entry.id !== id));
  };

  const rejectBooking = async (bookingId: string) => {
    const { data, error: rejectError } = await supabase.rpc('reject_booking', { p_booking_id: bookingId, p_new_status: 'rejected' });
    if (rejectError || data !== true) {
      setError('We could not reject this booking. It may already have changed.');
      return;
    }
    setAssignedBookings((current) => current.map((booking) => booking.id === bookingId ? { ...booking, status: 'rejected' as const } : booking));
    setNotice('Booking rejected.');
  };

  const activeServiceIds = new Set(providerServices.map((service) => service.service_id));

  if (loading) return <main className="relative min-h-screen px-6 py-16 text-ivory-muted">Loading provider dashboard…</main>;

  return (
    <main className="relative min-h-screen px-6 py-10 md:px-10 md:py-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <Link to="/bookings" className="text-sm text-ivory-muted hover:text-ivory transition-colors">Back to bookings</Link>
          <button type="button" onClick={() => void loadDashboard()} className="flex items-center gap-2 text-sm text-ivory-muted hover:text-ivory transition-colors"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div><p className="text-xs uppercase tracking-[0.2em] text-lime">Provider workspace</p><h1 className="font-display text-4xl md:text-6xl text-ivory mt-4">Offer your time.</h1><p className="text-ivory-dim mt-4 max-w-xl">Set your services and weekly availability. Approved providers can receive eligible booking requests.</p></div>
          {profile && <div className="flex items-center gap-3"><span className={`px-3 py-1.5 rounded-full text-xs ${profile.is_approved ? 'bg-lime/10 text-lime' : 'bg-ivory/10 text-ivory-muted'}`}>{profile.is_approved ? 'Approved provider' : 'Pending review'}</span><button type="button" onClick={() => void toggleActive()} disabled={saving} className="px-4 py-2 rounded-full border border-charcoal-border text-sm text-ivory-dim hover:border-lime/30 transition-colors disabled:opacity-50">{profile.is_active ? 'Accepting requests' : 'Not accepting requests'}</button></div>}
        </div>
        {notice && <p className="mt-8 p-4 rounded-xl bg-lime/10 border border-lime/20 text-sm text-lime">{notice}</p>}
        {error && <p className="mt-8 p-4 rounded-xl bg-red-400/10 border border-red-300/20 text-sm text-red-200">{error}</p>}
        {!profile ? <section className="mt-10 glass border border-charcoal-border rounded-2xl p-6 md:p-8 max-w-2xl"><div className="flex items-start gap-4 mb-6"><div className="w-12 h-12 rounded-xl bg-lime/10 flex items-center justify-center"><UserRound className="w-6 h-6 text-lime" /></div><div><h2 className="text-xl text-ivory">Create your provider profile</h2><p className="text-sm text-ivory-muted mt-1">Your profile will remain pending until it is reviewed.</p></div></div><ProfileForm form={profileForm} setForm={setProfileForm} onSubmit={createProfile} saving={saving} submitLabel="Submit for review" /></section> : <div className="grid lg:grid-cols-[1fr_1fr] gap-6 mt-10"><section className="glass border border-charcoal-border rounded-2xl p-6"><div className="flex items-center gap-3 mb-6"><UserRound className="w-5 h-5 text-lime" /><h2 className="text-xl text-ivory">Your profile</h2></div><ProfileForm form={profileForm} setForm={setProfileForm} onSubmit={updateProfile} saving={saving} submitLabel="Save profile" /></section><section className="glass border border-charcoal-border rounded-2xl p-6"><div className="flex items-center gap-3 mb-6"><ShieldCheck className="w-5 h-5 text-lime" /><h2 className="text-xl text-ivory">Services offered</h2></div><div className="space-y-2">{services.map((service) => { const selected = activeServiceIds.has(service.id); return <div key={service.id} className="flex items-center justify-between gap-3 p-3 rounded-lg glass-light border border-charcoal-border"><div><p className="text-sm text-ivory">{service.name}</p><p className="text-xs text-ivory-muted mt-1">{service.description}</p></div>{selected ? <button type="button" onClick={() => { const entry = providerServices.find((item) => item.service_id === service.id); if (entry) void removeService(entry.id); }} className="text-xs text-lime hover:text-lime-dark">Added</button> : <button type="button" onClick={() => void addService(service.id)} className="p-2 text-ivory-muted hover:text-lime transition-colors" aria-label={`Add ${service.name}`}><Plus className="w-4 h-4" /></button>}</div>; })}</div></section><section className="glass border border-charcoal-border rounded-2xl p-6 lg:col-span-2"><div className="flex items-center gap-3 mb-6"><Clock3 className="w-5 h-5 text-lime" /><h2 className="text-xl text-ivory">Weekly availability</h2></div><form onSubmit={addAvailability} className="grid sm:grid-cols-4 gap-3 items-end"><SelectField label="Day" value={String(availabilityForm.weekday)} onChange={(value) => setAvailabilityForm({ ...availabilityForm, weekday: Number(value) })} options={weekdays.map((day, index) => ({ value: String(index), label: day }))} /><SelectField label="Starts" value={availabilityForm.startTime} onChange={(value) => setAvailabilityForm({ ...availabilityForm, startTime: value })} options={['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00'].map((time) => ({ value: time, label: time }))} /><SelectField label="Ends" value={availabilityForm.endTime} onChange={(value) => setAvailabilityForm({ ...availabilityForm, endTime: value })} options={['13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'].map((time) => ({ value: time, label: time }))} /><button type="submit" className="inline-flex justify-center items-center gap-2 px-4 py-3 bg-lime text-charcoal rounded-xl text-sm font-medium hover:bg-lime-dark transition-colors"><Plus className="w-4 h-4" /> Add window</button></form><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">{availability.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-3 p-3 rounded-lg glass-light border border-charcoal-border"><div><p className="text-sm text-ivory">{weekdays[entry.weekday]}</p><p className="text-xs text-ivory-muted mt-1">{entry.start_time.slice(0, 5)} – {entry.end_time.slice(0, 5)}</p></div><button type="button" onClick={() => void removeAvailability(entry.id)} className="text-ivory-muted hover:text-red-200 transition-colors" aria-label="Remove availability"><Trash2 className="w-4 h-4" /></button></div>)}</div>{availability.length === 0 && <p className="text-sm text-ivory-muted mt-6">Add the times you are normally available. Customers will only see you for matching requests after approval.</p>}</section><section className="glass border border-charcoal-border rounded-2xl p-6 lg:col-span-2"><div className="flex items-center gap-3 mb-6"><CalendarDays className="w-5 h-5 text-lime" /><h2 className="text-xl text-ivory">Assigned bookings</h2></div>{assignedBookings.length === 0 ? <p className="text-sm text-ivory-muted">No assigned bookings yet. Requests appear here after a customer assigns you.</p> : <div className="space-y-3">{assignedBookings.map((booking) => <div key={booking.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl glass-light border border-charcoal-border"><div><div className="flex items-center gap-3"><p className="text-sm text-ivory font-medium">{booking.service_categories?.name || 'Service booking'}</p><Status status={booking.status} /></div><p className="text-xs text-ivory-muted mt-1">{booking.reference} · {booking.scheduled_date} at {booking.start_time.slice(0, 5)} · {booking.duration_hours}h</p><p className="text-sm text-ivory-dim mt-2">{booking.location}</p></div>{(booking.status === 'requested' || booking.status === 'confirmed') && <button type="button" onClick={() => void rejectBooking(booking.id)} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-charcoal-border text-sm text-ivory-muted hover:text-red-200 hover:border-red-300/40 transition-colors"><X className="w-4 h-4" /> Reject booking</button>}</div>)}</div>}</section></div>}
      </div>
    </main>
  );
}

function ProfileForm({ form, setForm, onSubmit, saving, submitLabel }: { form: { displayName: string; bio: string; serviceArea: string }; setForm: (form: { displayName: string; bio: string; serviceArea: string }) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; saving: boolean; submitLabel: string }) {
  return <form onSubmit={onSubmit} className="space-y-4"><TextInput label="Display name" value={form.displayName} onChange={(value) => setForm({ ...form, displayName: value })} placeholder="How customers should see you" /><TextInput label="Service area" value={form.serviceArea} onChange={(value) => setForm({ ...form, serviceArea: value })} placeholder="Town, city, or coverage area" /><label className="block"><span className="text-sm text-ivory-dim">Short bio (optional)</span><textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} rows={4} placeholder="Tell customers about your experience" className="mt-2 w-full px-4 py-3 glass-light border border-charcoal-border rounded-xl text-sm text-ivory placeholder:text-ivory-muted focus:outline-none focus:border-lime/50 resize-none" /></label><button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-3 bg-lime text-charcoal rounded-xl text-sm font-medium hover:bg-lime-dark transition-colors disabled:opacity-50">{saving ? 'Saving…' : submitLabel} <Check className="w-4 h-4" /></button></form>;
}

function TextInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="block"><span className="text-sm text-ivory-dim">{label}</span><input required value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 w-full px-4 py-3 glass-light border border-charcoal-border rounded-xl text-sm text-ivory placeholder:text-ivory-muted focus:outline-none focus:border-lime/50" /></label>;
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <label className="block"><span className="text-sm text-ivory-dim">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full px-3 py-3 glass-light border border-charcoal-border rounded-xl text-sm text-ivory focus:outline-none focus:border-lime/50 [color-scheme:dark]">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function Status({ status }: { status: Booking['status'] }) {
  const label = status === 'requested' ? 'Requested' : status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={`px-2.5 py-1 rounded-full text-xs ${status === 'cancelled' || status === 'rejected' ? 'bg-red-300/10 text-red-200' : status === 'confirmed' ? 'bg-lime/10 text-lime' : 'bg-ivory/10 text-ivory-muted'}`}>{label}</span>;
}
