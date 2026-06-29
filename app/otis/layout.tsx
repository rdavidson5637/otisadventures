import type { Metadata, Viewport } from "next";
import { AdminProvider } from "@/components/otis/AdminGate";
import FamilyHeader from "@/components/otis/FamilyHeader";
import InstallPrompt from "@/components/otis/InstallPrompt";
import OtisGlobalNav from "@/components/otis/OtisGlobalNav";
import Toast from "@/components/otis/Toast";
import { OtisProvider } from "@/lib/otis-context";

// Server-render at request time — needs Supabase env vars (Vercel project settings).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Otis' Adventures",
  description: "A private family scrapbook — Otis' adventures around the world.",
  robots: { index: false, follow: false },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Otis' Adventures",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Otis' Adventures",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1E2D4A",
};

export default function OtisLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <OtisProvider>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-startup-image" href="/icons/icon-512x512.png" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <div className="min-h-screen corkboard-bg">
          <FamilyHeader />
          <OtisGlobalNav />
          {children}
        </div>
        <Toast />
        <InstallPrompt />
      </OtisProvider>
    </AdminProvider>
  );
}
