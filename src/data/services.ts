import {
  Car,
  Wrench,
  Zap,
  WashingMachine,
  Hammer,
  HeartHandshake,
  type LucideIcon,
} from 'lucide-react';

export interface ServiceData {
  id: string;
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  hourlyPricing: string;
  image: string;
  icon: LucideIcon;
  features: string[];
}

export const services: ServiceData[] = [
  {
    id: 'personal-driver',
    name: 'Personal Driver',
    tagline: 'Your car. Their expertise.',
    description:
      'A professional drives your own vehicle so you can relax, work, or just enjoy the ride.',
    longDescription:
      'Whether it is a daily commute, a scheduled trip, or a night out, a qualified driver takes the wheel of your own car. Book by the hour or schedule ahead — no need to leave your vehicle behind.',
    hourlyPricing: 'Hourly pricing',
    image:
      'https://images.pexels.com/photos/8425394/pexels-photo-8425394.jpeg?auto=compress&cs=tinysrgb&h=900&w=700',
    icon: Car,
    features: ['Hourly or scheduled bookings', 'Drives your own vehicle', 'Verified, experienced drivers'],
  },
  {
    id: 'home-plumbing',
    name: 'Home Plumbing',
    tagline: 'Leaks fixed. Pipes sorted.',
    description:
      'Plumbing repairs, leak fixes, and common household plumbing tasks — charged by the hour.',
    longDescription:
      'From dripping taps to more complex pipe repairs, get a qualified plumber to your door. Transparent hourly pricing means you only pay for the time the job actually takes.',
    hourlyPricing: 'Hourly pricing',
    image:
      'https://images.pexels.com/photos/32588548/pexels-photo-32588548.jpeg?auto=compress&cs=tinysrgb&h=900&w=700',
    icon: Wrench,
    features: ['Leak detection and repair', 'Fixture installation', 'Transparent hourly rates'],
  },
  {
    id: 'electrical-repair',
    name: 'Electrical Repair',
    tagline: 'Safe hands. Certified work.',
    description:
      'Electrical troubleshooting and eligible repair services from qualified providers.',
    longDescription:
      'Troubleshooting, socket replacements, panel checks, and eligible electrical repairs — performed by providers with appropriate qualifications. Safety first, always.',
    hourlyPricing: 'Hourly pricing',
    image:
      'https://images.pexels.com/photos/34054464/pexels-photo-34054464.jpeg?auto=compress&cs=tinysrgb&h=900&w=700',
    icon: Zap,
    features: ['Troubleshooting and diagnostics', 'Qualified electricians', 'Safety-compliant repairs'],
  },
  {
    id: 'appliance-maintenance',
    name: 'Appliance Maintenance',
    tagline: 'Keep things running.',
    description:
      'Maintenance and repair assistance for the household appliances you rely on every day.',
    longDescription:
      'When the washing machine stutters or the oven runs cold, book a technician who can diagnose and repair common household appliances — without the wait-and-see.',
    hourlyPricing: 'Hourly pricing',
    image:
      'https://images.pexels.com/photos/38190070/pexels-photo-38190070.jpeg?auto=compress&cs=tinysrgb&h=900&w=700',
    icon: WashingMachine,
    features: ['Diagnostics and repair', 'Common household appliances', 'Hourly service charge'],
  },
  {
    id: 'home-assistance',
    name: 'Home Assistance',
    tagline: 'An extra pair of hands.',
    description:
      'Carpentry, painting, cleaning, and general household helper services by the hour.',
    longDescription:
      'From hanging shelves to fresh paint to a deep clean, get practical help with the tasks that pile up. Book the right helper for the job and pay for the hours you need.',
    hourlyPricing: 'Hourly pricing',
    image:
      'https://images.pexels.com/photos/5691506/pexels-photo-5691506.jpeg?auto=compress&cs=tinysrgb&h=900&w=700',
    icon: Hammer,
    features: ['Carpentry and painting', 'Cleaning and organization', 'Flexible hourly help'],
  },
  {
    id: 'social-companionship',
    name: 'Social Companionship',
    tagline: 'Good company, on your terms.',
    description:
      'Book a companion for conversation, a café visit, a walk, or another appropriate public outing.',
    longDescription:
      'Sometimes you just want company for a coffee, a walk in the park, or a casual outing. Social companionship is consensual, non-sexual, and charged by the hour — so you can enjoy time with someone who is glad to be there.',
    hourlyPricing: 'Hourly pricing',
    image:
      'https://images.pexels.com/photos/4255403/pexels-photo-4255403.jpeg?auto=compress&cs=tinysrgb&h=900&w=700',
    icon: HeartHandshake,
    features: ['Conversation and café visits', 'Walks and public outings', 'Consensual, non-sexual companionship'],
  },
];

export const heroShortcuts = [
  { id: 'personal-driver', label: 'Personal Driver', icon: Car },
  { id: 'home-plumbing', label: 'Home Services', icon: Wrench },
  { id: 'social-companionship', label: 'Companionship', icon: HeartHandshake },
];

export const heroImage =
  'https://images.pexels.com/photos/5988831/pexels-photo-5988831.jpeg?auto=compress&cs=tinysrgb&h=1000&w=1400';
