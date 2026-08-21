import fetch from "node-fetch";
import https from "https";

function getWordPressConfig() {
  const {
    WP_BASE_URL,
    WP_USERNAME,
    WP_APP_PASSWORD,
    WP_ALLOW_SELF_SIGNED,
  } = process.env;

  if (!WP_BASE_URL || !WP_USERNAME || !WP_APP_PASSWORD) {
    throw new Error(
      "Missing WP_BASE_URL, WP_USERNAME or WP_APP_PASSWORD. " +
      "Copy .env.example to .env and fill it in."
    );
  }

  return {
    WP_BASE_URL,
    WP_USERNAME,
    WP_APP_PASSWORD,
    WP_ALLOW_SELF_SIGNED,
  };
}

/**
 * Low-level WordPress REST request helper.
 *
 * `path` should start with /wp/v2/... or /wc/v3/...
 * (i.e. everything after /wp-json).
 */
export async function wpRequest(
  path,
  { method = "GET", body, query } = {}
) {
  const {
    WP_BASE_URL,
    WP_USERNAME,
    WP_APP_PASSWORD,
    WP_ALLOW_SELF_SIGNED,
  } = getWordPressConfig();

  const authHeader =
    "Basic " +
    Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString("base64");

  // Local by Flywheel uses a self-signed certificate on https://*.local.
  // Only bypass verification for local development, never for a live site.
  const agent =
    WP_ALLOW_SELF_SIGNED === "true"
      ? new https.Agent({ rejectUnauthorized: false })
      : undefined;

  const url = new URL(
    `${WP_BASE_URL.replace(/\/$/, "")}/wp-json${path}`
  );

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
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