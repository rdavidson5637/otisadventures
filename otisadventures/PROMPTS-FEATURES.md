# Otis' Adventures — Feature Prompts (Phase 2)

> These prompts build on top of the completed Phase 1 scrapbook (PROMPTS.md Steps 1-14).
> Complete all Phase 1 steps before starting here.
> Each prompt is self-contained. Run one at a time in Cursor Agent mode.
> Reference SPEC.md throughout for design tokens, colours and component patterns.

---

## Feature 1 — Two Admin Accounts (Dad & Mum)

```
Read SPEC.md. Replace the single admin password system with two named admin accounts — Dad and Mum.

1. DATABASE
Run in Supabase SQL editor:

CREATE TABLE admins (
  id uuid primary key default gen_random_uuid(),
  name text not null,                    -- 'Dad' | 'Mum'
  username text unique not null,         -- 'dad' | 'mum'
  password_hash text not null,           -- bcrypt hash
  avatar_url text,
  created_at timestamp default now()
);

-- Activity log table
CREATE TABLE admin_activity (
  id uuid primary key default gen_random_uuid(),
  admin_name text not null,              -- 'Dad' | 'Mum'
  action text not null,                  -- 'added 3 photos to Castle Ward'
  entity_type text,                      -- 'photo' | 'diary' | 'food' | 'place' | 'trip'
  entity_id uuid,
  entity_name text,                      -- human readable e.g. 'Castle Ward'
  created_at timestamp default now()
);

Enable RLS on both tables:
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read activity" ON admin_activity FOR SELECT USING (true);

2. ENVIRONMENT VARIABLES
Add to .env.local.example:
DAD_PASSWORD=
MUM_PASSWORD=

In .env.local, set two separate bcrypt-hashed passwords.
Install bcryptjs: npm install bcryptjs @types/bcryptjs

3. UPDATE /app/api/otis/auth/route.ts
- Accept { username, password } in POST body
- Look up admin by username in the admins table
- Compare password with bcrypt.compare()
- On success: return { success: true, adminName: 'Dad' | 'Mum' }
- Store in sessionStorage: otis_admin = 'true', otis_admin_name = 'Dad' | 'Mum'

Create /app/api/otis/admin/seed/route.ts — a one-time POST route that seeds the two admin rows:
- username: 'dad', name: 'Dad', password hashed from process.env.DAD_PASSWORD
- username: 'mum', name: 'Mum', password hashed from process.env.MUM_PASSWORD
- Only runs if admins table is empty
- Delete this route after first use

4. UPDATE /app/otis/admin/page.tsx
- Add username input field above the password field
- Label: "Who are you?" with two large pill buttons: "Dad 👨" and "Mum 👩"
- Clicking a pill pre-fills the username, focuses the password field
- Error message updates to: "Wrong password, [name]! 🙈"
- On success: store otis_admin_name in sessionStorage alongside otis_admin

5. UPDATE AdminGate.tsx
- Export useAdminName(): string | null — returns 'Dad' | 'Mum' | null from sessionStorage
- Update useIsAdmin() to check sessionStorage otis_admin === 'true'
- Export AdminName component: renders the current admin name inline

6. UPDATE ALL ADMIN WRITE ACTIONS
Wherever a POST/PATCH/DELETE is made to an API route from an admin action,
include admin_name: useAdminName() in the request body.

Update these API routes to accept admin_name and log activity:
- /api/otis/photos (POST) → log "Dad added X photos to [place name]"
- /api/otis/places/[id] (PATCH visited) → log "Mum marked [place name] as visited"
- /api/otis/diary (POST) → log "Dad added a diary entry for [date]"
- /api/otis/food (POST) → log "Mum logged a meal at [restaurant name]"
- /api/otis/trips (POST) → log "Dad created a new trip: [trip name]"
- /api/otis/spontaneous (POST) → log "Mum added a spontaneous trip: [name]"

Each API route should insert a row into admin_activity after the main action succeeds.

7. UPDATE PHOTO ATTRIBUTION
Photos uploaded by Dad show "📷 Dad" badge.
Photos uploaded by Mum show "📷 Mum" badge.
Update UploadModal.tsx — remove the "Ryan / Pippa" toggle, replace with auto-detection from sessionStorage otis_admin_name.
Update photo taken_by field to be set automatically, not manually.
```

---

## Feature 2 — Family Login System

