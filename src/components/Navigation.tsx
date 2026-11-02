import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Menu, X, ArrowUpRight, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const navLinks = [
  { label: 'Services', href: '#services' },
  { label: 'Book', href: '/book', route: true },
  { label: 'Trust', href: '#trust' },
  { label: 'About', href: '#cta' },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const navigate = useNavigate();
  const { scrollY } = useScroll();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(!!session));
    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    navigate('/');
  };

  useMotionValueEvent(scrollY, 'change', (val) => {
    setScrolled(val > 60);
  });

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleRouteClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    setMenuOpen(false);
    navigate(path);
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const navLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, link: { href: string; route?: boolean }) => {
    if (link.route) {
      handleRouteClick(e, link.href);
    } else {
      handleNavClick(e, link.href);
    }
  };

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'glass border-b border-charcoal-border/50' : 'bg-transparent'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a
            href="#top"
            onClick={(e) => handleNavClick(e, '#top')}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-lime flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
              <span className="text-charcoal font-display text-sm">H</span>
            </div>
            <span className="font-display text-lg tracking-tight text-ivory">
              Hourhand
            </span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => navLinkClick(e, link)}
                className="relative text-sm text-ivory-dim hover:text-ivory transition-colors duration-300 group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-lime transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
            <a
              href="/book"
              onClick={(e) => handleRouteClick(e, '/book')}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-lime text-charcoal text-sm font-medium rounded-full hover:bg-lime-dark transition-all duration-300 hover:scale-105 group"
            >
              Book a Service
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            {signedIn ? (
              <button
                type="button"
                onClick={signOut}
                className="flex items-center gap-1.5 text-sm text-ivory-muted hover:text-ivory transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            ) : null}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 text-ivory"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <div className="relative w-5 h-5">
              <Menu
                className={`absolute inset-0 transition-all duration-300 ${
                  menuOpen ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'
                }`}
              />
              <X
                className={`absolute inset-0 transition-all duration-300 ${
                  menuOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'
                }`}
              />
            </div>
          </button>
        </nav>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 md:hidden glass"
          >
            <div className="flex flex-col items-center justify-center h-full gap-8">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => navLinkClick(e, link)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
                  className="text-3xl font-display text-ivory hover:text-lime transition-colors"
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.a
                href="/book"
                onClick={(e) => handleRouteClick(e, '/book')}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42, duration: 0.5 }}
                className="mt-4 flex items-center gap-2 px-8 py-4 bg-lime text-charcoal font-medium rounded-full text-lg"
              >
                Book a Service
                <ArrowUpRight className="w-5 h-5" />
              </motion.a>
              {signedIn ? (
                <motion.button
                  type="button"
                  onClick={signOut}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="flex items-center gap-2 text-ivory-muted hover:text-ivory transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sign out
                </motion.button>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
