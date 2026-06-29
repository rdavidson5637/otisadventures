# Otis' Adventure Scrapbook — Cursor Build Prompts

> Read SPEC.md before starting. Each prompt below is a self-contained step.
> Complete each step fully and fix all errors before moving to the next.
> Reference SPEC.md and COPY.md throughout for design decisions and copy text.

---

## How to use these prompts in Cursor

1. Drop `SPEC.md`, `PROMPTS.md` and `COPY.md` into the root of your repo
2. Open Cursor Agent mode (not chat)
3. For each step, paste: **"Read SPEC.md and COPY.md, then do Step X from PROMPTS.md"**
4. Wait for Cursor to finish and fix any errors before moving on
5. After Step 2, run the seed script before continuing

---

## Step 1 — Project Foundation

```
Read SPEC.md. Set up the project foundation:

1. Install all dependencies:
   npm install @supabase/supabase-js react-leaflet leaflet @types/leaflet react-to-print canvas-confetti @types/canvas-confetti yet-another-react-lightbox date-fns

2. Create /types/otis.ts with TypeScript types for all entities as defined in SPEC.md:
   Trip, Place, Photo, DiaryEntry, SpontaneousTrip, FoodLog, Comment, Reaction

3. Create /lib/supabase.ts with two clients as defined in SPEC.md:
   - supabase (public, uses NEXT_PUBLIC_ keys)
   - supabaseAdmin (service role, server-side only)
   Add a comment warning: "NEVER import supabaseAdmin in client components"

4. Create /lib/slug.ts — slugify utility that converts "Northern Ireland 2025" to "northern-ireland-2025"

5. Create /lib/seed-places.ts — seed script using supabaseAdmin that inserts:
   - The Northern Ireland 2025 trip row (see SPEC.md for all values)
   - All 20 NI places with correct lat/lng and descriptions (see SPEC.md)
   Use ts-node to run. Log success/failure for each insert. Show me the run command at the end.

6. Create .env.local.example with all 4 required env variable keys (empty values) as listed in SPEC.md

7. Update /app/layout.tsx to include Google Fonts: Caveat (weights 400, 600, 700) and Nunito (weights 400, 600, 700) via next/font/google

Do not build any UI yet.
```

---

## Step 2 — All API Routes

```
Read SPEC.md. Create all API routes under /app/api/otis/ using supabaseAdmin for writes and the public supabase client for reads. All routes return NextResponse JSON. Add try/catch error handling to every route.

Create these route files exactly as listed in SPEC.md:

auth/route.ts — POST only. Check { password } in body against process.env.ADMIN_PASSWORD. Return { success: true/false }. Never expose the password.

trips/route.ts — GET all trips ordered by start_date desc. POST inserts new trip, generates slug using slugify from /lib/slug.ts.

trips/[id]/route.ts — PATCH updates trip. DELETE deletes trip.

places/route.ts — GET fetches places for a trip_id query param. POST inserts new place.

places/[id]/route.ts — PATCH updates place (visited, visited_date, otis_rating, description). DELETE deletes.

photos/route.ts — GET fetches photos for place_id query param. POST receives { base64, filename, metadata }, uploads file to Supabase Storage bucket 'otis-photos' using supabaseAdmin.storage, gets public URL, inserts photo row with storage_url.

photos/[id]/route.ts — DELETE removes photo row and deletes from Supabase Storage.

diary/route.ts — GET fetches diary entries for trip_id, optionally filtered by entry_date. POST inserts entry.

diary/[id]/route.ts — PATCH updates entry. DELETE deletes.

food/route.ts — GET fetches food log for trip_id ordered by date desc. POST inserts entry.

food/[id]/route.ts — PATCH updates. DELETE deletes.

spontaneous/route.ts — GET fetches spontaneous trips for trip_id. POST inserts.

spontaneous/[id]/route.ts — DELETE deletes.

comments/route.ts — GET fetches comments for place_id ordered by created_at asc. POST (public) inserts comment — requires commenter_name and message.

reactions/route.ts — GET fetches reactions for place_id. POST (public) inserts reaction — requires commenter_name and emoji.

After creating all routes, do not build any UI.
```

---

## Step 3 — Trip Selector Homepage