```
Read SPEC.md. Build a full family login system using Supabase Auth so family members can log in with a username and password created by Dad.

1. DATABASE
Run in Supabase SQL editor:

CREATE TABLE family_members (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  display_name text not null,           -- e.g. "Granny", "Grandad", "Auntie Sarah"
  relationship text,                    -- e.g. "Gran", "Grandad", "Auntie"
  location text,                        -- e.g. "Belfast", "Dublin"
  avatar_url text,
  password_hash text not null,
  created_at timestamp default now()
);

Enable RLS:
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Family can read members" ON family_members FOR SELECT USING (true);

2. INSTALL DEPENDENCIES
npm install bcryptjs @types/bcryptjs (if not already installed from Feature 1)

3. CREATE /app/api/otis/family/auth/route.ts
POST: accept { username, password }
- Look up family_member by username
- bcrypt.compare password
- On success: create a signed session token (use jose npm package: npm install jose)
  - Token payload: { memberId, displayName, username }
  - Sign with JWT_SECRET from env
  - Return token in httpOnly cookie (name: otis_family_session, maxAge: 7 days)
- On failure: return { success: false, message: 'Wrong password!' }

4. CREATE /app/api/otis/family/me/route.ts
GET: read otis_family_session cookie, verify JWT, return member data
Used to check if a family member is logged in on page load.

5. CREATE /app/api/otis/family/logout/route.ts
POST: clear the otis_family_session cookie

6. CREATE /app/api/otis/family/members/route.ts (admin only)
GET: fetch all family members (without password_hash)
POST: create new family member — accept { username, display_name, relationship, location, password }
  Hash password with bcrypt before storing.

7. CREATE /app/api/otis/family/members/[id]/route.ts (admin only)
PATCH: update member (display_name, relationship, location, avatar_url, password)
DELETE: delete member

8. CREATE /app/otis/login/page.tsx
Login page for family members.
Design — scrapbook style, corkboard background:
- Large 🍀 emoji centred
- Heading: "Welcome to Otis' Adventures" in Caveat very large navy
- Subheading: "Log in to see what Otis has been up to 💛" in Caveat muted
- Username input: placeholder "Your name..." (e.g. granny, grandad)
- Password input: placeholder "Password..."
- "Come on in! →" button in coral Caveat
- Small muted text below: "Need access? Ask Dad or Mum 😊"
- On success: redirect to /otis
- On failure: shake animation, "Hmm, that doesn't look right! Try again 🙈"

9. CREATE middleware.ts in project root
Use Next.js middleware to protect all /otis routes:
- Check for otis_family_session cookie OR otis_admin sessionStorage equivalent
- Since middleware runs server-side, check cookie only
- If no valid cookie AND no admin session: redirect to /otis/login
- Exception: /otis/login and /otis/admin are always accessible
- Also allow /api/otis/family/auth (the login endpoint itself)

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const familySession = request.cookies.get('otis_family_session')
  const isLoginPage = request.nextUrl.pathname === '/otis/login'
  const isAdminPage = request.nextUrl.pathname === '/otis/admin'
  const isAuthApi = request.nextUrl.pathname.startsWith('/api/otis/family/auth')

  if (isLoginPage || isAdminPage || isAuthApi) return NextResponse.next()

  if (!familySession) {
    return NextResponse.redirect(new URL('/otis/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/otis/:path*']
}

10. UPDATE COMMENTS AND REACTIONS
Family members are now logged in — no longer need the name prompt modal.
Update CommentsSection.tsx and ReactionsRow.tsx:
- Get commenter name from the family session cookie via /api/otis/family/me
- Remove NamePromptModal entirely — it's no longer needed
- Comments and reactions automatically use the logged-in family member's display_name
- Show their avatar (if set) next to their name in comments

11. CREATE /components/otis/FamilyHeader.tsx
A small header bar at the very top of all /otis pages (above the hero):
- Cream background, subtle kraft border bottom
- Left: "👋 Hello, [display_name]!" in Caveat navy
- Right: "Log out" small text button
- On mobile: compact, just avatar + name
- Only shows for family members (not admin — admin has their own indicator)

12. ADMIN — FAMILY MEMBER MANAGEMENT
Add a "Family Members" section to the admin area at /otis/admin:
- List of all family members with name, username, relationship, location, avatar
- "Add family member +" button → modal:
  - Display name input (e.g. "Granny")
  - Username input (e.g. "granny") — auto-slugified from display name
  - Relationship input (e.g. "Gran")
  - Location input (e.g. "Belfast")
  - Password input + confirm password
  - "Create account →" button
- Each member row has edit ✏️ and delete 🗑️ buttons
- Edit modal pre-fills all fields, password field shows "Leave blank to keep current password"
- After creating: show the login details in a copyable box: "Username: granny / Password: [password]"
  so Dad can copy and send to the family member

Add to .env.local.example:
JWT_SECRET=
```

---

## Feature 3 — Image Compression on Upload

```
Read SPEC.md. Add automatic image compression before upload to protect Supabase Storage free tier and keep page load fast.

1. INSTALL
npm install browser-image-compression

2. CREATE /lib/compress-image.ts

import imageCompression from 'browser-image-compression'

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1,              // max 1MB per photo
    maxWidthOrHeight: 1920,    // max 1920px on longest side
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.85,
    onProgress: undefined,
  }

  try {
    const compressed = await imageCompression(file, options)
    return compressed
  } catch (err) {
    console.error('Compression failed, using original:', err)
    return file  // fallback to original if compression fails
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

3. UPDATE UploadModal.tsx
Before converting files to base64, run each through compressImage():

import { compressImage, formatFileSize } from '@/lib/compress-image'

In the file selection handler:
- Show a compression progress indicator per file: "Compressing... ⚡"
- After compression: show original size → compressed size in the preview thumbnail caption
  e.g. "3.2 MB → 0.8 MB"
- Only then convert to base64 and POST to /api/otis/photos

UI addition in UploadModal:
- Below the drop zone, add a small muted note in Caveat:
  "Photos are automatically compressed to keep things fast 📱"
- Each preview thumbnail shows the compressed file size in small text

4. UPDATE /api/otis/photos/route.ts
- Add file size validation: reject files over 10MB even after compression (safety net)
- Log the compressed size in the photo row — add a file_size_kb integer column to photos table:

ALTER TABLE photos ADD COLUMN file_size_kb integer;

- Calculate size from the base64 string length before uploading:
  const sizeKb = Math.round((base64.length * 3) / 4 / 1024)

5. ADD STORAGE STATS TO ADMIN AREA
In the admin panel, show a small storage usage card:
- "Storage used: X MB of 1000 MB" (Supabase free tier is 1GB)
- Calculate from sum of file_size_kb across all photos
- Simple progress bar in the card
- Warning colour (coral) when over 700MB
```

---

## Feature 4 — Video Support

