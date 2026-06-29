export type PlaceCategory = "farm" | "nature" | "beach" | "indoor" | "castle";

export type TimeOfDay =
  | "morning"
  | "breakfast"
  | "lunch"
  | "dinner"
  | "bedtime"
  | "nap"
  | "moment";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type WeatherType =
  | "sunny"
  | "cloudy"
  | "rainy"
  | "windy"
  | "stormy"
  | "snowy"
  | "foggy";

export type FavouriteCategory =
  | "food"
  | "animal"
  | "place"
  | "word"
  | "book"
  | "toy"
  | "song"
  | "person";

export type PhotoTakenBy = "Dad" | "Mum";

export interface Trip {
  id: string;
  name: string;
  description: string | null;
  cover_emoji: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  slug: string;
  is_active: boolean;
  centre_lat: number | null;
  centre_lng: number | null;
  hero_photo_url: string | null;
  created_at: string;
}

export interface Place {
  id: string;
  trip_id: string;
  name: string;
  location: string | null;
  category: PlaceCategory | null;
  long_description: string | null;
  otis_thoughts: string | null;
  lat: number | null;
  lng: number | null;
  visited: boolean;
  visited_date: string | null;
  age_at_visit_months: number | null;
  otis_rating: number | null;
  hero_photo_id: string | null;
  created_at: string;
}

export interface Photo {
  id: string;
  place_id: string;
  storage_url: string | null;
  memory_note: string | null;
  caption?: string | null;
  taken_by: PhotoTakenBy | null;
  taken_date: string | null;
  file_size_kb: number | null;
  is_hero_shot?: boolean;
  is_trip_highlight?: boolean;
  created_at: string;
}

export interface Video {
  id: string;
  place_id: string | null;
  trip_id: string | null;
  storage_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  taken_by: PhotoTakenBy | null;
  taken_date: string | null;
  duration_seconds: number | null;
  file_size_kb: number | null;
  created_at: string;
}

export interface VideoWithRelations extends Video {
  place_name?: string | null;
  trip_name?: string | null;
  trip_slug?: string | null;
}

export interface GrowthEntry {
  id: string;
  height_cm: number;
  measured_date: string;
  note: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface FirstsCategory {
  id: string;
  name: string;
  emoji: string;
  created_at: string;
}

export interface OtisFirst {
  id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  photo_url: string | null;
  tags: string[] | null;
  created_at: string;
}

export interface OtisFirstWithCategory extends OtisFirst {
  category?: FirstsCategory | null;
}

export interface DiaryEntry {
  id: string;
  trip_id: string;
  entry_date: string;
  time_of_day: TimeOfDay | null;
  title: string | null;
  note: string | null;
  photo_url: string | null;
  weather: WeatherType | null;
  created_at: string;
}

export interface DiaryReaction {
  id: string;
  diary_entry_id: string;
  commenter_name: string;
  emoji: string;
  created_at: string;
}

export interface FavouriteThing {
  id: string;
  category: FavouriteCategory;
  value: string;
  note: string | null;
  date_logged: string;
  photo_url: string | null;
  is_current: boolean;
  created_at: string;
}

export interface GuestbookEntry {
  id: string;
  author_name: string;
  author_username: string | null;
  message: string;
  photo_url: string | null;
  is_pinned: boolean;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  username: string;
  display_name: string;
  relationship: string | null;
  location: string | null;
  avatar_url: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

export interface YearReview {
  id: string;
  year: number;
  headline: string | null;
  favourite_moment_id: string | null;
  published: boolean;
  created_at: string;
}

export interface TimeCapsule {
  id: string;
  title: string;
  unlock_date: string;
  created_by: string;
  is_unlocked: boolean;
  created_at: string;
}

export interface CapsuleLetter {
  id: string;
  capsule_id: string;
  author: string;
  letter_text: string | null;
  photo_url: string | null;
  last_edited: string | null;
  created_at: string;
}

export interface AdminActivity {
  id: string;
  admin_name: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_name: string | null;
  created_at: string;
}

export interface SpontaneousTrip {
  id: string;
  trip_id: string;
  name: string;
  location: string | null;
  date: string | null;
  note: string | null;
  photos: string[] | null;
  created_at: string;
}

export interface FoodLog {
  id: string;
  trip_id: string;
  restaurant_name: string | null;
  location: string | null;
  date: string | null;
  meal_type: MealType | null;
  what_otis_ate: string | null;
  otis_rating: number | null;
  photo_url: string | null;
  note: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

export interface Comment {
  id: string;
  place_id: string;
  commenter_name: string | null;
  message: string | null;
  created_at: string;
}

export interface Reaction {
  id: string;
  place_id: string;
  commenter_name: string | null;
  emoji: string | null;
  created_at: string;
}

export interface PlaceWithRelations extends Place {
  photos?: Photo[];
  comments?: Comment[];
  reactions?: Reaction[];
}

export interface TripWithStats extends Trip {
  places_visited?: number;
  photo_count?: number;
  day_count?: number;
}

export interface FeedEventType {
  id: string;
  name: string;
  emoji: string;
  colour: string;
  created_at: string;
}

export interface FeedComment {
  id: string;
  feed_post_id: string;
  author_username: string;
  author_display_name: string;
  message: string;
  created_at: string;
}

export interface FeedPost {
  id: string;
  author_username: string;
  author_display_name: string;
  event_type_id: string | null;
  event_type: FeedEventType | null;
  title: string;
  body: string | null;
  location_tag: string | null;
  photos: string[];
  is_removed: boolean;
  remove_reason: string | null;
  comment_count: number;
  recent_comments: FeedComment[];
  created_at: string;
}

export interface FamilyLocation {
  id: string;
  member_username: string;
  display_name: string;
  current_location: string;
  location_detail: string | null;
  timezone: string;
  lat: number | null;
  lng: number | null;
  avatar_url: string | null;
  relationship: string | null;
  last_updated: string;
}
