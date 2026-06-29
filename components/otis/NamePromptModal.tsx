"use client";

import { useState } from "react";

const STORAGE_KEY = "otis_commenter_name";

export function getCommenterName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setCommenterName(name: string) {
  localStorage.setItem(STORAGE_KEY, name);
}

interface NamePromptModalProps {
  onSubmit: (name: string) => void;
}

export default function NamePromptModal({ onSubmit }: NamePromptModalProps) {
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setCommenterName(trimmed);
    onSubmit(trimmed);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={handleSubmit}
        className="scrapbook-card relative w-full max-w-sm p-6"
      >
        <div
          className="washi-tape left-1/2 -translate-x-1/2"
          style={{ background: "rgba(245, 200, 66, 0.45)" }}
        />
        <h2 className="font-caveat text-3xl font-bold text-navy">
          What&apos;s your name? 👋
        </h2>
        <p className="mt-2 font-caveat text-lg text-navy/70">
          So we know who&apos;s sending all the love!
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name..."
          className="mt-4 w-full min-h-[48px] rounded border border-kraft bg-cream px-3 font-nunito"
          autoFocus
          required
        />
        <button
          type="submit"
          className="mt-4 w-full rounded bg-coral py-3 font-caveat text-xl text-cream"
        >
          Let&apos;s go! →
        </button>
      </form>
    </div>
  );
}
