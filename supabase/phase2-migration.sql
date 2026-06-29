-- Phase 2 feature migrations

CREATE TABLE IF NOT EXISTS admins (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  username text unique not null,
  password_hash text not null,
  avatar_url text,
  created_at timestamp default now()
);

CREATE TABLE IF NOT EXISTS admin_activity (
  id uuid primary key default gen_random_uuid(),
  admin_name text not null,
  action text not null,
  entity_type text,
  entity_id uuid,
  entity_name text,
  created_at timestamp default now()
);

CREATE TABLE IF NOT EXISTS family_members (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  display_name text not null,
  relationship text,
  location text,
  avatar_url text,
  password_hash text not null,
  lat float,
  lng float,
  created_at timestamp default now()
);

CREATE TABLE IF NOT EXISTS videos (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references places(id) on delete cascade,
  trip_id uuid references trips(id) on delete cascade,
  storage_url text not null,
  thumbnail_url text,
  caption text,
  taken_by text,
  taken_date date,
  duration_seconds int,
  file_size_kb int,
  created_at timestamp default now()
);

CREATE TABLE IF NOT EXISTS growth_entries (
  id uuid primary key default gen_random_uuid(),
  height_cm float not null,
  measured_date date not null,
  note text,
  photo_url text,
  created_at timestamp default now()
);

CREATE TABLE IF NOT EXISTS otis_settings (
  key text primary key,
  value text not null
);

CREATE TABLE IF NOT EXISTS firsts_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null,
  created_at timestamp default now()
);

CREATE TABLE IF NOT EXISTS otis_firsts (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references firsts_categories(id),
  title text not null,
  description text,
  date date not null,
  location text,
  photo_url text,
  tags text[],
  created_at timestamp default now()
);

CREATE TABLE IF NOT EXISTS favourite_things (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  value text not null,
  note text,
  date_logged date not null,
  photo_url text,
  is_current boolean default true,
  created_at timestamp default now()
);

CREATE TABLE IF NOT EXISTS guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_username text,
  message text not null,
  photo_url text,
  pinned boolean default false,
  created_at timestamp default now()
);

CREATE TABLE IF NOT EXISTS year_reviews (
  id uuid primary key default gen_random_uuid(),
  year int not null unique,
  headline text,
  favourite_moment_id uuid references diary_entries(id),
  published boolean default false,
  created_at timestamp default now()
);

CREATE TABLE IF NOT EXISTS diary_reactions (
  id uuid primary key default gen_random_uuid(),
  diary_entry_id uuid references diary_entries(id) on delete cascade,
  commenter_name text not null,
  emoji text not null,
  created_at timestamp default now()
);

CREATE TABLE IF NOT EXISTS time_capsules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  unlock_date date not null,
  created_by text not null,
  is_unlocked boolean default false,
  created_at timestamp default now()
);

CREATE TABLE IF NOT EXISTS capsule_letters (
  id uuid primary key default gen_random_uuid(),
  capsule_id uuid references time_capsules(id) on delete cascade,
  author text not null,
  letter_text text,
  photo_url text,
  last_edited timestamp,
  created_at timestamp default now()
);

ALTER TABLE photos ADD COLUMN IF NOT EXISTS file_size_kb integer;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS caption text;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS is_trip_highlight boolean default false;
ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS weather text;
ALTER TABLE food_log ADD COLUMN IF NOT EXISTS lat float;
ALTER TABLE food_log ADD COLUMN IF NOT EXISTS lng float;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS centre_lat float;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS centre_lng float;
ALTER TABLE places ADD COLUMN IF NOT EXISTS age_at_visit_months integer;

INSERT INTO otis_settings (key, value) VALUES ('dob', '2024-12-17') ON CONFLICT (key) DO NOTHING;
INSERT INTO otis_settings (key, value) VALUES ('home_lat', '54.7160') ON CONFLICT (key) DO NOTHING;
INSERT INTO otis_settings (key, value) VALUES ('home_lng', '-5.8093') ON CONFLICT (key) DO NOTHING;
INSERT INTO otis_settings (key, value) VALUES ('home_location', 'Northern Ireland') ON CONFLICT (key) DO NOTHING;
INSERT INTO otis_settings (key, value) VALUES ('home_timezone', 'Europe/London') ON CONFLICT (key) DO NOTHING;

INSERT INTO firsts_categories (name, emoji)
SELECT v.name, v.emoji FROM (VALUES
  ('Food', '🍕'), ('Place', '📍'), ('Milestone', '🎉'), ('Funny Moment', '😂'),
  ('Animal', '🐾'), ('Word', '💬'), ('Skill', '⭐'), ('Travel', '✈️')
) AS v(name, emoji)
WHERE NOT EXISTS (SELECT 1 FROM firsts_categories LIMIT 1);

UPDATE trips SET centre_lat = 54.7, centre_lng = -6.6 WHERE slug = 'northern-ireland-2026';