```
Read SPEC.md. Add video support — one video per place, plus a dedicated Otis' Videos page.

1. DATABASE
Run in Supabase SQL editor:

CREATE TABLE videos (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references places(id) on delete cascade,
  trip_id uuid references trips(id) on delete cascade,
  storage_url text not null,
  thumbnail_url text,           -- auto-generated or manually uploaded
  caption text,
  taken_by text,                -- 'Dad' | 'Mum'
  taken_date date,
  duration_seconds int,
  file_size_kb int,
  created_at timestamp default now()
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read videos" ON videos FOR SELECT USING (true);

-- place_id OR trip_id — place videos link to a place, trip-level videos link to trip only
-- A place can have ONE video (enforce in the app, not DB)

2. UPDATE /app/api/otis/videos/route.ts
POST (admin): 
- Accept base64 video + metadata
- Validate: max 60 seconds, max 100MB, must be mp4/mov/webm
- Upload to Supabase Storage bucket 'otis-photos' under a /videos/ prefix
- Insert video row
- If place already has a video: replace it (delete old, insert new)

GET: fetch video for a place_id or all videos for a trip_id

/app/api/otis/videos/[id]/route.ts
DELETE (admin): remove video row + storage file

3. UPDATE PlaceCard.tsx
In the photo section of each place card:
- If place has a video: show a video thumbnail with a play button overlay ▶️
- The thumbnail sits alongside the photo grid (or replaces a photo slot if no photos)
- Clicking the video thumbnail opens a VideoPlayer modal (see below)
- Admin: "Add video 🎬" button in the photo section — only shows if no video yet
  Clicking opens VideoUploadModal

Create /components/otis/VideoPlayer.tsx:
- Modal overlay, dark background
- HTML5 <video> element with controls
- Source from storage_url
- Shows caption in Caveat below
- Taken by badge: "🎬 Dad" or "🎬 Mum"
- Close button top right
- On mobile: full screen

Create /components/otis/VideoUploadModal.tsx:
- Similar to UploadModal but single file only
- Accept: mp4, mov, webm
- Max size warning: "Keep videos under 30 seconds for best performance"
- Show file duration after selection (use HTML5 video element to read duration)
- If duration > 60 seconds: show warning "This video is quite long — consider trimming it"
  (don't block upload, just warn)
- Caption input
- Taken date picker
- Taken by: auto-filled from admin session
- Upload progress bar (use XMLHttpRequest for progress events, not fetch)
- On complete: refresh place card, show toast "🎬 Video saved!"

4. CREATE /app/otis/videos/page.tsx — Otis' Videos Page

Route: /otis/videos

Page heading: "Otis' Videos 🎬" in Caveat very large
Subheading: "Every precious moment, captured on camera 💛" in Caveat muted

Fetch all videos across all trips, joined with place name and trip name.

Layout — masonry-style grid of video cards:
Each card:
- Cream scrapbook card, slight rotation seeded from video id
- Washi tape on top
- Video thumbnail with large ▶️ play button overlay
- Place name in Caveat bold navy
- Trip name small muted (e.g. "Northern Ireland 2025")
- Caption in Caveat italic muted
- Taken by badge + date
- Clicking anywhere on card opens VideoPlayer modal

Group videos by trip (most recent trip first):
- Trip name as a Caveat section heading
- Videos for that trip in a grid below

Empty state: "No videos yet — go capture some magic! 🎬"

Admin: "Upload a video +" floating button — opens VideoUploadModal
(allows uploading a video without going to a specific place card)

5. ADD VIDEOS TO NAV
In the main /otis layout, add "🎬 Videos" to the top-level navigation
(not inside trip tabs — it's global across all trips)

6. STORAGE CONSIDERATIONS
Videos go in the same 'otis-photos' Supabase bucket under a /videos/ path.
Update the storage stats card from Feature 3 to include video storage separately:
- "Photos: X MB · Videos: X MB · Total: X MB of 1000 MB"
```

---

## Feature 5 — World Map on Trip Selector

```
Read SPEC.md. Add an interactive world map to the trip selector homepage showing all trips as pins.

1. UPDATE /app/otis/page.tsx
Add a world map section above the trip cards grid.

The map section:
- Full width, height 400px desktop / 280px mobile
- Slight kraft border top and bottom
- Section heading above: "Otis' World 🌍" in Caveat large cream, left aligned

2. CREATE /components/otis/WorldMap.tsx
Wrapper with dynamic import ssr: false:
const WorldMapInner = dynamic(() => import('@/components/otis/WorldMapInner'), { ssr: false })

3. CREATE /components/otis/WorldMapInner.tsx
'use client'

Use react-leaflet MapContainer.
Tile layer: use a clean, illustrated style tile — CartoDB Voyager:
https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png

World view: zoom 2, centre [20, 0]

Each trip as a custom marker:
- Large emoji marker using L.divIcon — shows the trip's cover_emoji in a cream circle with navy border
- Size: 44px diameter
- Visited/active trips: solid navy border 3px
- Future planned trips (if is_active false and end_date in future): dashed border

On marker click:
- Small popup appears (Leaflet popup, custom styled):
  - Cream background, shadow
  - Trip name in Caveat bold
  - Location + date range small muted
  - "Open Scrapbook →" link in coral Caveat
  - Places visited count

Map controls:
- Zoom in/out buttons (default Leaflet, styled to match cream theme)
- "Reset view" button: zooms back to world view

Fun stat below the map (full width, centred):
"Otis has explored {X} countries and travelled {X} miles so far 🌍"
- Countries: count distinct countries from trip location fields
- Miles: calculate straight-line distances between trip locations using Haversine formula

Add to /lib/haversine.ts:
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8 // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

4. UPDATE trips TABLE
Add centre coordinates for each trip (used to position the world map marker):
ALTER TABLE trips ADD COLUMN centre_lat float;
ALTER TABLE trips ADD COLUMN centre_lng float;

Update the Northern Ireland 2025 trip:
UPDATE trips SET centre_lat = 54.7, centre_lng = -6.6 WHERE slug = 'northern-ireland-2025';

Update the Create Trip admin modal to include centre_lat and centre_lng fields
with helper text: "Find these on Google Maps — right click the centre of your destination"
```

---

## Feature 6 — Otis' Growth Tracker

```
Read SPEC.md. Build a height tracker that logs Otis' height over time and visualises it as a filling ruler chart.

1. DATABASE
Run in Supabase SQL editor:

CREATE TABLE growth_entries (
  id uuid primary key default gen_random_uuid(),
  height_cm float not null,
  measured_date date not null,
  note text,                          -- e.g. "Measured at Granny's house"
  photo_url text,                     -- optional photo of Otis on this date
  created_at timestamp default now()
);

ALTER TABLE growth_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read growth" ON growth_entries FOR SELECT USING (true);

Also add Otis' date of birth to a global settings table:
CREATE TABLE otis_settings (
  key text primary key,
  value text not null
);
INSERT INTO otis_settings (key, value) VALUES ('dob', '2024-01-01');
-- Dad will update this with the real DOB via admin

Enable RLS:
ALTER TABLE otis_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read settings" ON otis_settings FOR SELECT USING (true);

2. API ROUTES

/app/api/otis/growth/route.ts
GET: fetch all growth entries ordered by measured_date asc
POST (admin): insert new growth entry

/app/api/otis/growth/[id]/route.ts
PATCH (admin): update entry
DELETE (admin): delete entry

/app/api/otis/settings/route.ts
GET: fetch all otis_settings as key/value object
PATCH (admin): update a setting by key

3. CREATE /app/otis/otis/page.tsx — "About Otis" page
Route: /otis/otis
This page houses: Growth Tracker, Otis' Firsts, Otis' Favourite Things, Guestbook

Navigation: add "👶 Otis" link to the main /otis layout nav

Page heading: "All About Otis 👶" in Caveat very large
Tabs within the page:
📏 Growing Up · 🌟 Firsts · ❤️ Favourite Things · 📖 Guestbook

4. CREATE /components/otis/GrowthTracker.tsx

Ruler visualisation:
- A tall vertical ruler graphic, cream background, kraft border
- Ruler markings every 5cm from 40cm to 140cm (typical toddler to child range)
- Each logged height shown as a horizontal line across the ruler with:
  - A small cream tag on the right: height in cm + age at measurement + date
  - The line in coral (#D4614E), 2px
  - The most recent height line is thicker (3px) and has a small arrow →
- The ruler "fills" with a light green (#4A7C59 at 15% opacity) from 0 up to the current height
- Ruler sits in a scrollable container — centred on the current height

Age calculation:
- Fetch DOB from otis_settings
- For each entry: calculate age as "X months" (under 2 years) or "X years Y months" (over 2)
- Show age on each ruler tag

Current height card (above the ruler):
- Large Caveat number: current height in cm
- "Otis is [age] old" in Caveat green
- "He's grown Xcm since we started measuring! 🚀" if more than one entry

Photo strip (below the ruler):
- Horizontal scrollable strip of photos from growth entries
- Each photo in polaroid style with the height and date as caption
- Clicking opens a lightbox

Admin controls:
- "Log height +" button → modal:
  - Height input (number, cm) with a large Caveat font display that updates as you type
  - Date picker (defaults to today)
  - Note input (optional)
  - Photo upload (optional, single)
  - "Save →" button
- Each ruler entry has a delete 🗑️ button on hover (admin only)

5. ADD DOB SETTING TO ADMIN
In the admin panel (/otis/admin), add a "Otis' Settings" section:
- Date of birth picker — saves to otis_settings table with key 'dob'
- Once set, all age calculations across the site use this value
- Show current age next to the field: "Otis is currently X months old"
```

