"use client";

import { useState } from "react";

export default function FamilyLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/otis/family/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        window.location.href = "/otis";
        return;
      }

      setError(
        data.message ??
          (res.status >= 500
            ? "Something went wrong on our end — try again in a moment"
            : "Hmm, that doesn't look right! Check your username and password 🙈")
      );
      setShake(true);
      setTimeout(() => setShake(false), 400);
    } catch {
      setError("Could not reach the server — check your connection and try again");
      setShake(true);
      setTimeout(() => setShake(false), 400);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className={`scrapbook-card relative w-full max-w-md p-8 text-center ${shake ? "shake" : ""}`}
      >
        <div
          className="washi-tape left-1/2 -translate-x-1/2"
          style={{ background: "rgba(74, 124, 89, 0.45)" }}
        />

        <p className="text-5xl">🍀</p>
        <h1 className="mt-4 font-caveat text-4xl font-bold text-navy sm:text-5xl">
          Welcome to Otis&apos; Adventures
        </h1>
        <p className="mt-2 font-caveat text-xl text-navy/60">
          Log in to see what Otis has been up to 💛
        </p>

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value.trimStart())}
          placeholder="Username (e.g. dad, granny)"
          autoCapitalize="none"
          autoCorrect="off"
          className="mt-8 w-full min-h-[48px] rounded border border-kraft bg-cream px-3 font-nunito"
          autoFocus
          required
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password..."
          className="mt-3 w-full min-h-[48px] rounded border border-kraft bg-cream px-3 font-nunito"
          required
        />

        {error && (
          <p className="mt-3 font-caveat text-lg text-coral">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded bg-coral py-3 font-caveat text-2xl text-cream"
        >
          {loading ? "Checking..." : "Come on in! →"}
        </button>

        <p className="mt-4 font-caveat text-sm text-navy/50">
          Family login — username e.g. <strong>dad</strong>, <strong>granny</strong>, or{" "}
          <strong>Mum</strong>. This is separate from the{" "}
          <a href="/otis/admin" className="text-coral underline-offset-2 hover:underline">
            admin dashboard
          </a>
          .
        </p>
      </form>
    </main>
  );
}
