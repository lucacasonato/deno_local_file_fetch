import "./polyfill.ts";
import { assertEquals } from "https://deno.land/std@0.91.0/testing/asserts.ts";

Deno.test("fetch local file URL", async () => {
  const req = await fetch(new URL("./fixtures/test.json", import.meta.url));
  assertEquals(req.status, 200);
  assertEquals(req.headers.get("content-type"), "application/json");
  const json = await req.json();
  assertEquals(json, { hello: "world" });
});

Deno.test("fetch 1MB file", async () => {
  const { size } = await Deno.stat("fixtures/1MB.file");
  const response = await fetch(new URL("./fixtures/1MB.file", import.meta.url));
  const file = await response.blob();

  assertEquals(size, file.size);
});