---

## Feature 7 — Otis' Firsts

```
Read SPEC.md. Build the Otis' Firsts section — a log of milestone first moments.

1. DATABASE
Run in Supabase SQL editor:

CREATE TABLE firsts_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null,
  created_at timestamp default now()
);

CREATE TABLE otis_firsts (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references firsts_categories(id),
  title text not null,              -- e.g. "First time seeing the sea"
  description text,                 -- longer note about the moment
  date date not null,
  location text,
  photo_url text,
  tags text[],                      -- custom tags e.g. ['emotional', 'beach', 'sunset']
  created_at timestamp default now()
);

ALTER TABLE firsts_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE otis_firsts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read categories" ON firsts_categories FOR SELECT USING (true);
CREATE POLICY "Public can read firsts" ON otis_firsts FOR SELECT USING (true);

Seed some initial categories (Dad can add more via admin):
INSERT INTO firsts_categories (name, emoji) VALUES
('Food', '🍕'),
('Place', '📍'),
('Milestone', '🎉'),
('Funny Moment', '😂'),
('Animal', '🐾'),
('Word', '💬'),
('Skill', '⭐'),
('Travel', '✈️');

2. API ROUTES

/app/api/otis/firsts/categories/route.ts
GET: fetch all categories
POST (admin): create new category

/app/api/otis/firsts/categories/[id]/route.ts
PATCH (admin): update category
DELETE (admin): delete category

/app/api/otis/firsts/route.ts
GET: fetch all firsts ordered by date desc, joined with category
POST (admin): insert first

/app/api/otis/firsts/[id]/route.ts
PATCH (admin): update first
DELETE (admin): delete first

3. CREATE /components/otis/OtisFirsts.tsx
Lives in the "Firsts" tab of /otis/otis page.

Header stats:
- "X firsts logged so far 🌟" in Caveat large
- Category breakdown: small pill badges showing count per category

Filter bar: pill buttons for each category + "All"

Firsts displayed as scrapbook cards in a masonry grid:
Each card:
- Cream background, slight rotation seeded from id
- Washi tape in category colour
- Large category emoji top right
- Title in Caveat bold navy, large
- Date in small muted: "3rd July 2025"
- Otis' age at the time (calculated from DOB): small green badge "Age: 14 months"
- Location with 📍 if set
- Description in Caveat italic muted
- Photo in polaroid style if set
- Tags as small kraft pill badges at bottom: #beach #sunset #emotional
- Family reactions row (same ❤️ 😂 😍 🥹 🎉 system as place cards)

Admin:
- "Add a first +" floating button → modal:
  - Title input: "What was this first?" placeholder
  - Category selector: grid of emoji + name pills, one selectable
  - Date picker
  - Location input
  - Description textarea
  - Photo upload (single)
  - Tags input: type a tag and press enter to add, shown as removable pills
  - Save → POST to /api/otis/firsts
- Edit + delete on hover for each card

Admin category management:
- Small "Manage categories" link in the filter bar (admin only)
- Opens a simple modal: list of categories with edit/delete, "Add category +" with name + emoji inputs

Empty state: "No firsts logged yet — every adventure starts with a first! 🌟"
```

---

## Feature 8 — Otis' Favourite Things

```
Read SPEC.md. Build the Favourite Things tracker — a running log of what Otis loves, updated trip by trip.

1. DATABASE
Run in Supabase SQL editor:

CREATE TABLE favourite_things (
  id uuid primary key default gen_random_uuid(),
  category text not null,    -- 'food' | 'animal' | 'place' | 'word' | 'book' | 'toy' | 'song' | 'person'
  value text not null,       -- e.g. "Scrambled eggs", "Elephants", "The beach"
  note text,                 -- optional extra context
  date_logged date not null, -- when this was Otis' favourite
  photo_url text,
  is_current boolean default true,  -- is this currently his favourite?
  created_at timestamp default now()
);

ALTER TABLE favourite_things ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read favourites" ON favourite_things FOR SELECT USING (true);

2. API ROUTES

/app/api/otis/favourites/route.ts
GET: fetch all favourites, optionally filtered by category and/or is_current
POST (admin): insert favourite — if is_current true, set all other entries in same category to is_current: false

/app/api/otis/favourites/[id]/route.ts
PATCH (admin): update favourite
DELETE (admin): delete favourite

3. CREATE /components/otis/FavouriteThings.tsx
Lives in the "Favourite Things" tab of /otis/otis page.

Layout — two views toggled by a "Current ⭐ / History 📜" toggle:

CURRENT VIEW:
A beautiful grid of "favourite thing" cards — one per category showing the current favourite.
8 cards total:
  🍕 Favourite Food
  🐾 Favourite Animal  
  📍 Favourite Place
  💬 Favourite Word
  📚 Favourite Book
  🧸 Favourite Toy
  🎵 Favourite Song
  👤 Favourite Person

Each card — scrapbook style:
- Large category emoji centred
- Category label in Caveat small muted
- Current favourite in Caveat bold very large navy
- Note in Caveat italic muted small
- Date logged: "as of [month year]" small muted
- Photo in polaroid style if set
- Admin: edit ✏️ button that opens an inline edit form directly on the card

HISTORY VIEW:
Timeline per category showing how Otis' favourites have changed over time.
Each category gets a collapsible section:
- Category heading with emoji
- Vertical timeline of past favourites, most recent first
- Each entry: value, date range (from when it was set to when it was replaced), note, photo
- "Currently: [value]" badge on the most recent

Admin:
- On each current favourite card: "Update favourite →" button (admin only)
  Opens a simple modal: new value input, note, date, optional photo
  Saves new entry + sets previous to is_current: false
- In history view: delete button on old entries

Empty state per category: "[emoji] Not logged yet" — greyed out card with dashed border
Admin empty state: tap card to add the first entry for this category
```

