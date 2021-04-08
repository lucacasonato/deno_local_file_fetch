import "./polyfill.ts";
import { assertEquals } from "https://deno.land/std@0.92.0/testing/asserts.ts";

Deno.test("fetch local file URL", async () => {
  const req = await fetch(new URL("./fixtures/test.json", import.meta.url));
  assertEquals(req.status, 200);
  assertEquals(req.headers.get("content-type"), "application/json");
  const json = await req.json();
  assertEquals(json, { hello: "world" });
});
