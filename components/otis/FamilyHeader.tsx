"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useIsAdmin } from "@/components/otis/AdminGate";

type FamilyMember = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
};

export default function FamilyHeader() {
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      setLoading(false);
      return;
    }

    fetch("/api/otis/family/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn && data.member) {
          setMember(data.member);
        }
      })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  async function handleLogout() {
    await fetch("/api/otis/family/logout", { method: "POST" });
    router.push("/otis/login");
  }

  if (loading) return null;

  if (isAdmin) {
    return (
      <header className="border-b border-kraft/60 bg-cream px-4 py-2">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <p className="truncate font-caveat text-lg text-navy sm:text-xl">
            🔑 Admin mode — browse the scrapbook freely
          </p>
          <a
            href="/otis/admin"
            className="shrink-0 font-nunito text-sm text-navy/60 underline-offset-2 hover:text-navy hover:underline"
          >
            Dashboard
          </a>
        </div>
      </header>
    );
  }

  if (!member) return null;

  return (
    <header className="border-b border-kraft/60 bg-cream px-4 py-2">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt=""
              className="h-8 w-8 shrink-0 rounded-full border border-kraft object-cover"
            />
          ) : (
            <span className="text-xl sm:hidden">👋</span>
          )}
          <p className="truncate font-caveat text-lg text-navy sm:text-xl">
            <span className="hidden sm:inline">👋 </span>
            Hello, {member.displayName}!
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="shrink-0 font-nunito text-sm text-navy/60 underline-offset-2 hover:text-navy hover:underline"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