---

## Feature 9 — Guestbook

```
Read SPEC.md. Build the family guestbook — a place for family to leave messages for Otis to read when he's older.

1. DATABASE
Run in Supabase SQL editor:

CREATE TABLE guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,        -- from family login display_name
  author_username text,
  message text not null,
  photo_url text,                   -- optional photo they attach
  created_at timestamp default now()
);

ALTER TABLE guestbook_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Family can read guestbook" ON guestbook_entries FOR SELECT USING (true);
CREATE POLICY "Family can write guestbook" ON guestbook_entries FOR INSERT WITH CHECK (true);

2. API ROUTES

/app/api/otis/guestbook/route.ts
GET: fetch all entries ordered by created_at desc
POST (family): insert entry — get author_name from family session cookie

3. CREATE /components/otis/Guestbook.tsx
Lives in the "Guestbook" tab of /otis/otis page.

Page header:
- Heading: "Letters to Otis 💌" in Caveat very large navy
- Subheading: "Messages from everyone who loves him — for him to read someday 💛" in Caveat muted

Entry form (always visible at top for logged-in family):
- Cream card, washi tape on top
- "Leave a message for Otis ✍️" heading in Caveat
- Large textarea: "Write something for Otis to read when he's older..."
- Optional photo upload (single)
- "Sign the guestbook →" button in coral
- Author name auto-filled from session: "Signing as [display_name]" small muted below button
- On submit: POST to /api/otis/guestbook, prepend to list

Guestbook entries — letter/postcard style cards:
Each entry:
- Cream card, more generous rotation than place cards (-3 to +3 deg)
- Washi tape on top
- A subtle lined paper texture inside (CSS repeating-linear-gradient)
- Author name in Caveat bold large coral — like a signature
- Message in Caveat 18px navy, line-height 1.8 — reads like a handwritten letter
- Date in small muted bottom right: "July 2025"
- Photo in polaroid style if attached
- Family members can react with ❤️ to each other's messages

Admin controls:
- Delete 🗑️ button on any entry (admin only, in case of spam)
- Pin 📌 button: pinned entries always show at the top

Empty state:
"No messages yet — be the first to write something for Otis! 💌"

Add Supabase Realtime subscription on guestbook_entries table so new messages appear live.
```

---

## Feature 10 — Family Map

```
Read SPEC.md. Build a family map showing where all family members are based.

1. CREATE /components/otis/FamilyMap.tsx
Add as a new section on the /otis/otis page below the main tabs,
OR as its own tab "🗺️ Family" within the About Otis page tabs.

Heading: "Otis' Family Around the World 🌍" in Caveat large

Use the same WorldMap pattern (dynamic import, ssr: false, CartoDBVoyager tiles).

Each family member as a marker:
- Custom L.divIcon: circular avatar photo if set, or initials on cream circle
- Navy border, slight drop shadow
- Click → popup with: display_name, relationship, location, avatar photo, "Joined [month year]"

Also show Otis' home location as a special marker:
- Large 👶 emoji marker
- Popup: "This is where Otis lives! 🏠"

Store Otis' home coordinates in otis_settings:
INSERT INTO otis_settings (key, value) VALUES ('home_lat', '54.7160');
INSERT INTO otis_settings (key, value) VALUES ('home_lng', '-5.8093');
-- Dad updates these via admin settings

Draw dashed lines from each family member location to Otis' home:
- Light navy (#1E2D4A at 20% opacity), dashed polyline
- Subtle, not overwhelming — just a visual connection

2. UPDATE family_members TABLE
Add location coordinates:
ALTER TABLE family_members ADD COLUMN lat float;
ALTER TABLE family_members ADD COLUMN lng float;

Update the admin family member form (from Feature 2) to include:
- Location text field (already exists)
- Lat/Lng fields with helper: "Find on Google Maps — right click and copy coordinates"

3. FUN STAT BELOW THE MAP
"Otis has family in X cities across X countries 💛"
Count distinct locations and countries from family_members.
```

---

## Feature 11 — Food Hall of Fame & Food Map

```
Read SPEC.md. Add a Food Hall of Fame section and a food map to the food log tab.

1. FOOD HALL OF FAME
Add to the top of /components/otis/FoodLog.tsx, above the existing stats row:

"Otis Approved ⭐" section:
- Section heading: "Otis Approved ⭐" in Caveat large coral
- Subheading: "The best things Otis has ever eaten — rated 5 out of 5 🍴" in Caveat muted
- Auto-populated: fetch all food_log entries where otis_rating = 5
- Displayed as a horizontal scrollable strip of special cards:

Hall of Fame card (distinct style from regular food cards):
- Gold/yellow (#F5C842) washi tape instead of normal colour
- A small ⭐ stamp in the top right corner (like the rubber stamp in the hero)
- Restaurant name in Caveat bold large
- "What Otis ate" in Caveat italic coral, large
- Location + date small muted
- 5 filled 🍴 forks
- Photo if present

If no 5-star meals yet:
"Nothing yet — Otis has high standards! Keep exploring 🍽️"

2. FOOD MAP
Add a new "🗺️ Food Map" toggle button in the food tab header alongside the existing list view.

Create /components/otis/FoodMap.tsx (wrapper, dynamic import ssr: false)
Create /components/otis/FoodMapInner.tsx ('use client')

Map centred on the current trip region (pass centre coords as props).
Each food entry as a marker, coloured by meal type:
  breakfast: #F5C842 (yellow)
  lunch:     #4A7C59 (green)
  dinner:    #1E2D4A (navy)
  snack:     #D4614E (coral)

Marker shape: a small fork 🍴 icon inside a circle of the meal type colour.

For food entries without lat/lng (most won't have coordinates):
- Do a client-side geocode lookup using the location text field
- Use the free Nominatim API (OpenStreetMap geocoding):
  fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`)
- Cache results in a ref to avoid re-fetching
- If geocoding fails: don't show that marker, no error shown to user