```
Read SPEC.md and COPY.md. Build the trip selector homepage at /app/otis/page.tsx.

This is the landing page at /otis. It fetches all trips server-side from Supabase and renders them as scrapbook cover cards.

Create /app/otis/layout.tsx:
- Add metadata: title "Otis' Adventures", robots noindex nofollow
- Corkboard background (#c8b99a with SVG cross-hatch pattern) applied to body
- Import Caveat and Nunito fonts

Create /app/otis/page.tsx (React Server Component):
- Fetch all trips from Supabase on the server
- Render the hero heading and trip cards
- Use copy from COPY.md for all text

Create /components/otis/TripCard.tsx (client component for hover animation):
- Scrapbook cover card as described in SPEC.md
- Rotation seeded from trip.id using the getRotation function in SPEC.md
- Washi tape strip across the top
- Cover emoji, trip name, location, date range, mini stats
- "Open Scrapbook →" button linking to /otis/[trip.slug]
- is_active badge: "Current Adventure ✈️" in green
- Completed badge: "Completed 🎉" in navy
- Hover: rotate to 0deg, scale 1.02, stronger shadow

Admin mode:
- Create /components/otis/AdminGate.tsx — exports useIsAdmin() hook that reads sessionStorage 'otis_admin'
- On the trip selector page, if isAdmin, show "Create new trip +" button top right
- Clicking opens a modal with: name, description, emoji picker, start_date, end_date, location inputs
- On submit: POST to /api/otis/trips, refresh page

Use all colours and design tokens from SPEC.md.
Use all copy text from COPY.md.
```

---

## Step 4 — Trip Scrapbook Shell

```
Read SPEC.md and COPY.md. Build the trip scrapbook page shell with hero, stats and navigation tabs.

Create /app/otis/[trip-slug]/layout.tsx:
- Fetch trip by slug server-side
- If not found: return notFound()
- Pass trip via context

Create /app/otis/[trip-slug]/page.tsx:
- Import and render: Hero, StatsRow, NavTabs, and the active tab content
- Tab state managed client-side
- Default tab: Our Places

Create /components/otis/Hero.tsx:
- All copy from COPY.md
- Decorative colour stripe across very top (coral/yellow/green/blue repeating, 8px)
- Washi tape decoration
- Cover emoji from trip data (large, centred)
- Trip name in Caveat, very large (clamp 38px–72px), navy
- Trip description in Caveat, green, 20px
- Date range badge
- Handwritten tagline (from COPY.md) in Caveat italic, muted
- Rubber stamp decoration bottom right: circular border, rotated 12deg, coral, "MADE WITH LOVE" text
- "← All Adventures" link top left back to /otis

Create /components/otis/StatsRow.tsx:
- Four stat cards in a row (2x2 on mobile)
- Each: cream card, washi tape on top, Caveat number large, label below
- Fetch counts from Supabase filtered by trip_id:
  Places Visited: count where visited = true
  Photos Taken: count of photos joined through places
  Memories Written: count of places where description is not null
  Days Explored: count of distinct diary entry dates
- Slight rotation seeded from index (0-3)

Create /components/otis/NavTabs.tsx:
- Sticky below hero on scroll
- Five tabs: 📍 Our Places · 🗺️ Map · 📅 Daily Diary · 🍽️ Food · ✅ Bucket List
- Active: cream background, navy text
- Inactive: transparent, muted cream
- Horizontally scrollable on mobile
- onClick callbacks to parent to switch active tab
```

---

## Step 5 — Place Cards & Photo System

