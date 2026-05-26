# Krishi Mitra — Business Model & Decisions

> *Living document of the platform's business logic, money flow, and policy decisions.
> Update this when policy changes — code should follow what's documented here.*

**Last updated:** 2026-05-26
**Maintainers:** Founders + Platform team

---

## 1. What is Krishi Mitra

A marketplace connecting **verified farmers** with **conscious consumers** who pre-book crop yield directly from the source. We remove middlemen, give farmers cashflow during the growing season, and let consumers trace food from seed to kitchen.

**Pitch in one line:** *"Know your farmer. Own your harvest."*

**Core insight:** Pre-booking lets farmers fund sowing without taking loans, and locks in price for both sides before market volatility hits.

---

## 2. User Roles

| Role | What they do | What they need from us |
|------|--------------|-----------------------|
| **Farmer** | List crops, post growth updates, receive payouts | Trust badges, cashflow, market reach |
| **Consumer** | Browse, pre-book, pay advance, take delivery | Trust in farmer, fair price, transparency |
| **Admin** | Verify farmer KYC, approve listings, resolve disputes | Tools to enforce platform quality |

---

## 3. The Money Flow (most important section)

### 3.1 Commission rates

| Side | Rate | Why |
|------|------|-----|
| **Farmer** | **8%** of subtotal | Lower than mandis (15–25%). Recruitment tool. |
| **Consumer** | **3%** added on top | Covers payment gateway + verification cost |
| **Total platform take** | ~11% of GMV | Sustainable for unit economics |

These are stored in `platform_config` table — admin-editable, no code deploy needed to change.

### 3.2 Stage-based advance % (key innovation)

