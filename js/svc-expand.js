/* DARK PARK MEDIA — expandable service tiles (Four One Five Visuals)
   Tap a tile: it grows 175% anchored at its own top-left corner and lifts
   above its neighbors (which stay put — the expanded tile simply overlaps
   them), and a placeholder-reel carousel fades in. Carousel auto-scroll
   starts fast and eases to a slow idle speed as the tile finishes opening —
   both driven off the same per-tile "progress" value so they stay in sync. */
(function () {
  "use strict";

  var grid = document.querySelector(".svc-grid--expand");
  if (!grid) return;

  var tileEls = [].slice.call(grid.querySelectorAll(".svc--expandable"));
  if (!tileEls.length) return;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var SCALE = 1.75;
  var CAROUSEL_HEIGHT = 130; // base px, pre-scale
  var FAST_SPEED = 260; // px/sec at progress 0
  var SLOW_SPEED = 28; // px/sec at progress 1 (steady idle auto-scroll)
  var LERP = reducedMotion ? 1 : 0.16;

  var expanded = null; // currently expanded tile object, or null
  var running = false;

  function tick(fn) {
    if (document.hidden) { setTimeout(function () { fn(performance.now()); }, 16); }
    else { requestAnimationFrame(fn); }
  }

  var tiles = tileEls.map(function (el) {
    var track = el.querySelector(".svc-carousel-track");
    var cards = [].slice.call(track.children);
    var cardGap = parseFloat(getComputedStyle(track).gap) || 10;

    // Cards are sized by `height: 100%` of the carousel, which is itself
    // still animating from 0 up to CAROUSEL_HEIGHT while this runs — so
    // their rendered width is a moving target, not something safe to
    // measure via getBoundingClientRect (measuring early would freeze in a
    // near-zero value). Compute each card's eventual width directly from
    // its declared aspect ratio and the carousel's fixed target height
    // instead, so the loop's wraparound math is correct from frame one.
    var setWidth = 0;
    cards.forEach(function (c) {
      var ratio = c.classList.contains("ratio-9-16") ? 9 / 16 : 16 / 9;
      setWidth += CAROUSEL_HEIGHT * ratio + cardGap;
    });

    // Duplicate the card set once so the marquee can loop seamlessly.
    cards.forEach(function (c) { track.appendChild(c.cloneNode(true)); });

    return {
      el: el,
      carousel: el.querySelector(".svc-carousel"),
      track: track,
      prevBtn: el.querySelector(".svc-carousel-arrow.prev"),
      nextBtn: el.querySelector(".svc-carousel-arrow.next"),
      cardCount: cards.length,
      setWidth: setWidth,
      scale: 1,
      scaleTarget: 1,
      offset: 0,
      manualTarget: null,
      dragging: false,
      dragStartX: 0,
      dragStartOffset: 0,
      userInteracted: false
    };
  });

  function progressOf(t) {
    return Math.min(1, Math.max(0, (t.scale - 1) / (SCALE - 1)));
  }

  function setExpanded(target) {
    if (expanded === target) return;
    if (expanded) {
      expanded.el.classList.remove("svc-is-expanded");
      expanded.el.setAttribute("aria-expanded", "false");
      expanded.carousel.setAttribute("aria-hidden", "true");
      expanded.prevBtn.tabIndex = -1;
      expanded.nextBtn.tabIndex = -1;
    }
    expanded = target;
    if (expanded) {
      expanded.el.classList.add("svc-is-expanded");
      expanded.el.setAttribute("aria-expanded", "true");
      expanded.carousel.setAttribute("aria-hidden", "false");
      expanded.prevBtn.tabIndex = 0;
      expanded.nextBtn.tabIndex = 0;
      expanded.userInteracted = false;
    }
    tiles.forEach(function (t) { t.scaleTarget = t === expanded ? SCALE : 1; });
    startLoop();
  }

  function advanceCarousel(t, dt) {
    var prog = progressOf(t);
    if (prog <= 0.001 && t.offset === 0 && !t.dragging && t.manualTarget === null) return;

    if (t.dragging) {
      // position already set directly in the pointer handler
    } else if (t.manualTarget !== null) {
      var mk = reducedMotion ? 1 : 1 - Math.pow(1 - 0.22, dt * 60);
      t.offset += (t.manualTarget - t.offset) * mk;
      if (Math.abs(t.manualTarget - t.offset) < 0.5) {
        t.offset = t.manualTarget;
        t.manualTarget = null;
      }
    } else if (!reducedMotion && !t.userInteracted && prog > 0.001) {
      var speed = FAST_SPEED + (SLOW_SPEED - FAST_SPEED) * prog;
      t.offset -= speed * dt;
    }

    if (t.offset <= -t.setWidth) t.offset += t.setWidth;
    if (t.offset > 0) t.offset -= t.setWidth;
    t.track.style.transform = "translateX(" + t.offset + "px)";
  }

  var lastTime = 0;
  function loop(now) {
    var dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 0.016;
    lastTime = now;

    // Time-corrected lerp factor so convergence speed is independent of the
    // actual frame rate (matters when rAF is throttled, e.g. background tabs).
    var k = reducedMotion ? 1 : 1 - Math.pow(1 - LERP, dt * 60);

    var anyActive = false;
    tiles.forEach(function (t) {
      t.scale += (t.scaleTarget - t.scale) * k;
      if (Math.abs(t.scaleTarget - t.scale) < 0.001) t.scale = t.scaleTarget;

      var prog = progressOf(t);
      t.carousel.style.height = (prog * CAROUSEL_HEIGHT) + "px";
      t.carousel.style.opacity = prog;
      t.prevBtn.style.opacity = prog > 0.6 ? "1" : "0";
      t.nextBtn.style.opacity = prog > 0.6 ? "1" : "0";
      t.prevBtn.style.pointerEvents = prog > 0.6 ? "auto" : "none";
      t.nextBtn.style.pointerEvents = prog > 0.6 ? "auto" : "none";

      t.el.style.transform = t.scale !== 1 ? "scale(" + t.scale + ")" : "";

      advanceCarousel(t, dt);

      if (t.scaleTarget !== t.scale || prog > 0.001 || t.offset !== 0 || t.manualTarget !== null) {
        anyActive = true;
      }
    });

    if (anyActive) {
      tick(loop);
    } else {
      running = false;
      lastTime = 0;
    }
  }

  function startLoop() {
    if (running) return;
    running = true;
    lastTime = 0;
    tick(loop);
  }

  tiles.forEach(function (t) {
    t.el.addEventListener("click", function (e) {
      if (e.target.closest(".svc-carousel")) return;
      setExpanded(expanded === t ? null : t);
    });
    t.el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setExpanded(expanded === t ? null : t);
      } else if (e.key === "Escape" && expanded === t) {
        setExpanded(null);
      }
    });
    if (canHover) {
      t.el.addEventListener("mouseleave", function () {
        if (expanded === t) setExpanded(null);
      });
    }

    ["pointerdown", "click"].forEach(function (evt) {
      t.carousel.addEventListener(evt, function (e) { e.stopPropagation(); });
    });

    t.prevBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      t.userInteracted = true;
      t.manualTarget = (t.manualTarget !== null ? t.manualTarget : t.offset) + (t.setWidth / t.cardCount);
    });
    t.nextBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      t.userInteracted = true;
      t.manualTarget = (t.manualTarget !== null ? t.manualTarget : t.offset) - (t.setWidth / t.cardCount);
    });

    t.track.addEventListener("pointerdown", function (e) {
      t.dragging = true;
      t.userInteracted = true;
      t.manualTarget = null;
      t.dragStartX = e.clientX;
      t.dragStartOffset = t.offset;
      t.track.setPointerCapture(e.pointerId);
      startLoop();
    });
    t.track.addEventListener("pointermove", function (e) {
      if (!t.dragging) return;
      t.offset = t.dragStartOffset + (e.clientX - t.dragStartX);
      t.track.style.transform = "translateX(" + t.offset + "px)";
    });
    ["pointerup", "pointercancel"].forEach(function (evt) {
      t.track.addEventListener(evt, function () { t.dragging = false; });
    });
  });

  document.addEventListener("click", function (e) {
    if (expanded && !e.target.closest(".svc--expandable")) setExpanded(null);
  });
})();
