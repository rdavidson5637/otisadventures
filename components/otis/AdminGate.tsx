"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type AdminContextValue = {
  isAdmin: boolean;
  adminName: string | null;
  refreshAdminSession: () => Promise<void>;
};

const AdminContext = createContext<AdminContextValue>({
  isAdmin: false,
  adminName: null,
  refreshAdminSession: async () => {},
});

async function fetchAdminSession(): Promise<{ isAdmin: boolean; adminName: string | null }> {
  try {
    const res = await fetch("/api/otis/auth/me", { credentials: "same-origin" });
    if (!res.ok) return { isAdmin: false, adminName: null };
    const data = await res.json();
    return {
      isAdmin: !!data.isAdmin,
      adminName: data.adminName ?? null,
    };
  } catch {
    return { isAdmin: false, adminName: null };
  }
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminName, setAdminName] = useState<string | null>(null);

  const refreshAdminSession = useCallback(async () => {
    const session = await fetchAdminSession();
    setIsAdmin(session.isAdmin);
    setAdminName(session.adminName);
  }, []);

  useEffect(() => {
    sessionStorage.removeItem("otis_admin");
    sessionStorage.removeItem("otis_admin_name");
    refreshAdminSession();
  }, [refreshAdminSession]);

  return (
    <AdminContext.Provider value={{ isAdmin, adminName, refreshAdminSession }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useIsAdmin(): boolean {
  return useContext(AdminContext).isAdmin;
}

export function useAdminName(): string | null {
  return useContext(AdminContext).adminName;
}

export function useRefreshAdminSession(): () => Promise<void> {
  return useContext(AdminContext).refreshAdminSession;
}

export function AdminName({ className }: { className?: string }) {
  const adminName = useAdminName();
  if (!adminName) return null;
  return <span className={className}>{adminName}</span>;
}

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const isAdmin = useIsAdmin();
  if (!isAdmin) return null;
  return <>{children}</>;
}
