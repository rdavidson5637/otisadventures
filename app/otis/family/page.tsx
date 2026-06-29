import WhereIsEveryone from "@/components/otis/WhereIsEveryone";
import FamilyFeed from "@/components/otis/FamilyFeed";

export default function FamilyPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-10 text-center">
        <h1 className="font-caveat text-5xl font-bold text-navy md:text-6xl">
          The Davidson Family 💛
        </h1>
        <p className="mt-3 font-caveat text-xl text-navy/60 md:text-2xl">
          What everyone&apos;s up to — all in one place
        </p>
      </header>

      <WhereIsEveryone />

      <div className="relative my-14">
        <div className="h-px bg-kraft" />
        <div
          className="washi-tape absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ background: "rgba(245, 200, 66, 0.45)", width: "120px" }}
        />
      </div>

      <FamilyFeed />
    </main>
  );
}
