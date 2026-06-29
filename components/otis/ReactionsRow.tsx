"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useFamilyMember } from "@/lib/use-family-member";
import type { Reaction } from "@/types/otis";
import { showToast } from "./Toast";

const REACTION_EMOJIS = ["❤️", "😂", "😍", "🥹", "🎉"] as const;

interface ReactionsRowProps {
  placeId: string;
  initialReactions: Reaction[];
}

export default function ReactionsRow({ placeId, initialReactions }: ReactionsRowProps) {
  const { member, displayName } = useFamilyMember();
  const [reactions, setReactions] = useState<Reaction[]>(initialReactions);

  useEffect(() => {
    const channel = supabase
      .channel(`reactions-${placeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reactions",
          filter: `place_id=eq.${placeId}`,
        },
        (payload) => {
          const newReaction = payload.new as Reaction;
          setReactions((prev) => [...prev, newReaction]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [placeId]);

  function getCounts() {
    const counts: Record<string, number> = {};
    const names: Record<string, string[]> = {};
    for (const emoji of REACTION_EMOJIS) {
      counts[emoji] = 0;
      names[emoji] = [];
    }
    for (const r of reactions) {
      if (r.emoji && counts[r.emoji] !== undefined) {
        counts[r.emoji]++;
        if (r.commenter_name) names[r.emoji].push(r.commenter_name);
      }
    }
    return { counts, names };
  }

  const { counts, names } = getCounts();

  async function postReaction(emoji: string, commenterName: string) {
    const optimistic: Reaction = {
      id: `temp-${Date.now()}`,
      place_id: placeId,
      commenter_name: commenterName,
      emoji,
      created_at: new Date().toISOString(),
    };
    setReactions((prev) => [...prev, optimistic]);

    try {
      const res = await fetch("/api/otis/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          place_id: placeId,
          commenter_name: commenterName,
          emoji,
        }),
      });
      if (!res.ok) throw new Error("failed");
      showToast({ text: `${emoji} Reaction added!` });
    } catch {
      setReactions((prev) => prev.filter((r) => r.id !== optimistic.id));
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    }
  }

  function handleEmojiClick(emoji: string) {
    if (!displayName) return;
    postReaction(emoji, displayName);
  }

  function formatTooltip(emoji: string): string {
    const list = names[emoji] ?? [];
    if (!list.length) return "";
    if (list.length <= 3) return list.join(", ");
    return `${list.slice(0, 2).join(", ")}, +${list.length - 2} more`;
  }

  if (!member) return null;

  return (
    <div className="mt-4 border-t border-kraft/50 pt-3">
      <p className="mb-2 font-caveat text-base text-navy/70">React with love:</p>
      <div className="flex flex-wrap gap-2">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            title={formatTooltip(emoji)}
            onClick={() => handleEmojiClick(emoji)}
            className="flex items-center gap-1 rounded bg-cream px-2 py-1 font-caveat text-lg transition-transform hover:scale-110"
          >
            <span>{emoji}</span>
            {counts[emoji] > 0 && (
              <span className="text-sm text-navy/60">{counts[emoji]}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
