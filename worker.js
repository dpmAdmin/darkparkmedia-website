// Serves the Four One Five Visuals page at fouronefivevisuals.com.
// All other hosts fall through to the static assets (Dark Park Media site).
const FOFV_HOSTS = new Set(["fouronefivevisuals.com", "www.fouronefivevisuals.com"]);
const FOFV_PAGE = "/four-one-five-visuals";
// Service and town pages (files in /415/, built by sites/fofv-seo-pages/build.py).
const FOFV_PAGES = new Set([
  "real-estate-photography", "listing-films", "drone-aerial-photography", "property-websites",
  "mill-valley", "ross", "tiburon", "san-rafael", "san-anselmo", "fairfax", "greenbrae",
  "kentfield", "sausalito", "san-francisco",
]);

export default {
  async fetch(request, env) {
    // A review copy (Worker "fofv-preview" on workers.dev, var PREVIEW) answers as the
    // 415 site on its own address and is never indexed.
    if (env.PREVIEW) {
      const res = await route(request, env, true);
      const out = new Response(res.body, res);
      out.headers.set("X-Robots-Tag", "noindex, nofollow");
      return out;
    }
    return route(request, env, false);
  },
};

async function route(request, env, preview) {
  const url = new URL(request.url);

  // Only one copy of each page: plain http always forwards to https.
  if (url.protocol === "http:") {
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  }

  // Listing films are too big for site files (25 MiB cap); they live in the
  // fofv-media R2 bucket and stream from /media/<listing>/<file>.
  const media = url.pathname.match(/^\/media\/([a-z0-9-]+\/[\w.-]+)$/);
  if (media) return serveMedia(env, media[1], request);

  if (preview || FOFV_HOSTS.has(url.hostname)) {
    if (url.hostname.startsWith("www.")) {
      url.hostname = "fouronefivevisuals.com";
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname === FOFV_PAGE || url.pathname === FOFV_PAGE + ".html") {
      url.pathname = "/";
      return Response.redirect(url.toString(), 301);
    }
    // The 415 site's own robots.txt and sitemap (darkpark.media keeps its own).
    if (url.pathname === "/robots.txt" || url.pathname === "/sitemap.xml") {
      url.pathname = url.pathname === "/robots.txt" ? "/fofv-robots.txt" : "/fofv-sitemap.xml";
      return env.ASSETS.fetch(new Request(url, request));
    }
    if (url.pathname === "/") {
      url.pathname = FOFV_PAGE;
      return env.ASSETS.fetch(new Request(url, request));
    }
    const slug = url.pathname.replace(/^\/|\/$/g, "");
    if (FOFV_PAGES.has(slug)) {
      if (url.pathname.endsWith("/")) {
        url.pathname = "/" + slug;
        return Response.redirect(url.toString(), 301);
      }
      url.pathname = "/415/" + slug;
      return env.ASSETS.fetch(new Request(url, request));
    }
    if (url.pathname.startsWith("/415/")) {
      url.pathname = url.pathname.slice(4).replace(/\.html$/, "");
      return Response.redirect(url.toString(), 301);
    }
    // The redesign went live 2026-10-21; the review address now points home.
    if (url.pathname === "/preview") {
      url.pathname = "/";
      return Response.redirect(url.toString(), 301);
    }
    // The pre-2026-10-21 page, kept for reference (noindex).
    if (url.pathname === "/previous") {
      url.pathname = "/fofv-previous";
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
  if (url.pathname.startsWith("/415/")) {
    return Response.redirect("https://fouronefivevisuals.com" + url.pathname.slice(4).replace(/\.html$/, ""), 301);
  }

  return env.ASSETS.fetch(request);
}

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