Click a marker → popup showing:
- Restaurant name
- What Otis ate
- Otis rating as 🍴 forks
- Date
- Photo thumbnail if present

Legend bottom left: meal type colours

UPDATE food_log TABLE to store geocoded coordinates:
ALTER TABLE food_log ADD COLUMN lat float;
ALTER TABLE food_log ADD COLUMN lng float;

When a food entry is geocoded successfully, PATCH /api/otis/food/[id] to save the coordinates so it doesn't need geocoding again.
```

---

## Feature 12 — Weather Log in Daily Diary

```
Read SPEC.md. Add a weather log to each diary day.

1. DATABASE
ALTER TABLE diary_entries ADD COLUMN weather text;
-- weather values: 'sunny' | 'cloudy' | 'rainy' | 'windy' | 'stormy' | 'snowy' | 'foggy'

2. UPDATE /app/api/otis/diary/route.ts
Accept weather in POST body.

/app/api/otis/diary/[id]/route.ts
Accept weather in PATCH body.

3. UPDATE DailyDiary.tsx date strip
Each date button in the horizontal strip:
- If that date has entries with a weather value: show the weather emoji below the date
- Weather emojis:
  sunny:   ☀️
  cloudy:  ⛅
  rainy:   🌧️
  windy:   💨
  stormy:  ⛈️
  snowy:   ❄️
  foggy:   🌫️
- Small, below the date text, centred

4. UPDATE DiaryEntry modal (admin add entry)
Add a weather selector at the top of the add/edit entry modal:
- Label: "What was the weather like?" in Caveat
- Row of 7 clickable emoji buttons — each toggles selected state
- Selected weather has cream card background, unselected is transparent
- Weather is per-day, not per-entry — so set it on the first entry of the day
  and auto-fill it for subsequent entries on the same day

5. UPDATE diary day header
At the top of each diary day timeline (above the first entry):
- Show a day summary card:
  - Date in Caveat large
  - Weather emoji + label if set
  - Total entries count: "X memories logged"
  - Admin: clicking the weather emoji opens a small weather picker popover to change it

6. WEATHER STATS
Add to the trip hero StatsRow or as a fun fact on the diary tab:
"☀️ X sunny days · 🌧️ X rainy days" during the trip
Calculate from diary entries with weather values.
```

---

## Feature 13 — Admin Activity Log

```
Read SPEC.md. Build the admin activity log (uses the admin_activity table created in Feature 1).

1. CREATE /components/otis/ActivityLog.tsx
Admin-only component. Add as a collapsible panel in the /otis/admin page.

Panel heading: "Recent Activity 📋" in Caveat large
Subheading: "Everything you and Mum have been adding 👀" in Caveat muted

Activity feed — reverse chronological list:
Each activity item:
- Admin avatar indicator: "👨 Dad" or "👩 Mum" pill badge in navy/coral respectively
- Action text in Caveat: e.g. "added 3 photos to Castle Ward"
- Entity link if applicable: place name / trip name / diary date in coral, clickable
- Relative timestamp: "2 hours ago" using date-fns

Visual style:
- Cream background cards, very slight rotation
- Washi tape on the "today" section divider
- Group by day: "Today", "Yesterday", "3rd July" etc as Caveat section dividers

Filters (admin only):
- "All · Dad · Mum" pill toggle to filter by which admin
- "All · Photos · Places · Diary · Food · Trips" to filter by entity type

Load more:
- Show 20 most recent by default
- "Load more →" button fetches next 20

2. UPDATE /app/api/otis/activity/route.ts
GET (admin only): fetch activity log with pagination
- Query params: limit, offset, admin_name, entity_type
- Join with places/trips table to get entity names

3. REAL-TIME ACTIVITY
Add Supabase Realtime subscription on admin_activity table
so if Dad is logged in and Mum adds something, it appears in the log live.
Show a "New activity from Mum! 👩" toast when a real-time event fires.
```

---

## Feature 14 — Year in Review

```
Read SPEC.md. Build the Year in Review — an auto-generated summary page for each calendar year.

1. DATABASE
Run in Supabase SQL editor:

CREATE TABLE year_reviews (
  id uuid primary key default gen_random_uuid(),
  year int not null unique,
  headline text,               -- admin-written headline for the year
  favourite_moment_id uuid,    -- references diary_entries(id) — most reacted moment
  published boolean default false,
  created_at timestamp default now()
);

ALTER TABLE year_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published reviews" ON year_reviews FOR SELECT USING (published = true);

Add reactions to diary entries (so family can vote on favourite moment):
CREATE TABLE diary_reactions (
  id uuid primary key default gen_random_uuid(),
  diary_entry_id uuid references diary_entries(id) on delete cascade,
  commenter_name text not null,
  emoji text not null,
  created_at timestamp default now()
);

ALTER TABLE diary_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read diary reactions" ON diary_reactions FOR SELECT USING (true);
CREATE POLICY "Public can insert diary reactions" ON diary_reactions FOR INSERT WITH CHECK (true);

2. API ROUTES

/app/api/otis/year-review/route.ts
GET: fetch all published year reviews
POST (admin): create/update year review for a year

/app/api/otis/year-review/[year]/route.ts
GET: fetch full year review data — auto-aggregate:
  - All trips in that year
  - Total places visited
  - Total photos taken
  - Total diary entries
  - Total meals logged
  - Most visited place category
  - Best rated meal (highest otis_rating in food_log)
  - Most reacted diary entry (most reactions in diary_reactions)
  - Total distance travelled (sum of trip distances)
  - Otis' age at start and end of year
  - Top 3 photos (most reacted in reactions table)
  - Firsts logged that year
  - Favourite things as of end of year
PATCH (admin): update headline, publish/unpublish

/app/api/otis/diary/[id]/reactions/route.ts
GET: fetch reactions for a diary entry
POST: add reaction (family logged in)

3. CREATE /app/otis/year/[year]/page.tsx
Route: /otis/year/2025

A beautiful standalone summary page — shareable via the /otis/year/2025 URL.

Page design — more editorial than the scrapbook, but same design tokens:
Full-width, dark navy background, cream text — feels like a special annual edition.

Sections (scroll down the page):

HERO:
- Large year number in Caveat, enormous (font-size 180px, navy at 10% opacity as background texture)
- "Otis' 2025 🍀" in Caveat very large cream, centred
- Admin headline below in Caveat italic, muted cream
- Otis' age: "Otis turned X this year" in Caveat green

STATS CARDS (horizontal scroll on mobile):
- X trips taken
- X places visited  
- X photos taken
- X meals eaten
- X miles travelled
- X firsts logged

