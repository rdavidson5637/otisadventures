-- Run this in Supabase SQL Editor for project fqtgccvzmpnqqxydssac

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  cover_emoji text,
  start_date date,
  end_date date,
  location text,
  slug text unique,
  is_active boolean default false,
  created_at timestamp default now()
);

-- If trips table already exists without slug:
-- alter table public.trips add column if not exists slug text unique;

create table if not exists places (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  name text not null,
  location text,
  category text,
  long_description text,
  otis_thoughts text,
  lat float,
  lng float,
  visited boolean default false,
  visited_date date,
  otis_rating int,
  created_at timestamp default now()
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references places(id) on delete cascade,
  storage_url text,
  memory_note text,
  taken_by text,
  taken_date date,
  created_at timestamp default now()
);

create table if not exists diary_entries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  entry_date date not null,
  time_of_day text,
  title text,
  note text,
  photo_url text,
  created_at timestamp default now()
);

create table if not exists spontaneous_trips (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  name text not null,
  location text,
  date date,
  note text,
  photos text[],
  created_at timestamp default now()
);

create table if not exists food_log (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  restaurant_name text,
  location text,
  date date,
  meal_type text,
  what_otis_ate text,
  otis_rating int,
  photo_url text,
  note text,
  created_at timestamp default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references places(id) on delete cascade,
  commenter_name text,
  message text,
  created_at timestamp default now()
);

create table if not exists reactions (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references places(id) on delete cascade,
  commenter_name text,
  emoji text,
  created_at timestamp default now()
);

alter table trips enable row level security;
alter table places enable row level security;
alter table photos enable row level security;
alter table diary_entries enable row level security;
alter table spontaneous_trips enable row level security;
alter table food_log enable row level security;
alter table comments enable row level security;
alter table reactions enable row level security;

create policy "Public read trips" on trips for select using (true);
create policy "Public read places" on places for select using (true);
create policy "Public read photos" on photos for select using (true);
create policy "Public read diary" on diary_entries for select using (true);
create policy "Public read spontaneous" on spontaneous_trips for select using (true);
create policy "Public read food" on food_log for select using (true);
create policy "Public read comments" on comments for select using (true);
create policy "Public read reactions" on reactions for select using (true);

create policy "Public insert comments" on comments for insert with check (true);
create policy "Public insert reactions" on reactions for insert with check (true);

insert into storage.buckets (id, name, public)
values ('otis-photos', 'otis-photos', true)
on conflict (id) do nothing;

create policy "Public read otis photos"
on storage.objects for select
using (bucket_id = 'otis-photos');
