import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Search, MapPin, Sparkles, LocateFixed, LoaderCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { heroShortcuts, heroImage } from '@/data/services';

const easeOut = [0.22, 1, 0.36, 1] as const;

type HeroProps = {
  onLocationResolved: (location: string) => void;
};

type ReverseGeocodeResponse = {
  display_name?: string;
};

export default function Hero({ onLocationResolved }: HeroProps) {
  const ref = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const [searchValue, setSearchValue] = useState('');
  const [locationState, setLocationState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [locationMessage, setLocationMessage] = useState('');

  const scrollToBooking = () => {
    document.querySelector('#booking')?.scrollIntoView({ behavior: 'smooth' });
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationState('error');
      setLocationMessage('Location detection is not supported in this browser.');
      return;
    }

    setLocationState('loading');
    setLocationMessage('Finding your location…');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`
          );
          if (!response.ok) throw new Error('Could not resolve address');
          const data = (await response.json()) as ReverseGeocodeResponse;
          const location = data.display_name?.trim();
          if (!location) throw new Error('No address found');
          setSearchValue(location);
          onLocationResolved(location);
          setLocationState('success');
          setLocationMessage('Location found.');
        } catch {
          setLocationState('error');
          setLocationMessage('We found your coordinates but could not read the address.');
        }
      },
      (error) => {
        setLocationState('error');
        setLocationMessage(
          error.code === error.PERMISSION_DENIED
            ? 'Location permission was denied. Enter your area instead.'
            : 'Could not find your location. Enter your area instead.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const location = searchValue.trim();
    if (!location) {
      detectLocation();
      return;
    }
    onLocationResolved(location);
    scrollToBooking();
  };

  const scrollToServices = () => {
    const services = document.querySelector('#services');
    if (services) services.scrollIntoView({ behavior: 'smooth' });
  };

  const handleShortcut = (serviceId: string) => {
    navigate(`/book?service=${encodeURIComponent(serviceId)}`);
  };

  return (
    <section
      ref={ref}
      id="top"
      className="relative min-h-screen flex items-center pt-20 pb-12 px-6 md:px-10"
    >
      <motion.div
        style={{ y: reducedMotion ? 0 : contentY, opacity: reducedMotion ? 1 : opacity }}
        className="max-w-7xl mx-auto w-full grid lg:grid-cols-12 gap-8 lg:gap-12 items-center"
      >
        {/* Left: Headline + search */}
        <div className="lg:col-span-7 relative z-10">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOut }}
            className="flex items-center gap-2 mb-8"
          >
            <div className="w-2 h-2 rounded-full bg-lime animate-pulse-soft" />
            <span className="text-xs uppercase tracking-[0.2em] text-ivory-muted">
              On-demand, by the hour
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="font-display text-[2.75rem] sm:text-6xl lg:text-7xl xl:text-[5.5rem] text-ivory text-balance">
            {['The Right Help.', 'Right When You', 'Need It.'].map((line, i) => (
              <span key={i} className="block overflow-hidden">
                <motion.span
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.9, ease: easeOut, delay: 0.15 + i * 0.12 }}
                  className="block"
                >
                  {line === 'Right When You' && (
                    <span className="text-lime italic font-editorial font-light">
                      Right When You{' '}
                    </span>
                  )}
                  {line !== 'Right When You' && line}
                  {line === 'Right When You' && null}
                </motion.span>
              </span>
            ))}
          </h1>

          {/* Supporting text */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeOut, delay: 0.55 }}
            className="mt-6 text-base lg:text-lg text-ivory-dim max-w-xl text-pretty leading-relaxed"
          >
            From getting behind the wheel to fixing things at home or finding company
            for an outing, book the help you need, by the hour.
          </motion.p>

          {/* Search / booking entry */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeOut, delay: 0.7 }}
            className="mt-8 flex flex-col sm:flex-row gap-3 max-w-xl"
          >
            <div className="relative flex-1">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-muted" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  if (locationState !== 'idle') setLocationState('idle');
                  if (locationMessage) setLocationMessage('');
                }}
                placeholder="Enter your location to find help nearby"
                aria-label="Service location"
                className="w-full pl-11 pr-12 py-3.5 glass-light border border-charcoal-border rounded-xl text-sm text-ivory placeholder:text-ivory-muted focus:outline-none focus:border-lime/50 transition-colors"
              />
              <button
                type="button"
                onClick={detectLocation}
                disabled={locationState === 'loading'}
                aria-label="Use my current location"
                title="Use my current location"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-ivory-muted hover:text-lime disabled:opacity-50 transition-colors"
              >
                {locationState === 'loading' ? (
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                ) : (
                  <LocateFixed className="w-4 h-4" />
                )}
              </button>
            </div>
            <button
              type="submit"
              disabled={locationState === 'loading'}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-lime text-charcoal font-medium text-sm rounded-xl hover:bg-lime-dark transition-all duration-300 hover:scale-[1.02] group whitespace-nowrap disabled:opacity-60 disabled:hover:scale-100"
            >
              <Search className="w-4 h-4" />
              {searchValue.trim() ? 'Find Help' : 'Use My Location'}
            </button>
          </motion.form>
          <div aria-live="polite" className="min-h-5 mt-2 text-xs">
            {locationMessage && (
              <span className={locationState === 'error' ? 'text-red-300' : 'text-ivory-muted'}>
                {locationMessage}
              </span>
            )}
          </div>

          {/* Service shortcuts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeOut, delay: 0.85 }}
            className="mt-6 flex flex-wrap gap-3"
          >
            {heroShortcuts.map((shortcut) => (
              <button
                key={shortcut.id}
                onClick={() => handleShortcut(shortcut.id)}
                className="flex items-center gap-2 px-4 py-2 glass-light border border-charcoal-border rounded-full text-sm text-ivory-dim hover:text-ivory hover:border-lime/40 transition-all duration-300 group"
              >
                <shortcut.icon className="w-4 h-4 text-lime group-hover:scale-110 transition-transform" />
                {shortcut.label}
              </button>
            ))}
          </motion.div>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeOut, delay: 1 }}
            className="mt-10 flex items-center gap-4"
          >
            <button
              onClick={scrollToServices}
              className="flex items-center gap-2 text-ivory font-medium text-sm group"
            >
              <span className="border-b border-ivory/30 group-hover:border-lime transition-colors pb-0.5">
                Explore Services
              </span>
              <ArrowUpRight className="w-4 h-4 text-lime group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
            <span className="text-ivory-muted text-xs">No subscription required</span>
          </motion.div>
        </div>

        {/* Right: Image with floating elements */}
        <div className="lg:col-span-5 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: easeOut, delay: 0.3 }}
            style={{ y: reducedMotion ? 0 : imageY, scale: reducedMotion ? 1 : imageScale }}
            className="relative aspect-[4/5] rounded-2xl overflow-hidden"
          >
            <img
              src={heroImage}
              alt="A scenic drive along a coastal road at sunset"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent" />
          </motion.div>

          {/* Floating card: live booking */}
          <motion.div
            initial={{ opacity: 0, x: 30, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.8, ease: easeOut, delay: 1.1 }}
            className="absolute -bottom-4 -left-4 sm:-left-8 glass border border-charcoal-border rounded-2xl p-4 w-48 shadow-2xl"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-lime/20 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-lime" />
              </div>
              <span className="text-xs text-ivory-dim font-medium">Live preview</span>
            </div>
            <p className="text-sm text-ivory leading-snug">Personal Driver</p>
            <p className="text-xs text-ivory-muted mt-1">Hourly pricing</p>
            <div className="mt-3 flex items-center gap-1.5">
              <div className="h-1.5 flex-1 rounded-full bg-charcoal-border overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '60%' }}
                  transition={{ duration: 1.2, ease: easeOut, delay: 1.5 }}
                  className="h-full bg-lime rounded-full"
                />
              </div>
              <span className="text-[10px] text-ivory-muted">2h booked</span>
            </div>
          </motion.div>

          {/* Floating card: rating-like element but reframed as trust badge */}
          <motion.div
            initial={{ opacity: 0, x: -20, y: -10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.8, ease: easeOut, delay: 1.3 }}
            className="absolute -top-4 -right-2 sm:-right-6 glass border border-charcoal-border rounded-xl px-4 py-3 shadow-2xl"
          >
            <p className="text-xs text-ivory-muted">Verified providers</p>
            <p className="text-sm text-ivory font-medium mt-0.5">Qualification-checked</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] uppercase tracking-[0.2em] text-ivory-muted">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-ivory-muted to-transparent" />
      </motion.div>
    </section>
  );
}
