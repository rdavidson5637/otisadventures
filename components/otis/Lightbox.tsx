"use client";

import { useMemo } from "react";
import YARLLightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { format, parseISO } from "date-fns";
import type { Photo } from "@/types/otis";

interface LightboxProps {
  photos: Photo[];
  index: number;
  open: boolean;
  onClose: () => void;
}

export default function Lightbox({ photos, index, open, onClose }: LightboxProps) {
  const slides = useMemo(
    () =>
      photos
        .filter((p) => p.storage_url)
        .map((photo) => ({
          src: photo.storage_url!,
          title: photo.caption ?? photo.memory_note ?? undefined,
          description: buildCaption(photo),
        })),
    [photos]
  );

  return (
    <YARLLightbox open={open} close={onClose} index={index} slides={slides} />
  );
}

function buildCaption(photo: Photo): string {
  const parts: string[] = [];
  if (photo.caption) parts.push(photo.caption);
  if (photo.taken_by) parts.push(`📷 ${photo.taken_by}`);
  if (photo.taken_date) {
    parts.push(format(parseISO(photo.taken_date), "d MMM yyyy"));
  }
  return parts.join(" · ");
}
