import fetch from "node-fetch";
import https from "https";

const {
  WP_BASE_URL,
  WP_USERNAME,
  WP_APP_PASSWORD,
  WP_ALLOW_SELF_SIGNED,
} = process.env;

if (!WP_BASE_URL || !WP_USERNAME || !WP_APP_PASSWORD) {
  console.error(
    "Missing WP_BASE_URL, WP_USERNAME or WP_APP_PASSWORD. Copy .env.example to .env and fill it in."
  );
}

const authHeader =
  "Basic " + Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString("base64");

// Local by Flywheel uses a self-signed cert on https://*.local — only bypass
// verification for local dev, never for a live site.
const agent =
  WP_ALLOW_SELF_SIGNED === "true"
    ? new https.Agent({ rejectUnauthorized: false })
    : undefined;

/**
 * Low-level request helper. `path` should start with /wp/v2/... or /wc/v3/...
 * (i.e. everything after /wp-json).
 */
export async function wpRequest(path, { method = "GET", body, query } = {}) {
  const url = new URL(`${WP_BASE_URL.replace(/\/$/, "")}/wp-json${path}`);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });
  }

  const res = await fetch(url, {
    method,
    agent,
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    throw new Error(
      `WP REST API error ${res.status} on ${method} ${path}: ${JSON.stringify(json)}`
    );
  }
  return json;
}
