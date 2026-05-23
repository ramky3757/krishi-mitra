-- Storage buckets
insert into storage.buckets (id, name, public) values ('kyc-docs', 'kyc-docs', false);
insert into storage.buckets (id, name, public) values ('listing-media', 'listing-media', true);
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

-- KYC docs: only the user and admins can access
create policy "KYC docs: owner can upload"
  on storage.objects for insert with check (
    bucket_id = 'kyc-docs' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "KYC docs: owner can read"
  on storage.objects for select using (
    bucket_id = 'kyc-docs' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Listing media: public read, farmer upload
create policy "Listing media: public read"
  on storage.objects for select using (bucket_id = 'listing-media');

create policy "Listing media: authenticated upload"
  on storage.objects for insert with check (
    bucket_id = 'listing-media' and auth.role() = 'authenticated'
  );

-- Avatars: public read, authenticated upload
create policy "Avatars: public read"
  on storage.objects for select using (bucket_id = 'avatars');

create policy "Avatars: authenticated upload"
  on storage.objects for insert with check (
    bucket_id = 'avatars' and auth.role() = 'authenticated'
  );
