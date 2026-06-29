"use client";

import { createContext, useCallback, useContext } from "react";
import { OTIS_DOB } from "@/lib/otis-constants";
import { getOtisAge, getOtisAgeShort } from "@/lib/otis-age";

type OtisContextValue = {
  dob: string;
  loading: boolean;
  getAge: (atDate: string) => string;
  getAgeShort: (atDate: string) => string;
};

const OtisContext = createContext<OtisContextValue>({
  dob: OTIS_DOB,
  loading: false,
  getAge: () => "",
  getAgeShort: () => "",
});

export function OtisProvider({ children }: { children: React.ReactNode }) {
  const getAge = useCallback(
    (atDate: string) => getOtisAge(OTIS_DOB, atDate),
    []
  );

  const getAgeShort = useCallback(
    (atDate: string) => getOtisAgeShort(OTIS_DOB, atDate),
    []
  );

  return (
    <OtisContext.Provider
      value={{ dob: OTIS_DOB, loading: false, getAge, getAgeShort }}
    >
      {children}
    </OtisContext.Provider>
  );
}

export function useOtis() {
  return useContext(OtisContext);
}
