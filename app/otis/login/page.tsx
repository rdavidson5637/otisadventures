"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FamilyLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      const res = await fetch("/api/otis/family/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.success) {
        router.push("/otis");
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => setShake(false), 400);
      }
    } catch {
      setError(true);
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
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Your name..."
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
          <p className="mt-3 font-caveat text-lg text-coral">
            Hmm, that doesn&apos;t look right! Try again 🙈
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded bg-coral py-3 font-caveat text-2xl text-cream"
        >
          {loading ? "Checking..." : "Come on in! →"}
        </button>

        <p className="mt-4 font-caveat text-sm text-navy/50">
          Need access? Ask Dad or Mum 😊
        </p>
      </form>
    </main>
  );
}
