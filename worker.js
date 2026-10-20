// Serves the Four One Five Visuals page at fouronefivevisuals.com.
// All other hosts fall through to the static assets (Dark Park Media site).
const FOFV_HOSTS = new Set(["fouronefivevisuals.com", "www.fouronefivevisuals.com"]);
const FOFV_PAGE = "/four-one-five-visuals";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Listing films are too big for site files (25 MiB cap); they live in the
    // fofv-media R2 bucket and stream from /media/<listing>/<file>.
    const media = url.pathname.match(/^\/media\/([a-z0-9-]+\/[\w.-]+)$/);
    if (media) return serveMedia(env, media[1], request);

    if (FOFV_HOSTS.has(url.hostname)) {
      if (url.hostname.startsWith("www.")) {
        url.hostname = "fouronefivevisuals.com";
        return Response.redirect(url.toString(), 301);
      }
      if (url.pathname === FOFV_PAGE || url.pathname === FOFV_PAGE + ".html") {
        url.pathname = "/";
        return Response.redirect(url.toString(), 301);
      }
      if (url.pathname === "/") {
        url.pathname = FOFV_PAGE;
        return env.ASSETS.fetch(new Request(url, request));
      }
    }

    if (url.hostname === "www.darkpark.media") {
      url.hostname = "darkpark.media";
      return Response.redirect(url.toString(), 301);
    }

    // The 415 page lives on its own domain; send old darkpark.media paths there.
    if (url.pathname === FOFV_PAGE || url.pathname === FOFV_PAGE + ".html") {
      return Response.redirect("https://fouronefivevisuals.com/", 301);
    }

    return env.ASSETS.fetch(request);
  },
};

// A film from R2, with Range support so browsers can seek and start playing at once.
async function serveMedia(env, key, request) {
  const range = request.headers.get("Range");
  const obj = await env.MEDIA.get(key, range ? { range: request.headers } : {});
  if (!obj) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("ETag", obj.httpEtag);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "public, max-age=604800");
  if (range && obj.range) {
    const start = obj.range.offset ?? 0;
    const end = start + (obj.range.length ?? obj.size - start) - 1;
    headers.set("Content-Range", `bytes ${start}-${end}/${obj.size}`);
    headers.set("Content-Length", String(end - start + 1));
    return new Response(obj.body, { status: 206, headers });
  }
  headers.set("Content-Length", String(obj.size));
  return new Response(obj.body, { headers });
}