```
Read SPEC.md. Build the places tab, place cards and photo system.

Create /components/otis/PlacesTab.tsx:
- Filter bar: All / 🐄 Farms / 🌿 Nature / 🏖️ Beaches / 🏛️ Indoors / 🏰 Castles
- Fetch places for trip_id from /api/otis/places
- Filter client-side by selected category
- Render PlaceCard grid (responsive: 1 col mobile, 2 col tablet, 3 col desktop)
- Admin: "Add place +" button → modal form

Create /components/otis/PlaceCard.tsx:
- All card styling from SPEC.md
- Rotation seeded from place.id using getRotation() from SPEC.md
- Washi tape colour based on category (see SPEC.md category colours)
- Hover: rotate to 0deg, scale 1.02, z-index 10

Photo section (top of card):
- No photos + admin: placeholder with camera emoji, "Tap to add photos of Otis!" — clicking opens UploadModal
- No photos + public: "No photos yet 📷" placeholder
- Has photos: PhotoGrid component
- Admin: "+" button overlaid bottom-right, opens UploadModal

Card body:
- Category label in category colour, Caveat, uppercase, small
- Place name Caveat 22px navy bold
- Location small muted with 📍
- Description Caveat 15px italic muted
- Memory note: admin = textarea (auto-save on blur to PATCH /api/otis/places/[id]); public = static Caveat text if note exists
- Otis rating: admin = 5 clickable 👶 emojis; public = read-only filled 👶 emojis
- Date visited: admin = date input; public = "Visited [date]" badge if visited_date set
- "We were here! ✅" toggle — admin only — PATCH /api/otis/places/[id] with { visited, visited_date }

Below card body:
- ReactionsRow (placeholder for now — wire up in Step 7)
- CommentsSection (placeholder for now — wire up in Step 7)

Create /components/otis/PhotoGrid.tsx:
- 2x2 thumbnail grid
- 4th cell shows "+X more" overlay if photos.length > 4
- Click any thumbnail → open Lightbox at that index

Create /components/otis/Lightbox.tsx:
- Use yet-another-react-lightbox
- Each slide: full photo + below: memory_note in Caveat italic, taken_by badge (📷 Ryan / 📷 Pippa), taken_date, otis_rating as 👶 emojis

Create /components/otis/UploadModal.tsx:
- Modal overlay, cream background, washi tape decoration
- Drag and drop zone + click to browse
- Multiple file selection
- Preview thumbnails before saving
- Fields: taken_by (Ryan / Pippa toggle buttons), taken_date (date picker), memory_note (textarea)
- On save: convert files to base64, POST each to /api/otis/photos, close modal, refresh photos
```

---

## Step 6 — Comments & Reactions

```
Read SPEC.md. Build the comments and reactions system with Supabase Realtime.

Create /components/otis/NamePromptModal.tsx:
- Modal: "What's your name? 👋" heading in Caveat large
- Single name text input, "Let's go! →" button in coral
- On submit: save to localStorage as 'otis_commenter_name', close modal, fire callback
- Cream scrapbook style, washi tape on top
- Cannot be dismissed without entering a name

Create /components/otis/ReactionsRow.tsx:
Props: place_id, initialReactions: Reaction[]
- 5 emoji buttons: ❤️ 😂 😍 🥹 🎉
- Each shows emoji + count of that emoji for this place
- On click: check localStorage for name → if missing open NamePromptModal first → then POST to /api/otis/reactions
- Optimistic UI: update count immediately, revert on error
- Tooltip on hover: list of names who reacted ("Ryan, Granny, +2 more")
- Realtime: subscribe to Supabase reactions table filtered by place_id, update counts live
- Clean up subscription in useEffect return

Create /components/otis/CommentsSection.tsx:
Props: place_id, initialComments: Comment[]
- Collapsed by default: "💬 X comments" toggle button
- Expanded: vertical comment thread
- Each comment: name in Caveat bold navy, message in Caveat, relative time in small muted (use date-fns formatDistanceToNow)
- Comments styled as small sticky note cards with slight alternating rotations
- Input at bottom: text input + "Post →" button
- On post: check localStorage for name → if missing open NamePromptModal → POST to /api/otis/comments → add optimistically
- Realtime: subscribe to Supabase comments table filtered by place_id
- Clean up subscription in useEffect return

Wire up ReactionsRow and CommentsSection into PlaceCard (replace placeholders from Step 5).
Pass initialReactions and initialComments as props fetched server-side with the place data.
```

---

## Step 7 — Map View

```
Read SPEC.md. Build the interactive map tab.

CRITICAL: Leaflet uses window and document — it cannot run server-side. You MUST use Next.js dynamic import with ssr: false.

Create /components/otis/MapView.tsx:
- This is the wrapper component only
- Use Next.js dynamic():
  const MapViewInner = dynamic(() => import('@/components/otis/MapViewInner'), { ssr: false })
- Render MapViewInner with a loading fallback: cream div with "Loading map... 🗺️" in Caveat

Create /components/otis/MapViewInner.tsx:
- Add 'use client' at the top
- Import leaflet CSS: import 'leaflet/dist/leaflet.css'
- Fix Leaflet default icon issue (common Next.js bug):
  import L from 'leaflet'
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({ iconRetinaUrl: ..., iconUrl: ..., shadowUrl: ... })
- Use MapContainer, TileLayer, Marker, Popup from react-leaflet
- Tile layer: OpenStreetMap — https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
- Centre on Northern Ireland: lat 54.7, lng -6.6, zoom 8 (pass centre and zoom as props in future for other trips)

Custom markers using L.divIcon:
- Unvisited place: white circle, 2px border in category colour, 20px diameter
- Visited place: filled circle in category colour, white ✅ text centred
- Spontaneous trip: coral star ⭐ icon

On marker click:
- Slide-in panel from the right
- position fixed, right 0, top 0, height 100vh
- Width 380px desktop, 100vw mobile
- Contains PlaceCard for that place (read-only, no admin controls)
- Close button (✕) top right of panel
- Panel slides in with CSS transform translateX animation

Category legend:
- Fixed bottom-left of map
- Small cream card with shadow
- Each row: coloured dot + category name

Props: places: Place[], spontaneousTrips: SpontaneousTrip[]
```

