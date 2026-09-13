# Arman Hair Studio — PRD

## Original Problem Statement
Complete premium luxury salon website + customer portal + admin panel + mobile-responsive app for **Arman Hair Studio** (Arman Khan, Bhopal, 8878356060). Black + gold theme inspired by provided mockups. Tagline: "The Art of Hair". Pages: Home, About, Services (Gents + Ladies — NO PRICES), Gallery, Reviews, Contact/Appointment booking. Full booking workflow with admin approval + customer/admin emails.

## User Personas
- **Customer**: books appointments, tracks status, leaves reviews
- **Admin (Arman Khan)**: reviews leads, confirms/reschedules/completes, sees customer database

## Architecture
- **Backend**: FastAPI + MongoDB (Motor), JWT bearer auth (localStorage), bcrypt hashes, Emergent-managed Resend email
- **Frontend**: React 19 + Tailwind + Playfair Display / Manrope / Great Vibes fonts + lucide-react + sonner + framer-motion
- **Auth**: 2 roles — `customer`, `admin`. Admin seeded on startup.
- **Routes**: /, /about, /services, /gallery, /reviews, /contact, /login, /register, /account, /admin/login, /admin

## Implemented (Feb 2026)
- 6 public pages with luxury black+gold theme, scissor divider, dual CTAs, no prices
- Customer register/login/profile/my-appointments/cancel
- Admin dashboard (5 stat cards, filterable appointment table, status change with automatic email, customers tab)
- Booking form → dual-email (customer confirmation + owner lead notification)
- WhatsApp deep-link buttons + floating FAB (wa.me/918878356060)
- Review posting (auth-gated) + 4 seeded testimonials
- Fully mobile-responsive, PWA-ready meta tags, SEO title/description
- 100% backend test pass, 20/20 frontend flows verified

## Test Credentials
- Admin: `admin@armanhairstudio.com` / `Arman@Studio2026`
- Customer: register any via `/register`

## Backlog (P1)
- Native Android/iOS app (React Native / Capacitor wrapper)
- Google Reviews sync + rich schema.org markup
- Real gallery upload from admin panel
- SMS confirmations via Twilio
- Loyalty / referral program
