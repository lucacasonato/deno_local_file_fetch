import "./polyfill.ts";
import { assertEquals } from "https://deno.land/std@0.97.0/testing/asserts.ts";
import { toFileUrl } from "https://deno.land/std@0.97.0/path/mod.ts";

Deno.test("fetch local file URL", async () => {
  const req = await fetch(new URL("./fixtures/test.json", import.meta.url));
  assertEquals(req.status, 200);
  assertEquals(
    req.headers.get("content-type"),
    "application/json; charset=UTF-8",
  );
  const json = await req.json();
  assertEquals(json, { hello: "world" });
});

Deno.test("fetch local file URL (larger)", async () => {
  const lorem = (await Deno.readTextFile("./fixtures/lorem.txt")).repeat(32);
  const tmp = await Deno.makeTempFile();
  await Deno.writeTextFile(tmp, lorem);

  const response = await fetch(toFileUrl(tmp));
  const text = await response.text();
  await Deno.remove(tmp);
  assertEquals(text, lorem);
});

Deno.test("fetch 1MB file", async () => {
  const { size } = await Deno.stat("fixtures/1MB.file");
  const response = await fetch(new URL("./fixtures/1MB.file", import.meta.url));
  const file = await response.blob();

  assertEquals(size, file.size);
});
