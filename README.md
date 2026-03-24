# ScheduleMuseAI

AI-powered scheduling platform built with Next.js, Clerk, Cloudflare D1, and Zoom.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Auth | Clerk (`@clerk/nextjs`) |
| Database | Cloudflare D1 (SQLite via REST) |
| Styling | Tailwind CSS v4 |
| Video | Zoom OAuth (meetings, webhooks) |
| Encryption | AES-256-GCM (token storage) |
| Deployment | Vercel |

## Architecture

```
src/
├── app/                    # Next.js App Router pages + API routes
│   ├── api/
│   │   ├── analytics/      # Server-side KPI aggregation
│   │   ├── admin/          # migrate + seed routes
│   │   ├── bookings/       # CRUD booking pages
│   │   ├── contacts/       # CRUD contacts (CRM-lite)
│   │   ├── dashboard/      # Server-side dashboard KPIs
│   │   ├── developers/     # API keys + webhooks management
│   │   ├── events/         # Calendar events
│   │   ├── integrations/   # Zoom OAuth flow + deauthorize webhook
│   │   ├── meetings/       # CRUD meetings + Zoom meeting creation
│   │   └── onboarding/     # Persist onboarding preferences
│   ├── dashboard/          # Main dashboard (calendar + KPIs)
│   ├── meeting-setup/      # Booking page editor (6-tab config)
│   ├── onboarding/         # New user onboarding wizard
│   └── developers/         # API keys + webhooks UI
├── components/
│   └── layout/             # AppSidebar, UserProfile
└── lib/
    ├── auth.ts             # Clerk + API key authentication (resolveAuth)
    ├── apikey.ts           # API key validation + scope enforcement
    ├── cloudflare.ts       # D1 query helper + KV + batch operations
    ├── contacts.ts         # Shared contact types + formatContact/splitName
    ├── crypto.ts           # AES-256-GCM encrypt/decrypt for tokens
    ├── webhooks.ts         # Webhook dispatch (HMAC-signed, fire-once)
    ├── zoom.ts             # Zoom API client (tokens, meetings)
    └── utils.ts            # Merge tag utilities
```

## Environment Variables

Create a `.env.local` file with:

```bash
# Clerk (https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Cloudflare (https://dash.cloudflare.com)
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...           # Needs D1 + KV permissions
CLOUDFLARE_D1_DATABASE_ID=...
CLOUDFLARE_KV_NAMESPACE_ID=...

# Zoom OAuth (https://marketplace.zoom.us)
ZOOM_CLIENT_ID=...
ZOOM_CLIENT_SECRET=...
ZOOM_REDIRECT_URI=https://your-domain.com/api/integrations/callback
ZOOM_WEBHOOK_SECRET_TOKEN=...      # For deauthorize webhook verification

# Encryption
ENCRYPTION_KEY=...                 # 32-byte hex string for AES-256-GCM
```

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

## Database Setup

The schema is defined in `schema.sql`. To initialize:

1. Create a Cloudflare D1 database
2. Set environment variables
3. Hit `POST /api/admin/seed` to create tables
4. Hit `POST /api/admin/migrate` to apply any pending migrations

## API Authentication

Two auth methods are supported:

1. **Clerk session** — browser-based, full access
2. **API key** — programmatic access with scoped permissions

API keys use `Authorization: Bearer smuse_...` or `x-api-key: smuse_...` headers.

### Available Scopes

| Scope | Access |
|---|---|
| `meetings:read` | List/get meetings |
| `meetings:write` | Create meetings |
| `contacts:read` | List/get contacts |
| `contacts:write` | Create/update/delete contacts |
| `bookings:read` | List/get booking pages |
| `bookings:write` | Create/update/delete booking pages |
| `events:read` | List calendar events |
| `analytics:read` | Read analytics data |

## Webhooks

Users can register webhook endpoints via the Developers page. Events are dispatched with HMAC-SHA256 signed payloads:

- `meeting.created` — fired when a meeting is booked
- `contact.created` — fired when a contact is added
- `booking_page.created` — fired when a booking page is created

Endpoints are auto-deactivated after 5 consecutive delivery failures.

## License

Private — all rights reserved.