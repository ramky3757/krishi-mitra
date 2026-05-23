# HarvestBond — CLAUDE.md

## App Name & Tagline

**HarvestBond** — *"Know your farmer. Own your harvest."*

Alternative names considered: FieldPact, CropBond, YieldBridge, FarmPledge

---

## Vision

HarvestBond is a marketplace platform that connects **real, verified farmers** with **conscious consumers** who want to pre-buy crop yield directly from the source. The platform removes middlemen, gives farmers financial stability upfront, and lets consumers trace their food from seed to kitchen.

---

## Core Concept (Business Logic)

1. **Farmer posts a crop listing** — land area, crop type, total expected yield, quantity available for pre-sale, price per kg, organic/conventional, pesticide details, farm photos/videos, expected harvest date.
2. **Consumer browses listings** — filtered by location, crop category, farmer rating, organic flag, etc.
3. **Consumer pre-books quantity** — e.g., 50 kg of rice out of 500 kg available. Pays **25–30% advance** at booking time.
4. **Crop grows** — Farmer posts progress updates (photos, milestones). Consumer can schedule **up to 2 farm visits** during the crop cycle.
5. **Harvest ready** — Both parties confirm. Consumer pays the **remaining balance**. Farmer ships/delivers to consumer.
6. **Post-delivery** — Consumer rates farmer. Farmer rates consumer.

---

## Platform Targets

- **Web** (primary — Next.js, desktop + tablet responsive)
- **Android** (React Native via Expo)
- **iOS** (React Native via Expo)

Single codebase using **Expo Router** with web support + NativeWind for styling.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend (Mobile + Web) | Expo (React Native) + Expo Router |
| Styling | NativeWind (Tailwind CSS for RN) |
| Backend / Auth / DB | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Payments | Razorpay (India primary) / Stripe (international) |
| Maps | Google Maps SDK / Expo Location |
| Notifications | Expo Notifications + Supabase push |
| State Management | Zustand |
| Forms | React Hook Form + Zod validation |
| Language | TypeScript throughout |

---

## User Roles

### 1. Farmer
- Register with phone + Aadhaar/farm document upload
- Create and manage crop listings
- Post crop progress updates (photos, videos, milestones)
- Accept/decline pre-bookings
- Schedule farm visits with consumers
- Receive payments (advance + final)
- Mark crop as harvested and shipped

### 2. Consumer
- Register with phone/email
- Browse crop listings by location/category
- Pre-book quantity, pay advance
- Track crop progress in real-time
- Schedule farm visits (max 2 per crop)
- Pay remaining balance on harvest
- Rate & review farmer

### 3. Admin
- Verify farmer identity & farm documents (KYC workflow)
- Approve/reject farmer listings
- Resolve disputes between farmer and consumer
- Platform analytics dashboard
- Manage categories, regions, pricing suggestions

---

## Farmer Verification (KYC — Anti-Fake Mechanism)

This is critical. Fake farmer profiles must be prevented.

**Verification steps:**
1. **Phone OTP** — mandatory at signup
2. **Government ID** — Aadhaar / Voter ID / Driving License upload
3. **Land Record (Khasra/Patta)** — upload land ownership or lease document
4. **Farm Geo-tag** — GPS coordinates of farm captured via app (cannot be faked easily)
5. **Farm Photos** — at least 3 photos taken in-app (with GPS metadata embedded)
6. **Admin manual review** — Admin approves before first listing goes live
7. **Re-verification** — Annual re-verification or if flagged

**Badges displayed on profile:**
- `ID Verified` — Government ID matched
- `Land Verified` — Land records confirmed
- `Location Verified` — GPS farm geo-tag confirmed
- `Trusted Farmer` — 10+ completed orders with 4+ star avg rating

---

## Crop Categories

- Rice / Paddy
- Wheat & Grains
- Vegetables (tomato, onion, potato, leafy greens, etc.)
- Fruits (mango, banana, pomegranate, etc.)
- Pulses & Legumes (dal, chickpea, etc.)
- Spices (turmeric, chili, etc.)
- Oilseeds (groundnut, sunflower, etc.)
- Organic (cross-category tag)

---

## Key Features — Must Have

### Crop Listings
- Crop type, variety, sowing date, expected harvest date
- Total yield estimate, quantity available to pre-sell
- Price per kg (advance price vs final price breakdown)
- Farm size (acres), location (state/district/village + GPS pin)
- Farming method: organic / conventional / natural
- Pesticides used (list with quantities) or "Zero pesticide"
- Soil type, water source (rain-fed / irrigation)
- Farmer profile + verification badges
- Photos/videos of the farm

### Pre-Booking System
- Reserve specific kg quantity
- Advance payment (25–30%) via payment gateway
- Digital booking confirmation receipt
- Booking status: Pending → Confirmed → In Progress → Harvested → Shipped → Delivered
- Cancellation policy (before/after sowing stage)

### Crop Progress Tracker
- Farmer posts milestone updates: Sowing → Sprouting → Growing → Pre-Harvest → Harvest Ready
- Each milestone has a photo + note + date
- Consumer sees live timeline in their booking dashboard
- Push notifications at each milestone

### Farm Visit Feature
- Consumer can request visit (2 allowed per booking)
- Farmer approves date/time
- Calendar-based scheduling
- In-app directions to farm (Google Maps deep link)
- Visit log (check-in confirmation)

### Payment Flow
- Advance payment at booking (25–30%)
- Escrow model (Supabase + payment gateway hold)
- Final payment on harvest confirmation by both parties
- Auto-release to farmer 48hrs after delivery confirmation
- Dispute window: 7 days post-delivery

### Messaging
- In-app chat between farmer and consumer (per booking thread)
- No phone number sharing until both agree (privacy)
- Admin can view chats for dispute resolution

