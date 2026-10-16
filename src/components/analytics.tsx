"use client";

import {
  Analytics as VercelAnalytics,
  type BeforeSendEvent,
} from "@vercel/analytics/next";

/**
 * These keys can carry an email (`sent`), a Supabase error that repeats it
 * (`error`), an inbox search (`q`), or a return path that itself embeds `?q=`
 * (`next`). Other inbox filters stay on the event.
 */
const SENSITIVE_PARAMS = ["sent", "error", "q", "next"] as const;

function redactAnalyticsEvent(event: BeforeSendEvent): BeforeSendEvent {
  const url = new URL(event.url);
  for (const key of SENSITIVE_PARAMS) {
    url.searchParams.delete(key);
  }
  return { ...event, url: url.toString() };
}

function Analytics() {
  return <VercelAnalytics beforeSend={redactAnalyticsEvent} />;
}

export { Analytics };
