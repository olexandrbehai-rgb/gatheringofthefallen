export type AnalyticsData = Record<string, string | number | boolean>;

const VISITOR_ID_KEY = "gtf_visitor_id";

function getVisitorId(): string | undefined {
  try {
    const existing = window.localStorage.getItem(VISITOR_ID_KEY);
    if (existing) return existing;
    const visitorId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(VISITOR_ID_KEY, visitorId);
    return visitorId;
  } catch {
    return undefined;
  }
}

function getReferrerSource(): string {
  if (!document.referrer) return "direct";
  try {
    const referrer = new URL(document.referrer);
    return referrer.origin === window.location.origin ? "internal" : referrer.hostname;
  } catch {
    return "unknown";
  }
}

declare global {
  interface Window {
    umami?: {
      track(name: string, data?: AnalyticsData): void;
    };
  }
}

export function trackEvent(name: string, data?: AnalyticsData): void {
  if (typeof window === "undefined") return;

  try {
    window.umami?.track(name, data);
  } catch {
    // Analytics failures must never interrupt the user experience.
  }

  void fetch(`${import.meta.env.BASE_URL}api/activity/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    keepalive: true,
    body: JSON.stringify({
      eventName: name,
      path: window.location.pathname,
      visitorId: getVisitorId(),
      metadata: {
        ...(data ?? {}),
        referrer: getReferrerSource(),
      },
    }),
  }).catch(() => {
    // Private activity tracking must never interrupt the user experience.
  });
}