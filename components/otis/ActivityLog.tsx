"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  parseISO,
} from "date-fns";
import { supabase } from "@/lib/supabase";
import { getRotation } from "@/lib/otis-utils";
import type { AdminActivity } from "@/types/otis";
import { useAdminName } from "./AdminGate";
import { showToast } from "./Toast";

const ENTITY_FILTERS = ["", "photo", "place", "diary", "food", "trip"] as const;
const ADMIN_FILTERS = ["", "Dad", "Mum"] as const;

export default function ActivityLog() {
  const currentAdmin = useAdminName();
  const [items, setItems] = useState<AdminActivity[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [adminFilter, setAdminFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(
    async (append = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          limit: "20",
          offset: String(append ? offset : 0),
        });
        if (adminFilter) params.set("admin_name", adminFilter);
        if (entityFilter) params.set("entity_type", entityFilter);

        const res = await fetch(`/api/otis/activity?${params}`);
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        setItems((prev) => (append ? [...prev, ...data.items] : data.items));
        setTotal(data.total);
        if (!append) setOffset(0);
      } catch {
        showToast({ text: "Something went wrong. Try again?", type: "error" });
      } finally {
        setLoading(false);
      }
    },
    [adminFilter, entityFilter, offset]
  );

  useEffect(() => {
    fetchActivity(false);
  }, [adminFilter, entityFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const channel = supabase
      .channel("admin-activity-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_activity" },
        (payload) => {
          const activity = payload.new as AdminActivity;
          setItems((prev) => {
            if (prev.some((a) => a.id === activity.id)) return prev;
            return [activity, ...prev];
          });
          if (activity.admin_name !== currentAdmin) {
            const emoji = activity.admin_name === "Mum" ? "👩" : "👨";
            showToast({
              text: `New activity from ${activity.admin_name}! ${emoji}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentAdmin]);

  const grouped = useMemo(() => {
    const groups: { label: string; items: AdminActivity[] }[] = [];
    let currentLabel = "";
    for (const item of items) {
      const date = parseISO(item.created_at);
      let label: string;
      if (isToday(date)) label = "Today";
      else if (isYesterday(date)) label = "Yesterday";
      else label = format(date, "do MMMM");

      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, items: [] });
      }
      groups[groups.length - 1].items.push(item);
    }
    return groups;
  }, [items]);

  function adminBadge(name: string) {
    const emoji = name === "Mum" ? "👩" : "👨";
    const bg = name === "Mum" ? "bg-coral/20 text-coral" : "bg-navy/10 text-navy";
    return (
      <span className={`rounded-full px-2 py-0.5 font-caveat text-sm ${bg}`}>
        {emoji} {name}
      </span>
    );
  }

  return (
    <section className="scrapbook-card relative p-6">
      <div
        className="washi-tape left-1/2 -translate-x-1/2"
        style={{ background: "rgba(91, 141, 184, 0.45)" }}
      />
      <h2 className="font-caveat text-3xl font-bold text-navy">Recent Activity 📋</h2>
      <p className="mb-4 font-caveat text-lg text-navy/60">
        Everything you and Mum have been adding 👀
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {ADMIN_FILTERS.map((f) => (
          <button
            key={f || "all"}
            type="button"
            onClick={() => setAdminFilter(f)}
            className={`rounded-full px-3 py-1 font-caveat text-sm ${
              adminFilter === f ? "bg-navy text-cream" : "bg-cream text-navy"
            }`}
          >
            {f || "All"}
          </button>
        ))}
        <span className="mx-1 text-navy/30">·</span>
        {ENTITY_FILTERS.map((f) => (
          <button
            key={f || "all-entity"}
            type="button"
            onClick={() => setEntityFilter(f)}
            className={`rounded-full px-3 py-1 font-caveat text-sm ${
              entityFilter === f ? "bg-coral text-cream" : "bg-cream text-navy"
            }`}
          >
            {f ? f.charAt(0).toUpperCase() + f.slice(1) + "s" : "All"}
          </button>
        ))}
      </div>

      {loading && !items.length ? (
        <div className="h-32 skeleton-shimmer rounded bg-kraft/50" />
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.label}>
              <h3 className="mb-3 font-caveat text-xl text-navy/70">{group.label}</h3>
              <div className="space-y-2">
                {group.items.map((item, i) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-start gap-2 rounded bg-cream/80 p-3"
                    style={{ transform: `rotate(${getRotation(item.id + String(i))}deg)` }}
                  >
                    {adminBadge(item.admin_name)}
                    <p className="font-caveat text-base text-navy">
                      {item.action}
                      {item.entity_name && (
                        <span className="text-coral"> · {item.entity_name}</span>
                      )}
                    </p>
                    <span className="ml-auto font-nunito text-xs text-navy/40">
                      {formatDistanceToNow(parseISO(item.created_at), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length < total && (
        <button
          type="button"
          onClick={() => {
            const next = offset + 20;
            setOffset(next);
            fetchActivity(true);
          }}
          className="mt-4 font-caveat text-lg text-coral hover:underline"
        >
          Load more →
        </button>
      )}
    </section>
  );
}
