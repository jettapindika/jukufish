# JUKU

Fish inventory management PWA for Paotere Harbor cold storage facilities in Makassar, Indonesia.

## What It Does

JUKU tracks fish stock entering and leaving cold storage warehouses. It monitors freshness over time, generates QR codes for each batch, and syncs data across devices in real time — even when offline.

### Key Features

- **Stock In/Out** — Multi-step forms to record fish entries and exits with species, weight, and quality grade (A/B/C)
- **Freshness Tracking** — 3-tier aging system (Segar → Perhatian → Kritis) with color-coded indicators and pulse animations for critical stock
- **QR Codes** — Auto-generated per batch, scannable for quick lookup
- **Offline-First** — Full functionality without internet; data persists in IndexedDB and syncs when back online
- **Role-Based Access** — Warehouse admin (`admin_gudang`) and owner (`pemilik`) see different dashboards
- **Invite System** — Owners generate invite codes for warehouse admins
- **Real-Time Sync** — Bidirectional Supabase sync with realtime subscriptions
- **Dark Mode** — CSS class toggle with separate design token sets
- **PWA** — Installable on mobile with service worker caching

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 |
| State | Zustand (single store, IndexedDB persistence via localforage) |
| Backend | Supabase (client-side only, no API routes) |
| QR | html5-qrcode (scan) + qrcode.react (generate) |
| Icons | Lucide React + Figma SVG exports |
| Font | Helvetica/Arial body, Cal Sans display |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

```bash
git clone https://github.com/your-username/jukufish.git
cd jukufish
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Tables

The app expects these tables in your Supabase project:

- `stock_entries` — Fish stock records
- `stock_exits` — Exit/withdrawal records
- `users` — User profiles with PIN auth
- `invite_codes` — Invite code management

### Run

```bash
npm run dev       # Dev server at http://localhost:3000
npm run build     # Production build
npm run start     # Production server
npm run lint      # ESLint
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Auth flow (login, register, PIN pad)
│   └── dashboard/
│       ├── page.tsx        # Role-based dashboard
│       ├── catat-masuk/    # Record stock in
│       ├── catat-keluar/   # Record stock out
│       ├── stok/           # Current stock view
│       ├── riwayat/        # History
│       ├── scan-qr/        # QR scanner
│       ├── shelf-life/     # Shelf life settings
│       ├── kelola/         # User management
│       └── export/         # Data export
├── components/
│   ├── bottom-nav.tsx      # 5-tab navigation (role-aware)
│   ├── fish-card.tsx       # Stock entry card
│   ├── freshness-bar.tsx   # Aging progress indicator
│   ├── pin-pad.tsx         # PIN input component
│   ├── qr-scanner.tsx      # Camera QR scanner
│   ├── stepper.tsx         # Multi-step form stepper
│   ├── swipe-confirm.tsx   # Swipe-to-confirm action
│   ├── sync-provider.tsx   # Sync status + realtime subscriptions
│   └── voice-recorder.tsx  # Voice input
├── hooks/
│   ├── use-fish-data.ts    # Fish species data hook
│   └── use-online-status.ts
└── lib/
    ├── store.ts            # Zustand store (single source of truth)
    ├── sync.ts             # Bidirectional Supabase sync engine
    ├── aging.ts            # Freshness calculation (<50% fresh, <80% warning, >=80% critical)
    ├── fish-data.ts        # 24 default species with Makassarese local names
    ├── auth-sync.ts        # Remote user/invite CRUD
    ├── types.ts            # Shared TypeScript interfaces
    ├── supabase.ts         # Supabase client
    └── utils.ts            # cn() utility
```

## Conventions

- Indonesian UI text, English code identifiers
- Single Zustand store — no Context or Redux
- IDs follow `{type}-{timestamp}-{random}` pattern
- Design tokens extracted from Figma

## License

Private project.
