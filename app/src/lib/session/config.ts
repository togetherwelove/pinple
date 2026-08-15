export const ANONYMOUS_SESSION_COOKIE = "pinple_anonymous_session";

export const ANONYMOUS_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isAnonymousSessionId(value: string | undefined): value is string {
  return value !== undefined && UUID_PATTERN.test(value);
}
