"use client";

import { createContext, useContext, useEffect, useState } from "react";

type AdminContextValue = {
  isAdmin: boolean;
  adminName: string | null;
};

const AdminContext = createContext<AdminContextValue>({
  isAdmin: false,
  adminName: null,
});

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminName, setAdminName] = useState<string | null>(null);

  useEffect(() => {
    setIsAdmin(sessionStorage.getItem("otis_admin") === "true");
    setAdminName(sessionStorage.getItem("otis_admin_name"));
  }, []);

  return (
    <AdminContext.Provider value={{ isAdmin, adminName }}>
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