TRIPS SECTION:
Each trip as a card: cover emoji, name, date range, places visited count, hero photo

FAVOURITE MOMENT (most reacted diary entry):
- Large full-width card
- "Your favourite moment of [year] 💛" heading
- The diary entry with its time of day icon, title, note, photo
- Reaction counts shown: "❤️ 12 · 😍 8 · 🥹 6"
- "Voted by your family" subtext in Caveat muted

BEST MEAL:
- "Otis' meal of the year 🍴" — the highest rated food entry
- Restaurant, what he ate, 5 🍴 forks, photo

TOP PHOTOS:
- 3 most-reacted photos in a large polaroid layout

FIRSTS THIS YEAR:
- Horizontal scrollable strip of Otis' Firsts cards from this year

GROWTH:
- Mini ruler chart showing height at start and end of the year
- "Otis grew Xcm this year! 📏"

GUESTBOOK MESSAGES THIS YEAR:
- 3 most-reacted guestbook messages from this year

FAMILY REACTIONS:
- "Add a ❤️ reaction to your favourite moment of the year" CTA
- Diary entries from the year listed with their reaction counts
- Family can react here to vote — most reacted automatically becomes next year's favourite moment

4. ADD TO NAVIGATION
In the /otis layout: add a "📅 Year in Review" link
Shows list of published years: "2025 · 2026 · 2027..."
Each links to /otis/year/[year]

5. ADMIN — PUBLISH YEAR REVIEW
In /otis/admin: "Year in Review" section
- Shows each year that has trip/diary data
- "Preview" button: shows the page in draft mode (admin only)
- "Write headline" button: text input for the year's headline
- "Publish →" button: sets published: true, makes it visible to family
- "Unpublish" button to revert
```

---

## Feature 15 — Time Capsule

```
Read SPEC.md. Build the time capsule — sealed letters from Dad and Mum to Otis, locked until milestone dates.

1. DATABASE
Run in Supabase SQL editor:

CREATE TABLE time_capsules (
  id uuid primary key default gen_random_uuid(),
  title text not null,              -- e.g. "For Otis on his 18th Birthday"
  unlock_date date not null,        -- the date it becomes visible
  created_by text not null,         -- 'Dad' | 'Mum' (or 'Both')
  is_unlocked boolean default false,-- true once unlock_date has passed
  created_at timestamp default now()
);

CREATE TABLE capsule_letters (
  id uuid primary key default gen_random_uuid(),
  capsule_id uuid references time_capsules(id) on delete cascade,
  author text not null,             -- 'Dad' | 'Mum'
  letter_text text,                 -- the letter content
  photo_url text,                   -- optional photo to include
  last_edited timestamp,
  created_at timestamp default now()
);

-- RLS: capsules visible to all once unlocked, hidden until then
ALTER TABLE time_capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE capsule_letters ENABLE ROW LEVEL SECURITY;

-- Only show unlocked capsules to public (or all to admin)
-- Enforce this in API routes rather than RLS since we need server-side date comparison

2. API ROUTES

/app/api/otis/capsules/route.ts
GET: 
  - Admin: fetch all capsules with letters
  - Family: fetch only capsules where unlock_date <= today (is_unlocked)
POST (admin): create new capsule

/app/api/otis/capsules/[id]/route.ts
GET: fetch capsule + letters (admin: always; family: only if unlocked)
PATCH (admin): update capsule title, unlock_date
DELETE (admin): delete capsule

/app/api/otis/capsules/[id]/letters/route.ts
GET: fetch letters for capsule
POST (admin): create/update letter for a capsule+author combination
  (upsert — only one letter per author per capsule)

A cron job is not needed — just check unlock_date <= now() on every GET request
and set is_unlocked: true automatically when first accessed after unlock date.

3. CREATE /app/otis/capsule/page.tsx
Route: /otis/capsule

Page heading: "Time Capsule 🔒" in Caveat very large navy
Subheading: "Letters from Dad and Mum — sealed with love, waiting for the right moment 💛"

LOCKED CAPSULES (unlock_date in future):
Each displayed as a sealed envelope card:
- Cream card, maximum rotation (-3 to +3 deg), strong shadow
- A wax seal graphic centred (SVG circle with a simple 'O' monogram — craft a simple SVG)
- Title in Caveat bold: "For Otis on his 18th Birthday"
- Unlock date in Caveat: "Opens on [date]"
- Countdown timer below: "X years, X months, X days to go..."
  Update every second using setInterval
- "Written by Dad & Mum 💛" if both have written, "Written by Dad" / "Written by Mum" if one
- Sealed envelope visual — flap closed, slight drop shadow

The countdown timer:
- Shows: X years · X months · X days · X hours · X minutes · X seconds
- In Caveat, large, navy
- Each unit in its own small box (like a flip clock aesthetic but scrapbook style)
- If less than 24 hours: highlight in coral and show seconds

UNLOCKED CAPSULES (unlock_date has passed):
Each displayed as an opened envelope card — flap open, cream paper visible:
- Animated opening on first view: envelope flap opens (CSS animation)
- Title: "For Otis on his 18th Birthday 🎉"
- "Unlocked on [date]" badge in green

Opening a capsule:
- Click the card → full-page letter view
- Dark navy background, single cream letter card centred, max-width 640px
- "Dear Otis," in Caveat large coral at top
- Dad's letter section: "From Dad 👨" heading, letter text in Caveat 20px navy, line-height 2
- Divider: decorative kraft line
- Mum's letter section: "From Mum 👩" heading, letter in same style
- Photos from letters shown inline as polaroids
- "With all our love, Dad & Mum 💛" at bottom
- Date written + date unlocked in small muted text
- Print button: prints just the letter (no nav, no buttons)

4. ADMIN — CAPSULE MANAGEMENT
In /otis/admin: "Time Capsule" section

List of all capsules:
- Locked ones: show title, unlock date, who has written letters, word count
- "Edit" button: change title, unlock date
- "Write my letter" button: opens the letter editor