---

## Step 8 — Daily Diary

```
Read SPEC.md and COPY.md. Build the daily diary tab.

Create /components/otis/DailyDiary.tsx:
Props: trip_id: string, start_date: string, end_date: string, isAdmin: boolean

Date strip:
- Generate array of all dates between start_date and end_date inclusive
- Horizontally scrollable row of date buttons
- Each button: "Mon 1 Jul" format using date-fns format()
- Active date: coral background, cream Caveat text
- Dates with entries: small green dot below the date label
- Auto-scroll selected date into view on mount
- On date change: fetch entries from /api/otis/diary?trip_id=X&entry_date=Y

Timeline for selected date:
- Vertical dashed line in kraft colour down the left side
- Each entry hangs off the line with a circular dot connector

Create /components/otis/DiaryEntry.tsx:
Props: entry: DiaryEntry, isAdmin: boolean

- Entry card: cream background, slight rotation seeded from entry.id, washi tape on top
- Time of day icon + label (see SPEC.md for mapping)
- Title in Caveat bold navy
- Note in Caveat muted
- Photo: polaroid style (cream border 10px, slight rotation) if photo_url present
- Timestamp small muted bottom right (use date-fns)
- Admin: edit ✏️ and delete 🗑️ icon buttons appear on hover
  - Edit opens a pre-filled modal
  - Delete: confirm then DELETE /api/otis/diary/[id]

Admin add entry:
- Floating "Add entry +" button fixed bottom right
- Opens modal with:
  - Date input (pre-filled with selected date, not editable)
  - Time of day dropdown (icons + labels for all 7 options from SPEC.md)
  - Title input
  - Note textarea
  - Photo upload (single file → base64 → POST to /api/otis/photos, use returned URL)
  - Save → POST to /api/otis/diary, refresh entries

Empty state: use copy from COPY.md
```

---

## Step 9 — Food Log

```
Read SPEC.md and COPY.md. Build the food log tab.

Create /components/otis/FoodLog.tsx:
Props: trip_id: string, isAdmin: boolean

Fetch all food entries for trip_id from /api/otis/food on mount.

Stats row (4 cream cards with washi tape):
- Meals logged: total count
- Restaurants tried: count of distinct restaurant_name values
- Otis' favourite: most frequently appearing what_otis_ate value
- Best rated: restaurant_name of the entry with highest otis_rating

Cards grouped by date (most recent first).
Date shown as Caveat heading between groups: "Monday 7th July"

Create /components/otis/FoodCard.tsx:
Props: entry: FoodLog, isAdmin: boolean

- Cream card, slight rotation seeded from entry.id, washi tape on top
- Meal type badge top right, colour coded:
  breakfast: #F5C842 (yellow)
  lunch:     #4A7C59 (green)
  dinner:    #1E2D4A (navy)
  snack:     #D4614E (coral)
- Restaurant name: Caveat bold large navy
- Location: small muted 📍
- Date: small muted
- "What Otis ate:" label Caveat, then food in Caveat italic larger
- Otis rating: 1-5 🍴 fork emojis (filled up to rating)
- Photo: polaroid style if photo_url present
- Note: Caveat italic muted
- Admin: edit + delete on hover

Admin floating button: "Log a meal 🍽️" fixed bottom right
Opens modal:
- Restaurant name input
- Location input
- Date picker
- Meal type selector (4 options with colour indicators)
- "What Otis ate" textarea
- Otis rating: 1-5 clickable 🍴 forks
- Photo upload (single)
- Note textarea
- Save → POST to /api/otis/food, refresh list

Empty state: use copy from COPY.md
```

---

