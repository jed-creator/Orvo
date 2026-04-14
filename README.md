# Serva

**Universal Booking & Payments Marketplace**

Serva is a two-sided marketplace connecting consumers with local service businesses (salons, personal trainers, therapists, dog walkers, tutors, and more) for instant booking and payment.

## Architecture

Monorepo with three apps sharing a Supabase backend:

- **`apps/web`** — Business dashboard + admin panel (Next.js 14 + TypeScript + Tailwind + shadcn/ui)
- **`apps/mobile`** — Consumer app for iOS & Android (React Native + Expo)
- **`packages/shared`** — Shared types, Zod schemas, utility functions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native + Expo |
| Web | Next.js 14 + TypeScript |
| Backend | Next.js API Routes + tRPC |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Payments | Stripe Connect |
| Search | Supabase Full-Text + PostGIS |
| File Storage | Supabase Storage |
| Email | Resend |
| SMS | Twilio |
| Push | Expo Notifications |
| Hosting | Vercel |
| Monitoring | Sentry |

## Development Status

This project is being built following the 108-step Build Guide in `docs/`. Current phase: **Phase 1 — Environment Setup**.

See [`PLAN.md`](./PLAN.md) for the full build plan.

## Local Development

```bash
# Install all workspace dependencies
npm install

# Run the web app (Next.js)
npm run dev --workspace=@serva/web

# Run the mobile app (Expo)
npm run start --workspace=@serva/mobile
```

## Documentation

Source specification documents live in `/docs`:
- `Serva - Step by Step Build Guide.pdf` — The 108-step implementation guide
- `Serva - MVP Development Roadmap.pdf` — Timeline and budget
- `Serva - Technical Specification.pdf` — Feature specification
- `Serva - Technical Architecture.pdf` — Long-term architecture vision
- `Serva - Business Plan.pdf`, `Serva - Pitch Deck.pdf` — Business context
