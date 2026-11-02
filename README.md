# Hourhand — On-Demand Service Platform

> Book skilled help by the hour. No subscriptions, no guesswork — just transparent hourly pricing.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-lime?style=for-the-badge)](https://prince-sinha75.github.io/On-Demand-Service-Platform/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)

---

## 🔗 Live Demo

**[https://prince-sinha75.github.io/On-Demand-Service-Platform/](https://prince-sinha75.github.io/On-Demand-Service-Platform/)**

> Sign up for a free account to explore bookings, or register as a provider to see the provider dashboard.

---

## 📖 Overview

**Hourhand** is a full-stack on-demand service marketplace built with React and Supabase. Customers can browse six service categories, request a booking with full scheduling details, and manage their requests in real time. Providers register through a dedicated dashboard, set their weekly availability, and receive assigned bookings.

The entire platform runs on transparent **hourly pricing** — no hidden fees, no subscriptions.

---

## ✨ Features

### For Customers
- 🔍 **Browse services** — six categories with descriptions, features, and live hourly rates from the database
- 📍 **Location search** — GPS-based geolocation with Nominatim reverse-geocoding to auto-fill your address
- 📅 **4-step booking wizard** — service selection → job details → date & time scheduling → review & confirm
- 💰 **Live price estimate** — calculated in real time as you pick duration
- 📋 **Booking management** — view all bookings, cancel pending/confirmed ones, find and assign available providers
- 🔔 **Status tracking** — requested → confirmed → completed (or cancelled / rejected)

### For Providers
- 🧑‍🔧 **Provider profile** — create a public profile with bio and service area, submitted for admin review
- 📆 **Weekly availability** — set working windows per day of the week
- 🛠 **Service offerings** — toggle which service categories you accept
- ✅ **Booking management** — view assigned bookings, accept or reject them
- 🟢 **Active / inactive toggle** — go on or off duty without deleting your profile

### Platform
- 🔒 **Auth-gated routes** — booking, bookings list, and provider dashboard all require a signed-in account
- 🛡 **Row-Level Security** — Supabase RLS policies ensure customers only see their own bookings and providers only manage their own data
- 🔁 **Idempotent booking submission** — duplicate submissions on retry are prevented via a per-session request key
- 🌑 **Glassmorphism UI** — dark charcoal + ivory + lime accent design system

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript (Vite) |
| Routing | React Router DOM v7 |
| Backend & Database | Supabase (PostgreSQL + RLS + RPC functions) |
| Authentication | Supabase Auth (email/password) |
| Animations | Framer Motion v14 |
| Icons | Lucide React |
| Styling | Tailwind CSS v3 |
| Build Tool | Vite v5 |
| Type Checking | TypeScript 5.5 |
| Linting | ESLint 9 + typescript-eslint |

---

## 🗂 Project Structure

```
src/
├── components/
│   ├── AnimatedBackground.tsx   # Decorative animated background layer
│   ├── AuthPage.tsx             # Sign-in / sign-up form
│   ├── BookingPage.tsx          # 4-step booking wizard
│   ├── BookingPreview.tsx       # Homepage booking entry point
│   ├── BookingsPage.tsx         # Customer bookings list & management
│   ├── FinalCTA.tsx             # Homepage final call-to-action
│   ├── Hero.tsx                 # Full-screen hero with geolocation search
│   ├── Navigation.tsx           # Global responsive navigation
│   ├── ProviderDashboard.tsx    # Provider profile, services & availability
│   ├── Services.tsx             # Animated services showcase section
│   └── TrustSection.tsx         # Trust signals section
├── data/
│   └── services.ts              # Static service presentation data
├── lib/
│   └── supabase.ts              # Supabase client, shared types & helpers
├── App.tsx                      # Routing, auth guard, app shell
├── main.tsx                     # React entry point
└── index.css                    # Global styles & Tailwind directives

supabase/
└── migrations/                  # All database migration SQL files
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18 or later
- [npm](https://npmjs.com) v9 or later
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone the repository

```bash
git clone https://github.com/prince-sinha75/On-Demand-Service-Platform.git
cd On-Demand-Service-Platform
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Open `.env` and set:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

You can find both values in your Supabase project under **Settings → API**.

### 4. Run database migrations

Apply all migrations in `supabase/migrations/` to your Supabase project. You can do this via the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase db push
```

Or run each `.sql` file manually in the Supabase SQL Editor in the order they are numbered.

### 5. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server with hot reload |
| `npm run build` | Build the production bundle to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint across all source files |
| `npm run typecheck` | Type-check without emitting output |

---

## 🌐 Deployment

The project is a standard Vite SPA and can be deployed to any static hosting service.

### Netlify (recommended)

1. Connect your GitHub repository in the Netlify dashboard
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add your environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) in **Site settings → Environment variables**

### Vercel

1. Import the repository in Vercel
2. Framework preset: **Vite**
3. Add the two environment variables in the project settings

> **Important:** Never expose your Supabase service role key in the frontend. Only the **anon key** should be used here — all sensitive operations are protected by Supabase RLS policies.

---

## 🗃 Database Schema

The platform uses the following main tables:

| Table | Description |
|---|---|
| `service_categories` | Available service types with slugs, hourly rates, and kind (`driver`, `home`, `companionship`) |
| `bookings` | Customer booking requests with status, pricing, and scheduling details |
| `provider_profiles` | Provider profiles pending or approved by admin |
| `provider_services` | Which service categories each provider offers |
| `provider_availability` | Weekly time window slots per provider |
| `booking_status_history` | Audit log of every status change |

Key RPC functions: `create_booking`, `cancel_booking`, `get_eligible_providers`, `assign_provider`, `reject_booking`.

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👤 Author

**Prince Sinha**
- GitHub: [@prince-sinha75](https://github.com/prince-sinha75)
