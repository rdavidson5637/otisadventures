# Otis' Adventure Scrapbook — Full Project Specification

## Overview

A private, shareable family scrapbook web app called **"Otis' Adventures"** living at `rdevstudio.co.uk/otis`. It documents a toddler's trips around the world — starting with Northern Ireland 2025. Each trip gets its own full scrapbook covering places visited, a daily diary, food discoveries, spontaneous trips, family reactions and a printable PDF keepsake.

The aesthetic is a **hand-crafted scrapbook / adventure journal** — kraft paper textures, washi tape accents, polaroid photos, slightly rotated cards, Caveat handwriting font throughout.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + custom CSS for scrapbook effects |
| Database | Supabase (Postgres) |
| File Storage | Supabase Storage (bucket: `otis-photos`) |
| Fonts | Caveat (display), Nunito (body) — Google Fonts |
| Map | Leaflet.js via react-leaflet (dynamic import, ssr: false) |
| PDF Export | react-to-print |
| Confetti | canvas-confetti |
| Lightbox | yet-another-react-lightbox |
| Relative time | date-fns |

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
```

- `NEXT_PUBLIC_` prefixed vars are safe for client-side use
- `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_PASSWORD` are server-side only — never import in client components

---

## Access & Auth

- No login required — page lives at a secret URL
- Anyone with the link can view, react and comment
- Admin mode at `/otis/admin` — password checked against `process.env.ADMIN_PASSWORD` server-side
- On correct password: set `sessionStorage.setItem('otis_admin', 'true')` and redirect to `/otis`
- `useIsAdmin()` hook reads sessionStorage — used for UI only, not security
- All admin writes go through Next.js API routes using `supabaseAdmin` (service role key)
- `supabaseAdmin` must NEVER be imported in any client component — only in `/app/api/` routes

---

## Supabase Schema

All tables have RLS enabled. Public read on all tables. Public insert on comments and reactions only. All other writes go through API routes using the service role key.

```sql
trips (
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
)

places (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  name text not null,
  location text,
  category text, -- 'farm' | 'nature' | 'beach' | 'indoor' | 'castle'
  description text,
  lat float,
  lng float,
  visited boolean default false,
  visited_date date,
  otis_rating int, -- 1-5
  created_at timestamp default now()
)

photos (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references places(id) on delete cascade,
  storage_url text,
  memory_note text,
  taken_by text, -- 'Ryan' | 'Pippa'
  taken_date date,
  created_at timestamp default now()
)

diary_entries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  entry_date date not null,
  time_of_day text, -- 'morning' | 'breakfast' | 'lunch' | 'dinner' | 'bedtime' | 'nap' | 'moment'
  title text,
  note text,
  photo_url text,
  created_at timestamp default now()
)

spontaneous_trips (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  name text not null,
  location text,
  date date,
  note text,
  photos text[],
  created_at timestamp default now()
)

food_log (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  restaurant_name text,
  location text,
  date date,
  meal_type text, -- 'breakfast' | 'lunch' | 'dinner' | 'snack'
  what_otis_ate text,
  otis_rating int, -- 1-5
  photo_url text,
  note text,
  created_at timestamp default now()
)

comments (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references places(id) on delete cascade,
  commenter_name text,
  message text,
  created_at timestamp default now()
)

reactions (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references places(id) on delete cascade,
  commenter_name text,
  emoji text,
  created_at timestamp default now()
)
```

---

## URL Structure

```
/otis                            → Trip selector homepage
/otis/[trip-slug]                → Full scrapbook for one trip
/otis/admin                      → Admin password gate
```

Trip slugs are generated from the trip name:
"Northern Ireland 2025" → `northern-ireland-2025`

---

## Design System

### Colours

```css
--cream:  #FDF6E3
--kraft:  #E8D5A3
--navy:   #1E2D4A
--green:  #4A7C59
--coral:  #D4614E
--yellow: #F5C842
--blue:   #5B8DB8
--purple: #8B6BA8
```

### Category Colours

```
farm:    #4A7C59  (green)
nature:  #5B8DB8  (blue)
beach:   #F5C842  (yellow)
indoor:  #D4614E  (coral)
castle:  #8B6BA8  (purple)
```

### Typography

- **Display / handwriting:** Caveat — all headings, labels, notes, stats, buttons
- **Body:** Nunito — supporting text, descriptions, timestamps

### Card Style

```css
background: #FDF6E3;
border-radius: 4px;       /* paper feel — not rounded */
box-shadow: 3px 5px 15px rgba(0,0,0,0.22);
transform: rotate(Xdeg);  /* seeded from entity ID, range -2 to +2deg */
```

Card rotation must be **seeded from the entity's ID** so it stays consistent across renders. Convert the first 8 chars of the UUID to a number, map to -2 to +2 degrees.

### Washi Tape

```css
position: absolute;
top: -10px;
height: 22px;
width: 70px;
background: rgba(CATEGORY_COLOR, 0.45);
border-radius: 2px;
transform: rotate(-1deg);
```

### Body Background

```css
background-color: #c8b99a;
background-image: url("data:image/svg+xml, /* SVG cross-hatch pattern */ ");
```

---

## File Structure

```
/app
  /otis
    page.tsx                      ← trip selector homepage
    layout.tsx
    /[trip-slug]
      page.tsx                    ← full scrapbook for one trip
      layout.tsx
    /admin
      page.tsx                    ← admin password gate

