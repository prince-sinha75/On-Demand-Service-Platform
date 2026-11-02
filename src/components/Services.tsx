import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { services } from '@/data/services';

const easeOut = [0.22, 1, 0.36, 1] as const;

export default function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  // Track which service is currently in view
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const items = Array.from(container.querySelectorAll('[data-service-index]'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt(
              (entry.target as HTMLElement).dataset.serviceIndex || '0',
              10
            );
            setActiveIndex(idx);
          }
        });
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const handleBookService = (serviceId: string) => {
    navigate(`/book?service=${encodeURIComponent(serviceId)}`);
  };

  // Sticky panel transforms
  const stickyScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
  const stickyOpacity = useTransform(scrollYProgress, [0, 0.95, 1], [1, 1, 0.7]);

  return (
    <section
      ref={sectionRef}
      id="services"
      className="relative py-20 md:py-32 px-6 md:px-10"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: easeOut }}
          className="mb-16 md:mb-24 max-w-2xl"
        >
          <span className="text-xs uppercase tracking-[0.2em] text-lime">
            What we offer
          </span>
          <h2 className="font-display text-4xl md:text-6xl text-ivory mt-4 text-balance">
            Six ways to get help,{' '}
            <span className="text-ivory-muted italic font-editorial font-light">
              one platform
            </span>
          </h2>
          <p className="mt-4 text-ivory-dim text-pretty leading-relaxed">
            Scroll through the services we are building. Each one is bookable by the
            hour, with transparent pricing and verified providers.
          </p>
        </motion.div>

        {/* Desktop: sticky two-column layout */}
        <div className="hidden md:grid grid-cols-12 gap-12">
          {/* Sticky visual panel */}
          <div className="col-span-5">
            <motion.div
              style={{
                scale: reducedMotion ? 1 : stickyScale,
                opacity: reducedMotion ? 1 : stickyOpacity,
              }}
              className="sticky top-24"
            >
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-charcoal-light border border-charcoal-border">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIndex}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.7, ease: easeOut }}
                    className="absolute inset-0"
                  >
                    <img
                      src={services[activeIndex].image}
                      alt={services[activeIndex].name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/20 to-transparent" />
                  </motion.div>
                </AnimatePresence>

                {/* Overlay info */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.5, ease: easeOut, delay: 0.15 }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        {services.map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 rounded-full transition-all duration-500 ${
                              i === activeIndex
                                ? 'w-8 bg-lime'
                                : 'w-2 bg-ivory/20'
                            }`}
                          />
                        ))}
                      </div>
                      <h3 className="font-display text-2xl text-ivory">
                        {services[activeIndex].name}
                      </h3>
                      <p className="text-sm text-ivory-dim mt-1.5">
                        {services[activeIndex].description}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <Clock className="w-3.5 h-3.5 text-lime" />
                        <span className="text-xs text-lime font-medium">
                          {services[activeIndex].hourlyPricing}
                        </span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Index indicator */}
                <div className="absolute top-5 right-5 z-10">
                  <span className="font-display text-5xl text-ivory/10">
                    {String(activeIndex + 1).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Scrollable service descriptions */}
          <div ref={scrollContainerRef} className="col-span-7 space-y-[50vh] py-[20vh]">
            {services.map((service, i) => (
              <div
                key={service.id}
                data-service-index={i}
                className={`transition-all duration-500 ${
                  i === activeIndex ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl glass-light border border-charcoal-border shrink-0">
                    <service.icon className="w-5 h-5 text-lime" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-ivory-muted">
                      {String(i + 1).padStart(2, '0')} / {String(services.length).padStart(2, '0')}
                    </span>
                    <h3 className="font-display text-2xl lg:text-3xl text-ivory mt-1">
                      {service.name}
                    </h3>
                    <p className="text-lime text-sm italic font-editorial mt-0.5">
                      {service.tagline}
                    </p>
                  </div>
                </div>

                <p className="text-ivory-dim leading-relaxed ml-16 max-w-lg">
                  {service.longDescription}
                </p>

                <div className="ml-16 mt-5 flex flex-wrap gap-2">
                  {service.features.map((feature) => (
                    <span
                      key={feature}
                      className="text-xs px-3 py-1.5 glass-light border border-charcoal-border rounded-full text-ivory-dim"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <div className="ml-16 mt-6 flex items-center gap-4">
                  <button
                    onClick={() => handleBookService(service.id)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-lime text-charcoal text-sm font-medium rounded-full hover:bg-lime-dark transition-all duration-300 hover:scale-105 group"
                  >
                    Book This Service
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-ivory-muted" />
                    <span className="text-sm text-ivory-muted">{service.hourlyPricing}</span>
                  </div>
                </div>
              </div>
            ))}
            {/* Trailing space */}
            <div className="h-[10vh]" />
          </div>
        </div>

        {/* Mobile: stacked layout with inline images */}
        <div className="md:hidden space-y-12">
          {services.map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, ease: easeOut, delay: i * 0.05 }}
              className="relative"
            >
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-4">
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/30 to-transparent" />
                <div className="absolute top-3 right-3">
                  <span className="font-display text-3xl text-ivory/20">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-lime" />
                  <span className="text-xs text-lime font-medium">{service.hourlyPricing}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg glass-light border border-charcoal-border">
                  <service.icon className="w-4 h-4 text-lime" />
                </div>
                <h3 className="font-display text-xl text-ivory">{service.name}</h3>
              </div>
              <p className="text-lime text-sm italic font-editorial mb-2">{service.tagline}</p>
              <p className="text-ivory-dim text-sm leading-relaxed">{service.longDescription}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {service.features.map((feature) => (
                  <span
                    key={feature}
                    className="text-xs px-3 py-1.5 glass-light border border-charcoal-border rounded-full text-ivory-dim"
                  >
                    {feature}
                  </span>
                ))}
              </div>
              <button
                onClick={() => handleBookService(service.id)}
                className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-lime text-charcoal text-sm font-medium rounded-full group"
              >
                Book This Service
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
