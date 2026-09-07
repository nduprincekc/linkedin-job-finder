// Error monitoring + product analytics, both optional and both privacy-first.
// Nothing is sent unless the matching env var is set, so local dev stays silent.

const DSN   = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SENTRY_DSN) || "";
const PH_KEY = (typeof import.meta !== "undefined" && import.meta.env?.VITE_POSTHOG_KEY) || "";
const PH_HOST = (typeof import.meta !== "undefined" && import.meta.env?.VITE_POSTHOG_HOST) || "https://eu.i.posthog.com";
const RELEASE = (typeof import.meta !== "undefined" && import.meta.env?.VITE_APP_VERSION) || "dev";

export const errorsEnabled = Boolean(DSN);
export const analyticsEnabled = Boolean(PH_KEY);

/* ---------------------------------------------------------------- */
/* Errors — a tiny Sentry client. No SDK, no 90 KB bundle.           */
/* ---------------------------------------------------------------- */
let sentryUrl = null, sentryKey = null;
if (DSN) {
  try {
    const u = new URL(DSN);
    sentryKey = u.username;
    sentryUrl = `${u.protocol}//${u.host}/api${u.pathname}/store/`;
  } catch { /* malformed DSN — stay silent rather than break the app */ }
}

const seen = new Set();   // don't spam the same error on every render

export function captureError(err, context = {}) {
  if (!sentryUrl) { console.error(err); return; }
  const key = `${err?.name}:${err?.message}`.slice(0, 200);
  if (seen.has(key)) return;
  seen.add(key);
  const body = {
    event_id: crypto.randomUUID().replace(/-/g, ""),
    timestamp: new Date().toISOString(),
    platform: "javascript",
    release: RELEASE,
    level: "error",
    logger: "app",
    exception: { values: [{ type: err?.name || "Error", value: String(err?.message || err).slice(0, 500),
      stacktrace: { frames: String(err?.stack || "").split("\n").slice(1, 12).reverse().map(f => ({ filename: f.trim().slice(0, 300) })) } }] },
    tags: { view: context.view || "unknown" },
    extra: context,
    request: { url: location.href }
  };
  fetch(sentryUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${sentryKey}, sentry_client=jobfinder/1.0` },
    body: JSON.stringify(body),
    keepalive: true
  }).catch(() => {});
}

export function installErrorHandlers(getContext = () => ({})) {
  if (!sentryUrl) return;
  window.addEventListener("error", e => captureError(e.error || new Error(e.message), getContext()));
  window.addEventListener("unhandledrejection", e => captureError(e.reason instanceof Error ? e.reason : new Error(String(e.reason)), getContext()));
}

/* ---------------------------------------------------------------- */
/* Analytics — PostHog capture endpoint, no cookies, no PII.         */
/* ---------------------------------------------------------------- */
let distinctId = null;
function getId() {
  if (distinctId) return distinctId;
  try {
    distinctId = localStorage.getItem("jf:aid");
    if (!distinctId) { distinctId = crypto.randomUUID(); localStorage.setItem("jf:aid", distinctId); }
  } catch { distinctId = "anon"; }
  return distinctId;
}

export function track(event, props = {}) {
  if (!PH_KEY) return;
  // Never send anything that identifies a person or reveals what they searched for verbatim.
  fetch(`${PH_HOST}/capture/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: PH_KEY,
      event,
      distinct_id: getId(),
      properties: { ...props, $current_url: location.pathname, release: RELEASE, $lib: "jobfinder" },
      timestamp: new Date().toISOString()
    }),
    keepalive: true
  }).catch(() => {});
}

// Tie events to an account once signed in — the id only, never the email.
export function identify(userId, traits = {}) {
  if (!PH_KEY || !userId) return;
  distinctId = userId;
  try { localStorage.setItem("jf:aid", userId); } catch { /* ignore */ }
  track("$identify", { $set: traits });
}
