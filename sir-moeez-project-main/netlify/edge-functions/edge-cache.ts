export default async (request: Request, context: any) => {
  const url = new URL(request.url);
  const { pathname } = url;

  // Only cache GET requests for static assets and data files
  const isGet = request.method === "GET";
  const isAsset =
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/datafiles/") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".woff2");

  const response = await context.next();

  if (isGet && isAsset) {
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  // Avoid caching HTML and APIs
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
