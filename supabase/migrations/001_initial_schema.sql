-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =========================================
-- USERS
-- =========================================
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  phone text unique,
  email text unique,
  full_name text not null default '',
  avatar_url text,
  role text check (role in ('farmer', 'consumer', 'admin')) not null default 'consumer',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.users enable row level security;

create policy "Users can read their own profile"
  on public.users for select using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update using (auth.uid() = id);

-- Auto-insert user record on auth signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.users (id, phone, email, full_name)
  values (
    new.id,
    new.phone,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================
-- FARMER PROFILES
-- =========================================
create table public.farmer_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  kyc_status text check (kyc_status in ('pending', 'under_review', 'approved', 'rejected')) default 'pending',
  id_doc_url text,
  land_doc_url text,
  farm_geo_lat numeric(10,7),
  farm_geo_lng numeric(10,7),
  farm_address text,
  state text not null default '',
  district text not null default '',
  village text,
  verification_badges text[] default '{}',
  total_listings integer default 0,
  avg_rating numeric(3,2) default 0,
  completed_orders integer default 0,
  bio text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.farmer_profiles enable row level security;

create policy "Farmer profiles are publicly readable"
  on public.farmer_profiles for select to authenticated using (true);

create policy "Farmers can update their own profile"
  on public.farmer_profiles for update using (auth.uid() = user_id);

create policy "Farmers can insert their own profile"
  on public.farmer_profiles for insert with check (auth.uid() = user_id);

-- =========================================
-- CONSUMER PROFILES
-- =========================================
create table public.consumer_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  address text,
  state text,
  district text,
  preferences text[] default '{}',
  created_at timestamptz default now() not null
);

alter table public.consumer_profiles enable row level security;

create policy "Consumers can read their own profile"
  on public.consumer_profiles for select using (auth.uid() = user_id);

create policy "Consumers can update their own profile"
  on public.consumer_profiles for all using (auth.uid() = user_id);

-- =========================================
-- CROP LISTINGS
-- =========================================
create table public.crop_listings (
  id uuid primary key default uuid_generate_v4(),
  farmer_id uuid not null references public.users(id) on delete cascade,
  crop_category text not null,
  crop_name text not null,
  crop_variety text,
  farm_size_acres numeric(8,2) not null,
  total_yield_kg numeric(10,2) not null,
  available_qty_kg numeric(10,2) not null,
  booked_qty_kg numeric(10,2) default 0,
  price_per_kg_advance numeric(10,2) not null,
  price_per_kg_final numeric(10,2) not null,
  advance_percentage integer default 25 check (advance_percentage between 25 and 30),
  sowing_date date not null,
  harvest_date date not null,
  farming_method text check (farming_method in ('organic', 'conventional', 'natural', 'integrated')) not null,
  pesticides_info text,
  is_zero_pesticide boolean default false,
  water_source text,
  soil_type text,
  description text,
  status text check (status in ('draft', 'pending_approval', 'active', 'fully_booked', 'harvested', 'completed', 'cancelled')) default 'pending_approval',
  state text not null,
  district text not null,
  village text,
  geo_lat numeric(10,7),
  geo_lng numeric(10,7),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.crop_listings enable row level security;

create policy "Active listings are publicly readable"
  on public.crop_listings for select to authenticated using (
    status = 'active' or farmer_id = auth.uid()
  );

create policy "Farmers can insert their own listings"
  on public.crop_listings for insert with check (auth.uid() = farmer_id);

create policy "Farmers can update their own listings"
  on public.crop_listings for update using (auth.uid() = farmer_id);

create index crop_listings_state_idx on public.crop_listings(state);
create index crop_listings_district_idx on public.crop_listings(district);
create index crop_listings_category_idx on public.crop_listings(crop_category);
create index crop_listings_status_idx on public.crop_listings(status);

-- =========================================
-- LISTING MEDIA
-- =========================================
create table public.listing_media (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.crop_listings(id) on delete cascade,
  url text not null,
  type text check (type in ('photo', 'video')) default 'photo',
  caption text,
  created_at timestamptz default now() not null
);

alter table public.listing_media enable row level security;

create policy "Listing media is publicly readable"
  on public.listing_media for select to authenticated using (true);

create policy "Farmers can manage listing media"
  on public.listing_media for all using (
    exists (select 1 from public.crop_listings where id = listing_id and farmer_id = auth.uid())
  );

-- =========================================
-- BOOKINGS
-- =========================================
create table public.bookings (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.crop_listings(id),
  consumer_id uuid not null references public.users(id),
  qty_kg numeric(10,2) not null check (qty_kg > 0),
  advance_amount numeric(12,2) not null,
  final_amount numeric(12,2) not null,
  total_amount numeric(12,2) not null,
  status text check (status in ('pending', 'confirmed', 'in_progress', 'harvested', 'shipped', 'delivered', 'cancelled', 'disputed')) default 'pending',
  delivery_address text,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.bookings enable row level security;

create policy "Consumers can see their own bookings"
  on public.bookings for select using (
    auth.uid() = consumer_id or
    exists (select 1 from public.crop_listings cl where cl.id = listing_id and cl.farmer_id = auth.uid())
  );

create policy "Consumers can create bookings"
  on public.bookings for insert with check (auth.uid() = consumer_id);

create policy "Farmers and consumers can update bookings"
  on public.bookings for update using (
    auth.uid() = consumer_id or
    exists (select 1 from public.crop_listings cl where cl.id = listing_id and cl.farmer_id = auth.uid())
  );

-- Update booked_qty_kg when booking status changes
create or replace function update_listing_booked_qty()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' or (TG_OP = 'UPDATE' and new.status != 'cancelled' and old.status = 'cancelled') then
    update public.crop_listings
    set booked_qty_kg = booked_qty_kg + new.qty_kg,
        status = case when (available_qty_kg - booked_qty_kg - new.qty_kg) <= 0 then 'fully_booked' else status end
    where id = new.listing_id;
  elsif TG_OP = 'UPDATE' and new.status = 'cancelled' and old.status != 'cancelled' then
    update public.crop_listings
    set booked_qty_kg = greatest(0, booked_qty_kg - new.qty_kg),
        status = case when status = 'fully_booked' then 'active' else status end
    where id = new.listing_id;
  end if;
  return new;
end;
$$;

create trigger booking_qty_sync
  after insert or update on public.bookings
  for each row execute procedure update_listing_booked_qty();

-- =========================================
-- PAYMENTS
-- =========================================
create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id),
  type text check (type in ('advance', 'final', 'refund')) not null,
  amount numeric(12,2) not null,
  gateway_ref text,
  status text check (status in ('pending', 'completed', 'failed', 'refunded')) default 'pending',
  created_at timestamptz default now() not null
);

