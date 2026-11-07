// Serves the Four One Five Visuals page at fouronefivevisuals.com.
// All other hosts fall through to the static assets (Dark Park Media site).
const FOFV_HOSTS = new Set(["fouronefivevisuals.com", "www.fouronefivevisuals.com"]);
const FOFV_PAGE = "/four-one-five-visuals";
// Service and town pages (files in /415/, built by sites/fofv-seo-pages/build.py).
const FOFV_PAGES = new Set([
  "real-estate-photography", "listing-films", "drone-aerial-photography", "property-websites",
  "mill-valley", "ross", "tiburon", "san-rafael", "san-anselmo", "fairfax", "greenbrae",
  "kentfield", "sausalito", "san-francisco",
  // Listing pages (files in /415/work/).
  "work", "work/33-shell-road", "work/126-winding-way", "work/88-lucas-park-drive", "work/7-francisco-vista-court",
]);
// Dark Park pages: on the 415 host these forward home to darkpark.media so no
// second indexable copy exists. Anything else not listed below is a 404 there.
const DARKPARK_PAGES = new Set(["index", "bay-aerials", "motion-marketing", "resume", "reel"]);
// Static files the 415 pages are allowed to load from the shared asset tree.
const FOFV_STATIC = /^\/(assets|css|js)\//;

const NOT_FOUND = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found · Four One Five Visuals</title><meta name="robots" content="noindex"><link rel="icon" href="/assets/icons/icon-32.png" type="image/png"><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f4efe7;color:#14110e;font:400 17px/1.6 system-ui,sans-serif;text-align:center;padding:24px}h1{font:300 italic 40px/1.1 "Iowan Old Style",Georgia,serif;margin:0 0 12px}a{color:#a5603a}</style></head><body><div><h1>That page isn't here.</h1><p>Try the <a href="/">homepage</a>, <a href="/real-estate-photography">photography</a>, <a href="/listing-films">listing films</a> or <a href="https://order.fouronefivevisuals.com">book a shoot</a>.</p></div></body></html>`;

const LLMS_TXT = `# Four One Five Visuals

> Real estate photography, listing films, drone aerials, twilight and property websites for agents in Marin County and San Francisco, California. A brand of Dark Park Media LLC.

- Photos are delivered within 24 hours of the shoot, at MLS and print sizes.
- Listing films (60 to 120 seconds) are delivered within 5 days, branded and unbranded, with vertical cuts for social.
- Drone photos up to 100 megapixels and 6K aerial video, flown under FAA Part 107.
- Real and virtual twilight, floor plans, property websites, social reels, brochures, listing copy, agent intros and virtual staging are available on the same visit.
- Booking, pricing (set by the home's square footage), scheduling and delivery happen in the online portal: https://order.fouronefivevisuals.com
- Contact: text 415.425.2955 or email contact@fouronefivevisuals.com

## Pages
- Home: https://fouronefivevisuals.com/
- Real estate photography: https://fouronefivevisuals.com/real-estate-photography
- Listing films: https://fouronefivevisuals.com/listing-films
- Drone and aerial photography: https://fouronefivevisuals.com/drone-aerial-photography
- Property websites: https://fouronefivevisuals.com/property-websites
- Towns served: Mill Valley, Ross, Tiburon, San Rafael, San Anselmo, Fairfax, Greenbrae, Kentfield, Sausalito, San Francisco (each at https://fouronefivevisuals.com/<town-slug>)
`;

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
    const res = await routeFofv(url, request, env);
    return withHeaders(res, url);
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

  return withHeaders(await env.ASSETS.fetch(request), url);
}

// HSTS on every page; a day of browser cache on static files (they are
// sometimes replaced in place, so not immutable).
function withHeaders(res, url) {
  const out = new Response(res.body, res);
  out.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  if (res.ok && FOFV_STATIC.test(url.pathname)) {
    out.headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
  }
  return out;
}

async function routeFofv(url, request, env) {
  {
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
    if (url.pathname === "/llms.txt") {
      return new Response(LLMS_TXT, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" } });
    }
    if (url.pathname === "/favicon.ico") {
      url.pathname = "/assets/icons/icon-32.png";
      return env.ASSETS.fetch(new Request(url, request));
    }
    if (url.pathname === "/site.webmanifest" || FOFV_STATIC.test(url.pathname)) {
      return env.ASSETS.fetch(request);
    }
    // A Dark Park page asked for on the 415 host: send it home rather than
    // serve a second copy. Everything else on this host does not exist.
    const base = slug.replace(/\.html$/, "") || "index";
    if (DARKPARK_PAGES.has(base)) {
      return Response.redirect("https://darkpark.media" + (base === "index" ? "/" : "/" + base), 301);
    }
    return new Response(NOT_FOUND, { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
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
