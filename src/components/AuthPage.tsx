import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const destination = typeof location.state?.from === 'string' ? location.state.from : '/book';

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (mode === 'signup' && password.length < 8) {
      setError('Choose a password with at least 8 characters that is not easy to guess.');
      return;
    }
    setLoading(true);

    const result = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name.trim() } },
        });

    setLoading(false);
    if (result.error) {
      const weakPassword = result.error.message.toLowerCase().includes('weak_password');
      setError(weakPassword
        ? 'Choose a stronger password that is not easy to guess.'
        : mode === 'signin'
        ? 'We could not sign you in. Check your email and password.'
        : 'We could not create your account. Please check your details and try again.');
      return;
    }

    if (mode === 'signup' && !result.data.session) {
      setMessage('Your account is ready. Check your email if confirmation is required, then sign in.');
      setMode('signin');
      return;
    }

    navigate(destination, { replace: true });
  };

  return (
    <main className="relative min-h-screen px-6 py-12 md:px-10 flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal-light/40 to-charcoal" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-ivory-muted hover:text-ivory transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hourhand
        </button>
        <div className="glass border border-charcoal-border rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-2 mb-7">
            <div className="w-8 h-8 rounded-lg bg-lime flex items-center justify-center">
              <span className="text-charcoal font-display text-sm">H</span>
            </div>
            <span className="font-display text-lg text-ivory">Hourhand</span>
          </div>
          <p className="text-xs uppercase tracking-[0.18em] text-lime">Your account</p>
          <h1 className="font-display text-4xl text-ivory mt-3">
            {mode === 'signin' ? 'Welcome back.' : 'Make time for help.'}
          </h1>
          <p className="text-sm text-ivory-dim mt-3 leading-relaxed">
            {mode === 'signin'
              ? 'Sign in to continue your booking and manage your requests.'
              : 'Create an account to place and manage service bookings.'}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {mode === 'signup' && (
              <label className="block">
                <span className="sr-only">Name</span>
                <div className="relative">
                  <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-muted" />
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    required
                    className="w-full pl-11 pr-4 py-3.5 glass-light border border-charcoal-border rounded-xl text-sm text-ivory placeholder:text-ivory-muted focus:outline-none focus:border-lime/50"
                  />
                </div>
              </label>
            )}
            <label className="block">
              <span className="sr-only">Email address</span>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email address"
                  autoComplete="email"
                  required
                  className="w-full pl-11 pr-4 py-3.5 glass-light border border-charcoal-border rounded-xl text-sm text-ivory placeholder:text-ivory-muted focus:outline-none focus:border-lime/50"
                />
              </div>
            </label>
            <label className="block">
              <span className="sr-only">Password</span>
              <div className="relative">
                <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  minLength={8}
                  required
                  className="w-full pl-11 pr-4 py-3.5 glass-light border border-charcoal-border rounded-xl text-sm text-ivory placeholder:text-ivory-muted focus:outline-none focus:border-lime/50"
                />
              </div>
            </label>
            {error && <p className="text-sm text-red-300">{error}</p>}
            {message && <p className="text-sm text-lime leading-relaxed">{message}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-lime text-charcoal font-medium rounded-xl hover:bg-lime-dark transition-all disabled:opacity-60"
            >
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError('');
              setMessage('');
            }}
            className="w-full mt-5 text-sm text-ivory-muted hover:text-ivory transition-colors"
          >
            {mode === 'signin' ? 'New to Hourhand? Create an account' : 'Already have an account? Sign in'}
          </button>
        </div>
      </motion.div>
    </main>
  );
}
