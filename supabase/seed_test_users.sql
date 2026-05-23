-- Seed test users for HarvestBond dev mode
--
-- STEP 1 — Create the 3 auth users in the Supabase Dashboard first:
--   Dashboard → Authentication → Users → "Add user" → "Create new user"
--   Use these exact credentials and TICK "Auto Confirm User" so email confirmation is skipped:
--
--     admin@harvestbond.test     / admin1234
--     farmer@harvestbond.test    / farmer1234
--     consumer@harvestbond.test  / consumer1234
--
-- STEP 2 — Run this script in the SQL Editor. It assigns roles, names,
--          and creates the farmer/consumer profile rows.
-- ---------------------------------------------------------------------

-- Assign roles and display names on the public.users row
-- (The handle_new_user trigger should have already inserted a row for each.)
update public.users
   set role = 'admin', full_name ='Platform Admin'
 where email = 'admin@harvestbond.test';

update public.users
   set role = 'farmer', full_name ='Ramesh Kumar'
 where email = 'farmer@harvestbond.test';

update public.users
   set role = 'consumer', full_name ='Priya Sharma'
 where email = 'consumer@harvestbond.test';

-- Create farmer profile (KYC approved, location set)
insert into public.farmer_profiles (
  user_id, kyc_status, farm_geo_lat, farm_geo_lng, verification_badges
)
select id, 'approved', 17.3850, 78.4867, array['ID Verified', 'Land Verified', 'Location Verified']
  from public.users
 where email = 'farmer@harvestbond.test'
on conflict (user_id) do update
   set kyc_status = excluded.kyc_status,
       verification_badges = excluded.verification_badges;

-- Create consumer profile
insert into public.consumer_profiles (user_id, address)
select id, '123 Banjara Hills, Hyderabad, Telangana 500034'
  from public.users
 where email = 'consumer@harvestbond.test'
on conflict (user_id) do update
   set address = excluded.address;

-- Verify
select email, role, full_name from public.users where email like '%@harvestbond.test' order by role;
