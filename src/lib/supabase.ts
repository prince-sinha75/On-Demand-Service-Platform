import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase configuration is missing.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type ServiceCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  kind: 'driver' | 'home' | 'companionship';
  active: boolean;
  hourly_rate: number | null;
  currency: string;
};

export type Booking = {
  id: string;
  reference: string;
  service_id: string;
  location: string;
  scheduled_date: string;
  start_time: string;
  duration_hours: number;
  details: Record<string, string>;
  status: 'requested' | 'confirmed' | 'cancelled' | 'completed' | 'rejected';
  created_at: string;
  hourly_rate: number | null;
  currency: string;
  estimated_total: number | null;
  provider_id: string | null;
  confirmed_at: string | null;
  service_categories?: Pick<ServiceCategory, 'name' | 'slug'> | null;
  provider_profiles?: { display_name: string | null; service_area: string | null } | null;
};

export type ProviderProfile = {
  id: string;
  user_id: string;
  display_name: string | null;
  bio: string | null;
  service_area: string | null;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProviderService = {
  id: string;
  provider_id: string;
  service_id: string;
  created_at: string;
};

export type ProviderAvailability = {
  id: string;
  provider_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
};

export type BookingStatusHistory = {
  id: string;
  booking_id: string;
  previous_status: string | null;
  new_status: string;
  changed_by: string | null;
  note: string | null;
  created_at: string;
};

export type EligibleProvider = {
  provider_id: string;
  display_name: string | null;
  service_area: string | null;
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: '\u00A3',
  USD: '$',
  EUR: '\u20AC',
};

export function formatPrice(amount: number | null | undefined, currency: string): string {
  if (amount === null || amount === undefined) return 'Price to be confirmed';
  const symbol = CURRENCY_SYMBOLS[currency] || currency + ' ';
  return `${symbol}${amount.toFixed(2)}`;
}

export function formatHourlyRate(amount: number | null | undefined, currency: string): string {
  if (amount === null || amount === undefined) return 'Price to be confirmed';
  return `${formatPrice(amount, currency)}/hr`;
}
