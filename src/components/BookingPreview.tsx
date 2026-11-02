import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  Info,
  Timer,
} from 'lucide-react';
import { services } from '@/data/services';

const easeOut = [0.22, 1, 0.36, 1] as const;

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00',
];

const durations = [
  { label: '1 hour', value: 1 },
  { label: '2 hours', value: 2 },
  { label: '3 hours', value: 3 },
  { label: '4 hours', value: 4 },
  { label: '6 hours', value: 6 },
  { label: '8 hours', value: 8 },
];

interface BookingState {
  serviceId: string;
  location: string;
  date: string;
  time: string;
  duration: number;
}

type BookingPreviewProps = {
  initialLocation?: string;
};

export default function BookingPreview({ initialLocation = '' }: BookingPreviewProps) {
  const [step, setStep] = useState(0);
  const [booking, setBooking] = useState<BookingState>({
    serviceId: '',
    location: initialLocation,
    date: '',
    time: '',
    duration: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialLocation) {
      setBooking((current) => ({ ...current, location: initialLocation }));
    }
  }, [initialLocation]);

  const steps = ['Service', 'Location', 'Date & Time', 'Duration', 'Summary'];
  const selectedService = services.find((s) => s.id === booking.serviceId);

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (currentStep === 0 && !booking.serviceId) newErrors.serviceId = 'Please select a service';
    if (currentStep === 1 && !booking.location.trim()) newErrors.location = 'Please enter a location';
    if (currentStep === 2) {
      if (!booking.date) newErrors.date = 'Please choose a date';
      if (!booking.time) newErrors.time = 'Please choose a time';
    }
    if (currentStep === 3 && !booking.duration) newErrors.duration = 'Please select a duration';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 0));
    setErrors({});
  };

  const handleReset = () => {
    setBooking({ serviceId: '', location: '', date: '', time: '', duration: 0 });
    setStep(0);
    setErrors({});
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <section id="booking" className="relative py-20 md:py-32 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: easeOut }}
          className="mb-12 md:mb-16 max-w-2xl"
        >
          <span className="text-xs uppercase tracking-[0.2em] text-lime">
            Booking preview
          </span>
          <h2 className="font-display text-4xl md:text-6xl text-ivory mt-4 text-balance">
            See how booking{' '}
            <span className="text-ivory-muted italic font-editorial font-light">feels</span>
          </h2>
          <p className="mt-4 text-ivory-dim text-pretty leading-relaxed">
            A guided preview of the booking flow. This is a product preview — no real
            booking is placed and no provider availability is confirmed yet.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Booking form panel */}
          <div className="lg:col-span-7">
            <div className="glass border border-charcoal-border rounded-2xl p-6 md:p-8">
              {/* Preview badge */}
              <div className="flex items-center gap-2 mb-6 pb-6 border-b border-charcoal-border">
                <Info className="w-4 h-4 text-lime" />
                <span className="text-xs text-ivory-dim">
                  Product preview — not a live booking
                </span>
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-8">
                {steps.map((label, i) => (
                  <div key={label} className="flex items-center gap-2 flex-1">
                    <div
                      className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium transition-all duration-300 ${
                        i === step
                          ? 'bg-lime text-charcoal scale-110'
                          : i < step
                          ? 'bg-lime/20 text-lime'
                          : 'bg-charcoal-border text-ivory-muted'
                      }`}
                    >
                      {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                    {i < steps.length - 1 && (
                      <div
                        className={`h-px flex-1 transition-colors duration-300 ${
                          i < step ? 'bg-lime/40' : 'bg-charcoal-border'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Step content */}
              <div className="min-h-[280px]">
                <AnimatePresence mode="wait">
                  {/* Step 0: Service selection */}
                  {step === 0 && (
                    <motion.div
                      key="service"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4, ease: easeOut }}
                    >
                      <h3 className="text-lg font-medium text-ivory mb-1">Select a service</h3>
                      <p className="text-sm text-ivory-muted mb-5">Choose what you need help with</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {services.map((service) => (
                          <button
                            key={service.id}
                            onClick={() => {
                              setBooking({ ...booking, serviceId: service.id });
                              setErrors({});
                            }}
                            className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-300 ${
                              booking.serviceId === service.id
                                ? 'border-lime bg-lime/5 scale-[1.02]'
                                : 'border-charcoal-border glass-light hover:border-lime/30'
                            }`}
                          >
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-charcoal-border shrink-0">
                              <service.icon className="w-5 h-5 text-ivory" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-ivory font-medium truncate">{service.name}</p>
                              <p className="text-xs text-ivory-muted">{service.hourlyPricing}</p>
                            </div>
                            {booking.serviceId === service.id && (
                              <Check className="w-4 h-4 text-lime shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                      {errors.serviceId && (
                        <p className="mt-3 text-sm text-red-400 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {errors.serviceId}
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* Step 1: Location */}
                  {step === 1 && (
                    <motion.div
                      key="location"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4, ease: easeOut }}
                    >
                      <h3 className="text-lg font-medium text-ivory mb-1">Where do you need help?</h3>
                      <p className="text-sm text-ivory-muted mb-5">Enter your address or neighborhood</p>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ivory-muted" />
                        <input
                          type="text"
                          value={booking.location}
                          onChange={(e) => {
                            setBooking({ ...booking, location: e.target.value });
                            setErrors({});
                          }}
                          placeholder="e.g. Shoreditch, London"
                          className="w-full pl-12 pr-4 py-4 glass-light border border-charcoal-border rounded-xl text-ivory placeholder:text-ivory-muted focus:outline-none focus:border-lime/50 transition-colors"
                        />
                      </div>
                      {errors.location && (
                        <p className="mt-3 text-sm text-red-400 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {errors.location}
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* Step 2: Date & Time */}
                  {step === 2 && (
                    <motion.div
                      key="datetime"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4, ease: easeOut }}
                    >
                      <h3 className="text-lg font-medium text-ivory mb-1">When should help arrive?</h3>
                      <p className="text-sm text-ivory-muted mb-5">Pick a date and time slot</p>
                      <div className="space-y-4">
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ivory-muted" />
                          <input
                            type="date"
                            min={today}
                            value={booking.date}
                            onChange={(e) => {
                              setBooking({ ...booking, date: e.target.value });
                              setErrors({ ...errors, date: '' });
                            }}
                            className="w-full pl-12 pr-4 py-4 glass-light border border-charcoal-border rounded-xl text-ivory placeholder:text-ivory-muted focus:outline-none focus:border-lime/50 transition-colors [color-scheme:dark]"
                          />
                        </div>
                        {errors.date && (
                          <p className="text-sm text-red-400 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {errors.date}
                          </p>
                        )}
                        <div>
                          <p className="text-sm text-ivory-dim mb-3">Available time slots</p>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {timeSlots.map((slot) => (
                              <button
                                key={slot}
                                onClick={() => {
                                  setBooking({ ...booking, time: slot });
                                  setErrors({ ...errors, time: '' });
                                }}
                                className={`py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                  booking.time === slot
                                    ? 'bg-lime text-charcoal scale-105'
                                    : 'glass-light border border-charcoal-border text-ivory-dim hover:border-lime/30'
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                          {errors.time && (
                            <p className="mt-3 text-sm text-red-400 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {errors.time}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Duration */}
                  {step === 3 && (
                    <motion.div
                      key="duration"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4, ease: easeOut }}
                    >
                      <h3 className="text-lg font-medium text-ivory mb-1">How long do you need?</h3>
                      <p className="text-sm text-ivory-muted mb-5">Select the expected duration</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {durations.map((dur) => (
                          <button
                            key={dur.value}
                            onClick={() => {
                              setBooking({ ...booking, duration: dur.value });
                              setErrors({});
                            }}
                            className={`flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                              booking.duration === dur.value
                                ? 'bg-lime text-charcoal scale-105'
                                : 'glass-light border border-charcoal-border text-ivory-dim hover:border-lime/30'
                            }`}
                          >
                            <Timer className="w-4 h-4" />
                            {dur.label}
                          </button>
                        ))}
                      </div>
                      {errors.duration && (
                        <p className="mt-3 text-sm text-red-400 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {errors.duration}
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* Step 4: Summary */}
                  {step === 4 && (
                    <motion.div
                      key="summary"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4, ease: easeOut }}
                    >
                      <h3 className="text-lg font-medium text-ivory mb-1">Booking summary</h3>
                      <p className="text-sm text-ivory-muted mb-5">Review your selection</p>
                      <div className="space-y-4">
                        <SummaryRow label="Service" value={selectedService?.name || ''} icon={selectedService?.icon} />
                        <SummaryRow label="Location" value={booking.location} icon={MapPin} />
                        <SummaryRow label="Date" value={booking.date} icon={Calendar} />
                        <SummaryRow label="Time" value={booking.time} icon={Clock} />
                        <SummaryRow label="Duration" value={`${booking.duration} hour${booking.duration > 1 ? 's' : ''}`} icon={Timer} />
                        <div className="pt-4 border-t border-charcoal-border">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-ivory-dim">Estimated price</span>
                            <span className="text-sm text-lime font-medium">
                              {selectedService?.hourlyPricing || 'Hourly pricing'}
                            </span>
                          </div>
                          <p className="text-xs text-ivory-muted mt-2">
                            Final pricing will be shown when rates are configured and a provider is matched.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-charcoal-border">
                <button
                  onClick={handleBack}
                  disabled={step === 0}
                  className={`flex items-center gap-2 text-sm transition-all ${
                    step === 0
                      ? 'text-ivory-muted/40 cursor-not-allowed'
                      : 'text-ivory-dim hover:text-ivory'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                {step < steps.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-6 py-3 bg-lime text-charcoal text-sm font-medium rounded-xl hover:bg-lime-dark transition-all duration-300 hover:scale-105 group"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-6 py-3 glass-light border border-charcoal-border text-ivory text-sm font-medium rounded-xl hover:border-lime/30 transition-all duration-300"
                  >
                    Start Over
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Summary sidebar */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.8, ease: easeOut, delay: 0.2 }}
              className="sticky top-24"
            >
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-charcoal-light border border-charcoal-border">
                <AnimatePresence mode="wait">
                  {selectedService ? (
                    <motion.div
                      key={selectedService.id}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6, ease: easeOut }}
                      className="absolute inset-0"
                    >
                      <img
                        src={selectedService.image}
                        alt={selectedService.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/30 to-transparent" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full glass-light flex items-center justify-center mx-auto mb-4">
                          <Calendar className="w-7 h-7 text-ivory-muted" />
                        </div>
                        <p className="text-sm text-ivory-muted">
                          Your selection appears here
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Live summary overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                  <p className="text-xs uppercase tracking-[0.15em] text-lime mb-2">
                    Your booking
                  </p>
                  <h4 className="font-display text-xl text-ivory">
                    {selectedService?.name || 'No service selected'}
                  </h4>
                  <div className="mt-3 space-y-1.5">
                    {booking.location && (
                      <p className="text-sm text-ivory-dim flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-ivory-muted" />
                        {booking.location}
                      </p>
                    )}
                    {booking.date && (
                      <p className="text-sm text-ivory-dim flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-ivory-muted" />
                        {booking.date}
                        {booking.time && ` · ${booking.time}`}
                      </p>
                    )}
                    {booking.duration > 0 && (
                      <p className="text-sm text-ivory-dim flex items-center gap-1.5">
                        <Timer className="w-3.5 h-3.5 text-ivory-muted" />
                        {booking.duration} hour{booking.duration > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Preview notice */}
              <div className="mt-4 flex items-start gap-2.5 p-4 glass border border-charcoal-border rounded-xl">
                <Info className="w-4 h-4 text-lime shrink-0 mt-0.5" />
                <p className="text-xs text-ivory-dim leading-relaxed">
                  This is an interactive product preview. No booking is placed, no
                  provider is reserved, and pricing has not been configured yet.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-ivory-muted">{label}</span>
      <span className="text-sm text-ivory font-medium flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-lime" />}
        {value || '—'}
      </span>
    </div>
  );
}
