import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { uploadFeedPhotos } from "@/lib/feed-upload";
import {
  getFamilySessionFromRequest,
  isAdminSessionFromRequest,
} from "@/lib/family-auth";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import type { FeedComment, FeedEventType, FeedPost } from "@/types/otis";

async function enrichPosts(
  posts: Record<string, unknown>[],
  commentLimit = 3
): Promise<FeedPost[]> {
  if (!posts.length) return [];

  const postIds = posts.map((p) => p.id as string);

  const { data: comments } = await supabase
    .from("feed_comments")
    .select("*")
    .in("feed_post_id", postIds)
    .order("created_at", { ascending: true });

  const commentsByPost = new Map<string, FeedComment[]>();
  for (const c of comments ?? []) {
    const list = commentsByPost.get(c.feed_post_id) ?? [];
    list.push(c as FeedComment);
    commentsByPost.set(c.feed_post_id, list);
  }

  return posts.map((post) => {
    const allComments = commentsByPost.get(post.id as string) ?? [];
    const eventType = post.feed_event_types as FeedEventType | null;
    return {
      id: post.id as string,
      author_username: post.author_username as string,
      author_display_name: post.author_display_name as string,
      event_type_id: post.event_type_id as string | null,
      event_type: eventType,
      title: post.title as string,
      body: post.body as string | null,
      location_tag: post.location_tag as string | null,
      photos: (post.photos as string[]) ?? [],
      is_removed: post.is_removed as boolean,
      remove_reason: post.remove_reason as string | null,
      comment_count: allComments.length,
      recent_comments: allComments.slice(0, commentLimit),
      created_at: post.created_at as string,
    };
  });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);
    const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);
    const moderation = url.searchParams.get("moderation") === "true";
    const teaser = url.searchParams.get("teaser") === "true";

    const client = moderation && isAdminSessionFromRequest(request) ? supabaseAdmin : supabase;

    let query = client
      .from("family_feed")
      .select("*, feed_event_types(*)")
      .order("created_at", { ascending: false });

    if (!moderation) {
      query = query.eq("is_removed", false);
    }

    if (teaser) {
      query = query.limit(3);
    } else {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;
    if (error) return jsonError(error.message);

    const enriched = await enrichPosts(data ?? [], teaser ? 0 : 3);
    return jsonOk(enriched);
  } catch {
    return jsonError("Failed to fetch feed");
  }
}

export async function POST(request: Request) {
  try {
    const session = await getFamilySessionFromRequest(request);
    if (!session) return jsonError("Login required", 401);

    const body = await parseBody<{
      event_type_id?: string;
      title?: string;
      body?: string;
      location_tag?: string;
      photos?: { base64: string; filename: string }[];
    }>(request);

    if (!body?.title?.trim()) return jsonError("Title required", 400);

    let photoUrls: string[] = [];
    if (body.photos?.length) {
      photoUrls = await uploadFeedPhotos(body.photos);
    }

    const { data, error } = await supabaseAdmin
      .from("family_feed")
      .insert({
        author_username: session.username,
        author_display_name: session.displayName,
        event_type_id: body.event_type_id ?? null,
        title: body.title.trim(),
        body: body.body?.trim() || null,
        location_tag: body.location_tag?.trim() || null,
        photos: photoUrls,
      })
      .select("*, feed_event_types(*)")
      .single();

    if (error) return jsonError(error.message);

    const [enriched] = await enrichPosts([data]);
    return jsonOk(enriched, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to create post");
  }
}