### Ratings & Reviews
- Post-delivery rating (1–5 stars)
- Tags: Quality, Freshness, Packaging, Responsiveness, Accuracy
- Farmer can rate consumer (payment behavior, visit conduct)
- Reviews publicly visible on profiles

---

## Good to Have Features

### Consumer Features
- **Crop subscription** — auto-rebook same farmer same crop every season
- **Family planner** — estimate yearly consumption, get crop reminders
- **Bulk order** — group buy with friends/family, split a large lot
- **Wishlist** — save crops, get notified when farmer posts

### Farmer Features
- **Crop calendar** — seasonal sowing/harvest planner
- **Yield predictor** — AI suggestion on yield based on land area + crop type + weather
- **Market price feed** — live mandi prices as reference
- **Government schemes feed** — relevant PMFBY, PM-KISAN, etc.

### Platform Features
- **Community forum** — farmers and consumers discuss topics
- **Blog/articles** — farming practices, nutrition, seasonal crops
- **Weather integration** — weather forecast for farm location
- **Logistics partner** — integrated shipping partners for delivery
- **Crop insurance** — optional insurance for pre-booked crops (partner API)
- **Multilingual** — Hindi, Telugu, Tamil, Kannada, Marathi support
- **Offline mode** — farmer can draft updates offline, sync when connected

---

## Screens / Navigation Map

### Onboarding
- Splash / Welcome
- Role selection: Farmer / Consumer
- Phone OTP login / Social login
- Profile setup

### Consumer App
- Home feed (location-based crop listings, featured farmers)
- Browse (filter: category, location, organic, price range, harvest date)
- Crop detail page (listing + farmer profile + progress updates)
- Booking flow (select qty → advance payment → confirmation)
- My Bookings (timeline, progress, chat, visit booking)
- Profile & settings

### Farmer App
- Dashboard (active listings, pending bookings, revenue summary)
- Create/Edit crop listing
- My Listings
- Booking management (accept/decline, view consumer profile)
- Progress update (post milestone with photo)
- Visit scheduler
- Earnings & payout history
- KYC verification status

### Admin Panel (Web only)
- Farmer KYC queue
- Listing approval queue
- Dispute management
- Analytics dashboard

---

## Database Schema (High Level)

### Tables
- `users` (id, phone, email, role, name, avatar, created_at)
- `farmer_profiles` (user_id, kyc_status, id_doc_url, land_doc_url, farm_geo_lat, farm_geo_lng, verification_badges)
- `consumer_profiles` (user_id, address, preferences)
- `crop_listings` (id, farmer_id, crop_category, crop_name, variety, farm_size_acres, total_yield_kg, available_qty_kg, price_per_kg_advance, price_per_kg_final, sowing_date, harvest_date, farming_method, pesticides_info, description, status, location_state, location_district, location_village, geo_lat, geo_lng)
- `listing_media` (listing_id, url, type: photo/video)
- `bookings` (id, listing_id, consumer_id, qty_kg, advance_amount, final_amount, status, created_at)
- `payments` (id, booking_id, type: advance/final, amount, gateway_ref, status, created_at)
- `progress_updates` (id, listing_id, milestone, note, photo_url, created_at)
- `farm_visits` (id, booking_id, requested_date, status, confirmed_date)
- `messages` (id, booking_id, sender_id, text, created_at)
- `reviews` (id, booking_id, reviewer_id, reviewee_id, rating, tags, comment)

---

## Project Folder Structure

```
OwnFarmOnDemand/
├── CLAUDE.md
├── apps/
│   ├── mobile/          # Expo app (iOS + Android + Web)
│   │   ├── app/         # Expo Router file-based routing
│   │   ├── components/
│   │   ├── stores/      # Zustand stores
│   │   ├── hooks/
│   │   ├── lib/         # Supabase client, utils
│   │   ├── types/
│   │   └── assets/
│   └── admin/           # Next.js admin panel
│       ├── app/
│       ├── components/
│       └── lib/
├── packages/
│   ├── shared-types/    # TypeScript types shared across apps
│   └── ui/              # Shared UI primitives (optional)
├── supabase/
│   ├── migrations/      # DB migration files
│   └── seed.sql
└── package.json         # Monorepo root (pnpm workspaces)
```

---

## Development Phases

### Phase 1 — MVP (Months 1–3)
- Farmer registration + KYC upload flow
- Crop listing creation
- Consumer browse + search
- Pre-booking with advance payment
- Basic progress updates

### Phase 2 — Engagement (Months 4–6)
- Farm visit scheduling
- In-app chat
- Ratings & reviews
- Push notifications
- Final payment flow

### Phase 3 — Scale (Months 7–12)
- Subscription/auto-rebook
- Group/family buy
- Multilingual
- Logistics partner integration
- Admin analytics dashboard

---

## Design Principles
- Mobile-first, but fully responsive on web
- Clean, earthy color palette (greens, soil browns, harvest yellows)
- Large farm photos as hero content
- Trust signals front and center (verification badges, progress photos)
- Simple UX for farmers with low digital literacy (large buttons, voice hints)
- Accessibility: WCAG AA compliant

---

## Important Notes for Claude

- Always keep farmer UX simple — many farmers have basic smartphone skills
- Verification/trust is the #1 feature, never skip or stub it
- Payment flows must handle partial amounts (advance + final separately)
- Location filtering is critical — default to user's state, allow radius filtering
- Never expose farmer's personal phone/address until booking is confirmed
- Progress update photos must support low-bandwidth compression
- All monetary amounts in INR (₹), support paise-level precision
- Booking cancellation rules must be clearly displayed before payment
- Farm visit scheduling requires farmer's manual approval (not auto-confirm)
