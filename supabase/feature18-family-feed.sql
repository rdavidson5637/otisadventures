-- Feature 18: Family feed & locations

CREATE TABLE IF NOT EXISTS feed_event_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null,
  colour text not null,
  created_at timestamp default now()
);

INSERT INTO feed_event_types (name, emoji, colour) VALUES
('Birthday', '🎂', '#F5C842'),
('Anniversary', '💍', '#D4614E'),
('Graduation', '🎓', '#4A7C59'),
('Holiday', '✈️', '#5B8DB8'),
('New Baby', '👶', '#E8A0B0'),
('New Home', '🏠', '#8B6BA8'),
('Achievement', '🏆', '#F5C842'),
('Wedding', '💒', '#D4614E'),
('New Job', '💼', '#4A7C59'),
('Just a moment', '✨', '#5B8DB8')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS family_feed (
  id uuid primary key default gen_random_uuid(),
  author_username text not null,
  author_display_name text not null,
  event_type_id uuid references feed_event_types(id),
  title text not null,
  body text,
  location_tag text,
  photos text[],
  is_removed boolean default false,
  remove_reason text,
  created_at timestamp default now()
);

CREATE TABLE IF NOT EXISTS feed_comments (
  id uuid primary key default gen_random_uuid(),
  feed_post_id uuid references family_feed(id) on delete cascade,
  author_username text not null,
  author_display_name text not null,
  message text not null,
  created_at timestamp default now()
);

CREATE TABLE IF NOT EXISTS family_locations (
  id uuid primary key default gen_random_uuid(),
  member_username text not null unique,
  display_name text not null,
  current_location text not null,
  location_detail text,
  timezone text not null,
  lat float,
  lng float,
  avatar_url text,
  relationship text,
  last_updated timestamp default now()
);

ALTER TABLE feed_event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read event types" ON feed_event_types;
CREATE POLICY "Public can read event types" ON feed_event_types FOR SELECT USING (true);

DROP POLICY IF EXISTS "Family can read feed" ON family_feed;
CREATE POLICY "Family can read feed" ON family_feed FOR SELECT USING (is_removed = false);

DROP POLICY IF EXISTS "Family can insert posts" ON family_feed;
CREATE POLICY "Family can insert posts" ON family_feed FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can read feed comments" ON feed_comments;
CREATE POLICY "Public can read feed comments" ON feed_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Family can insert comments" ON feed_comments;
CREATE POLICY "Family can insert comments" ON feed_comments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can read locations" ON family_locations;
CREATE POLICY "Public can read locations" ON family_locations FOR SELECT USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE family_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE feed_comments;

-- Seed existing family members into locations
INSERT INTO family_locations (member_username, display_name, current_location, timezone, avatar_url, relationship)
SELECT username, display_name, COALESCE(location, 'Northern Ireland'), 'Europe/London', avatar_url, relationship
FROM family_members
ON CONFLICT (member_username) DO NOTHING;