The advance % a consumer pays is **not fixed** — it scales with how close the crop is to harvest. Consumers booking early pay less (since they're waiting longer); consumers booking near harvest pay more (less risk).

| Crop Stage | Time to harvest | Consumer advance | Why |
|-----------|----------------|------------------|-----|
| 🌱 **Pre-sowing** | 4–6 months | **20%** | Long wait — low advance encourages early commitment |
| 🌾 **Sowed** | 3–4 months | **30%** | Farmer has invested some labor |
| 🌿 **Growing** | 1–3 months | **40%** | Crop visibly progressing |
| 🌸 **Pre-harvest** | 2–4 weeks | **60%** | Near-certain delivery |
| ✅ **Ready Now** | Immediate | **100%** | Pay full, delivered in days |

**Why this matters:**
- Self-segments consumers — risk-averse buyers wait for "Ready Now", committed buyers lock in early
- Solves the friction problem of demanding 50%+ upfront on 4-6 month waits
- Cashflow safety always holds (we don't release more to farmer than we hold)
- Late bookers pay listed price; early bookers may get a 5–10% discount (future feature)

### 3.3 Example — full transaction breakdown

**Setup:** 50 kg rice @ ₹80/kg, booked at *Sowed* stage (30% advance), delivery selected.

```
Subtotal (crop):                 ₹4,000   (50 × ₹80)
Delivery charge (15/kg flat):    ₹  750
Consumer platform fee (3%):      ₹  120
─────────────────────────────────────────
Total consumer pays:             ₹4,870
  Advance now (30%):             ₹1,461
  Balance on delivery:           ₹3,409

Farmer earnings (gross):         ₹4,000
Farmer platform fee (8%):        ₹  320
─────────────────────────────────────────
Farmer net payout:               ₹3,680

Platform revenue:
  Farmer fee:                    ₹  320
  Consumer fee:                  ₹  120
  Delivery (until Shiprocket):   ₹  750  (entire amount, no logistics partner yet)
─────────────────────────────────────────
  Platform total:                ₹1,190
  Razorpay/Cashfree (~2%):       ₹   97
  ─────────────────────────────────────
  Net to platform:               ₹1,093  (~22% margin including delivery)
```

---

## 4. Payout Schedule (farmer cashflow)

Farmer payouts are **split across milestones** so cashflow funds the actual work, but never exceeds what we've collected from the consumer.

### 4.1 Schedule

| Trigger | % of farmer's net payout released |
|---------|----------------------------------|
| Booking confirmed + **48 hr cooling period** | **30%** (seed money for sowing) |
| Farmer marks "Sowing started" with photo | **+40%** (cumulative 70%) |
| Consumer confirms delivery + **48 hr dispute window** | **+30%** (full 100%) |

### 4.2 Why this design

- **Seed money is tied to verified work** — farmer uploads sowing photo to unlock the 40%
- **Each release ≤ what platform holds** — never need to chase a farmer for money back
- **48 hr cooling period** prevents instant-cancel exploits
- **48 hr dispute window** after delivery for consumer to flag quality issues

### 4.3 Config

Stored in `platform_config`:

```sql
advance_release_pct_initial      = 30   -- released at booking+48h
advance_release_pct_on_sowing    = 40   -- released at sowing milestone
-- remaining 30 released at delivery+48h
advance_release_delay_hours      = 48
final_release_delay_hours        = 48
```

---

## 5. Refund Policy (consumer-facing)

Aligned tightly with payout schedule so we never owe a refund larger than what we hold.

### 5.1 Refund tiers

| Cancellation timing | Refund of consumer's payments |
|--------------------|------------------------------|
| **Within 48 hours of booking** | **100%** |
| **After 48 hours, before sowing** | **80%** |
| **After sowing, before flowering** | **50%** |
| **After flowering, before harvest** | **25%** |
| **After harvest** | **0%** |

### 5.2 Why this works

| Cancellation point | What we owe | What we hold | Safe? |
|-------------------|-------------|--------------|-------|
| Day 1 | 100% | 100% | ✅ |
| Day 3 | 80% | ~73% + fees ≈ 80%+ | ✅ |
| After sowing | 50% | 30% held + fees | ✅ |
| After harvest | 0% | — | ✅ |

### 5.3 Post-harvest cancellation — what happens to the crop?

**Principle: We are a marketplace, NOT a buyer of goods. We never take inventory.**

If consumer cancels after harvest:
- **Farmer keeps the crop** (we don't collect it)
- **Farmer keeps the 70% payout** already received
- **Consumer loses their advance** (0% refund per policy)
- **Platform offers farmer instant "Re-list at Ready Now stage" with waived fees** to help recover the remaining 30%

### 5.4 Handling "market rate" disputes from farmers

When market price rises and farmer wants to break contract:

- **Contract enforcement language** in T&Cs farmer signs at listing time
- Make it explicit: this is a **fixed forward contract**, neither side adjusts to market movements
- For genuine grievance cases (verified low mandi rate + good farmer reputation), use a **goodwill fund** capped at 0.5% of platform revenue — case-by-case, not contractual

---

## 6. Logistics (Delivery)

### 6.1 Phase 1 — current state

Consumer has two options at checkout:

| Option | Cost | What we provide |
|--------|------|-----------------|
| 🚜 **Farm Pickup** | Free | Consumer picks up directly. Builds trust. |
| 📦 **Home Delivery** | ₹15/kg (flat) | We arrange delivery (Phase 2 will use Shiprocket) |

Currently the entire ₹15/kg is platform revenue (no actual logistics partner yet).

### 6.2 Phase 2 — Shiprocket integration

Once we have ≥20 active orders/week:

1. Integrate Shiprocket API for actual shipping rates
2. Consumer sees: actual cost + 10% markup
3. We pay Shiprocket the actual cost; markup is platform revenue
4. Use Porter/Dunzo for same-city large orders (more cost-effective)

### 6.3 Phase 3 — Aggregated logistics

Once we have ≥10 farmer-consumer pairs in same region:

- Batch pickups: 1 truck collects from 5 farms, drops at central point
- Reduces cost from ~₹150/order to ~₹40/order
- Only viable when geographic density is achieved

### 6.4 Phase 4 — Own logistics (only if economics justify)

Reserved for dense city corridors (Bangalore, Hyderabad) with proven volume. Cold-chain trucks, warehouses, dispatch staff. ₹50L+ investment — far future.

---

## 7. KYC & Verification

### 7.1 Farmer KYC (mandatory before listing crops)

| Document | Why |
|----------|-----|
| Phone OTP | Basic identity |
| Government ID (Aadhaar/Voter/DL) | Identity verification |
| Land record (Khasra/Patta) | Confirms farm ownership |
| Farm GPS coordinates | Anti-fake (can't fake GPS) |
| Farm photos (≥3, GPS-embedded) | Visual proof |
| Admin manual review | Final approval |

**Badges granted on approval:** ID Verified, Land Verified, Location Verified, Trusted Farmer (10+ orders, 4+ star avg).

### 7.2 Consumer KYC (mandatory before first booking)

| Document | Why |
|----------|-----|
| Full name + mobile | Communication |
| Communication address (full) | Delivery + tax records |
| Government ID (Aadhaar/Voter/DL/Passport) | Identity verification (smaller commitment than farmer) |
| Profession (optional) | Analytics for outreach |

Consumer KYC is lighter than farmer KYC — we're not preventing fraud, just collecting baseline trust info and ensuring delivery feasibility.

---

## 8. Payment Gateway

**Choice: Cashfree** (over Razorpay/Juspay)

**Why:**
- UPI free for transactions <₹2,000 (most pre-bookings)
- Cards at 1.75% (vs Razorpay's 2%) — 12.5% cheaper
- Free payouts to farmer bank accounts (via Cashfree Payouts)
- Same modern checkout UX as Razorpay
- API similar to Razorpay — swap is straightforward

**Payment methods supported:** UPI (all apps), Cards (Visa/MC/RuPay/Amex), Wallets (Paytm/PhonePe/Amazon Pay/Mobikwik), Net Banking (60+ banks), EMI, BNPL (Simpl/LazyPay/ZestMoney), International cards.

**Status:** Awaiting Cashfree KYC. Once keys are in env vars, integration is ~2-3 hours of dev work.

---

## 9. Deployment

| App | URL | Stack | Vercel Region |
|-----|-----|-------|---------------|
| Consumer + Farmer | `https://krishimitra.app` | Expo (React Native + Web) | bom1 (Mumbai) |
| Admin Panel | `https://admin.krishimitra.app` | Next.js 15 | bom1 (Mumbai) |
| Backend | Supabase | PostgreSQL + Auth + Storage | ap-south-1 (Mumbai) |

All three in Mumbai region for lowest latency to Indian users.

---

## 10. Tech Decisions

| Decision | Why |
|----------|-----|
| Single codebase (Expo) for iOS/Android/Web | Maintain once, ship 3 platforms |
| Supabase for backend | No backend engineers needed at MVP scale |
| Stage-based advance % | Reduces consumer friction, matches farmer payout safely |
| Marketplace model (never take inventory) | No cold-chain risk, no spoilage exposure |
| Email OTP + Google OAuth | Two-tap login, no SMS cost |

---

## 11. Roadmap Snapshot

### ✅ Done (MVP foundation)
- Farmer KYC + listing creation
- Consumer KYC + browsing
- Pre-booking with mock payment
- Crop stage system + stage-based advance
- Commission + payout math
- Refund tiers
- Admin panel for KYC + user management
- Authentication: Email OTP + Google
- Mobile-responsive admin

### 🔨 In progress
- Farmer UI to update crop stage with photo
- Cashfree KYC (founder action item)

### ⏳ Next (post-Cashfree)
- Real payment integration (Cashfree Checkout + Webhooks)
- Cashfree Payouts API for farmer bank transfers
- Cron job to release scheduled payouts
- Cancellation flow with auto-calculated refunds

### 📅 Phase 2
- Shiprocket API for delivery
- Farmer progress photo uploads at each stage
- Consumer farm visit scheduling
- Razorpay Apple Pay support

### 🌅 Phase 3
- Crop subscriptions (auto-rebook same farmer/crop)
- Multilingual (Hindi, Telugu, Tamil, Kannada, Marathi)
- Aggregated logistics (batch pickups by region)
- Family planner / group buy
- Weather + insurance integrations

---

## 12. Quick Reference — Key Numbers

| What | Value | Where to change |
|------|-------|----------------|
| Farmer commission | 8% | `platform_config.farmer_fee_pct` |
| Consumer fee | 3% | `platform_config.consumer_fee_pct` |
| Delivery rate | ₹15/kg | `platform_config.default_delivery_charge_per_kg` |
| Advance % (pre-sowing) | 20% | `platform_config.advance_pct_pre_sowing` |
| Advance % (sowed) | 30% | `platform_config.advance_pct_sowed` |
| Advance % (growing) | 40% | `platform_config.advance_pct_growing` |
| Advance % (pre-harvest) | 60% | `platform_config.advance_pct_pre_harvest` |
| Advance % (ready now) | 100% | `platform_config.advance_pct_ready_now` |
| Farmer release on booking | 30% | `platform_config.advance_release_pct_initial` |
| Farmer release on sowing | 40% | `platform_config.advance_release_pct_on_sowing` |
| Cooling period before payout | 48h | `platform_config.advance_release_delay_hours` |
| Dispute window after delivery | 48h | `platform_config.final_release_delay_hours` |
| Refund <48h | 100% | `platform_config.refund_within_48h_pct` |
| Refund before sowing | 80% | `platform_config.refund_before_sowing_pct` |
| Refund before flowering | 50% | `platform_config.refund_before_flowering_pct` |
| Refund before harvest | 25% | `platform_config.refund_before_harvest_pct` |
| Refund after harvest | 0% | `platform_config.refund_after_harvest_pct` |

**To update any of these without a code deploy:**

```sql
UPDATE platform_config SET farmer_fee_pct = 10 WHERE id = 1;
NOTIFY pgrst, 'reload schema';
```

The app fetches the latest config on each checkout — change reflects immediately.

---

## 13. Open Questions / Future Decisions

- [ ] **Early-booking discount** — offer 5–10% off if consumer books at pre-sowing stage?
- [ ] **Trusted Farmer pricing** — should top-rated farmers get lower commission (e.g., 6%)?
- [ ] **Bulk buyer accounts** — special tier for restaurants/cloud kitchens? Lower advance, different terms?
- [ ] **Subscription model** — monthly recurring crop deliveries with auto-renewal pricing?
- [ ] **Insurance integration** — partner with crop insurance providers for added consumer protection?
- [ ] **Cash on delivery** — should we support COD for the balance payment, or strictly digital?

---

## 14. Contacts & Resources

- **Repo:** github.com/ramky3757/krishi-mitra
- **Supabase Dashboard:** supabase.com/dashboard
- **Vercel Dashboard:** vercel.com — two projects (krishi-mitra-home, krishi-mitra)
- **Domain:** krishimitra.app (registered at Namecheap)

---

*This document is the source of truth for business rules. When code disagrees with this doc, fix the code — not the doc. When the business decision changes, update the doc first, then ship the code change.*
