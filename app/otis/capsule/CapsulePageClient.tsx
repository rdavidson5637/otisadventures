"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInMonths,
  differenceInSeconds,
  differenceInYears,
  format,
  parseISO,
} from "date-fns";
import confetti from "canvas-confetti";
import Link from "next/link";
import Image from "next/image";
import type { CapsuleLetter, TimeCapsule } from "@/types/otis";

type CapsuleWithLetters = TimeCapsule & { capsule_letters?: CapsuleLetter[] };

function Countdown({ unlockDate }: { unlockDate: string }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const target = parseISO(unlockDate);
  const years = differenceInYears(target, now);
  const months = differenceInMonths(target, now) % 12;
  const days = differenceInDays(target, now) % 30;
  const hours = differenceInHours(target, now) % 24;
  const minutes = differenceInMinutes(target, now) % 60;
  const seconds = differenceInSeconds(target, now) % 60;
  const urgent = differenceInHours(target, now) < 24;

  const units = [
    { label: "years", value: years },
    { label: "months", value: months },
    { label: "days", value: days },
    { label: "hours", value: hours },
    { label: "minutes", value: minutes },
    { label: "seconds", value: seconds },
  ];

  return (
    <div className={`mt-4 flex flex-wrap justify-center gap-2 ${urgent ? "text-coral" : "text-navy"}`}>
      {units.map((u) => (
        <div
          key={u.label}
          className={`rounded border px-3 py-2 text-center font-caveat ${
            urgent ? "border-coral bg-coral/10" : "border-kraft bg-cream"
          }`}
        >
          <p className="text-2xl font-bold">{u.value}</p>
          <p className="text-xs">{u.label}</p>
        </div>
      ))}
    </div>
  );
}

function WaxSeal() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="mx-auto">
      <circle cx="32" cy="32" r="28" fill="#8B1A1A" />
      <circle cx="32" cy="32" r="24" fill="#A52A2A" />
      <text x="32" y="40" textAnchor="middle" fill="#F5F0E8" fontSize="24" fontFamily="Georgia, serif">
        O
      </text>
    </svg>
  );
}