## Step 10 — Bucket List & Spontaneous Trips

```
Read SPEC.md and COPY.md. Build the bucket list tab.

Create /components/otis/BucketList.tsx:
Props: trip_id: string, places: Place[], isAdmin: boolean

Progress section:
- "X of Y adventures completed" in Caveat large navy
- Progress bar: #E8D5A3 background, linear-gradient(90deg, #4A7C59, #5B8DB8) fill
- CSS transition: width 0.5s ease on change
- On a new place ticked: fire canvas-confetti burst:
  confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#D4614E','#F5C842','#4A7C59','#5B8DB8'] })

Places grouped by category (Caveat heading per group):
- 🐄 Farms
- 🌿 Nature & Outdoors
- 🏖️ Beaches
- 🏛️ Indoors
- 🏰 Castles & History

Each bucket item:
- Custom checkbox: cream background, 2px border in category colour, checkmark in category colour when done
- Place name in Caveat navy
- Admin only: clicking checkbox → PATCH /api/otis/places/[id] with { visited: true, visited_date: new Date().toISOString().split('T')[0] }
- Public: read-only, visited items show checkmark and strikethrough name
- Smooth spring animation on checkbox tick (CSS transition)

Create /components/otis/SpontaneousTrips.tsx:
Props: trip_id: string, isAdmin: boolean

Section below bucket list: "🌟 Spontaneous Adventures" heading in Caveat

Trip cards — same scrapbook style:
- Name, location, date
- Note in Caveat italic
- PhotoGrid (opens Lightbox)
- Admin: delete button with confirmation

Admin: "Add spontaneous trip +" button
Modal:
- Name input
- Location input
- Date picker
- Note textarea
- Photo upload (multiple)
- Save → POST to /api/otis/spontaneous, refresh list

Empty state: use copy from COPY.md
```

---

## Step 11 — Admin Gate

```
Read SPEC.md. Build the admin system.

Create /app/otis/admin/page.tsx:
- Corkboard background (same as rest of site)
- Centred cream scrapbook card, washi tape on top
- Heading: "Admin Access 🔑" in Caveat large navy
- Subtext: "Ryan & Pippa only 🤫" in Caveat muted
- Password input (type="password"), styled in scrapbook theme
- "Enter →" button in coral, Caveat font
- On submit: POST to /api/otis/auth with { password }
- On success: sessionStorage.setItem('otis_admin', 'true'), router.push('/otis')
- On failure: shake animation on the card, show "Wrong password! 🙈" in coral Caveat

Update /components/otis/AdminGate.tsx:
- Export useIsAdmin(): boolean — reads sessionStorage 'otis_admin' === 'true'
- Export AdminOnly component: renders children only if isAdmin
- Add comment: "This is UI-only — real security is in API routes using service role key"

Go back through all components from Steps 3-10 and verify admin UI is correctly gated:
- PlaceCard: photo upload, memory note textarea, otis rating, visited toggle, date picker — all admin only
- DailyDiary: "Add entry +" button — admin only; edit/delete on entries — admin only
- FoodLog: "Log a meal" button — admin only; edit/delete on cards — admin only
- BucketList: checkbox interaction — admin only
- SpontaneousTrips: "Add spontaneous trip +" — admin only
- TripCard / trip selector: "Create new trip +" — admin only
```

---

## Step 12 — PDF Print View

```
Read SPEC.md and COPY.md. Build the PDF print view.

Install react-to-print if not already installed.

Create /components/otis/PrintView.tsx:
- A forwardRef component for react-to-print
- Wrapped in: <div style={{ display: 'none' }} className="print:block">
- This component is invisible on screen, only appears when printing

Print layout sections (each major section has page-break-after: always):

1. Cover page:
   - Large cover emoji centred
   - Trip name in Caveat very large
   - "by Otis" in Caveat italic
   - Date range
   - Stats: X places visited · X photos taken · X days explored
   - Decorative stripe

2. One page per visited place (loop places where visited === true):
   - Place name + category badge
   - Up to 2 photos side by side, polaroid style
   - Memory note in Caveat italic
   - Date visited + 👶 Otis rating
   - Best comment (first comment, if any)

3. Daily diary (one page per day with entries):
   - Day heading in Caveat large
   - Each entry: time icon, title, note, small photo

4. Food log page:
   - "What Otis Ate 🍽️" heading
   - Table: Restaurant / Location / Date / What Otis Ate / Rating 🍴

5. Spontaneous adventures page:
   - Each trip: name, date, note

6. Photo wall (final page):
   - "📸 Otis' Photo Wall" heading
   - Grid of every photo, polaroid style with place name caption

Print CSS (add to globals.css or as a style tag):
@media print {
  @page { margin: 20mm; size: A4; }
  body { background: white !important; }
  .no-print { display: none !important; }
  .print-break { page-break-after: always; }
}

Add to trip scrapbook page:
- Sticky footer bar (no-print class on screen)
- "🖨️ Print / Save as PDF" button in coral, full width
- onClick: trigger react-to-print on the PrintView ref
```

