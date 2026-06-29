export const FAMILY_SESSION_COOKIE = "otis_family_session";
export const ADMIN_SESSION_COOKIE = "otis_admin_session";

export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export const familySessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

export const adminSessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};
