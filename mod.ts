import { lookup } from "https://deno.land/x/media_types@v2.5.2/mod.ts";

const originalfetch = window.fetch;

async function fetch(
  input: string | Request | URL,
  init?: RequestInit,
): Promise<Response> {
  const url = typeof input === "string"
    ? new URL(input)
    : input instanceof Request
    ? new URL(input.url)
    : input;

  if (url.protocol === "file:") {
    // Only allow GET requests
    if (init && init.method && init.method !== "GET") {
      throw new TypeError(
        `${init.method} is not a supported method for file:// URLs.`,
      );
    }

    // Open the file, and convert to ReadableStream
    const file = await Deno.open(url, { read: true }).catch((err) => {
      if (err instanceof Deno.errors.NotFound) {
        return undefined;
      } else {
        throw err;
      }
    });
    if (!file) {
      return new Response("404 not found", { status: 404 });
    }
    const body = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        for await (const chunk of Deno.iter(file)) {
          controller.enqueue(chunk);
        }
        file.close();
        controller.close();
      },
      cancel() {
        file.close();
      },
    });

    // Get meta information
    const headers = new Headers();
    const contentType = lookup(url.pathname);
    if (contentType) {
      headers.set("content-type", contentType);
    }
    const info = await Deno.stat(url);
    if (info.mtime) {
      headers.set("last-modified", info.mtime.toUTCString());
    }

    // Create 200 streaming response
    return new Response(body, { status: 200, headers });
  }

  return originalfetch(input, init);
}

export { fetch };
