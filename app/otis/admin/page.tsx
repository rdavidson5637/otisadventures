"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminDashboard from "@/components/otis/AdminDashboard";
import { useRefreshAdminSession } from "@/components/otis/AdminGate";

export default function AdminPage() {
  const router = useRouter();
  const refreshAdminSession = useRefreshAdminSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedName, setSelectedName] = useState<"Dad" | "Mum" | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/otis/auth/me", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data) => setIsLoggedIn(!!data.isAdmin))
      .catch(() => setIsLoggedIn(false))
      .finally(() => setChecking(false));
  }, []);

  function selectAdmin(name: "Dad" | "Mum", user: string) {
    setSelectedName(name);
    setUsername(user);
    setError(false);
    document.getElementById("admin-password")?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      const res = await fetch("/api/otis/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        await refreshAdminSession();
        setIsLoggedIn(true);
        router.refresh();
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

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="font-caveat text-2xl text-navy">Loading...</p>
      </main>
    );
  }

  if (isLoggedIn) {
    return <AdminDashboard />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className={`scrapbook-card relative w-full max-w-sm p-8 ${shake ? "shake" : ""}`}
      >
        <div
          className="washi-tape left-1/2 -translate-x-1/2"
          style={{ background: "rgba(212, 97, 78, 0.45)" }}
        />
        <h1 className="font-caveat text-4xl font-bold text-navy">Admin Access 🔑</h1>
        <p className="mt-2 font-caveat text-lg text-navy/60">Who are you?</p>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => selectAdmin("Dad", "dad")}
            className={`flex-1 rounded-full border-2 px-4 py-3 font-caveat text-xl transition-colors ${
              username === "dad"
                ? "border-navy bg-navy text-cream"
                : "border-kraft bg-cream text-navy hover:border-navy/40"
            }`}
          >
            Dad 👨
          </button>
          <button
            type="button"
            onClick={() => selectAdmin("Mum", "mum")}
            className={`flex-1 rounded-full border-2 px-4 py-3 font-caveat text-xl transition-colors ${
              username === "mum"
                ? "border-navy bg-navy text-cream"
                : "border-kraft bg-cream text-navy hover:border-navy/40"
            }`}
          >
            Mum 👩
          </button>
        </div>

        <input type="hidden" name="username" value={username} required />

        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password..."
          className="mt-6 w-full min-h-[48px] rounded border border-kraft bg-cream px-3 font-nunito"
          required
        />

        {error && (
          <p className="mt-2 font-caveat text-lg text-coral">
            Wrong password, {selectedName ?? "friend"}! 🙈
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !username}
          className="mt-4 w-full rounded bg-coral py-3 font-caveat text-xl text-cream disabled:opacity-50"
        >
          {loading ? "Checking..." : "Enter →"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/otis")}
          className="mt-4 w-full font-caveat text-lg text-navy/60 hover:text-navy"
        >
          ← Back to scrapbook
        </button>
      </form>
    </main>
  );
}
