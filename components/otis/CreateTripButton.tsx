"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminOnly } from "./AdminGate";

export default function CreateTripModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    cover_emoji: "🌍",
    start_date: "",
    end_date: "",
    location: "",
    centre_lat: "",
    centre_lng: "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/otis/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        centre_lat: form.centre_lat ? parseFloat(form.centre_lat) : undefined,
        centre_lng: form.centre_lng ? parseFloat(form.centre_lng) : undefined,
        is_active: false,
      }),
    });
    setLoading(false);
    if (res.ok) {
      onClose();
      router.refresh();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={handleSubmit}
        className="scrapbook-card relative max-h-[90vh] w-full max-w-md overflow-y-auto p-6 md:rounded"
      >
        <div
          className="washi-tape left-1/2 -translate-x-1/2"
          style={{ background: "rgba(212, 97, 78, 0.45)" }}
        />
        <h2 className="mb-4 font-caveat text-3xl text-navy">New Adventure 🌍</h2>
        {(
          [
            "name",
            "description",
            "cover_emoji",
            "start_date",
            "end_date",
            "location",
            "centre_lat",
            "centre_lng",
          ] as const
        ).map((field) => (
          <input
            key={field}
            type={field.includes("date") ? "date" : field.includes("lat") || field.includes("lng") ? "number" : "text"}
            step={field.includes("lat") || field.includes("lng") ? "any" : undefined}
            placeholder={field.replace(/_/g, " ")}
            value={form[field]}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            className="mb-3 w-full min-h-[48px] rounded border border-kraft bg-cream px-3 font-nunito"
            required={field === "name"}
          />
        ))}
        <p className="mb-4 font-caveat text-sm text-navy/50">
          Find centre coordinates on Google Maps — right click the centre of your destination
        </p>
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
            {loading ? "Saving..." : "Create →"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function CreateTripButton() {
  const [open, setOpen] = useState(false);
  return (
    <AdminOnly>
      <>
        <button
          onClick={() => setOpen(true)}
          className="fixed right-4 top-4 z-40 rounded bg-coral px-4 py-2 font-caveat text-lg text-cream shadow-lg"
        >
          Create new trip +
        </button>
        {open && <CreateTripModal onClose={() => setOpen(false)} />}
      </>
    </AdminOnly>
  );
}
