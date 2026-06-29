"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import Image from "next/image";
import { calculateAge } from "@/lib/age-utils";
import { OTIS_DOB } from "@/lib/otis-constants";
import { getRotation } from "@/lib/otis-utils";
import type { FirstsCategory, OtisFirstWithCategory } from "@/types/otis";
import { AdminOnly, useIsAdmin } from "./AdminGate";
import { showToast } from "./Toast";

interface OtisFirstsProps {
  initialFirsts?: OtisFirstWithCategory[];
  initialCategories?: FirstsCategory[];
  initialDob?: string;
}

export default function OtisFirsts({
  initialFirsts = [],
  initialCategories = [],
  initialDob,
}: OtisFirstsProps) {
  const isAdmin = useIsAdmin();
  const [firsts, setFirsts] = useState<OtisFirstWithCategory[]>(initialFirsts);
  const [categories, setCategories] = useState<FirstsCategory[]>(initialCategories);
  const [dob] = useState(initialDob ?? OTIS_DOB);
  const [filter, setFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingFirst, setEditingFirst] = useState<OtisFirstWithCategory | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [firstsRes, catsRes] = await Promise.all([
        fetch("/api/otis/firsts"),
        fetch("/api/otis/firsts/categories"),
      ]);
      if (firstsRes.ok) setFirsts(await firstsRes.json());
      if (catsRes.ok) setCategories(await catsRes.json());
    } catch {
      /* ignore */
    }
  }, []);

  const filtered = useMemo(
    () =>
      filter === "all"
        ? firsts
        : firsts.filter((f) => f.category_id === filter),
    [firsts, filter]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of firsts) {
      if (f.category_id) {
        counts[f.category_id] = (counts[f.category_id] ?? 0) + 1;
      }
    }
    return counts;
  }, [firsts]);

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/otis/firsts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
      setFirsts((prev) => prev.filter((f) => f.id !== id));
      showToast({ text: "First removed" });
    } catch {
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    }
  }

  return (
    <div>
      <p className="mb-4 font-caveat text-3xl text-navy">
        {firsts.length} firsts logged so far 🌟
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <span
            key={cat.id}
            className="rounded-full bg-kraft/40 px-3 py-1 font-caveat text-sm text-navy"
          >
            {cat.emoji} {cat.name}: {categoryCounts[cat.id] ?? 0}
          </span>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full px-4 py-1 font-caveat text-base ${
            filter === "all" ? "bg-coral text-cream" : "bg-cream text-navy"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setFilter(cat.id)}
            className={`rounded-full px-4 py-1 font-caveat text-base ${
              filter === cat.id ? "bg-coral text-cream" : "bg-cream text-navy"
            }`}
          >
            {cat.emoji} {cat.name}
          </button>
        ))}
        <AdminOnly>
          <button
            type="button"
            onClick={() => setShowCategoryModal(true)}
            className="ml-2 font-caveat text-sm text-navy/60 underline"
          >
            Manage categories
          </button>
        </AdminOnly>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center font-caveat text-2xl text-navy/60">
          No firsts logged yet — every adventure starts with a first! 🌟
        </p>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {filtered.map((first) => (
            <FirstCard
              key={first.id}
              first={first}
              dob={dob}
              isAdmin={isAdmin}
              onEdit={() => {
                setEditingFirst(first);
                setShowModal(true);
              }}
              onDelete={() => handleDelete(first.id)}
            />
          ))}
        </div>
      )}

      <AdminOnly>
        <button
          type="button"
          onClick={() => {
            setEditingFirst(null);
            setShowModal(true);
          }}
          className="fixed bottom-6 right-6 z-40 rounded-full bg-coral px-5 py-3 font-caveat text-lg text-cream shadow-lg safe-bottom"
        >
          Add a first +
        </button>
      </AdminOnly>

      {showModal && (
        <FirstModal
          categories={categories}
          editing={editingFirst}
          onClose={() => {
            setShowModal(false);
            setEditingFirst(null);
          }}
          onSaved={() => {
            setShowModal(false);
            setEditingFirst(null);
            fetchData();
          }}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          categories={categories}
          onClose={() => setShowCategoryModal(false)}
          onUpdated={fetchData}
        />
      )}
    </div>
  );
}

