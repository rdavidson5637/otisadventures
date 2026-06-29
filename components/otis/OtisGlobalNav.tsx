"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const BASE_LINKS = [
  { href: "/otis", label: "🌍 Adventures" },
  { href: "/otis/videos", label: "🎬 Videos" },
  { href: "/otis/family", label: "👨‍👩‍👧‍👦 Family" },
  { href: "/otis/otis", label: "👶 Otis" },
  { href: "/otis/capsule", label: "🔒 Capsule" },
];

export default function OtisGlobalNav() {
  const pathname = usePathname();
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
    fetch("/api/otis/year-review")
      .then((r) => r.json())
      .then((data) => setYears((data ?? []).map((r: { year: number }) => r.year)))
      .catch(() => {});
  }, []);

  return (
    <nav className="sticky top-0 z-30 border-b border-kraft/50 bg-cork/95 backdrop-blur-sm no-select">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 scrollbar-none">
        {BASE_LINKS.map((link) => {
          const active =
            link.href === "/otis"
              ? pathname === "/otis"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 rounded px-4 py-2 font-caveat text-lg transition-colors ${
                active
                  ? "bg-cream text-navy shadow"
                  : "text-cream/80 hover:text-cream"
              }`}
            >
              {link.label}
            </Link>
          );
        })}

        {years.length > 0 && (
          <div className="flex shrink-0 items-center gap-1 border-l border-cream/20 pl-2">
            <span className="px-2 font-caveat text-sm text-cream/60">📅</span>
            {years.map((year) => (
              <Link
                key={year}
                href={`/otis/year/${year}`}
                className={`shrink-0 rounded px-3 py-2 font-caveat text-lg transition-colors ${
                  pathname === `/otis/year/${year}`
                    ? "bg-cream text-navy shadow"
                    : "text-cream/80 hover:text-cream"
                }`}
              >
                {year}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
