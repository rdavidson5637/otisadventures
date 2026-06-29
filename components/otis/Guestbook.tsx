"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { getRotation } from "@/lib/otis-utils";
import { useFamilyMember } from "@/lib/use-family-member";
import type { GuestbookEntry } from "@/types/otis";
import { useIsAdmin } from "./AdminGate";
import { showToast } from "./Toast";

export default function Guestbook() {
  const isAdmin = useIsAdmin();
  const { member, displayName } = useFamilyMember();
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/otis/guestbook");
      if (res.ok) setEntries(await res.json());
    } catch {
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    const channel = supabase
      .channel("guestbook-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "guestbook_entries" },
        (payload) => {
          const entry = payload.new as GuestbookEntry;
          setEntries((prev) => {
            if (prev.some((e) => e.id === entry.id)) return prev;
            return [entry, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || !member) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/otis/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      if (!res.ok) throw new Error("failed");
      setMessage("");
      showToast({ text: "💌 Message signed!" });
      fetchEntries();
    } catch {
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/otis/guestbook/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    }
  }

  async function handlePin(id: string, pinned: boolean) {
    try {
      const res = await fetch(`/api/otis/guestbook/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pinned: !pinned }),
      });
      if (!res.ok) throw new Error("failed");
      fetchEntries();
    } catch {
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    }
  }

  return (
    <div>
      <header className="mb-8 text-center">
        <h2 className="font-caveat text-4xl font-bold text-navy md:text-5xl">
          Letters to Otis 💌
        </h2>
        <p className="mt-2 font-caveat text-xl text-navy/60">
          Messages from everyone who loves him — for him to read someday 💛
        </p>
      </header>

      {member && (
        <form
          onSubmit={handleSubmit}
          className="scrapbook-card relative mb-8 p-6"
          style={{ transform: `rotate(${getRotation("guestbook-form")}deg)` }}
        >
          <div
            className="washi-tape left-1/2 -translate-x-1/2"
            style={{ background: "rgba(245, 200, 66, 0.45)" }}
          />
          <h3 className="mb-3 font-caveat text-2xl text-navy">
            Leave a message for Otis ✍️
          </h3>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write something for Otis to read when he's older..."
            className="mb-4 w-full min-h-[120px] rounded border border-kraft bg-cream px-4 py-3 font-caveat text-lg leading-relaxed"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-coral px-6 py-2 font-caveat text-xl text-cream disabled:opacity-50"
          >
            Sign the guestbook →
          </button>
          <p className="mt-2 font-caveat text-sm text-navy/50">
            Signing as {displayName}
          </p>
        </form>
      )}

      {loading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 rounded bg-kraft/50 skeleton-shimmer" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-center font-caveat text-2xl text-navy/60">
          No messages yet — be the first to write something for Otis! 💌
        </p>
      ) : (
        <div className="space-y-6">
          {entries.map((entry, i) => (
            <article
              key={entry.id}
              className="scrapbook-card group relative p-6"
              style={{
                transform: `rotate(${getRotation(entry.id + String(i))}deg)`,
                backgroundImage:
                  "repeating-linear-gradient(transparent, transparent 27px, rgba(30,45,74,0.06) 28px)",
              }}
            >
              <div
                className="washi-tape left-1/2 -translate-x-1/2"
                style={{ background: "rgba(212, 97, 78, 0.45)" }}
              />
              {entry.is_pinned && (
                <span className="absolute right-4 top-4 font-caveat text-lg">📌</span>
              )}
              <p className="font-caveat text-2xl font-bold text-coral">{entry.author_name}</p>
              <p className="mt-3 font-caveat text-lg leading-[1.8] text-navy">
                {entry.message}
              </p>
              {entry.photo_url && (
                <div className="relative mx-auto mt-4 h-32 w-32 overflow-hidden bg-cream p-2 shadow-md">
                  <Image src={entry.photo_url} alt="" fill className="object-cover" />
                </div>
              )}
              <p className="mt-4 text-right font-nunito text-xs text-navy/40">
                {format(parseISO(entry.created_at), "MMMM yyyy")}
              </p>
              {isAdmin && (
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => handlePin(entry.id, entry.is_pinned)}
                    className="rounded bg-cream px-2 py-1 text-sm"
                  >
                    📌
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    className="rounded bg-cream px-2 py-1 text-sm"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
