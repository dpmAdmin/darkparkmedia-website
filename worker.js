// Serves the Four One Five Visuals page at fouronefivevisuals.com.
// All other hosts fall through to the static assets (Dark Park Media site).
const FOFV_HOSTS = new Set(["fouronefivevisuals.com", "www.fouronefivevisuals.com"]);
const FOFV_PAGE = "/four-one-five-visuals";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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

    // The 415 page lives on its own domain; send old darkpark.media paths there.
    if (url.pathname === FOFV_PAGE || url.pathname === FOFV_PAGE + ".html") {
      return Response.redirect("https://fouronefivevisuals.com/", 301);
    }

    return env.ASSETS.fetch(request);
  },
};