alter table public.payments enable row level security;

create policy "Payments visible to booking parties"
  on public.payments for select using (
    exists (
      select 1 from public.bookings b
      join public.crop_listings cl on cl.id = b.listing_id
      where b.id = booking_id and (b.consumer_id = auth.uid() or cl.farmer_id = auth.uid())
    )
  );

-- =========================================
-- PROGRESS UPDATES
-- =========================================
create table public.progress_updates (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.crop_listings(id) on delete cascade,
  milestone text check (milestone in ('sowing', 'sprouting', 'growing', 'flowering', 'pre_harvest', 'harvest_ready')) not null,
  note text not null default '',
  photo_url text,
  created_at timestamptz default now() not null
);

alter table public.progress_updates enable row level security;

create policy "Progress updates are readable by authenticated users"
  on public.progress_updates for select to authenticated using (true);

create policy "Farmers can post progress updates for their listings"
  on public.progress_updates for insert with check (
    exists (select 1 from public.crop_listings where id = listing_id and farmer_id = auth.uid())
  );

-- =========================================
-- FARM VISITS
-- =========================================
create table public.farm_visits (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  requested_date date not null,
  confirmed_date date,
  status text check (status in ('requested', 'approved', 'rejected', 'completed', 'cancelled')) default 'requested',
  notes text,
  created_at timestamptz default now() not null
);

alter table public.farm_visits enable row level security;

create policy "Farm visits visible to booking parties"
  on public.farm_visits for select using (
    exists (
      select 1 from public.bookings b
      join public.crop_listings cl on cl.id = b.listing_id
      where b.id = booking_id and (b.consumer_id = auth.uid() or cl.farmer_id = auth.uid())
    )
  );

create policy "Consumers can request farm visits"
  on public.farm_visits for insert with check (
    exists (select 1 from public.bookings where id = booking_id and consumer_id = auth.uid())
  );

create policy "Farmers can approve/reject farm visits"
  on public.farm_visits for update using (
    exists (
      select 1 from public.bookings b
      join public.crop_listings cl on cl.id = b.listing_id
      where b.id = booking_id and cl.farmer_id = auth.uid()
    )
  );

-- =========================================
-- MESSAGES
-- =========================================
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  sender_id uuid not null references public.users(id),
  text text not null,
  created_at timestamptz default now() not null
);

alter table public.messages enable row level security;

create policy "Messages visible to booking parties"
  on public.messages for select using (
    exists (
      select 1 from public.bookings b
      join public.crop_listings cl on cl.id = b.listing_id
      where b.id = booking_id and (b.consumer_id = auth.uid() or cl.farmer_id = auth.uid())
    )
  );

create policy "Booking parties can send messages"
  on public.messages for insert with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.bookings b
      join public.crop_listings cl on cl.id = b.listing_id
      where b.id = booking_id and (b.consumer_id = auth.uid() or cl.farmer_id = auth.uid())
    )
  );

-- =========================================
-- REVIEWS
-- =========================================
create table public.reviews (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id),
  reviewer_id uuid not null references public.users(id),
  reviewee_id uuid not null references public.users(id),
  rating integer not null check (rating between 1 and 5),
  tags text[] default '{}',
  comment text,
  created_at timestamptz default now() not null,
  unique(booking_id, reviewer_id)
);

alter table public.reviews enable row level security;

create policy "Reviews are publicly readable"
  on public.reviews for select to authenticated using (true);

create policy "Delivered booking parties can post reviews"
  on public.reviews for insert with check (
    auth.uid() = reviewer_id and
    exists (
      select 1 from public.bookings where id = booking_id and status = 'delivered'
      and (consumer_id = auth.uid() or
        exists (select 1 from public.crop_listings where id = listing_id and farmer_id = auth.uid()))
    )
  );

-- Update farmer avg_rating on new review
create or replace function update_farmer_rating()
returns trigger language plpgsql security definer as $$
begin
  update public.farmer_profiles
  set avg_rating = (
    select avg(r.rating) from public.reviews r
    join public.bookings b on b.id = r.booking_id
    join public.crop_listings cl on cl.id = b.listing_id
    where cl.farmer_id = new.reviewee_id
  )
  where user_id = new.reviewee_id;
  return new;
end;
$$;

create trigger review_rating_sync
  after insert on public.reviews
  for each row execute procedure update_farmer_rating();
