"use client";

import { useEffect, useState } from "react";

export type ToastMessage = { text: string; type?: "success" | "error" };

let toastListener: ((msg: ToastMessage) => void) | null = null;

export function showToast(message: ToastMessage) {
  toastListener?.(message);
}

export default function Toast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    toastListener = setToast;
    return () => {
      toastListener = null;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;

  return (
    <div
      className={`fixed bottom-6 left-6 z-50 scrapbook-card px-5 py-3 font-caveat text-lg shadow-lg transition-transform safe-bottom ${
        toast.type === "error" ? "bg-coral text-cream" : "bg-cream text-navy"
      }`}
    >
      {toast.text}
    </div>
  );
}
