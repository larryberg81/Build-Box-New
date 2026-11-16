import assert from "node:assert/strict";
import { IncomingMessage, ServerResponse } from "node:http";
import { Duplex } from "node:stream";
import app from "../../api/[...path].mjs";

// Exercise the actual deployed entry in memory, without opening a port or
// sending email. Invalid submissions return before SMTP is consulted.
async function invoke(method, url, body) {
  const chunks = [];
  const socket = new Duplex({
    read() {},
    write(chunk, encoding, callback) {
      chunks.push(Buffer.from(chunk));
      callback();
    },
  });
  const request = new IncomingMessage(socket);
  request.method = method;
  request.url = url;
  const payload = body === undefined ? undefined : JSON.stringify(body);
  request.headers = payload === undefined ? {} : {
    "content-type": "application/json",
    "content-length": String(Buffer.byteLength(payload)),
  };
  const response = new ServerResponse(request);
  response.assignSocket(socket);
  let timer;
  const finished = new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`API request timed out: ${url}`)), 3000);
    response.once("finish", resolve);
    response.once("error", reject);
  });
  try {
    app(request, response);
    if (payload !== undefined) request.push(payload);
    request.push(null);
    await finished;
    const raw = Buffer.concat(chunks).toString("utf8");
    return {
      status: response.statusCode,
      body: JSON.parse(raw.slice(raw.indexOf("\r\n\r\n") + 4)),
    };
  } finally {
    clearTimeout(timer);
    socket.destroy();
  }
}

assert.equal(typeof app, "function");
const health = await invoke("GET", "/api/healthz");
assert.equal(health.status, 200);
assert.deepEqual(health.body, { status: "ok" });
const invalid = await invoke("POST", "/api/contact", {});
assert.equal(invalid.status, 400);
assert.equal(invalid.body.success, false);
const missingDelivery = await invoke("POST", "/api/contact", {
  name: "API validation",
  email: "validation@example.com",
  container: "20 ft",
});
assert.equal(missingDelivery.status, 400);
assert.match(missingDelivery.body.error, /Delivery city and ZIP or postal code/);
console.log("Vercel API entry verified: health and contact validation passed; no email sent.");
