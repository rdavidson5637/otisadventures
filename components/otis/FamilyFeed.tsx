"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { formatDistanceToNow, parseISO } from "date-fns";
import { compressImage } from "@/lib/compress-image";
import { getRotation } from "@/lib/otis-utils";
import { supabase } from "@/lib/supabase";
import { useFamilyMember } from "@/lib/use-family-member";
import type { FeedComment, FeedEventType, FeedPost, FamilyLocation } from "@/types/otis";
import { AdminOnly } from "./AdminGate";
import YARLLightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { showToast } from "./Toast";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function PostComposer({
  eventTypes,
  displayName,
  onPosted,
}: {
  eventTypes: FeedEventType[];
  displayName: string | null;
  onPosted: (post: FeedPost) => void;
}) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [locationTag, setLocationTag] = useState("");
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function processFiles(incoming: FileList | File[]) {
    const list = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    for (const original of list) {
      const compressed = await compressImage(original);
      setPhotos((prev) => [
        ...prev,
        { file: compressed, preview: URL.createObjectURL(compressed) },
      ]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);

    try {
      const photoPayload = await Promise.all(
        photos.map(async (p) => ({
          base64: await fileToBase64(p.file),
          filename: p.file.name.replace(/\.[^.]+$/, ".jpg"),
        }))
      );

      const res = await fetch("/api/otis/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type_id: selectedType,
          title: title.trim(),
          body: body.trim() || undefined,
          location_tag: locationTag.trim() || undefined,
          photos: photoPayload,
        }),
      });

      if (!res.ok) throw new Error("failed");
      const post = (await res.json()) as FeedPost;
      onPosted(post);
      showToast({ text: "🎉 Posted! Your family can see this now" });
      setTitle("");
      setBody("");
      setLocationTag("");
      setSelectedType(null);
      setPhotos([]);
    } catch {
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  if (!displayName) return null;

  return (
    <form onSubmit={handleSubmit} className="scrapbook-card relative mb-8 p-6">
      <div
        className="washi-tape left-1/2 -translate-x-1/2"
        style={{ background: "rgba(245, 200, 66, 0.45)" }}
      />
      <h3 className="font-caveat text-2xl font-bold text-navy">Share something ✍️</h3>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {eventTypes.map((et) => (
          <button
            key={et.id}
            type="button"
            onClick={() => setSelectedType(selectedType === et.id ? null : et.id)}
            className="shrink-0 rounded-full border-2 px-4 py-1 font-caveat text-lg transition-colors"
            style={
              selectedType === et.id
                ? { background: et.colour, borderColor: et.colour, color: "#F5F0E8" }
                : { borderColor: "#1E2D4A", color: "#1E2D4A", background: "transparent" }
            }
          >
            {et.emoji} {et.name}
          </button>
        ))}
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What's happening? 🎉"
        className="mt-4 w-full border-b border-kraft bg-transparent font-caveat text-2xl text-navy outline-none placeholder:text-navy/40"
        required
      />

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Tell everyone a bit more... (optional)"
        rows={3}
        className="mt-3 w-full resize-none border-b border-kraft bg-transparent font-caveat text-lg text-navy outline-none placeholder:text-navy/40"
      />

      <div className="mt-3 flex items-center gap-2">
        <span className="font-caveat text-green">📍</span>
        <input
          value={locationTag}
          onChange={(e) => setLocationTag(e.target.value)}
          placeholder="Where are you? (optional)"
          className="flex-1 bg-transparent font-caveat text-lg text-navy outline-none placeholder:text-navy/40"
        />
      </div>

      <div
        className={`mt-4 rounded border-2 border-dashed p-6 text-center transition-colors ${
          dragOver ? "border-coral bg-coral/5" : "border-kraft"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          processFiles(e.dataTransfer.files);
        }}
      >
        <p className="font-caveat text-navy/60">Drag photos here or</p>
        <label className="mt-1 inline-block cursor-pointer font-caveat text-coral hover:underline">
          choose files
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && processFiles(e.target.files)}
          />
        </label>
      </div>

      {photos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {photos.map((p, i) => (
            <div key={p.preview} className="relative">
              <Image
                src={p.preview}
                alt=""
                width={80}
                height={80}
                className="h-20 w-20 rounded object-cover"
              />
              <button
                type="button"
                onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-coral text-xs text-cream"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !title.trim()}
        className="mt-4 rounded bg-coral px-6 py-2 font-caveat text-xl text-cream disabled:opacity-50"
      >
        {submitting ? "Sharing..." : "Share with the family →"}
      </button>
      <p className="mt-2 font-caveat text-sm text-navy/50">Posting as {displayName}</p>
    </form>
  );
}

function PhotoGrid({
  photos,
  onOpenLightbox,
}: {
  photos: string[];
  onOpenLightbox: (index: number) => void;
}) {
  if (!photos.length) return null;

  if (photos.length === 1) {
    return (
      <button type="button" onClick={() => onOpenLightbox(0)} className="mt-4 block w-full">
        <div
          className="rotate-1 rounded bg-white p-2 shadow-md"
          style={{ transform: "rotate(1deg)" }}
        >
          <Image
            src={photos[0]}
            alt=""
            width={600}
            height={400}
            className="h-auto w-full object-cover"
          />
        </div>
      </button>
    );
  }

  if (photos.length === 2) {
    return (
      <div className="mt-4 grid grid-cols-2 gap-3">
        {photos.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => onOpenLightbox(i)}
            className="rounded bg-white p-2 shadow-md"
            style={{ transform: `rotate(${i === 0 ? -2 : 2}deg)` }}
          >
            <Image src={url} alt="" width={300} height={200} className="h-auto w-full object-cover" />
          </button>
        ))}
      </div>
    );
  }

  const visible = photos.slice(0, 4);
  const extra = photos.length - 4;

  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      {visible.map((url, i) => (
        <button
          key={url}
          type="button"
          onClick={() => onOpenLightbox(i)}
          className="relative rounded bg-white p-1 shadow"
        >
          <Image src={url} alt="" width={200} height={150} className="h-32 w-full object-cover" />
          {i === 3 && extra > 0 && (
            <span className="absolute inset-0 flex items-center justify-center bg-navy/50 font-caveat text-xl text-cream">
              +{extra} more
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function FeedPostCard({
  post,
  avatarMap,
  onRemove,
  onCommentAdded,
}: {
  post: FeedPost;
  avatarMap: Record<string, string | null>;
  onRemove: (id: string) => void;
  onCommentAdded: (postId: string, comment: FeedComment) => void;
}) {
  const rotation = getRotation(post.id);
  const emoji = post.event_type?.emoji ?? "✨";
  const tapeColour = post.event_type?.colour ?? "rgba(91, 141, 184, 0.45)";
  const [expanded, setExpanded] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [comments, setComments] = useState<FeedComment[]>(post.recent_comments);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [message, setMessage] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removeReason, setRemoveReason] = useState("");
  const [removing, setRemoving] = useState(false);
  const { displayName } = useFamilyMember();
  const avatar = avatarMap[post.author_username];

  useEffect(() => {
    setComments(post.recent_comments);
    setCommentCount(post.comment_count);
  }, [post.recent_comments, post.comment_count]);

  async function loadAllComments() {
    const res = await fetch(`/api/otis/feed/${post.id}/comments`);
    if (res.ok) {
      const all = await res.json();
      setComments(all);
      setCommentCount(all.length);
      setShowAllComments(true);
    }
  }

  async function submitComment() {
    if (!message.trim()) return;
    const optimistic: FeedComment = {
      id: `temp-${Date.now()}`,
      feed_post_id: post.id,
      author_username: "me",
      author_display_name: displayName ?? "You",
      message: message.trim(),
      created_at: new Date().toISOString(),
    };
    setComments((prev) => [...prev, optimistic]);
    setCommentCount((c) => c + 1);
    const text = message.trim();
    setMessage("");

    try {
      const res = await fetch(`/api/otis/feed/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) throw new Error("failed");
      const saved = (await res.json()) as FeedComment;
      setComments((prev) => prev.map((c) => (c.id === optimistic.id ? saved : c)));
      onCommentAdded(post.id, saved);
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      setCommentCount((c) => c - 1);
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    }
  }

  async function confirmRemove() {
    setRemoving(true);
    try {
      const res = await fetch(`/api/otis/feed/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_removed: true, remove_reason: removeReason || null }),
      });
      if (!res.ok) throw new Error("failed");
      showToast({ text: "Post removed" });
      onRemove(post.id);
    } catch {
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    } finally {
      setRemoving(false);
      setShowRemoveModal(false);
    }
  }

  const visibleComments = showAllComments ? comments : comments.slice(0, 3);

  return (
    <article
      className="scrapbook-card group relative p-6 transition-all duration-300 hover:z-10 hover:scale-[1.02] hover:rotate-0 hover:shadow-lg"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <div
        className="washi-tape left-1/2 -translate-x-1/2"
        style={{ background: tapeColour }}
      />

      <AdminOnly>
        <button
          type="button"
          onClick={() => setShowRemoveModal(true)}
          className="absolute right-3 top-3 hidden font-caveat text-sm text-coral group-hover:block"
        >
          Remove post 🗑️
        </button>
      </AdminOnly>

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-3xl">{emoji}</span>
          <span className="font-caveat text-sm text-navy/60">
            {post.event_type?.name ?? "Just a moment"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-right">
          {avatar ? (
            <Image
              src={avatar}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cream text-sm font-bold text-navy">
              {post.author_display_name[0]}
            </div>
          )}
          <div>
            <p className="font-caveat font-bold text-navy">{post.author_display_name}</p>
            <p className="font-caveat text-xs text-navy/40">
              {formatDistanceToNow(parseISO(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>

      <h3 className="mt-4 font-caveat text-[22px] font-bold text-navy">{post.title}</h3>
      {post.body && (
        <p className="mt-2 font-caveat text-base leading-relaxed text-navy/70">{post.body}</p>
      )}
      {post.location_tag && (
        <p className="mt-2 font-caveat text-sm text-green">📍 {post.location_tag}</p>
      )}

      <PhotoGrid
        photos={post.photos}
        onOpenLightbox={(i) => {
          setLightboxIndex(i);
          setLightboxOpen(true);
        }}
      />

      <div className="mt-4 border-t border-kraft/50 pt-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="font-caveat text-lg text-navy"
        >
          {commentCount === 0
            ? "💬 Leave a comment"
            : `💬 ${commentCount} comment${commentCount === 1 ? "" : "s"}`}
        </button>

        {expanded && (
          <div className="mt-3 space-y-3">
            {visibleComments.map((c) => (
              <div key={c.id} className="flex gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream text-xs font-bold text-navy">
                  {c.author_display_name[0]}
                </div>
                <div className="flex-1">
                  <p className="font-caveat font-bold text-navy">{c.author_display_name}</p>
                  <p className="font-caveat text-navy/80">{c.message}</p>
                  <p className="font-caveat text-xs text-navy/40">
                    {formatDistanceToNow(parseISO(c.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
            {!showAllComments && commentCount > 3 && (
              <button
                type="button"
                onClick={loadAllComments}
                className="font-caveat text-coral hover:underline"
              >
                See all {commentCount} comments
              </button>
            )}
            {displayName && (
              <div className="flex items-center gap-2">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitComment()}
                  placeholder="Write a comment..."
                  className="flex-1 rounded border border-kraft bg-cream px-3 py-2 font-caveat text-navy outline-none"
                />
                <button
                  type="button"
                  onClick={submitComment}
                  className="font-caveat text-2xl text-coral"
                >
                  →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <YARLLightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={post.photos.map((src) => ({ src }))}
      />

      {showRemoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="scrapbook-card max-w-md p-6">
            <p className="font-caveat text-xl font-bold text-navy">
              Remove this post from the family feed?
            </p>
            <input
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              placeholder="Reason (optional)"
              className="mt-3 w-full rounded border border-kraft bg-cream px-3 py-2 font-caveat"
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setShowRemoveModal(false)}
                className="flex-1 rounded border px-4 py-2 font-caveat"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemove}
                disabled={removing}
                className="flex-1 rounded bg-coral px-4 py-2 font-caveat text-cream"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

export default function FamilyFeed() {
  const { displayName } = useFamilyMember();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [eventTypes, setEventTypes] = useState<FeedEventType[]>([]);
  const [avatarMap, setAvatarMap] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const knownPostIds = useRef(new Set<string>());

  const fetchPosts = useCallback(async (startOffset: number, append: boolean) => {
    const res = await fetch(`/api/otis/feed?limit=20&offset=${startOffset}`);
    if (!res.ok) return [];
    const data = (await res.json()) as FeedPost[];
    if (data.length < 20) setHasMore(false);
    if (append) {
      setPosts((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        return [...prev, ...data.filter((p) => !ids.has(p.id))];
      });
    } else {
      setPosts(data);
      knownPostIds.current = new Set(data.map((p) => p.id));
    }
    return data;
  }, []);

  useEffect(() => {
    Promise.all([
      fetchPosts(0, false),
      fetch("/api/otis/feed/event-types").then((r) => r.json()),
      fetch("/api/otis/locations").then((r) => r.json()),
    ])
      .then(([, types, locations]) => {
        setEventTypes(types ?? []);
        const map: Record<string, string | null> = {};
        for (const loc of (locations ?? []) as FamilyLocation[]) {
          map[loc.member_username] = loc.avatar_url;
        }
        setAvatarMap(map);
      })
      .finally(() => setLoading(false));
  }, [fetchPosts]);

  useEffect(() => {
    const feedChannel = supabase
      .channel("family-feed-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "family_feed" },
        async (payload) => {
          const newPost = payload.new as { id: string; is_removed?: boolean };
          if (newPost.is_removed || knownPostIds.current.has(newPost.id)) return;
          const res = await fetch(`/api/otis/feed?limit=1&offset=0`);
          if (!res.ok) return;
          const [fresh] = (await res.json()) as FeedPost[];
          if (fresh && fresh.id === newPost.id) {
            knownPostIds.current.add(fresh.id);
            setPosts((prev) => [fresh, ...prev.filter((p) => p.id !== fresh.id)]);
          }
        }
      )
      .subscribe();

    const commentsChannel = supabase
      .channel("feed-comments-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "feed_comments" },
        (payload) => {
          const comment = payload.new as FeedComment;
          setPosts((prev) =>
            prev.map((p) => {
              if (p.id !== comment.feed_post_id) return p;
              if (p.recent_comments.some((c) => c.id === comment.id)) return p;
              return {
                ...p,
                comment_count: p.comment_count + 1,
                recent_comments: [...p.recent_comments, comment].slice(-3),
              };
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(feedChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, []);

  function handlePosted(post: FeedPost) {
    knownPostIds.current.add(post.id);
    setPosts((prev) => [post, ...prev]);
  }

  async function loadMore() {
    setLoadingMore(true);
    const next = offset + 20;
    await fetchPosts(next, true);
    setOffset(next);
    setLoadingMore(false);
  }

  if (loading) {
    return <p className="font-caveat text-xl text-navy/60">Loading feed... 📰</p>;
  }

  return (
    <section>
      <h2 className="font-caveat text-3xl font-bold text-navy md:text-4xl">
        What Everyone&apos;s Up To 📰
      </h2>
      <p className="mt-1 font-caveat text-lg text-navy/60">
        Life&apos;s big moments, shared with everyone who loves Otis 💛
      </p>

      <div className="mt-6">
        <PostComposer
          eventTypes={eventTypes}
          displayName={displayName}
          onPosted={handlePosted}
        />
      </div>

      {posts.length === 0 ? (
        <p className="text-center font-caveat text-2xl text-navy/60">
          Nothing shared yet — be the first to post something! 🎉
        </p>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <FeedPostCard
              key={post.id}
              post={post}
              avatarMap={avatarMap}
              onRemove={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
              onCommentAdded={() => {}}
            />
          ))}
        </div>
      )}

      {hasMore && posts.length > 0 && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="font-caveat text-xl text-coral hover:underline disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load more →"}
          </button>
        </div>
      )}
    </section>
  );
}

/** Compact teaser cards for homepage */
export function FamilyFeedTeaser() {
  const [posts, setPosts] = useState<FeedPost[]>([]);

  useEffect(() => {
    fetch("/api/otis/feed?teaser=true")
      .then((r) => r.json())
      .then(setPosts)
      .catch(() => {});
  }, []);

  if (!posts.length) return null;

  return (
    <section className="mb-12">
      <h2 className="mb-4 font-caveat text-3xl font-bold text-navy">Family Updates 💛</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {posts.map((post) => (
          <div
            key={post.id}
            className="scrapbook-card p-4"
            style={{ transform: `rotate(${getRotation(post.id)}deg)` }}
          >
            <p className="font-caveat text-2xl">{post.event_type?.emoji ?? "✨"}</p>
            <p className="font-caveat font-bold text-navy">{post.title}</p>
            <p className="font-caveat text-sm text-navy/60">{post.author_display_name}</p>
            <p className="font-caveat text-xs text-navy/40">
              {formatDistanceToNow(parseISO(post.created_at), { addSuffix: true })}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center">
        <a href="/otis/family" className="font-caveat text-xl text-coral hover:underline">
          See all family updates →
        </a>
      </p>
    </section>
  );
}
