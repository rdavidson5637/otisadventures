import { differenceInMonths, differenceInYears, parseISO } from "date-fns";

export function getOtisAge(dob: string, atDate: string): string {
  const dobDate = parseISO(dob);
  const date = parseISO(atDate);

  const years = differenceInYears(date, dobDate);
  const months = differenceInMonths(date, dobDate) % 12;

  if (years === 0) {
    const totalMonths = differenceInMonths(date, dobDate);
    return `${totalMonths} month${totalMonths !== 1 ? "s" : ""} old`;
  }
  if (months === 0) {
    return `${years} year${years !== 1 ? "s" : ""} old`;
  }
  return `${years} year${years !== 1 ? "s" : ""} and ${months} month${months !== 1 ? "s" : ""} old`;
}

export function getOtisAgeShort(dob: string, atDate: string): string {
  const dobDate = parseISO(dob);
  const date = parseISO(atDate);
  const months = differenceInMonths(date, dobDate);
  if (months < 24) return `${months}m`;
  const years = differenceInYears(date, dobDate);
  const remainingMonths = months % 12;
  return remainingMonths > 0 ? `${years}y ${remainingMonths}m` : `${years}y`;
}

export function getAgeAtVisitMonths(dob: string, visitedDate: string): number {
  return differenceInMonths(parseISO(visitedDate), parseISO(dob));
}
