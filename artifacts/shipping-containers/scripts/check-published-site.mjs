import { pathToFileURL } from "node:url";

const REQUEST_TIMEOUT_MS = 15_000;

function normalizeSiteUrl(value) {
  if (!value) {
    throw new Error(
      "Pass the published site URL as an argument or set VERCEL_URL.",
    );
  }

  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(value)
    ? value
    : `https://${value}`;
  const url = new URL(withProtocol);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`Unsupported site URL protocol: ${url.protocol}`);
  }
  url.pathname = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
  url.search = "";
  url.hash = "";
  return url;
}

function readAttribute(tag, name) {
  const match = tag.match(
    new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"),
  );
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

function extractGeneratedAssets(html, pageUrl) {
  const javascript = [];
  const stylesheets = [];

  for (const match of html.matchAll(/<script\b[^>]*>/gi)) {
    const source = readAttribute(match[0], "src");
    if (source) javascript.push(new URL(source, pageUrl));
  }

  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    const href = readAttribute(tag, "href");
    if (!href) continue;

    const rel = (readAttribute(tag, "rel") ?? "").toLowerCase().split(/\s+/);
    const as = (readAttribute(tag, "as") ?? "").toLowerCase();
    if (rel.includes("stylesheet") || (rel.includes("preload") && as === "style")) {
      stylesheets.push(new URL(href, pageUrl));
    }
    if (rel.includes("modulepreload") || (rel.includes("preload") && as === "script")) {
      javascript.push(new URL(href, pageUrl));
    }
  }

  const sameOrigin = (asset) => asset.origin === pageUrl.origin;
  return {
    javascript: [...new Map(javascript.filter(sameOrigin).map((url) => [url.href, url])).values()],
    stylesheets: [...new Map(stylesheets.filter(sameOrigin).map((url) => [url.href, url])).values()],
  };
}

async function checkRequest(url, fetchImpl, log, failures) {
  const requestUrl = url.href;
  try {
    const response = await fetchImpl(requestUrl, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      const message = `GET ${requestUrl} failed: HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}`;
      log(`FAIL ${message}`);
      failures.push(message);
      return null;
    }
    log(`PASS GET ${requestUrl} (${response.status})`);
    return response;
  } catch (error) {
    const message = `GET ${requestUrl} failed: ${error.message}`;
    log(`FAIL ${message}`);
    failures.push(message);
    return null;
  }
}

export async function checkPublishedSite(
  siteUrl,
  { fetchImpl = fetch, log = console.log } = {},
) {
  const homeUrl = normalizeSiteUrl(siteUrl);
  const failures = [];
  const homeResponse = await checkRequest(homeUrl, fetchImpl, log, failures);
  if (!homeResponse) {
    throw new Error(failures.join("\n"));
  }

  const pageUrl = new URL(homeResponse.url || homeUrl.href);
  const html = await homeResponse.text();
  const assets = extractGeneratedAssets(html, pageUrl);

  for (const [kind, urls] of [
    ["JavaScript", assets.javascript],
    ["CSS", assets.stylesheets],
  ]) {
    if (urls.length === 0) {
      const message = `GET ${pageUrl.href} returned HTML without a same-origin generated ${kind} asset reference`;
      log(`FAIL ${message}`);
      failures.push(message);
      continue;
    }
    for (const url of urls) {
      await checkRequest(url, fetchImpl, log, failures);
    }
  }

  if (failures.length > 0) {
    throw new Error(failures.join("\n"));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args[0] === "--") args.shift();
  const target = args[0] || process.env.VERCEL_URL;
  try {
    await checkPublishedSite(target);
    console.log("Published shipping-container site smoke check passed.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
