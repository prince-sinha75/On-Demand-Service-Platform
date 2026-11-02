import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const easeOut = [0.22, 1, 0.36, 1] as const;

export default function FinalCTA() {
  const ref = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const handleMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        setMouse({
          x: (e.clientX - rect.left) / rect.width - 0.5,
          y: (e.clientY - rect.top) / rect.height - 0.5,
        });
      });
    };
    el.addEventListener('mousemove', handleMove);
    return () => {
      el.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  const handleExplore = () => {
    const el = document.querySelector('#services');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section ref={ref} id="cta" className="relative py-24 md:py-40 px-6 md:px-10 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Contour lines that respond to mouse */}
        <svg
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          viewBox="0 0 1440 600"
          style={{
            transform: `translate(${mouse.x * 40}px, ${mouse.y * 40}px)`,
            transition: 'transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => {
            const y = 80 + i * 70;
            return (
              <path
                key={i}
                d={`M -100 ${y} C 300 ${y - 30 - i * 5}, 600 ${y + 40 + i * 3}, 900 ${y - 20 - i * 4} S 1300 ${y + 30 - i * 6}, 1600 ${y}`}
                fill="none"
                stroke="rgba(197, 248, 42, 0.05)"
                strokeWidth="1"
              />
            );
          })}
        </svg>

        {/* Mouse-following glow */}
        {!reducedMotion && (
          <div
            className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${mouse.x * 80}px), calc(-50% + ${mouse.y * 80}px))`,
              background:
                'radial-gradient(circle, rgba(197, 248, 42, 0.08) 0%, transparent 60%)',
              transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        )}
      </div>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="flex items-center justify-center gap-2 mb-8"
        >
          <div className="w-2 h-2 rounded-full bg-lime animate-pulse-soft" />
          <span className="text-xs uppercase tracking-[0.2em] text-ivory-muted">
            Ready when you are
          </span>
        </motion.div>

        {/* Headline with staggered reveal */}
        <h2 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[6rem] text-ivory text-balance leading-[0.95]">
          {['Your Time Matters.', 'Let Us Help.'].map((line, i) => (
            <span key={i} className="block overflow-hidden">
              <motion.span
                initial={{ y: '100%' }}
                whileInView={{ y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: easeOut, delay: i * 0.15 }}
                className={`block ${i === 1 ? 'text-lime italic font-editorial font-light' : ''}`}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h2>

        {/* Supporting text */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, ease: easeOut, delay: 0.35 }}
          className="mt-6 text-lg text-ivory-dim max-w-xl mx-auto text-pretty"
        >
          Find the right help for your next task, journey, or outing.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, ease: easeOut, delay: 0.5 }}
          className="mt-10"
        >
          <button
            onClick={handleExplore}
            className="inline-flex items-center gap-2 px-8 py-4 bg-lime text-charcoal font-medium text-lg rounded-full hover:bg-lime-dark transition-all duration-300 hover:scale-105 group"
          >
            Explore Services
            <ArrowUpRight className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </button>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-24 md:mt-32 pt-10 border-t border-charcoal-border relative z-10">
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {/* Logo + tagline */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-lime flex items-center justify-center">
                <span className="text-charcoal font-display text-xs">H</span>
              </div>
              <span className="font-display text-base text-ivory">Hourhand</span>
            </div>
            <p className="text-sm text-ivory-muted max-w-xs leading-relaxed">
              On-demand help by the hour — driving, home services, and companionship.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-ivory-muted mb-4">
              Navigate
            </p>
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'Services', href: '#services', route: false },
                { label: 'Book a Service', href: '/book', route: true },
                { label: 'Trust & Safety', href: '#trust', route: false },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    if (link.route) {
                      navigate(link.href);
                    } else {
                      document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="text-sm text-ivory-dim hover:text-lime transition-colors w-fit"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-ivory-muted mb-4">
              Stay in the loop
            </p>
            <p className="text-sm text-ivory-dim leading-relaxed max-w-xs">
              Support and contact details will appear here when the service is ready for launch.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-charcoal-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ivory-muted">
            © {new Date().getFullYear()} Hourhand. All rights reserved.
          </p>
          <p className="text-xs text-ivory-muted">
            Product preview — not yet live for bookings
          </p>
        </div>
      </footer>
    </section>
  );
}
