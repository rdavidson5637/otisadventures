"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { formatDistanceToNow, parseISO } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useFamilyMember } from "@/lib/use-family-member";
import { getRotation } from "@/lib/otis-utils";
import type { Comment } from "@/types/otis";
import { showToast } from "./Toast";

interface CommentsSectionProps {
  placeId: string;
  initialComments: Comment[];
}

export default function CommentsSection({
  placeId,
  initialComments,
}: CommentsSectionProps) {
  const { member, displayName } = useFamilyMember();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const channel = supabase
      .channel(`comments-${placeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `place_id=eq.${placeId}`,
        },
        (payload) => {
          const newComment = payload.new as Comment;
          setComments((prev) => {
            if (prev.some((c) => c.id === newComment.id)) return prev;
            return [...prev, newComment];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [placeId]);

  async function postComment(text: string, commenterName: string) {
    const optimistic: Comment = {
      id: `temp-${Date.now()}`,
      place_id: placeId,
      commenter_name: commenterName,
      message: text,
      created_at: new Date().toISOString(),
    };
    setComments((prev) => [...prev, optimistic]);
    setMessage("");
    setExpanded(true);

    try {
      const res = await fetch("/api/otis/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          place_id: placeId,
          commenter_name: commenterName,
          message: text,
        }),
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setComments((prev) =>
        prev.map((c) => (c.id === optimistic.id ? data : c))
      );
      showToast({ text: "💬 Comment posted!" });
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = message.trim();
    if (!text || !displayName) return;
    postComment(text, displayName);
  }

  const toggleLabel =
    comments.length === 0
      ? "💬 Be the first to comment"
      : comments.length === 1
        ? "💬 1 comment"
        : `💬 ${comments.length} comments`;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="font-caveat text-lg text-navy/70 hover:text-navy"
      >
        {toggleLabel}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {comments.map((comment, i) => (
            <div
              key={comment.id}
              className="scrapbook-card p-3"
              style={{ transform: `rotate(${getRotation(comment.id + String(i))}deg)` }}
            >
              <div className="flex items-center gap-2">
                {member?.avatarUrl && comment.commenter_name === displayName && (
                  <div className="relative h-8 w-8 overflow-hidden rounded-full">
                    <Image src={member.avatarUrl} alt="" fill className="object-cover" />
                  </div>
                )}
                <p className="font-caveat text-base font-bold text-navy">
                  {comment.commenter_name}
                </p>
              </div>
              <p className="font-caveat text-base text-navy/80">{comment.message}</p>
              <p className="mt-1 font-nunito text-xs text-navy/40">
                {formatDistanceToNow(parseISO(comment.created_at), { addSuffix: true })}
              </p>
            </div>
          ))}

          {member && (
            <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Leave a little message for Otis..."
                className="min-h-[48px] flex-1 rounded border border-kraft bg-cream px-3 font-caveat text-lg"
              />
              <button
                type="submit"
                className="min-h-[48px] rounded bg-coral px-4 font-caveat text-lg text-cream"
              >
                Post →
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
