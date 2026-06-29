"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import type { CapsuleLetter, FamilyMember, FeedEventType, FeedPost, TimeCapsule, YearReview } from "@/types/otis";
import ActivityLog from "./ActivityLog";
import { useAdminName } from "./AdminGate";
import { showToast } from "./Toast";

type StorageStats = {
  photoMb: number;
  videoMb: number;
  totalMb: number;
  limitMb: number;
  percentUsed: number;
};

export default function AdminDashboard() {
  const adminName = useAdminName();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [storage, setStorage] = useState<StorageStats | null>(null);
  const [yearReviews, setYearReviews] = useState<YearReview[]>([]);
  const [capsules, setCapsules] = useState<(TimeCapsule & { capsule_letters?: CapsuleLetter[] })[]>([]);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [letterEditor, setLetterEditor] = useState<{
    capsuleId: string;
    author: string;
    title: string;
  } | null>(null);
  const [showCapsuleModal, setShowCapsuleModal] = useState(false);

  const fetchAll = useCallback(async () => {
    const [membersRes, settingsRes, storageRes, yearsRes, capsulesRes] = await Promise.all([
      fetch("/api/otis/family/members"),
      fetch("/api/otis/settings"),
      fetch("/api/otis/storage"),
      fetch("/api/otis/year-review"),
      fetch("/api/otis/capsules"),
    ]);

    if (membersRes.ok) setMembers(await membersRes.json());
    if (settingsRes.ok) setSettings(await settingsRes.json());
    if (storageRes.ok) setStorage(await storageRes.json());
    if (yearsRes.ok) setYearReviews(await yearsRes.json());
    if (capsulesRes.ok) setCapsules(await capsulesRes.json());
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function saveSetting(key: string, value: string) {
    const res = await fetch("/api/otis/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    if (res.ok) {
      setSettings((s) => ({ ...s, [key]: value }));
      showToast({ text: "Settings saved ✓" });
    }
  }

  async function deleteMember(id: string) {
    if (!confirm("Delete this family member?")) return;
    const res = await fetch(`/api/otis/family/members/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMembers((m) => m.filter((x) => x.id !== id));
      showToast({ text: "Member removed" });
    }
  }

  async function publishYear(year: number, published: boolean) {
    const res = await fetch(`/api/otis/year-review/${year}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published }),
    });
    if (res.ok) fetchAll();
  }

  async function saveYearHeadline(year: number, headline: string) {
    await fetch("/api/otis/year-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, headline }),
    });
    fetchAll();
  }

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <main className="mx-auto max-w-4xl space-y-10 px-4 py-12">
      <header>
        <h1 className="font-caveat text-4xl font-bold text-navy">Admin Dashboard 🔑</h1>
        <p className="mt-2 font-caveat text-xl text-navy/60">
          Logged in as {adminName} ·{" "}
          <Link href="/otis" className="text-coral hover:underline">
            Back to scrapbook →
          </Link>
        </p>
      </header>

      {/* Otis Settings */}
      <section className="scrapbook-card relative p-6">
        <div className="washi-tape left-1/2 -translate-x-1/2" style={{ background: "rgba(74, 124, 89, 0.45)" }} />
        <h2 className="font-caveat text-3xl font-bold text-navy">Otis Settings 👶</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="font-caveat text-sm text-navy/70">Date of birth</span>
            <input
              type="date"
              value={settings.dob ?? ""}
              onChange={(e) => saveSetting("dob", e.target.value)}
              className="mt-1 w-full rounded border border-kraft bg-cream px-3 py-2 font-nunito"
            />
          </label>
          <label className="block">
            <span className="font-caveat text-sm text-navy/70">Home latitude</span>
            <input
              type="number"
              step="any"
              value={settings.home_lat ?? ""}
              onChange={(e) => saveSetting("home_lat", e.target.value)}
              className="mt-1 w-full rounded border border-kraft bg-cream px-3 py-2 font-nunito"
            />
          </label>
          <label className="block">
            <span className="font-caveat text-sm text-navy/70">Home longitude</span>
            <input
              type="number"
              step="any"
              value={settings.home_lng ?? ""}
              onChange={(e) => saveSetting("home_lng", e.target.value)}
              className="mt-1 w-full rounded border border-kraft bg-cream px-3 py-2 font-nunito"
            />
          </label>
        </div>
      </section>

      {/* Storage */}
      {storage && (
        <section className="scrapbook-card relative p-6">
          <div className="washi-tape left-1/2 -translate-x-1/2" style={{ background: "rgba(245, 200, 66, 0.45)" }} />
          <h2 className="font-caveat text-3xl font-bold text-navy">Storage 📦</h2>
          <p className="mt-2 font-caveat text-lg text-navy">
            Storage used: {storage.totalMb} MB of {storage.limitMb} MB
          </p>
          <p className="font-nunito text-sm text-navy/60">
            Photos: {storage.photoMb} MB · Videos: {storage.videoMb} MB
          </p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-kraft/50">
            <div
              className={`h-full transition-all ${storage.percentUsed > 70 ? "bg-coral" : "bg-green"}`}
              style={{ width: `${Math.min(storage.percentUsed, 100)}%` }}
            />
          </div>
        </section>
      )}

      {/* Family Members */}
      <section className="scrapbook-card relative p-6">
        <div className="washi-tape left-1/2 -translate-x-1/2" style={{ background: "rgba(212, 97, 78, 0.45)" }} />
        <div className="flex items-center justify-between">
          <h2 className="font-caveat text-3xl font-bold text-navy">Family Members 👨‍👩‍👧</h2>
          <button
            type="button"
            onClick={() => {
              setEditingMember(null);
              setShowMemberModal(true);
            }}
            className="rounded bg-coral px-4 py-2 font-caveat text-lg text-cream"
          >
            Add member +
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded bg-cream/80 p-3"
            >
              <div>
                <p className="font-caveat text-xl font-bold text-navy">{m.display_name}</p>
                <p className="font-nunito text-sm text-navy/60">
                  @{m.username} · {m.relationship ?? "—"} · {m.location ?? "—"}
                  {m.lat != null && ` · ${m.lat}, ${m.lng}`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingMember(m);
                    setShowMemberModal(true);
                  }}
                  className="font-caveat text-lg"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  onClick={() => deleteMember(m.id)}
                  className="font-caveat text-lg"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ActivityLog />

      <FeedEventTypesAdmin />

      <FamilyFeedModeration />

      {/* Year in Review */}
      <section className="scrapbook-card relative p-6">
        <div className="washi-tape left-1/2 -translate-x-1/2" style={{ background: "rgba(30, 45, 74, 0.2)" }} />
        <h2 className="font-caveat text-3xl font-bold text-navy">Year in Review 📅</h2>
        <div className="mt-4 space-y-4">
          {yearOptions.map((year) => {
            const review = yearReviews.find((r) => r.year === year);
            return (
              <div key={year} className="flex flex-wrap items-center gap-3 rounded bg-cream/80 p-3">
                <span className="font-caveat text-2xl font-bold text-navy">{year}</span>
                <input
                  placeholder="Write a headline..."
                  defaultValue={review?.headline ?? ""}
                  onBlur={(e) => saveYearHeadline(year, e.target.value)}
                  className="min-w-[200px] flex-1 rounded border border-kraft bg-cream px-3 py-1 font-caveat"
                />
                <Link
                  href={`/otis/year/${year}`}
                  className="font-caveat text-coral hover:underline"
                >
                  Preview
                </Link>
                {review?.published ? (
                  <button
                    type="button"
                    onClick={() => publishYear(year, false)}
                    className="rounded border px-3 py-1 font-caveat text-sm"
                  >
                    Unpublish
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => publishYear(year, true)}
                    className="rounded bg-green px-3 py-1 font-caveat text-sm text-cream"
                  >
                    Publish →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Time Capsules */}
      <section className="scrapbook-card relative p-6">
        <div className="washi-tape left-1/2 -translate-x-1/2" style={{ background: "rgba(212, 97, 78, 0.45)" }} />
        <div className="flex items-center justify-between">
          <h2 className="font-caveat text-3xl font-bold text-navy">Time Capsule 🔒</h2>
          <button
            type="button"
            onClick={() => setShowCapsuleModal(true)}
            className="rounded bg-coral px-4 py-2 font-caveat text-lg text-cream"
          >
            Create capsule +
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {capsules.map((c) => {
            const letters = c.capsule_letters ?? [];
            const dadLetter = letters.find((l) => l.author === "Dad");
            const mumLetter = letters.find((l) => l.author === "Mum");
            const wordCount = (text: string | null | undefined) =>
              text ? text.trim().split(/\s+/).filter(Boolean).length : 0;

            return (
              <div key={c.id} className="rounded bg-cream/80 p-4">
                <p className="font-caveat text-xl font-bold text-navy">{c.title}</p>
                <p className="font-caveat text-sm text-navy/60">
                  Opens {format(parseISO(c.unlock_date), "d MMM yyyy")} ·{" "}
                  Dad: {wordCount(dadLetter?.letter_text)} words · Mum:{" "}
                  {wordCount(mumLetter?.letter_text)} words
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setLetterEditor({
                        capsuleId: c.id,
                        author: adminName ?? "Dad",
                        title: c.title,
                      })
                    }
                    className="font-caveat text-coral hover:underline"
                  >
                    Write my letter →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {showMemberModal && (
        <MemberModal
          member={editingMember}
          onClose={() => {
            setShowMemberModal(false);
            setEditingMember(null);
          }}
          onSaved={() => {
            setShowMemberModal(false);
            setEditingMember(null);
            fetchAll();
          }}
        />
      )}

      {showCapsuleModal && (
        <CapsuleCreateModal
          onClose={() => setShowCapsuleModal(false)}
          onCreated={(capsule) => {
            setShowCapsuleModal(false);
            fetchAll();
            setLetterEditor({
              capsuleId: capsule.id,
              author: adminName ?? "Dad",
              title: capsule.title,
            });
          }}
        />
      )}

      {letterEditor && (
        <LetterEditor
          {...letterEditor}
          onClose={() => setLetterEditor(null)}
        />
      )}
    </main>
  );
}

function MemberModal({
  member,
  onClose,
  onSaved,
}: {
  member: FamilyMember | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    display_name: member?.display_name ?? "",
    username: member?.username ?? "",
    relationship: member?.relationship ?? "",
    location: member?.location ?? "",
    lat: member?.lat?.toString() ?? "",
    lng: member?.lng?.toString() ?? "",
    password: "",
    confirm: "",
  });
  const [credentials, setCredentials] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function slugify(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!member && form.password !== form.confirm) {
      showToast({ text: "Passwords don't match", type: "error" });
      return;
    }
    setLoading(true);
    try {
      const body = {
        display_name: form.display_name,
        username: form.username || slugify(form.display_name),
        relationship: form.relationship,
        location: form.location,
        lat: form.lat ? parseFloat(form.lat) : null,
        lng: form.lng ? parseFloat(form.lng) : null,
        ...(form.password ? { password: form.password } : {}),
      };

      const res = member
        ? await fetch(`/api/otis/family/members/${member.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/otis/family/members", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...body, password: form.password }),
          });

      if (!res.ok) throw new Error("failed");
      if (!member) {
        setCredentials(`Username: ${body.username} / Password: ${form.password}`);
      } else {
        onSaved();
      }
    } catch {
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={handleSubmit} className="scrapbook-card max-h-[90vh] w-full max-w-md overflow-y-auto p-6">
        <h2 className="mb-4 font-caveat text-3xl text-navy">
          {member ? "Edit Member ✏️" : "Add Family Member 👨‍👩‍👧"}
        </h2>
        {credentials ? (
          <div>
            <p className="font-caveat text-lg text-navy">Account created! Share these details:</p>
            <pre className="mt-2 rounded bg-kraft/30 p-3 font-mono text-sm">{credentials}</pre>
            <button type="button" onClick={onSaved} className="mt-4 w-full rounded bg-coral py-3 font-caveat text-lg text-cream">
              Done →
            </button>
          </div>
        ) : (
          <>
            <input
              placeholder="Display name (e.g. Granny)"
              value={form.display_name}
              onChange={(e) =>
                setForm({
                  ...form,
                  display_name: e.target.value,
                  username: form.username || slugify(e.target.value),
                })
              }
              className="mb-3 w-full rounded border border-kraft bg-cream px-3 py-2 font-caveat"
              required
            />
            <input
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="mb-3 w-full rounded border border-kraft bg-cream px-3 font-nunito"
              required
            />
            <input
              placeholder="Relationship"
              value={form.relationship}
              onChange={(e) => setForm({ ...form, relationship: e.target.value })}
              className="mb-3 w-full rounded border border-kraft bg-cream px-3 font-caveat"
            />
            <input
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="mb-3 w-full rounded border border-kraft bg-cream px-3 font-caveat"
            />
            <div className="mb-3 grid grid-cols-2 gap-2">
              <input
                placeholder="Latitude"
                value={form.lat}
                onChange={(e) => setForm({ ...form, lat: e.target.value })}
                className="rounded border border-kraft bg-cream px-3 py-2 font-nunito text-sm"
              />
              <input
                placeholder="Longitude"
                value={form.lng}
                onChange={(e) => setForm({ ...form, lng: e.target.value })}
                className="rounded border border-kraft bg-cream px-3 py-2 font-nunito text-sm"
              />
            </div>
            <p className="mb-3 font-caveat text-xs text-navy/50">
              Find on Google Maps — right click and copy coordinates
            </p>
            <input
              type="password"
              placeholder={member ? "Leave blank to keep current password" : "Password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mb-3 w-full rounded border border-kraft bg-cream px-3 font-nunito"
              required={!member}
            />
            {!member && (
              <input
                type="password"
                placeholder="Confirm password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                className="mb-4 w-full rounded border border-kraft bg-cream px-3 font-nunito"
                required
              />
            )}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 rounded border py-3 font-caveat text-lg">
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
          </>
        )}
      </form>
    </div>
  );
}

function CapsuleCreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (capsule: TimeCapsule) => void;
}) {
  const [title, setTitle] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/otis/capsules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, unlock_date: unlockDate }),
      });
      if (!res.ok) throw new Error("failed");
      onCreated(await res.json());
    } catch {
      showToast({ text: "Something went wrong. Try again?", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={handleSubmit} className="scrapbook-card w-full max-w-md p-6">
        <h2 className="mb-4 font-caveat text-3xl text-navy">New Time Capsule 🔒</h2>
        <input
          placeholder="e.g. For Otis on his 18th Birthday"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-3 w-full rounded border border-kraft bg-cream px-3 py-2 font-caveat text-lg"
          required
        />
        <input
          type="date"
          value={unlockDate}
          onChange={(e) => setUnlockDate(e.target.value)}
          className="mb-4 w-full rounded border border-kraft bg-cream px-3 py-2 font-nunito"
          required
        />
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded border py-3 font-caveat text-lg">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded bg-coral py-3 font-caveat text-lg text-cream"
          >
            Create capsule →
          </button>
        </div>
      </form>
    </div>
  );
}

function LetterEditor({
  capsuleId,
  author,
  title,
  onClose,
}: {
  capsuleId: string;
  author: string;
  title: string;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/otis/capsules/${capsuleId}/letters`)
      .then((r) => r.json())
      .then((letters: CapsuleLetter[]) => {
        const mine = letters.find((l) => l.author === author);
        if (mine?.letter_text) setText(mine.letter_text);
      });
  }, [capsuleId, author]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!text.trim()) return;
      const res = await fetch(`/api/otis/capsules/${capsuleId}/letters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, letter_text: text }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [capsuleId, author, text]);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-cream">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-caveat text-3xl text-navy">{title}</h2>
          <span className="font-caveat text-sm text-green">{saved ? "Saved ✓" : ""}</span>
        </div>
        <p className="font-caveat text-2xl text-coral">Dear Otis,</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mt-4 min-h-[400px] w-full resize-none border-none bg-transparent font-caveat text-xl leading-[2] text-navy outline-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(transparent, transparent 31px, rgba(30,45,74,0.08) 32px)",
          }}
          placeholder="Write your letter..."
        />
        <p className="font-caveat text-sm text-navy/50">{wordCount} words written</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 rounded bg-coral px-6 py-3 font-caveat text-xl text-cream"
        >
          I&apos;m done for now →
        </button>
      </div>
    </div>
  );
}

const PRESET_COLOURS = ["#F5C842", "#D4614E", "#4A7C59", "#5B8DB8", "#E8A0B0", "#8B6BA8"];

function FeedEventTypesAdmin() {
  const [types, setTypes] = useState<FeedEventType[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", emoji: "", colour: PRESET_COLOURS[0] });

  const fetchTypes = useCallback(async () => {
    const res = await fetch("/api/otis/feed/event-types");
    if (res.ok) setTypes(await res.json());
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/otis/feed/event-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowModal(false);
      setForm({ name: "", emoji: "", colour: PRESET_COLOURS[0] });
      fetchTypes();
      showToast({ text: "Event type added ✓" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this event type?")) return;
    const res = await fetch(`/api/otis/feed/event-types?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setTypes((t) => t.filter((x) => x.id !== id));
      showToast({ text: "Event type removed" });
    }
  }

  return (
    <section className="scrapbook-card relative p-6">
      <div
        className="washi-tape left-1/2 -translate-x-1/2"
        style={{ background: "rgba(91, 141, 184, 0.45)" }}
      />
      <div className="flex items-center justify-between">
        <h2 className="font-caveat text-3xl font-bold text-navy">Feed Event Types 🏷️</h2>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="rounded bg-coral px-4 py-2 font-caveat text-lg text-cream"
        >
          Add event type +
        </button>
      </div>
      <div className="mt-4 space-y-2">
        {types.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded bg-cream/80 px-3 py-2"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{t.emoji}</span>
              <span className="font-caveat text-lg text-navy">{t.name}</span>
              <span
                className="h-5 w-5 rounded-full border border-navy/10"
                style={{ background: t.colour }}
              />
            </div>
            <button
              type="button"
              onClick={() => handleDelete(t.id)}
              className="font-caveat text-lg"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleAdd} className="scrapbook-card w-full max-w-md p-6">
            <h3 className="font-caveat text-2xl font-bold text-navy">Add event type</h3>
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-3 w-full rounded border border-kraft bg-cream px-3 py-2 font-caveat"
              required
            />
            <input
              placeholder="Emoji"
              value={form.emoji}
              onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
              className="mt-2 w-full rounded border border-kraft bg-cream px-3 py-2 font-caveat"
              required
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {PRESET_COLOURS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, colour: c }))}
                  className={`h-8 w-8 rounded-full border-2 ${form.colour === c ? "border-navy" : "border-transparent"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <input
              placeholder="Custom hex"
              value={form.colour}
              onChange={(e) => setForm((f) => ({ ...f, colour: e.target.value }))}
              className="mt-2 w-full rounded border border-kraft bg-cream px-3 py-2 font-caveat"
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 rounded border px-4 py-2 font-caveat"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded bg-coral px-4 py-2 font-caveat text-cream"
              >
                Add →
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

type ModerationFilter = "all" | "active" | "removed";

function FamilyFeedModeration() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [filter, setFilter] = useState<ModerationFilter>("all");

  const fetchPosts = useCallback(async () => {
    const res = await fetch("/api/otis/feed?moderation=true&limit=100&offset=0");
    if (res.ok) setPosts(await res.json());
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const activeCount = posts.filter((p) => !p.is_removed).length;
  const removedCount = posts.filter((p) => p.is_removed).length;

  const filtered = posts.filter((p) => {
    if (filter === "active") return !p.is_removed;
    if (filter === "removed") return p.is_removed;
    return true;
  });

  async function restorePost(id: string) {
    const res = await fetch(`/api/otis/feed/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_removed: false, remove_reason: null }),
    });
    if (res.ok) {
      fetchPosts();
      showToast({ text: "Post restored ✓" });
    }
  }

  return (
    <section className="scrapbook-card relative p-6">
      <div
        className="washi-tape left-1/2 -translate-x-1/2"
        style={{ background: "rgba(212, 97, 78, 0.45)" }}
      />
      <h2 className="font-caveat text-3xl font-bold text-navy">Family Feed 📰</h2>
      <p className="mt-1 font-caveat text-navy/60">
        {activeCount} active posts · {removedCount} removed
      </p>
      <div className="mt-3 flex gap-2 font-caveat text-lg">
        {(["all", "active", "removed"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={filter === f ? "font-bold text-coral" : "text-navy/60"}
          >
            {f === "all" ? "All" : f === "active" ? "Active" : "Removed"}
            {f !== "removed" && " ·"}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {filtered.map((post) => (
          <div key={post.id} className="rounded bg-cream/80 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-caveat text-lg font-bold text-navy">
                  {post.event_type?.emoji ?? "✨"} {post.title}
                </p>
                <p className="font-caveat text-sm text-navy/60">
                  by {post.author_display_name} · {post.comment_count} comments
                </p>
                {post.is_removed && (
                  <span className="mt-1 inline-block rounded bg-coral/20 px-2 py-0.5 font-caveat text-sm text-coral">
                    Removed
                    {post.remove_reason ? ` — ${post.remove_reason}` : ""}
                  </span>
                )}
              </div>
              {post.is_removed && (
                <button
                  type="button"
                  onClick={() => restorePost(post.id)}
                  className="rounded bg-green px-3 py-1 font-caveat text-sm text-cream"
                >
                  Restore
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
