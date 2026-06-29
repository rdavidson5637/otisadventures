export const TIMEZONE_OPTIONS = [
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Dublin", label: "Dublin (GMT/IST)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Europe/Amsterdam", label: "Amsterdam (CET)" },
  { value: "Europe/Madrid", label: "Madrid (CET)" },
  { value: "Europe/Rome", label: "Rome (CET)" },
  { value: "Europe/Athens", label: "Athens (EET)" },
  { value: "Europe/Moscow", label: "Moscow (MSK)" },
  { value: "America/New_York", label: "New York (EST)" },
  { value: "America/Chicago", label: "Chicago (CST)" },
  { value: "America/Denver", label: "Denver (MST)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST)" },
  { value: "America/Toronto", label: "Toronto (EST)" },
  { value: "America/Vancouver", label: "Vancouver (PST)" },
  { value: "America/Sao_Paulo", label: "São Paulo (BRT)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Seoul", label: "Seoul (KST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "Australia/Melbourne", label: "Melbourne (AEST)" },
  { value: "Pacific/Auckland", label: "Auckland (NZST)" },
];

export function getTimezoneTapeColour(timezone: string): string {
  if (timezone.startsWith("Europe/") || timezone.startsWith("Africa/")) {
    return "rgba(74, 124, 89, 0.45)";
  }
  if (timezone.startsWith("America/")) {
    return "rgba(91, 141, 184, 0.45)";
  }
  return "rgba(212, 97, 78, 0.45)";
}

export function getTimezoneCityLabel(timezone: string): string {
  const found = TIMEZONE_OPTIONS.find((t) => t.value === timezone);
  if (found) return found.label.split(" (")[0];
  return timezone.split("/").pop()?.replace(/_/g, " ") ?? timezone;
}
