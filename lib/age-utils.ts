import { differenceInMonths, parseISO } from "date-fns";

export function calculateAge(dob: string, atDate: string): string {
  const birth = parseISO(dob);
  const at = parseISO(atDate);
  const totalMonths = differenceInMonths(at, birth);

  if (totalMonths < 0) return "not born yet";
  if (totalMonths < 24) {
    return totalMonths === 1 ? "1 month" : `${totalMonths} months`;
  }

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (months === 0) {
    return years === 1 ? "1 year" : `${years} years`;
  }
  const yearPart = years === 1 ? "1 year" : `${years} years`;
  const monthPart = months === 1 ? "1 month" : `${months} months`;
  return `${yearPart} ${monthPart}`;
}