Letter editor (admin):
- Full-page writing experience — cream background, lined paper texture
- "Dear Otis," pre-written at top
- Large textarea in Caveat 20px — feels like writing by hand
- Word count shown: "X words written"
- Optional: add a photo at the end of the letter
- Auto-saves every 30 seconds (PATCH to API) — "Saved ✓" shown in top right
- "I'm done for now →" button to close (doesn't lock — admin can always edit until unlock date)
- Once unlock_date has passed: letters become read-only for everyone including admin

"Create new capsule +" button → modal:
- Title input: "e.g. For Otis on his 18th Birthday" — placeholder
- Unlock date picker — date only, no time
- "Create capsule →" button
After creating: immediately opens the letter editor for Dad's letter

5. NOTIFICATIONS
When a capsule unlocks (unlock_date becomes today):
- On next visit by any family member: show a full-screen celebration moment:
  - Confetti burst (canvas-confetti)
  - "A time capsule has unlocked! 🔓" modal
  - "Otis' [title] is now open" 
  - "Open the capsule →" button → navigates to /otis/capsule
  Store 'capsule_[id]_celebrated' in localStorage so it only shows once per device
```

---

## Feature 16 — Photo Captions & Best Trip Photo

```
Read SPEC.md. Add photo captions and a hero shot feature.

1. DATABASE
ALTER TABLE photos ADD COLUMN caption text;
ALTER TABLE photos ADD COLUMN is_hero_shot boolean DEFAULT false;

2. UPDATE UploadModal.tsx
Add a caption input field per photo in the upload modal:
- After selecting files, each preview thumbnail shows an input below it
- Placeholder: "Add a caption... (e.g. 'Otis discovering his first rock pool 🌊')"
- Caption saved with the photo row

3. UPDATE Lightbox.tsx
In the lightbox slide footer, show caption prominently:
- Caption in Caveat italic, 18px, cream — sits between the photo and the metadata row
- If no caption: show nothing (don't show a placeholder)

4. UPDATE PhotoGrid.tsx
On hover of a thumbnail: show caption as a tooltip overlay
- Semi-transparent navy background, cream Caveat text
- Fades in on hover, fades out on mouse leave

5. HERO SHOT
In the photo section of each PlaceCard (admin only):
- Each photo thumbnail has a ⭐ star button on hover
- Clicking makes it the hero shot for this place (PATCH /api/otis/places/[id] with hero_photo_id)
- The starred photo shows a small ⭐ badge

UPDATE places TABLE:
ALTER TABLE places ADD COLUMN hero_photo_id uuid REFERENCES photos(id);

For the TRIP hero shot:
UPDATE trips TABLE:
ALTER TABLE trips ADD COLUMN hero_photo_url text;

In the TripCard component:
- If trip has a hero_photo_url: show it as a background image on the card
  (full card background, dark overlay, text over the top in cream)
- If no hero photo: existing kraft/cream card design

In admin UploadModal or a separate modal:
- "Set as trip hero shot ⭐" button on each photo
- PATCH /api/otis/trips/[id] with { hero_photo_url }
- This photo becomes the cover of the trip card on the selector page
```

---

## Feature 17 — Age at Time of Visit

```
Read SPEC.md. Auto-calculate and display Otis' age across all places and trips.

1. CREATE /lib/otis-age.ts

import { differenceInMonths, differenceInYears } from 'date-fns'

export function getOtisAge(dob: string, atDate: string): string {
  const dobDate = new Date(dob)
  const date = new Date(atDate)
  
  const years = differenceInYears(date, dobDate)
  const months = differenceInMonths(date, dobDate) % 12
  
  if (years === 0) {
    return `${differenceInMonths(date, dobDate)} months old`
  }
  if (months === 0) {
    return `${years} year${years > 1 ? 's' : ''} old`
  }
  return `${years} year${years > 1 ? 's' : ''} and ${months} month${months > 1 ? 's' : ''} old`
}

export function getOtisAgeShort(dob: string, atDate: string): string {
  const dobDate = new Date(dob)
  const date = new Date(atDate)
  const months = differenceInMonths(date, dobDate)
  if (months < 24) return `${months}m`
  const years = differenceInYears(date, dobDate)
  const remainingMonths = months % 12
  return remainingMonths > 0 ? `${years}y ${remainingMonths}m` : `${years}y`
}

2. FETCH DOB
Create a React context /lib/otis-context.tsx:
- OtisProvider fetches otis_settings on mount
- Provides dob string and getAge(atDate: string) function to all children
- Wrap /app/otis/layout.tsx with OtisProvider

3. UPDATE TripCard.tsx
Below the date range, add:
"Otis was [age] during this trip" in Caveat muted small
Using trip.start_date to calculate age.

4. UPDATE Hero.tsx (trip page)
Below the trip description:
"Otis was [age] during this adventure 👶" in Caveat green small

5. UPDATE PlaceCard.tsx
If the place has a visited_date:
Show a small age badge on the card: "Age: [short age]" in kraft colour, Caveat small
Positioned near the "Visited [date]" badge

6. UPDATE PlaceDrawer.tsx
In the drawer header, if visited_date is set:
"Otis was [full age] when he visited" in Caveat muted italic

7. UPDATE OtisFirsts cards
Each First card already shows age — verify it uses getOtisAge(dob, first.date)

8. UPDATE TripSelector homepage
Add a fun stat below the world map:
"Otis is currently [current age] 👶" — calculated from DOB to today
Updates in real-time (no caching — always fresh).
```

---

## Build Order for Phase 2

Run these features in this order to avoid dependency issues:

1. Feature 1 — Two Admin Accounts (other features depend on admin_name)
2. Feature 2 — Family Login (other features depend on family sessions)
3. Feature 3 — Image Compression (standalone, no dependencies)
4. Feature 4 — Video Support (standalone)
5. Feature 5 — World Map (standalone)
6. Feature 6 — Growth Tracker (depends on otis_settings + DOB)
7. Feature 17 — Age at Time of Visit (depends on otis_settings from Feature 6)
8. Feature 7 — Otis' Firsts (depends on /otis/otis page structure)
9. Feature 8 — Favourite Things (depends on /otis/otis page)
10. Feature 9 — Guestbook (depends on family login from Feature 2)
11. Feature 10 — Family Map (depends on family_members from Feature 2)
12. Feature 11 — Food Hall of Fame & Food Map (standalone food additions)
13. Feature 12 — Weather Log (small diary addition)
14. Feature 13 — Admin Activity Log (depends on admin_activity from Feature 1)
15. Feature 16 — Photo Captions & Hero Shot (photo system addition)
16. Feature 14 — Year in Review (depends on most other features being in place)
17. Feature 15 — Time Capsule (standalone, save for last — it's the most special)

---

## How to use in Cursor

For each feature, paste:
"Read SPEC.md and COPY.md, then build Feature X from PROMPTS-FEATURES.md"

Complete each feature fully before moving to the next.
After Feature 1: re-run the seed script to add admin accounts.
After Feature 2: test family login end to end before continuing.
After Feature 6: set Otis' DOB in the admin settings before testing age features.
```
