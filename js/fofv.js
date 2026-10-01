/* FOUR ONE FIVE VISUALS - page-specific interaction
   1. Nav frosts and the scroll hint hides once the page starts moving;
      the hero brand block fades and lifts as the content rides over it.
   2. Rolling fog over the hero still: three tileable noise sprites
      (generated once, off the main path) drift across a canvas at
      different speeds, sizes and opacities. Nothing is scrubbed - the
      still holds and the fog moves, the way the reference site's clouds
      pass behind its logo.
   3. The inquiry card composes a mailto so the static site needs no
      backend. */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- scroll state ---------------- */
  var nav = document.querySelector(".nav");
  var hint = document.querySelector(".scroll-hint");
  var brand = document.querySelector(".hero-brand");
  var scrolledPast = false; // true once the hero is fully covered by the page

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (nav) nav.classList.toggle("is-solid", y > 40);
    if (hint) hint.classList.toggle("is-hidden", y > 40);
    if (brand && !reducedMotion) {
      var p = Math.min(1, y / (window.innerHeight * 0.55));
      brand.style.opacity = String(1 - p);
      brand.style.transform = "translateY(" + (-p * 44) + "px)";
    }
    scrolledPast = y > window.innerHeight * 1.15;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------- rolling fog ---------------- */
  var canvas = document.querySelector(".hero-fog");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");

    // Small deterministic PRNG so the fog looks the same on every load.
    function rng(seed) {
      return function () {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };
    }
    function smooth(t) { return t * t * (3 - 2 * t); }

    // Tileable value-noise fbm rendered to white-with-alpha. Each octave
    // uses its own wrap-around lattice so the sprite repeats seamlessly
    // in both axes and can be scrolled forever.
    function makeSprite(size, seed, cells, octaves, lo, hi) {
      var r = rng(seed);
      var lattices = [];
      for (var o = 0; o < octaves; o++) {
        var n = cells << o;
        var arr = new Float32Array(n * n);
        for (var i = 0; i < n * n; i++) arr[i] = r();
        lattices.push({ n: n, v: arr });
      }
      function noise(l, x, y) {
        var n = l.n;
        var xi = Math.floor(x), yi = Math.floor(y);
        var xf = smooth(x - xi), yf = smooth(y - yi);
        var x0 = xi % n, x1 = (xi + 1) % n, y0 = yi % n, y1 = (yi + 1) % n;
        var a = l.v[y0 * n + x0], b = l.v[y0 * n + x1];
        var c = l.v[y1 * n + x0], d = l.v[y1 * n + x1];
        return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
      }
      var c = document.createElement("canvas");
      c.width = c.height = size;
      var cx = c.getContext("2d");
      var img = cx.createImageData(size, size);
      var data = img.data;
      for (var y = 0; y < size; y++) {
        for (var x = 0; x < size; x++) {
          var v = 0, amp = 1, sum = 0;
          for (var k = 0; k < octaves; k++) {
            var l = lattices[k];
            v += noise(l, (x / size) * l.n, (y / size) * l.n) * amp;
            sum += amp;
            amp *= 0.5;
          }
          v /= sum;
          var a2 = Math.min(1, Math.max(0, (v - lo) / (hi - lo)));
          a2 = smooth(a2);
          var p = (y * size + x) * 4;
          data[p] = 255; data[p + 1] = 255; data[p + 2] = 255;
          data[p + 3] = Math.round(a2 * 255);
        }
      }
      cx.putImageData(img, 0, 0);
      return c;
    }

    var layers = [];
    var W = 0, H = 0;

    function resize() {
      // Canvas backing store at 1x - fog is soft by nature, and this keeps
      // the per-frame draw cheap on retina screens.
      W = canvas.width = Math.max(1, Math.round(canvas.clientWidth));
      H = canvas.height = Math.max(1, Math.round(canvas.clientHeight));
    }
    resize();
    window.addEventListener("resize", resize);

    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < layers.length; i++) {
        var L = layers[i];
        // Whole-pixel tile geometry: at fractional sizes or offsets the
        // scaled drawImage resamples across each tile boundary and leaves a
        // 1px seam where two tiles meet.
        var S = Math.round(H * L.scale);              // square tile edge
        // The sprites wrap in both axes, so lay the field down edge to edge
        // in x AND y. Tiling one row only leaves the sprite's top and bottom
        // as hard alpha cutoffs, and any layer shorter than the viewport
        // draws one of them straight across the frame.
        var ox = Math.round(((t * L.speed) % S + S) % S);   // drift, wraps either way
        var oy = H * L.y + Math.sin(t * 0.05 + i) * H * 0.02;
        oy = Math.round(((oy % S) + S) % S);                // vertical phase only
        ctx.globalAlpha = L.alpha;
        for (var y = oy - S; y < H; y += S) {
          for (var x = ox - 2 * S; x < W; x += S) {
            ctx.drawImage(L.sprite, x, y, S, S);
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    // rAF while visible; a slow timer when the tab is hidden or throttled
    // (embedded/preview contexts) so the fog never freezes on a blank
    // canvas. Skips the draw entirely once the page has covered the hero.
    var last = 0;
    var t = 0;
    function loop() {
      var now = performance.now();
      if (!scrolledPast) {
        var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
        t += dt;
        draw(t);
      }
      last = now;
      if (document.hidden) setTimeout(loop, 66);
      else requestAnimationFrame(loop);
    }

    function build() {
      // Three banks of fog: a broad slow bank low in the frame, a mid bank
      // drifting the other way, and a faster wisp layer up top.
      layers = [
        { sprite: makeSprite(512, 11, 4, 5, 0.42, 0.78), scale: 1.7, y: 0.62, speed: 11, alpha: 0.55 },
        { sprite: makeSprite(512, 29, 3, 5, 0.46, 0.80), scale: 2.3, y: 0.30, speed: -7, alpha: 0.42 },
        { sprite: makeSprite(512, 47, 6, 4, 0.50, 0.82), scale: 1.15, y: 0.18, speed: 19, alpha: 0.38 }
      ];
      draw(0);
      if (!reducedMotion) loop();
    }
    // Sprite generation is ~100ms of CPU; keep it off the first paint.
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(build, { timeout: 800 });
    } else {
      setTimeout(build, 120);
    }
  }

  /* ---------------- inquiry card → mailto ---------------- */
  var form = document.querySelector(".inquiry-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = form.elements;
      var name = [f.first.value, f.last.value].join(" ").trim();
      var lines = [
        "Name: " + name,
        "Email: " + f.email.value,
        "Phone: " + f.phone.value,
        "Property: " + f.address.value,
        "",
        "Tell us about the listing and your timeline:",
        ""
      ];
      var subject = "Shoot inquiry - Four One Five Visuals" + (f.address.value ? " - " + f.address.value : "");
      window.location.href = "mailto:" + form.getAttribute("data-to") +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(lines.join("\n"));
    });
  }
})();
