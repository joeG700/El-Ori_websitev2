create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,
  price numeric(10, 2) not null check (price >= 0),
  image_url text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

revoke all on public.products from public, anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

drop policy if exists "Public read access" on public.products;
drop policy if exists "Authenticated write access" on public.products;
drop policy if exists "Public read active products" on public.products;
create policy "Public read active products"
  on public.products for select
  to anon, authenticated
  using (active);

drop policy if exists "Admin read all products" on public.products;
create policy "Admin read all products"
  on public.products for select
  to authenticated
  using (
    lower((select auth.jwt() ->> 'email')) in
      ('elorriii02@gmail.com', 'joeghartey419@gmail.com')
  );

drop policy if exists "Admin insert products" on public.products;
create policy "Admin insert products"
  on public.products for insert
  to authenticated
  with check (
    lower((select auth.jwt() ->> 'email')) in
      ('elorriii02@gmail.com', 'joeghartey419@gmail.com')
  );

drop policy if exists "Admin update products" on public.products;
create policy "Admin update products"
  on public.products for update
  to authenticated
  using (
    lower((select auth.jwt() ->> 'email')) in
      ('elorriii02@gmail.com', 'joeghartey419@gmail.com')
  )
  with check (
    lower((select auth.jwt() ->> 'email')) in
      ('elorriii02@gmail.com', 'joeghartey419@gmail.com')
  );

drop policy if exists "Admin delete products" on public.products;
create policy "Admin delete products"
  on public.products for delete
  to authenticated
  using (
    lower((select auth.jwt() ->> 'email')) in
      ('elorriii02@gmail.com', 'joeghartey419@gmail.com')
  );

update public.products
set active = false
where slug in (
  'layered-gold-necklace',
  'pearl-drop-necklace',
  'statement-hoop-earrings',
  'crystal-stud-earrings',
  'twist-band-ring',
  'stackable-ring-set',
  'charm-bracelet',
  'gift-set-necklace-earrings'
)
and not exists (
  select 1 from public.products where slug = 'crystal-clover-necklace'
);

insert into public.products (slug, name, category, price, image_url)
values
  ('crystal-clover-necklace', 'Crystal Clover Necklace [Gold]', 'Necklaces', 100, 'assets/products/necklace-clover.jpg'),
  ('pearl-strand-necklace', 'Pearl Strand Necklace', 'Necklaces', 120, 'assets/products/necklace-pearl.jpg'),
  ('layered-chain-necklace', 'Layered Chain Necklace [Silver]', 'Necklaces', 85, 'assets/products/necklace-layered.jpg'),
  ('tennis-bracelet-silver', 'Tennis Bracelet [Silver]', 'Bracelets', 85, 'assets/products/bracelet-tennis.jpg'),
  ('love-bangle-gold', 'Love Bangle [Gold]', 'Bracelets', 90, 'assets/products/bracelet-love.jpg'),
  ('good-luck-dainty-bracelet', 'Good Luck Dainty Bracelet', 'Bracelets', 60, 'assets/products/bracelet-goodluck.jpg'),
  ('emerald-stud-earrings', 'Emerald Stud Earrings', 'Earrings', 70, 'assets/products/earrings-emerald.jpg'),
  ('daisy-stud-earrings', 'Daisy Stud Earrings', 'Earrings', 65, 'assets/products/earrings-daisy.jpg'),
  ('crystal-solitaire-ring', 'Crystal Solitaire Ring', 'Rings', 55, 'assets/products/ring-solitaire.jpg'),
  ('stacking-ring-set', 'Stacking Ring Set', 'Rings', 80, 'assets/products/rings-stack.jpg'),
  ('crystal-anklet-silver', 'Crystal Anklet [Silver]', 'Anklets', 50, 'assets/products/anklet-crystal.jpg'),
  ('pearl-anklet', 'Pearl Anklet', 'Anklets', 55, 'assets/products/anklet-pearl.jpg'),
  ('tresor-jewelry-set', 'Trésor Jewelry Set', 'Jewelry Sets', 180, 'assets/products/set-tresor.jpg'),
  ('ladies-watch-rose-gold', 'Ladies Watch [Rose Gold]', 'Watches', 150, 'assets/products/watch-ladies.jpg'),
  ('mens-watch-black-steel', 'Men''s Watch [Black Steel]', 'Watches', 180, 'assets/products/watch-mens.jpg'),
  ('signature-gift-set', 'Signature Gift Set', 'Gift Packages', 250, 'assets/products/gift-signature.jpg')
on conflict (slug) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
  on storage.objects for select
  to public
  using (bucket_id = 'product-images');

drop policy if exists "Admin upload product images" on storage.objects;
create policy "Admin upload product images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and lower((select auth.jwt() ->> 'email')) in
      ('elorriii02@gmail.com', 'joeghartey419@gmail.com')
  );

drop policy if exists "Admin update product images" on storage.objects;
create policy "Admin update product images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and lower((select auth.jwt() ->> 'email')) in
      ('elorriii02@gmail.com', 'joeghartey419@gmail.com')
  )
  with check (
    bucket_id = 'product-images'
    and lower((select auth.jwt() ->> 'email')) in
      ('elorriii02@gmail.com', 'joeghartey419@gmail.com')
  );

drop policy if exists "Admin delete product images" on storage.objects;
create policy "Admin delete product images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and lower((select auth.jwt() ->> 'email')) in
      ('elorriii02@gmail.com', 'joeghartey419@gmail.com')
  );
