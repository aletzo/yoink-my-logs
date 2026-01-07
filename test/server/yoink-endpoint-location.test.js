import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import http from "http";
import fs from "fs";
import path from "path";
import { setupTestDir, logDir, getLogLines, wait } from "../helpers.js";

// Set up temp directory before any imports
setupTestDir();

describe("/yoink endpoint location handling", () => {
  let server;
  let port = 7340;

  function request(options, body) {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: "localhost",
          port,
          ...options,
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              resolve({
                status: res.statusCode,
                headers: res.headers,
                data: JSON.parse(data),
              });
            } catch {
              resolve({ status: res.statusCode, headers: res.headers, data });
            }
          });
        }
      );
      req.on("error", reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  before(async () => {
    process.env.YOINK_PORT = port;
    const { startServer } = await import(`../../server.js?t=${Date.now()}`);

    await new Promise((resolve, reject) => {
      server = http.createServer(async (req, res) => {
        const { handleYoink, handleYoinkPreflight } = await import(
          `../../server.js?t=${Date.now()}`
        );
        const parsed = new URL(req.url, `http://localhost:${port}`);

        if (parsed.pathname === "/yoink" && req.method === "OPTIONS") {
          handleYoinkPreflight(res);
        } else if (parsed.pathname === "/yoink" && req.method === "POST") {
          handleYoink(req, res);
        } else {
          res.writeHead(404);
          res.end();
        }
      });

      server.listen(port, resolve);
      server.on("error", reject);
    });
  });

  after(() => {
    if (server) server.close();
  });

  test("accepts log with location field", async () => {
    const testId = `location-test-${Date.now()}`;

    const res = await request(
      {
        path: "/yoink",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        message: testId,
        data: { test: true },
        location: { relativePath: "test.js", line: 42 },
      }
    );

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);

    await wait(100);

    const lines = getLogLines();
    const log = lines
      .map((l) => JSON.parse(l))
      .find((l) => l.message === testId);

    assert.ok(log, "log should be written");
    assert.ok(log.location, "log should have location");
    assert.strictEqual(log.location.relativePath, "test.js");
    assert.strictEqual(log.location.line, 42);
  });

  test("accepts log with absolutePath in location", async () => {
    const testId = `fullpath-test-${Date.now()}`;

    const res = await request(
      {
        path: "/yoink",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        message: testId,
        location: {
          relativePath: "app.js",
          line: 100,
          absolutePath: "/Users/test/project/src/app.js",
        },
      }
    );

    assert.strictEqual(res.status, 200);

    await wait(100);

    const lines = getLogLines();
    const log = lines
      .map((l) => JSON.parse(l))
      .find((l) => l.message === testId);

    assert.ok(log.location);
    assert.strictEqual(log.location.relativePath, "app.js");
    assert.strictEqual(log.location.line, 100);
  });

  test("accepts log without location field", async () => {
    const testId = `no-location-${Date.now()}`;

    const res = await request(
      {
        path: "/yoink",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { message: testId, data: { test: true } }
    );

    assert.strictEqual(res.status, 200);

    await wait(100);

    const lines = getLogLines();
    const log = lines
      .map((l) => JSON.parse(l))
      .find((l) => l.message === testId);

    assert.ok(log, "log should be written");
    // Location might be undefined, which is fine
  });

  test("validates location has required fields", async () => {
    const testId = `invalid-location-${Date.now()}`;

    // Location without line should not include location in log
    const res = await request(
      {
        path: "/yoink",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        message: testId,
        location: { relativePath: "test.js" }, // missing line
      }
    );

    assert.strictEqual(res.status, 200);

    await wait(100);

    const lines = getLogLines();
    const log = lines
      .map((l) => JSON.parse(l))
      .find((l) => l.message === testId);

    assert.ok(log);
    // Location should not be included if it's incomplete
    assert.strictEqual(
      log.location,
      undefined,
      "incomplete location should not be stored"
    );
  });

  test("sanitizes location.relativePath to string", async () => {
    const testId = `sanitize-file-${Date.now()}`;

    const res = await request(
      {
        path: "/yoink",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        message: testId,
        location: { relativePath: 123, line: 42 }, // file should be string
      }
    );

    assert.strictEqual(res.status, 200);

    await wait(100);

    const lines = getLogLines();
    const log = lines
      .map((l) => JSON.parse(l))
      .find((l) => l.message === testId);

    assert.ok(log.location);
    assert.strictEqual(
      log.location.relativePath,
      "123",
      "relativePath should be converted to string"
    );
  });

  test("sanitizes location.line to number", async () => {
    const testId = `sanitize-line-${Date.now()}`;

    const res = await request(
      {
        path: "/yoink",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        message: testId,
        location: { relativePath: "test.js", line: "42" }, // line as string
      }
    );

    assert.strictEqual(res.status, 200);

    await wait(100);

    const lines = getLogLines();
    const log = lines
      .map((l) => JSON.parse(l))
      .find((l) => l.message === testId);

    assert.ok(log.location);
    assert.strictEqual(
      log.location.line,
      42,
      "line should be converted to number"
    );
    assert.strictEqual(typeof log.location.line, "number");
  });

  test("location with browser-style inline path", async () => {
    const testId = `browser-inline-${Date.now()}`;

    const res = await request(
      {
        path: "/yoink",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        message: testId,
        location: {
          relativePath: "localhost:8080 (inline)",
          line: 158,
          absolutePath: "http://localhost:8080/",
        },
      }
    );

    assert.strictEqual(res.status, 200);

    await wait(100);

    const lines = getLogLines();
    const log = lines
      .map((l) => JSON.parse(l))
      .find((l) => l.message === testId);

    assert.ok(log.location);
    assert.strictEqual(log.location.relativePath, "localhost:8080 (inline)");
    assert.strictEqual(log.location.line, 158);
  });
});
