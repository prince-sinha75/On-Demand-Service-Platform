import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Info } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ServiceCategory, supabase, formatHourlyRate, formatPrice } from '@/lib/supabase';
import { services as servicePresentation } from '@/data/services';

const steps = ['Service', 'Details', 'Schedule', 'Review'];
const durations = [1, 2, 3, 4, 6, 8];
const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
const easeOut = [0.22, 1, 0.36, 1] as const;

type BookingForm = {
  serviceId: string;
  location: string;
  pickupAddress: string;
  destination: string;
  tripType: 'one-way' | 'round-trip';
  vehicleDetails: string;
  task: string;
  activity: string;
  meetingLocation: string;
  preferences: string;
  additionalInstructions: string;
  scheduledDate: string;
  startTime: string;
  durationHours: number;
};

const emptyForm: BookingForm = {
  serviceId: '', location: '', pickupAddress: '', destination: '', tripType: 'one-way', vehicleDetails: '',
  task: '', activity: '', meetingLocation: '', preferences: '', additionalInstructions: '',
  scheduledDate: '', startTime: '', durationHours: 0,
};

export default function BookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [form, setForm] = useState<BookingForm>(() => ({
    ...emptyForm,
    serviceId: searchParams.get('service') || '',
    location: searchParams.get('location') || '',
  }));
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pageError, setPageError] = useState('');
  const [loadingServices, setLoadingServices] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [requestKey] = useState(() => crypto.randomUUID());
  useEffect(() => {
    const loadServices = async () => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('id, slug, name, description, kind, active, hourly_rate, currency')
        .eq('active', true)
        .order('name');
      if (error) {
        setPageError('We could not load available services. Please refresh and try again.');
      } else {
        const activeServices = (data || []) as ServiceCategory[];
        setServices(activeServices);
        const requestedSlug = searchParams.get('service');
        const requestedService = activeServices.find((service) => service.slug === requestedSlug);
        if (requestedService) {
          setForm((current) => ({ ...current, serviceId: requestedService.id }));
        }
      }
      setLoadingServices(false);
    };
    void loadServices();
  }, [searchParams]);

  const selectedService = services.find((service) => service.id === form.serviceId);
  const presentation = servicePresentation.find((service) => service.id === selectedService?.slug);
  const today = new Date().toISOString().split('T')[0];
  const detailLocation = selectedService?.kind === 'driver' ? form.pickupAddress : selectedService?.kind === 'companionship' ? form.meetingLocation : form.location;

  const updateForm = <K extends keyof BookingForm>(key: K, value: BookingForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const validateStep = (currentStep: number) => {
    const nextErrors: Record<string, string> = {};
    if (currentStep === 0 && !form.serviceId) nextErrors.serviceId = 'Choose a service to continue.';
    if (currentStep === 1) {
      if (selectedService?.kind === 'driver') {
        if (!form.pickupAddress.trim()) nextErrors.pickupAddress = 'Enter the pickup address.';
        if (!form.destination.trim()) nextErrors.destination = 'Enter the destination.';
      } else if (selectedService?.kind === 'companionship') {
        if (!form.meetingLocation.trim()) nextErrors.meetingLocation = 'Enter the meeting location.';
        if (!form.activity.trim()) nextErrors.activity = 'Tell us what kind of outing you have in mind.';
      } else {
        if (!form.location.trim()) nextErrors.location = 'Enter the service address.';
        if (!form.task.trim()) nextErrors.task = 'Describe the task you need help with.';
      }
    }
    if (currentStep === 2) {
      if (!form.scheduledDate) nextErrors.scheduledDate = 'Choose a date.';
      if (!form.startTime) nextErrors.startTime = 'Choose a preferred start time.';
      if (!form.durationHours) nextErrors.durationHours = 'Choose the expected duration.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const next = () => {
    if (validateStep(step)) setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const submitBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateStep(2) || !selectedService || !confirmed) {
      if (!confirmed) setErrors((current) => ({ ...current, confirmed: 'Confirm the details before submitting.' }));
      return;
    }
    setSubmitting(true);
    setPageError('');
    const details: Record<string, string> = {
      tripType: form.tripType,
      vehicleDetails: form.vehicleDetails.trim(),
      task: form.task.trim(),
      activity: form.activity.trim(),
      preferences: form.preferences.trim(),
      additionalInstructions: form.additionalInstructions.trim(),
      destination: form.destination.trim(),
      pickupAddress: form.pickupAddress.trim(),
      meetingLocation: form.meetingLocation.trim(),
    };
    const { data, error } = await supabase.rpc('create_booking', {
      p_service_id: selectedService.id,
      p_location: detailLocation.trim(),
      p_scheduled_date: form.scheduledDate,
      p_start_time: form.startTime,
      p_duration_hours: form.durationHours,
      p_details: details,
      p_request_key: requestKey,
    });
    setSubmitting(false);
    if (error || !data) {
      setPageError('We could not submit this booking request. Please try again.');
      return;
    }
    navigate('/bookings', { replace: true, state: { created: true } });
  };

  const estimatedTotal = selectedService && form.durationHours > 0 && selectedService.hourly_rate !== null
    ? selectedService.hourly_rate * form.durationHours
    : null;
  const estimatedCurrency = selectedService?.currency || 'GBP';

  const canContinue = useMemo(() => !loadingServices && services.length > 0, [loadingServices, services.length]);

  return (
    <main className="relative min-h-screen px-6 py-10 md:px-10 md:py-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <Link to="/" className="flex items-center gap-2 text-sm text-ivory-muted hover:text-ivory transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Hourhand
          </Link>
          <Link to="/bookings" className="text-sm text-lime hover:text-lime-dark transition-colors">My bookings</Link>
        </div>
        <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-lime">Secure booking</p>
            <h1 className="font-display text-4xl md:text-6xl text-ivory mt-4">Book the right help.</h1>
            <p className="text-ivory-dim mt-4 max-w-xl leading-relaxed">Your request is saved to your account and can be managed from your bookings page. A provider is not assigned until your request is reviewed.</p>
            <div className="glass border border-charcoal-border rounded-2xl p-6 md:p-8 mt-10">
              <div className="flex items-center gap-2 mb-8">
                {steps.map((label, index) => (
                  <div key={label} className="flex items-center gap-2 flex-1">
                    <button type="button" onClick={() => index < step && setStep(index)} className={`w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center transition-colors ${index === step ? 'bg-lime text-charcoal' : index < step ? 'bg-lime/20 text-lime' : 'bg-charcoal-border text-ivory-muted'}`}>
                      {index < step ? <Check className="w-4 h-4" /> : index + 1}
                    </button>
                    <span className="hidden sm:block text-xs text-ivory-muted">{label}</span>
                    {index < steps.length - 1 && <div className={`h-px flex-1 ${index < step ? 'bg-lime/40' : 'bg-charcoal-border'}`} />}
                  </div>
                ))}
              </div>
              {pageError && <p className="mb-5 p-3 rounded-lg bg-red-400/10 border border-red-300/20 text-sm text-red-200">{pageError}</p>}
              {!canContinue ? (
                <div className="py-16 text-center text-ivory-muted">{loadingServices ? 'Loading available services…' : 'No services are currently available.'}</div>
              ) : (
                <form onSubmit={submitBooking}>
                  <AnimatePresence mode="wait">
                    {step === 0 && <StepShell key="service" title="Choose a service" subtitle="Only currently active services are shown.">
                      <div className="grid sm:grid-cols-2 gap-3">
                        {services.map((service) => {
                          const Icon = servicePresentation.find((item) => item.id === service.slug)?.icon;
                          return <button type="button" key={service.id} onClick={() => updateForm('serviceId', service.id)} className={`text-left p-4 rounded-xl border transition-all ${form.serviceId === service.id ? 'border-lime bg-lime/5' : 'border-charcoal-border glass-light hover:border-lime/30'}`}>
                            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-charcoal-border flex items-center justify-center">{Icon && <Icon className="w-5 h-5 text-lime" />}</div><div><p className="text-sm text-ivory font-medium">{service.name}</p><p className="text-xs text-ivory-muted mt-1">{formatHourlyRate(service.hourly_rate, service.currency)}</p></div></div>
                          </button>;
                        })}
                      </div>
                      <FieldError message={errors.serviceId} />
                    </StepShell>}
                    {step === 1 && selectedService && <StepShell key="details" title="Tell us what you need" subtitle={selectedService.description}>
                      {selectedService.kind === 'driver' && <div className="space-y-4"><Input label="Pickup address" value={form.pickupAddress} onChange={(value) => updateForm('pickupAddress', value)} error={errors.pickupAddress} placeholder="Where should the driver meet you?" /><Input label="Destination" value={form.destination} onChange={(value) => updateForm('destination', value)} error={errors.destination} placeholder="Where are you going?" /><div><p className="text-sm text-ivory-dim mb-2">Trip type</p><div className="flex gap-2"><Choice selected={form.tripType === 'one-way'} onClick={() => updateForm('tripType', 'one-way')}>One-way</Choice><Choice selected={form.tripType === 'round-trip'} onClick={() => updateForm('tripType', 'round-trip')}>Round-trip</Choice></div></div><Input label="Vehicle details (optional)" value={form.vehicleDetails} onChange={(value) => updateForm('vehicleDetails', value)} placeholder="Make, model, or accessibility details" required={false} /></div>}
                      {selectedService.kind === 'home' && <div className="space-y-4"><Input label="Service address" value={form.location} onChange={(value) => updateForm('location', value)} error={errors.location} placeholder="Where should the provider work?" /><TextArea label="What needs doing?" value={form.task} onChange={(value) => updateForm('task', value)} error={errors.task} placeholder="Describe the job or problem" /><TextArea label="Additional instructions (optional)" value={form.additionalInstructions} onChange={(value) => updateForm('additionalInstructions', value)} placeholder="Access notes, timing details, or anything useful" /><p className="text-xs text-ivory-muted">Photo attachments will be available once private file storage is configured.</p></div>}
                      {selectedService.kind === 'companionship' && <div className="space-y-4"><Input label="Meeting location" value={form.meetingLocation} onChange={(value) => updateForm('meetingLocation', value)} error={errors.meetingLocation} placeholder="A public café, park, or other public place" /><TextArea label="Preferred activity" value={form.activity} onChange={(value) => updateForm('activity', value)} error={errors.activity} placeholder="Conversation, coffee, a walk, or another public outing" /><TextArea label="Preferences or access needs (optional)" value={form.preferences} onChange={(value) => updateForm('preferences', value)} placeholder="Anything that would make the outing comfortable" /><p className="text-xs text-ivory-muted flex items-start gap-2"><Info className="w-4 h-4 text-lime shrink-0" /> Social companionship is consensual and non-sexual. Meetings must remain appropriate public outings.</p></div>}
                    </StepShell>}
                    {step === 2 && <StepShell key="schedule" title="Choose a time" subtitle="This is your preferred schedule. Final availability is confirmed after review."><div className="space-y-5"><Input type="date" label="Date" value={form.scheduledDate} onChange={(value) => updateForm('scheduledDate', value)} error={errors.scheduledDate} min={today} /><div><p className="text-sm text-ivory-dim mb-3">Preferred start time</p><div className="grid grid-cols-3 sm:grid-cols-4 gap-2">{timeSlots.map((slot) => <Choice key={slot} selected={form.startTime === slot} onClick={() => updateForm('startTime', slot)}>{slot}</Choice>)}</div><FieldError message={errors.startTime} /></div><div><p className="text-sm text-ivory-dim mb-3">Expected duration</p><div className="grid grid-cols-3 sm:grid-cols-6 gap-2">{durations.map((duration) => <Choice key={duration} selected={form.durationHours === duration} onClick={() => updateForm('durationHours', duration)}>{duration}h</Choice>)}</div><FieldError message={errors.durationHours} /></div></div></StepShell>}
                    {step === 3 && selectedService && <StepShell key="review" title="Review your request" subtitle="Check the details before sending your booking request."><div className="space-y-3"><Summary label="Service" value={selectedService.name} /><Summary label="Location" value={detailLocation} /><Summary label="Schedule" value={`${form.scheduledDate} at ${form.startTime}`} /><Summary label="Duration" value={`${form.durationHours} hour${form.durationHours === 1 ? '' : 's'}`} /><Summary label="Details" value={selectedService.kind === 'driver' ? `${form.tripType}: ${form.pickupAddress} → ${form.destination}` : selectedService.kind === 'companionship' ? form.activity : form.task} /><div className="pt-3 border-t border-charcoal-border/70"><div className="flex items-center justify-between py-3"><span className="text-sm text-ivory-muted">Hourly rate</span><span className="text-sm text-ivory">{formatHourlyRate(selectedService.hourly_rate, selectedService.currency)}</span></div><div className="flex items-center justify-between py-3"><span className="text-sm text-ivory-muted">Estimated total</span><span className="text-sm text-lime font-medium">{formatPrice(estimatedTotal, estimatedCurrency)}</span></div>{selectedService.hourly_rate === null && <p className="text-xs text-ivory-muted mt-1">Final pricing will be confirmed before payment.</p>}{selectedService.hourly_rate !== null && <p className="text-xs text-ivory-muted mt-1">This is an estimate. The final amount may differ if the duration changes.</p>}</div></div><label className="mt-6 flex items-start gap-3 text-sm text-ivory-dim cursor-pointer"><input type="checkbox" checked={confirmed} onChange={(event) => { setConfirmed(event.target.checked); setErrors((current) => ({ ...current, confirmed: '' })); }} className="mt-1 accent-lime" /> I confirm these details are accurate and understand this is a request pending provider assignment.</label><FieldError message={errors.confirmed} /><p className="mt-4 text-xs text-ivory-muted flex items-start gap-2"><Info className="w-4 h-4 text-lime shrink-0" /> Sending creates a request in your account. It does not charge you or guarantee provider availability.</p></StepShell>}
                  </AnimatePresence>
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-charcoal-border"><button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0} className="flex items-center gap-2 text-sm text-ivory-muted disabled:opacity-30"><ArrowLeft className="w-4 h-4" /> Back</button>{step < 3 ? <button type="button" onClick={next} className="flex items-center gap-2 px-6 py-3 bg-lime text-charcoal rounded-xl text-sm font-medium hover:bg-lime-dark transition-colors">Continue <ArrowRight className="w-4 h-4" /></button> : <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-3 bg-lime text-charcoal rounded-xl text-sm font-medium hover:bg-lime-dark transition-colors disabled:opacity-60">{submitting ? 'Sending request…' : 'Send booking request'} {!submitting && <Check className="w-4 h-4" />}</button>}</div>
                </form>
              )}
            </div>
          </div>
          <aside className="lg:sticky lg:top-8"><div className="glass border border-charcoal-border rounded-2xl p-6"><p className="text-xs uppercase tracking-[0.18em] text-lime">Request summary</p><h2 className="font-display text-2xl text-ivory mt-3">{selectedService?.name || 'Choose a service'}</h2>{presentation && <img src={presentation.image} alt="" className="w-full aspect-[4/3] object-cover rounded-xl mt-5 opacity-80" />}{selectedService && <div className="mt-5 space-y-3 text-sm"><Summary label="Location" value={detailLocation || 'Not set yet'} /><Summary label="Date" value={form.scheduledDate || 'Not set yet'} /><Summary label="Time" value={form.startTime || 'Not set yet'} /><Summary label="Duration" value={form.durationHours ? `${form.durationHours} hours` : 'Not set yet'} /><div className="pt-3 border-t border-charcoal-border/70"><div className="flex items-center justify-between py-3"><span className="text-sm text-ivory-muted">Hourly rate</span><span className="text-sm text-ivory">{formatHourlyRate(selectedService.hourly_rate, selectedService.currency)}</span></div>{estimatedTotal !== null && <div className="flex items-center justify-between py-3"><span className="text-sm text-ivory-muted">Estimate</span><span className="text-sm text-lime font-medium">{formatPrice(estimatedTotal, estimatedCurrency)}</span></div>}</div>{selectedService.hourly_rate === null && <p className="text-xs text-ivory-muted mt-2">Final pricing will be confirmed before payment.</p>}</div>}<p className="mt-4 text-xs text-ivory-muted leading-relaxed">Provider availability is confirmed after the request is reviewed.</p></div></aside>
        </div>
      </div>
    </main>
  );
}

function StepShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.35, ease: easeOut }}><h2 className="text-xl font-medium text-ivory">{title}</h2><p className="text-sm text-ivory-muted mt-1 mb-6">{subtitle}</p>{children}</motion.div>;
}

function Input({ label, value, onChange, error, placeholder, type = 'text', min, required = true }: { label: string; value: string; onChange: (value: string) => void; error?: string; placeholder?: string; type?: string; min?: string; required?: boolean }) {
  return <label className="block"><span className="text-sm text-ivory-dim">{label}</span><input type={type} min={min} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} className="mt-2 w-full px-4 py-3.5 glass-light border border-charcoal-border rounded-xl text-sm text-ivory placeholder:text-ivory-muted focus:outline-none focus:border-lime/50 [color-scheme:dark]" />{error && <FieldError message={error} />}</label>;
}

function TextArea({ label, value, onChange, error, placeholder }: { label: string; value: string; onChange: (value: string) => void; error?: string; placeholder?: string }) {
  return <label className="block"><span className="text-sm text-ivory-dim">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={4} required={!label.includes('optional')} className="mt-2 w-full px-4 py-3.5 glass-light border border-charcoal-border rounded-xl text-sm text-ivory placeholder:text-ivory-muted focus:outline-none focus:border-lime/50 resize-none" />{error && <FieldError message={error} />}</label>;
}

function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm transition-all ${selected ? 'bg-lime text-charcoal' : 'glass-light border border-charcoal-border text-ivory-dim hover:border-lime/30'}`}>{selected && <Check className="w-3.5 h-3.5" />}{children}</button>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 py-3 border-b border-charcoal-border/70"><span className="text-sm text-ivory-muted">{label}</span><span className="text-sm text-ivory text-right max-w-[70%]">{value || 'Not set yet'}</span></div>;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-xs text-red-300">{message}</p> : null;
}
