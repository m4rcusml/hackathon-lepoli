const id = "[A-Za-z0-9_-]{1,200}";
const routes: [string, RegExp][] = [
  ["GET", /^session$/],
  ["GET", /^auth\/start$/],
  ["POST", /^auth\/logout$/],
  ["GET", /^patients$/],
  ["POST", /^sharing\/resolve$/],
  ["POST", /^follow-up-requests$/],
  ["GET", new RegExp(`^follow-up-requests/${id}$`)],
  ["GET", new RegExp(`^patients/${id}/(access|snapshot|updates)$`)],
  ["POST", new RegExp(`^patients/${id}/reviews$`)],
  ["GET", new RegExp(`^patients/${id}/documents/${id}/content$`)],
  ["POST", new RegExp(`^temporary-access/${id}/close$`)],
];
export const allowedOperation = (method: string, path: string) =>
  routes.some(([m, re]) => m === method && re.test(path));
export function safeReturnTo(value: string | null) {
  return value === null || /^\/doctor(?:\/[A-Za-z0-9_-]+)*\/?$/.test(value);
}
