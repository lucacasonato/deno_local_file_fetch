import { contentType } from "https://deno.land/std@0.168.0/media_types/mod.ts";
import { iterateReader } from "https://deno.land/std@0.168.0/streams/iterate_reader.ts";

const originalfetch = globalThis.fetch;

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
        for await (const chunk of iterateReader(file)) {
          controller.enqueue(chunk.slice(0));
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
    const extension = url.pathname.substring(url.pathname.lastIndexOf("."));
    const contentTypeHeader = contentType(extension);
    if (contentTypeHeader) {
      headers.set("content-type", contentTypeHeader);
    }
    const info = await Deno.stat(url);
    if (info.mtime) {
      headers.set("last-modified", info.mtime.toUTCString());
    }

    // Create 200 streaming response
    const response = new Response(body, { status: 200, headers });
    Object.defineProperty(response, "url", {
      get() {
        return url;
      },
      configurable: true,
      enumerable: true,
    });
    return response;
  }

  return originalfetch(input, init);
}

export { fetch };