/components/otis
  TripCard.tsx
  Hero.tsx
  StatsRow.tsx
  NavTabs.tsx
  PlaceCard.tsx
  PhotoGrid.tsx
  Lightbox.tsx
  CommentsSection.tsx
  ReactionsRow.tsx
  NamePromptModal.tsx
  MapView.tsx                     ← dynamic import wrapper (ssr: false)
  MapViewInner.tsx                ← actual Leaflet component ('use client')
  DailyDiary.tsx
  DiaryEntry.tsx
  FoodLog.tsx
  FoodCard.tsx
  BucketList.tsx
  SpontaneousTrips.tsx
  PrintView.tsx
  UploadModal.tsx
  AdminGate.tsx

/app/api/otis
  auth/route.ts
  trips/route.ts
  trips/[id]/route.ts
  places/route.ts
  places/[id]/route.ts
  photos/route.ts
  photos/[id]/route.ts
  diary/route.ts
  diary/[id]/route.ts
  food/route.ts
  food/[id]/route.ts
  spontaneous/route.ts
  spontaneous/[id]/route.ts
  comments/route.ts
  reactions/route.ts

/lib
  supabase.ts                     ← public + admin Supabase clients
  seed-places.ts                  ← NI 2025 seed data, run once with ts-node
  slug.ts                         ← slugify utility

/types
  otis.ts                         ← TypeScript types for all entities
```

---

## Component Behaviour Reference

### PlaceCard rotation seeding
```ts
function getRotation(id: string): number {
  const num = parseInt(id.replace(/-/g, '').slice(0, 8), 16)
  return ((num % 40) - 20) / 10 // maps to -2 to +2
}
```

### Name prompt logic
- On any react or comment action: check `localStorage.getItem('otis_commenter_name')`
- If null: open `NamePromptModal`, save result to localStorage, then proceed with action
- Never ask again once name is saved

### Realtime subscriptions
```ts
supabase
  .channel(`comments-${place_id}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'comments',
    filter: `place_id=eq.${place_id}`
  }, callback)
  .subscribe()
// Clean up in useEffect return
```

### Photo upload flow
1. User selects files in UploadModal
2. Convert each to base64
3. POST to `/api/otis/photos` with base64 + metadata
4. API route uploads to Supabase Storage, gets public URL
5. API route inserts photo row with storage_url
6. Component refreshes photo list

### Admin write flow
All admin mutations → Next.js API route → `supabaseAdmin` → Supabase
Never use `supabaseAdmin` directly in client components.

---

## Seed Data — Northern Ireland 2025

Trip row:
```
name: "Northern Ireland 2025"
description: "Otis' first big adventure — exploring the very best of Northern Ireland"
cover_emoji: "🍀"
start_date: "2025-07-01"
end_date: "2025-07-14"
location: "Northern Ireland"
slug: "northern-ireland-2025"
is_active: true
```

20 places (name / category / lat / lng):
```
Giant's Causeway        nature   55.2408  -6.5116
The Dark Hedges         nature   55.1347  -6.3808
W5 Science Centre       indoor   54.6047  -5.9155
Ulster Museum           indoor   54.5824  -5.9353
Armagh Planetarium      indoor   54.3519  -6.6482
Carrickfergus Castle    castle   54.7137  -5.8063
Castle Ward             castle   54.3677  -5.5805
Whiterocks Beach        beach    55.2073  -6.6587
Portstewart Strand      beach    55.1689  -6.7502
Drum Manor Forest Park  nature   54.6429  -6.8181
Murlough Nature Reserve beach    54.2341  -5.8627
Crawfordsburn Park      nature   54.6661  -5.7287
Belfast Zoo             nature   54.6546  -5.9427
Exploris Aquarium       indoor   54.3817  -5.5489
WWT Castle Espie        nature   54.5303  -5.6962
Glenariff Forest Park   nature   55.0223  -6.1251
Seaforde Butterfly House nature  54.3160  -5.8399
Ark Open Farm           farm     54.6163  -5.6790
Streamvale Open Farm    farm     54.5801  -5.8172
Play Factore            indoor   54.5964  -5.9953
```

---

## Key Rules for Cursor to Follow

1. **Never import `supabaseAdmin` in a client component** — API routes only
2. **Always use dynamic import with `ssr: false` for Leaflet** — it uses `window`
3. **Card rotations must be seeded from entity ID** — not random on each render
4. **All Tailwind classes must be from the default stylesheet** — no custom compiler
5. **`ADMIN_PASSWORD` and `SUPABASE_SERVICE_ROLE_KEY` must never have `NEXT_PUBLIC_` prefix**
6. **Add `robots: noindex` to the otis layout** — keep it private from search engines
7. **Mobile first** — test all components at 375px width
8. **Supabase Realtime subscriptions must be cleaned up** in `useEffect` return functions
