"use client";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center corkboard-bg px-4">
      <div className="scrapbook-card relative max-w-md p-8 text-center">
        <div
          className="washi-tape left-1/2 -translate-x-1/2"
          style={{ background: "rgba(245, 200, 66, 0.45)" }}
        />
        <p className="text-6xl">📵</p>
        <h1 className="mt-4 font-caveat text-4xl font-bold text-navy">You&apos;re offline!</h1>
        <p className="mt-3 font-caveat text-xl text-navy/60">
          Otis&apos; adventures will be back when you&apos;re connected 🍀
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded bg-coral px-6 py-2 font-caveat text-xl text-cream"
        >
          Try again →
        </button>
        <p className="mt-4 font-caveat text-sm text-navy/40">
          Already visited pages and photos will still work 📱
        </p>
      </div>
    </main>
  );
}
