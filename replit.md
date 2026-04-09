# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## VoiceBus App

### Features
- Voice + text search for buses using Web Speech API
- User and Admin roles with role-based access
- Seat selection UI with visual grid (available/booked/selected states)
- Book and cancel tickets
- Admin panel: add/edit/delete buses, view all bookings

### Demo Accounts
- Admin: `admin` / `admin123`
- User: `john_doe` / `password123`
- User: `priya` / `priya123`

### Artifacts
- `artifacts/bus-booking` — React + Vite frontend (previewPath: `/`)
- `artifacts/api-server` — Express backend (previewPath: `/api`)

### Database Schema (PostgreSQL)
- `users` — id, username, password (SHA-256), role (USER|ADMIN)
- `buses` — id, busNumber, fromLocation, toLocation, departureTime, arrivalTime, totalSeats, price
- `bookings` — id, userId, busId, seatNumbers (comma-separated), bookingTime, status (CONFIRMED|CANCELLED)

### API Routes
- `POST /api/auth/login` — login
- `POST /api/auth/register` — register
- `GET /api/auth/me` — current user
- `GET /api/buses` — list all buses
- `GET /api/buses/search?from=&to=&busNumber=` — search buses
- `GET /api/buses/:id` — bus detail + seat layout
- `POST /api/buses` — create bus (admin)
- `PUT /api/buses/:id` — update bus (admin)
- `DELETE /api/buses/:id` — delete bus (admin)
- `GET /api/bookings?userId=` — list bookings
- `POST /api/bookings` — create booking
- `DELETE /api/bookings/:id` — cancel booking
- `GET /api/stats/overview` — stats overview
- `GET /api/stats/popular-routes` — popular routes
- `GET /api/admin/bookings` — all bookings (admin)
