"use client";

import { useEffect, useState } from "react";

export type FamilyMember = {
  id: string;
  username: string;
  displayName: string;
  relationship: string | null;
  location: string | null;
  avatarUrl: string | null;
};

export function useFamilyMember() {
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/otis/family/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.loggedIn && data.member) {
          setMember(data.member);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { member, loading, displayName: member?.displayName ?? null };
}