---

## Step 13 — Polish & Mobile

```
Read SPEC.md. Final polish pass — do all of these:

1. LOADING STATES
Add skeleton loaders to every data-fetching component:
- PlaceCard skeleton: cream rectangles with shimmer animation (CSS keyframe: opacity 0.5 to 1)
- StatsRow skeleton: 4 grey rounded rectangles
- Diary timeline skeleton: alternating left/right placeholder cards
- FoodLog skeleton: 3 placeholder cards

2. MOBILE RESPONSIVENESS
Audit and fix all components at 375px viewport:
- Stats row: 2x2 grid on mobile (grid-cols-2)
- Place cards: single column (grid-cols-1)
- Map slide-in panel: width 100vw on mobile, full height
- Nav tabs: overflow-x-auto, no flex-wrap, hide scrollbar (scrollbar-none)
- Modals: full screen on mobile (inset-0, border-radius 0, overflow-y-auto)
- Hero text: confirm font-size clamp values work at 375px
- Upload modal: large tap targets (min 48px height on all inputs)
- Floating buttons: safe distance from bottom on iOS (padding-bottom: env(safe-area-inset-bottom))

3. TRANSITIONS & ANIMATIONS
- Place cards: on mount, fade in + translateY(20px → 0), staggered by index * 0.05s
- Tab switching: 200ms opacity fade between tab content
- Stats numbers: count-up animation on first render (increment from 0 to value over 1s)
- Progress bar: already has CSS transition from Step 10 — verify it works
- Modal open: scale 0.95 → 1, opacity 0 → 1, 150ms ease

4. TOAST NOTIFICATIONS
Create /components/otis/Toast.tsx:
- Fixed bottom-left, slides up from below
- Cream card, navy text, Caveat font, slight shadow
- Auto-dismisses after 3 seconds
- Use for: photo saved, memory saved, place marked visited, comment posted
- Error variant: coral background

5. ERROR STATES
- If any Supabase fetch fails: show Caveat error message + "Try again" button
- If photo upload fails: show error toast

6. REALTIME VERIFY
Confirm Supabase Realtime subscriptions are set up in CommentsSection and ReactionsRow.
Confirm all subscriptions are cleaned up in useEffect return.

7. FINAL CHECKS
- Confirm no import of supabaseAdmin anywhere in /components/ or /app/otis/ (only in /app/api/)
- Confirm MapViewInner.tsx has 'use client' and MapView.tsx uses dynamic import with ssr: false
- Confirm /app/otis/layout.tsx has robots: noindex, nofollow in metadata
- Confirm all 4 env variables are documented in .env.local.example
- Run: npx tsc --noEmit — fix all TypeScript errors
- Test on mobile viewport (375px) in browser devtools
```

---

## After All Steps — Run Checklist

Before sharing the link with family, verify:

- [ ] Seed script has been run (`npx ts-node lib/seed-places.ts`)
- [ ] All 20 places appear on the places tab
- [ ] Photo upload works end to end (upload → appears in grid → appears in lightbox)
- [ ] Visited toggle updates the bucket list progress bar
- [ ] Comments post and appear in realtime on another browser tab
- [ ] Reactions update counts live
- [ ] Map loads and shows all 20 markers
- [ ] Clicking a map marker opens the slide-in panel
- [ ] Daily diary date strip shows all dates in the trip range
- [ ] Food log modal submits and card appears
- [ ] Admin password gate works — correct password grants access, wrong password shows error
- [ ] Non-admin visitors cannot see upload buttons, memory note textareas, or visited toggles
- [ ] Print view generates a clean PDF in Chrome (File → Print → Save as PDF)
- [ ] Site works on iPhone Safari (test at 375px)
- [ ] robots: noindex is set so Google doesn't index the page