function FirstCard({
  first,
  dob,
  isAdmin,
  onEdit,
  onDelete,
}: {
  first: OtisFirstWithCategory;
  dob: string;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const rotation = getRotation(first.id);
  const catEmoji = first.category?.emoji ?? "🌟";

  return (
    <article
      className="group relative mb-4 break-inside-avoid scrapbook-card p-4"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <div
        className="washi-tape left-1/2 -translate-x-1/2"
        style={{ background: "rgba(245, 200, 66, 0.45)" }}
      />
      <span className="absolute right-3 top-3 text-2xl">{catEmoji}</span>

      <h3 className="pr-10 font-caveat text-2xl font-bold text-navy">{first.title}</h3>
      <p className="font-nunito text-xs text-navy/50">
        {format(parseISO(first.date), "do MMMM yyyy")}
      </p>

      {dob && (
        <span className="mt-1 inline-block rounded bg-green/20 px-2 py-0.5 font-caveat text-xs text-green">
          Age: {calculateAge(dob, first.date)}
        </span>
      )}

      {first.location && (
        <p className="mt-2 font-nunito text-sm text-navy/60">📍 {first.location}</p>
      )}

      {first.description && (
        <p className="mt-2 font-caveat text-base italic text-navy/70">
          {first.description}
        </p>
      )}

      {first.photo_url && (
        <div className="mt-3 rotate-1 rounded bg-cream p-2 shadow">
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <Image
              src={first.photo_url}
              alt=""
              fill
              className="object-cover"
              sizes="300px"
            />
          </div>
        </div>
      )}

      {first.tags && first.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {first.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-kraft/50 px-2 py-0.5 font-caveat text-xs text-navy"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {isAdmin && (
        <div className="mt-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button type="button" onClick={onEdit} className="font-caveat text-sm text-navy">
            ✏️ Edit
          </button>
          <button type="button" onClick={onDelete} className="font-caveat text-sm text-coral">
            🗑️ Delete
          </button>
        </div>
      )}
    </article>
  );
}

function FirstModal({
  categories,
  editing,
  onClose,
  onSaved,
}: {
  categories: FirstsCategory[];
  editing: OtisFirstWithCategory | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(editing?.title ?? "");
  const [categoryId, setCategoryId] = useState(editing?.category_id ?? "");
  const [date, setDate] = useState(
    editing?.date ?? new Date().toISOString().split("T")[0]
  );
  const [location, setLocation] = useState(editing?.location ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [tags, setTags] = useState<string[]>(editing?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !date) return;
    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        title,
        category_id: categoryId || undefined,
        date,
        location: location || undefined,
        description: description || undefined,
        tags: tags.length ? tags : undefined,
      };

      if (photo) {
        payload.photo_base64 = await fileToBase64(photo);
        payload.photo_filename = photo.name;
      }

      const url = editing ? `/api/otis/firsts/${editing.id}` : "/api/otis/firsts";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("failed");
      showToast({ text: "🌟 First saved!" });
      onSaved();
    } catch {
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={handleSubmit}
        className="scrapbook-card relative max-h-[90vh] w-full max-w-md overflow-y-auto p-6"
      >
        <div
          className="washi-tape left-1/2 -translate-x-1/2"
          style={{ background: "rgba(245, 200, 66, 0.45)" }}
        />
        <h2 className="mb-4 font-caveat text-3xl text-navy">
          {editing ? "Edit First" : "Add a First"} 🌟
        </h2>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What was this first?"
          className="mb-3 w-full min-h-[48px] rounded border border-kraft bg-cream px-3 font-caveat text-lg"
          required
        />

        <div className="mb-3 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryId(cat.id)}
              className={`rounded-full px-3 py-1 font-caveat text-base ${
                categoryId === cat.id ? "bg-coral text-cream" : "bg-cream text-navy border border-kraft"
              }`}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mb-3 w-full min-h-[48px] rounded border border-kraft bg-cream px-3 font-nunito"
        />

        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
          className="mb-3 w-full min-h-[48px] rounded border border-kraft bg-cream px-3 font-caveat text-lg"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell the story..."
          className="mb-3 w-full min-h-[80px] rounded border border-kraft bg-cream px-3 py-2 font-caveat text-lg"
        />

        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            placeholder="Add tag..."
            className="flex-1 rounded border border-kraft bg-cream px-3 py-2 font-caveat"
          />
          <button type="button" onClick={addTag} className="rounded bg-kraft/50 px-3 font-caveat">
            +
          </button>
        </div>

        {tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setTags(tags.filter((t) => t !== tag))}
                className="rounded-full bg-kraft/50 px-2 py-0.5 font-caveat text-sm"
              >
                #{tag} ✕
              </button>
            ))}
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          className="mb-4 w-full font-nunito text-sm"
        />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded border border-navy/20 py-3 font-caveat text-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded bg-coral py-3 font-caveat text-lg text-cream"
          >
            {loading ? "Saving..." : "Save →"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CategoryModal({
  categories,
  onClose,
  onUpdated,
}: {
  categories: FirstsCategory[];
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [list, setList] = useState(categories);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !emoji) return;
    const res = await fetch("/api/otis/firsts/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, emoji }),
    });
    if (res.ok) {
      const cat = await res.json();
      setList([...list, cat]);
      setName("");
      setEmoji("");
      onUpdated();
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/otis/firsts/categories/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setList(list.filter((c) => c.id !== id));
      onUpdated();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="scrapbook-card relative w-full max-w-md p-6">
        <h2 className="mb-4 font-caveat text-2xl text-navy">Manage Categories</h2>

        <ul className="mb-4 space-y-2">
          {list.map((cat) => (
            <li key={cat.id} className="flex items-center justify-between font-caveat text-lg">
              <span>
                {cat.emoji} {cat.name}
              </span>
              <button type="button" onClick={() => handleDelete(cat.id)}>
                🗑️
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder="😊"
            className="w-14 rounded border border-kraft bg-cream px-2 py-2 text-center"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            className="flex-1 rounded border border-kraft bg-cream px-3 font-caveat"
          />
          <button type="submit" className="rounded bg-coral px-3 font-caveat text-cream">
            +
          </button>
        </form>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded border border-navy/20 py-2 font-caveat"
        >
          Done
        </button>
      </div>
    </div>
  );
}