export default function CapsulePageClient() {
  const [capsules, setCapsules] = useState<CapsuleWithLetters[]>([]);
  const [openCapsule, setOpenCapsule] = useState<CapsuleWithLetters | null>(null);
  const [celebration, setCelebration] = useState<CapsuleWithLetters | null>(null);
  const today = new Date().toISOString().split("T")[0];

  const fetchCapsules = useCallback(async () => {
    const res = await fetch("/api/otis/capsules");
    if (res.ok) {
      const data: CapsuleWithLetters[] = await res.json();
      setCapsules(data);

      for (const c of data) {
        if (c.is_unlocked && c.unlock_date <= today) {
          const key = `capsule_${c.id}_celebrated`;
          if (!localStorage.getItem(key)) {
            setCelebration(c);
            localStorage.setItem(key, "true");
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
            break;
          }
        }
      }
    }
  }, [today]);

  useEffect(() => {
    fetchCapsules();
  }, [fetchCapsules]);

  const { locked, unlocked } = useMemo(() => {
    const locked: CapsuleWithLetters[] = [];
    const unlocked: CapsuleWithLetters[] = [];
    for (const c of capsules) {
      if (c.unlock_date > today) locked.push(c);
      else unlocked.push(c);
    }
    return { locked, unlocked };
  }, [capsules, today]);

  function authorsLabel(letters: CapsuleLetter[] = []) {
    const hasDad = letters.some((l) => l.author === "Dad" && l.letter_text);
    const hasMum = letters.some((l) => l.author === "Mum" && l.letter_text);
    if (hasDad && hasMum) return "Written by Dad & Mum 💛";
    if (hasDad) return "Written by Dad";
    if (hasMum) return "Written by Mum";
    return "Waiting to be written...";
  }

  if (openCapsule) {
    const letters = openCapsule.capsule_letters ?? [];
    const dad = letters.find((l) => l.author === "Dad");
    const mum = letters.find((l) => l.author === "Mum");

    return (
      <div className="min-h-screen bg-navy px-4 py-12">
        <div className="mx-auto max-w-xl">
          <button
            type="button"
            onClick={() => setOpenCapsule(null)}
            className="mb-6 font-caveat text-lg text-cream/70 hover:text-cream"
          >
            ← Back to capsules
          </button>
          <article className="scrapbook-card p-8">
            <p className="font-caveat text-3xl text-coral">Dear Otis,</p>
            {dad?.letter_text && (
              <section className="mt-8">
                <h3 className="font-caveat text-2xl font-bold text-navy">From Dad 👨</h3>
                <p className="mt-4 whitespace-pre-wrap font-caveat text-xl leading-[2] text-navy">
                  {dad.letter_text}
                </p>
                {dad.photo_url && (
                  <div className="relative mx-auto mt-4 h-48 w-48">
                    <Image src={dad.photo_url} alt="" fill className="object-cover" />
                  </div>
                )}
              </section>
            )}
            <hr className="my-8 border-kraft" />
            {mum?.letter_text && (
              <section>
                <h3 className="font-caveat text-2xl font-bold text-navy">From Mum 👩</h3>
                <p className="mt-4 whitespace-pre-wrap font-caveat text-xl leading-[2] text-navy">
                  {mum.letter_text}
                </p>
                {mum.photo_url && (
                  <div className="relative mx-auto mt-4 h-48 w-48">
                    <Image src={mum.photo_url} alt="" fill className="object-cover" />
                  </div>
                )}
              </section>
            )}
            <p className="mt-8 text-center font-caveat text-xl text-coral">
              With all our love, Dad & Mum 💛
            </p>
          </article>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <header className="mb-10 text-center">
        <h1 className="font-caveat text-5xl font-bold text-navy md:text-6xl">
          Time Capsule 🔒
        </h1>
        <p className="mt-4 font-caveat text-xl text-navy/60">
          Letters from Dad and Mum — sealed with love, waiting for the right moment 💛
        </p>
      </header>

      {locked.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-6 font-caveat text-3xl text-navy">Sealed Envelopes ✉️</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {locked.map((c, i) => (
              <div
                key={c.id}
                className="scrapbook-card p-6 text-center shadow-lg"
                style={{ transform: `rotate(${i % 2 === 0 ? -2 : 2}deg)` }}
              >
                <WaxSeal />
                <h3 className="mt-4 font-caveat text-2xl font-bold text-navy">{c.title}</h3>
                <p className="mt-2 font-caveat text-lg text-navy/70">
                  Opens on {format(parseISO(c.unlock_date), "d MMMM yyyy")}
                </p>
                <Countdown unlockDate={c.unlock_date} />
                <p className="mt-4 font-caveat text-sm text-navy/50">
                  {authorsLabel(c.capsule_letters)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {unlocked.length > 0 && (
        <section>
          <h2 className="mb-6 font-caveat text-3xl text-navy">Opened Capsules 🎉</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {unlocked.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setOpenCapsule(c)}
                className="scrapbook-card p-6 text-left transition-transform hover:scale-[1.02]"
              >
                <h3 className="font-caveat text-2xl font-bold text-navy">{c.title} 🎉</h3>
                <span className="mt-2 inline-block rounded bg-green/20 px-2 py-1 font-caveat text-sm text-green">
                  Unlocked on {format(parseISO(c.unlock_date), "d MMM yyyy")}
                </span>
                <p className="mt-3 font-caveat text-coral">Open the capsule →</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {!locked.length && !unlocked.length && (
        <p className="text-center font-caveat text-2xl text-navy/60">
          No time capsules yet — Dad and Mum are still writing... 💌
        </p>
      )}

      {celebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="scrapbook-card max-w-md p-8 text-center">
            <p className="text-5xl">🔓</p>
            <h2 className="mt-4 font-caveat text-3xl font-bold text-navy">
              A time capsule has unlocked!
            </h2>
            <p className="mt-2 font-caveat text-xl text-navy/70">{celebration.title} is now open</p>
            <button
              type="button"
              onClick={() => setCelebration(null)}
              className="mt-6 rounded bg-coral px-6 py-3 font-caveat text-xl text-cream"
            >
              Open the capsule →
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
