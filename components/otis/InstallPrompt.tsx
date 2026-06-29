"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Variant = "android" | "ios" | null;

const DISMISS_KEY = "otis_install_dismissed";

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export default function InstallPrompt() {
  const pathname = usePathname();
  const [variant, setVariant] = useState<Variant>(null);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const dismiss = useCallback(() => {
    sessionStorage.setItem(DISMISS_KEY, "true");
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      setVariant(null);
      setExiting(false);
    }, 200);
  }, []);

  useEffect(() => {
    if (pathname === "/otis/login" || pathname === "/otis/admin") return;
    if (isStandalone()) return;
    if (sessionStorage.getItem(DISMISS_KEY) === "true") return;

    let iosTimer: ReturnType<typeof setTimeout> | undefined;

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      if (iosTimer) clearTimeout(iosTimer);
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVariant("android");
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    if (isIOS()) {
      iosTimer = setTimeout(() => {
        if (sessionStorage.getItem(DISMISS_KEY) === "true") return;
        if (isStandalone()) return;
        setVariant("ios");
        setVisible(true);
      }, 2000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, [pathname]);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  }

  if (!visible || !variant) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 border-t-2 border-kraft bg-cream safe-bottom ${
        exiting ? "animate-install-slide-down" : "animate-install-slide-up"
      }`}
      role="dialog"
      aria-label="Install app"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="text-2xl">🍀</span>
          {variant === "android" ? (
            <div className="min-w-0">
              <p className="font-caveat text-lg font-bold text-navy">Add to your home screen!</p>
              <p className="font-caveat text-sm text-navy/60">
                Install Otis&apos; Adventures as an app
              </p>
            </div>
          ) : (
            <div className="min-w-0">
              <p className="font-caveat text-lg font-bold text-navy">Install on your iPhone!</p>
              <p className="font-caveat text-sm text-navy/60">
                Tap Share then &apos;Add to Home Screen&apos;
              </p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {variant === "android" && (
            <button
              type="button"
              onClick={handleInstall}
              className="rounded bg-coral px-4 py-2 font-caveat text-cream"
            >
              Install 📲
            </button>
          )}
          {variant === "ios" && (
            <span className="animate-install-bounce font-caveat text-2xl text-coral" aria-hidden>
              ↓
            </span>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="px-2 font-caveat text-xl text-navy/40"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
