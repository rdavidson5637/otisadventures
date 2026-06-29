"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getOtisAge, getOtisAgeShort } from "@/lib/otis-age";

type OtisContextValue = {
  dob: string;
  loading: boolean;
  getAge: (atDate: string) => string;
  getAgeShort: (atDate: string) => string;
};

const OtisContext = createContext<OtisContextValue>({
  dob: "",
  loading: true,
  getAge: () => "",
  getAgeShort: () => "",
});

export function OtisProvider({ children }: { children: React.ReactNode }) {
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/otis/settings")
      .then((r) => r.json())
      .then((s) => setDob(s.dob ?? ""))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getAge = useCallback(
    (atDate: string) => (dob ? getOtisAge(dob, atDate) : ""),
    [dob]
  );

  const getAgeShort = useCallback(
    (atDate: string) => (dob ? getOtisAgeShort(dob, atDate) : ""),
    [dob]
  );

  return (
    <OtisContext.Provider value={{ dob, loading, getAge, getAgeShort }}>
      {children}
    </OtisContext.Provider>
  );
}

export function useOtis() {
  return useContext(OtisContext);
}
