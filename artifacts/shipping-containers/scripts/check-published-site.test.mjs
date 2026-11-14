import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, test } from "node:test";
import { checkPublishedSite } from "./check-published-site.mjs";

let server;
let siteUrl;
let requests;

before(async () => {
  server = createServer((request, response) => {
    requests.push(request.url);
    if (request.url === "/") {
      response.writeHead(200, { "content-type": "text/html" });
      response.end(
        '<html><head><link rel="stylesheet" href="/assets/site.css"></head><body><script type="module" src="/assets/site.js"></script></body></html>',
      );
      return;
    }
    if (request.url === "/assets/site.js") {
      response.writeHead(200, { "content-type": "text/javascript" });
      response.end("console.log('ok')");
      return;
    }
    if (request.url === "/assets/site.css") {
      response.writeHead(200, { "content-type": "text/css" });
      response.end("body { color: black; }");
      return;
    }
    response.writeHead(404);
    response.end("Not found");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  siteUrl = `http://127.0.0.1:${server.address().port}/`;
});

after(async () => {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

test("checks the homepage and generated JavaScript and CSS", async () => {
  requests = [];
  const output = [];
  await checkPublishedSite(siteUrl, { log: (line) => output.push(line) });

  assert.deepEqual(requests, ["/", "/assets/site.js", "/assets/site.css"]);
  assert.equal(output.length, 3);
  assert.ok(output.every((line) => line.startsWith("PASS GET ")));
});

test("reports the exact asset request that fails", async () => {
  requests = [];
  const output = [];
  const failingFetch = async (url, options) => {
    if (url.endsWith("/assets/site.css")) {
      return new Response("Unavailable", {
        status: 503,
        statusText: "Service Unavailable",
      });
    }
    return fetch(url, options);
  };

  await assert.rejects(
    checkPublishedSite(siteUrl, {
      fetchImpl: failingFetch,
      log: (line) => output.push(line),
    }),
    /GET http:\/\/127\.0\.0\.1:\d+\/assets\/site\.css failed: HTTP 503 Service Unavailable/,
  );
  assert.ok(output.some((line) => line.includes("/assets/site.css failed: HTTP 503")));
});

test("reports an unsuccessful homepage request", async () => {
  requests = [];
  const output = [];
  await assert.rejects(
    checkPublishedSite(siteUrl, {
      fetchImpl: async () => new Response("Unavailable", { status: 502 }),
      log: (line) => output.push(line),
    }),
    /GET http:\/\/127\.0\.0\.1:\d+\/ failed: HTTP 502/,
  );
  assert.equal(output.length, 1);
  assert.ok(output[0].includes("GET ") && output[0].includes("HTTP 502"));
});

test("requires a URL when no deployment target is configured", async () => {
  await assert.rejects(
    checkPublishedSite(undefined),
    /Pass the published site URL as an argument or set VERCEL_URL/,
  );
});
