/* DARK PARK MEDIA — interaction layer */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) document.body.classList.add("reduced-motion");

  // iOS Safari won't decode/render any frame of a video until play() has
  // actually fired at least once — setting currentTime alone (as the scroll
  // scrub loops do) shows nothing. Kick playback then immediately pause so
  // the decoder initializes and the first frame paints.
  function primeScrubVideo(video) {
    var p = video.play();
    if (p && p.catch) {
      p.then(function () { video.pause(); }).catch(function () {});
    } else {
      video.pause();
    }
  }

  // rAF when the tab is visible; timer fallback when hidden/throttled so
  // scroll-driven state stays correct (e.g. embedded/preview contexts).
  function tick(fn) {
    if (document.hidden) { setTimeout(fn, 66); }
    else { requestAnimationFrame(fn); }
  }

  /* ------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------ */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      document.body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("is-open");
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ------------------------------------------------------------------
     Aperture cursor (pointer: fine only, skipped under reduced motion)
     ------------------------------------------------------------------ */
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (finePointer && !reducedMotion) {
    document.body.classList.add("has-cursor");
    var ring = document.createElement("div");
    ring.className = "cursor-ring";
    var trail = document.createElement("div");
    trail.className = "cursor-trail";
    document.body.appendChild(trail);
    document.body.appendChild(ring);

    var mx = -100, my = -100, tx = -100, ty = -100;
    document.addEventListener("mousemove", function (e) {
      mx = e.clientX;
      my = e.clientY;
      ring.style.transform = "translate(" + (mx - 0) + "px," + (my - 0) + "px) translate(-50%,-50%)";
    });

    (function trailLoop() {
      tx += (mx - tx) * 0.16;
      ty += (my - ty) * 0.16;
      trail.style.transform = "translate(" + tx + "px," + ty + "px) translate(-50%,-50%)";
      tick(trailLoop);
    })();

    var INTERACTIVE = "a, button, summary, input, textarea, select, [role='button']";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest(INTERACTIVE)) {
        ring.classList.add("is-tight");
        trail.classList.add("is-tight");
      }
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest(INTERACTIVE)) {
        ring.classList.remove("is-tight");
        trail.classList.remove("is-tight");
      }
    });
  }

  /* ------------------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------------------ */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window && !reducedMotion) {
    var ioFired = false;
    var io = new IntersectionObserver(function (entries) {
      ioFired = true;
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
    // Safety net: if the observer never delivers its initial callback
    // (throttled/hidden/embedded rendering), show everything.
    setTimeout(function () {
      if (!ioFired) revealEls.forEach(function (el) { el.classList.add("is-in"); });
    }, 1500);
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ------------------------------------------------------------------
     Hero scroll-scrub
     Scrubs video.currentTime against scroll progress of .hero-scrub.
     Under reduced motion the section is one viewport tall and the video
     simply holds a frame (poster-like); no scrubbing occurs.
     ------------------------------------------------------------------ */
  var scrubSection = document.querySelector(".hero-scrub");
  var scrubVideo = document.querySelector(".hero-media video");
  var heroTag = document.querySelector(".hero-tag");
  var scrollHint = document.querySelector(".hero-scroll-hint");

  if (scrubSection && scrubVideo && !reducedMotion) {
    var duration = 0;
    var targetTime = 0;
    var renderedTime = -1;

    scrubVideo.addEventListener("loadedmetadata", function () {
      duration = scrubVideo.duration || 0;
      primeScrubVideo(scrubVideo);
      update();
    });
    // In case metadata is already available (cache)
    if (scrubVideo.readyState >= 1) {
      duration = scrubVideo.duration || 0;
      primeScrubVideo(scrubVideo);
    }

    function progress() {
      var rect = scrubSection.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      if (total <= 0) return 0;
      return Math.min(1, Math.max(0, -rect.top / total));
    }

    function update() {
      var p = progress();
      if (duration > 0) {
        // Leave a hair off the end to avoid the 'ended' frame flash
        targetTime = p * Math.max(0, duration - 0.05);
      }
      if (heroTag) heroTag.classList.toggle("is-visible", p > 0.55);
      if (scrollHint) scrollHint.classList.toggle("is-hidden", p > 0.05);
    }

    // Poll progress + smooth the seek in one rAF loop so wheel steps
    // don't stutter and scrubbing works even if scroll events are missed.
    (function scrubLoop() {
      update();
      if (duration > 0) {
        var next = renderedTime < 0 ? targetTime : renderedTime + (targetTime - renderedTime) * 0.22;
        if (Math.abs(next - renderedTime) > 0.001) {
          renderedTime = next;
          try { scrubVideo.currentTime = renderedTime; } catch (e) { /* not seekable yet */ }
        }
      }
      tick(scrubLoop);
    })();
  } else if (heroTag) {
    // Reduced motion: show the positioning line immediately.
    heroTag.classList.add("is-visible");
    if (scrollHint) scrollHint.classList.add("is-hidden");
    if (scrubVideo) scrubVideo.pause();
  }

  /* ------------------------------------------------------------------
     Manifesto beat — CAPTURE. CREATE. DELIVER.
     Each word reveals via opacity + blur as it scrolls into place, staggered
     so they settle one after another rather than all at once. Continuous
     and reversible (like the hero scrub), not a one-shot reveal.
     ------------------------------------------------------------------ */
  var beatSection = document.querySelector(".manifesto-beat");
  var beatMedia = beatSection ? beatSection.querySelector(".manifesto-beat-media") : null;
  var beatVideo = beatMedia ? beatMedia.querySelector("video") : null;
  var beatWords = beatSection ? beatSection.querySelectorAll(".beat-word") : [];
  if (beatSection && beatWords.length && !reducedMotion) {
    var BEAT_STAGGER = 0.25;
    // The reveal finishes by this fraction of the section's time on screen,
    // not at progress 1 — otherwise the last word only reaches full opacity
    // the instant the section exits the viewport, so it's never actually
    // readable. Leaves a dwell period where the full line sits visible.
    var BEAT_REVEAL_COMPLETE = 0.6;
    // Derived so the last word's window always ends exactly at that point,
    // regardless of word count.
    var BEAT_WINDOW = 1 - (beatWords.length - 1) * BEAT_STAGGER;
    var BEAT_MAX_BLUR = 10;

    var beatDuration = 0;
    var beatTargetTime = 0;
    var beatRenderedTime = -1;

    if (beatVideo) {
      beatVideo.addEventListener("loadedmetadata", function () {
        beatDuration = beatVideo.duration || 0;
        primeScrubVideo(beatVideo);
      });
      if (beatVideo.readyState >= 1) beatDuration = beatVideo.duration || 0;
      primeScrubVideo(beatVideo);
    }

    // Progress spans the section's entire time on screen: 0 the instant its
    // top edge appears at the bottom of the viewport, 1 the instant its
    // bottom edge exits at the top — so it's always scrubbing for as long as
    // any part of it is visible, never idling mid-scroll. No pinning — the
    // section just scrolls by like everything else, just slower if it's short.
    function beatProgress() {
      var rect = beatSection.getBoundingClientRect();
      var vh = window.innerHeight;
      var span = vh + rect.height;
      if (span <= 0) return 0;
      return Math.min(1, Math.max(0, (vh - rect.top) / span));
    }

    (function beatLoop() {
      var overall = beatProgress();
      var revealProgress = Math.min(1, overall / BEAT_REVEAL_COMPLETE);
      beatWords.forEach(function (w, i) {
        var start = i * BEAT_STAGGER;
        var p = Math.min(1, Math.max(0, (revealProgress - start) / BEAT_WINDOW));
        w.style.opacity = p;
        w.style.filter = "blur(" + ((1 - p) * BEAT_MAX_BLUR) + "px)";
      });
      // Side-scroll the drone footage across its horizontal overflow.
      if (beatMedia) {
        var panPx = beatMedia.offsetWidth - beatSection.offsetWidth;
        if (panPx > 0) beatMedia.style.transform = "translateX(" + (-panPx * overall) + "px)";
      }
      // Scrub the clip itself against the same progress — forward on the way
      // down, backward on the way up — same mechanism as the hero.
      if (beatDuration > 0) {
        beatTargetTime = overall * Math.max(0, beatDuration - 0.05);
        var next = beatRenderedTime < 0 ? beatTargetTime : beatRenderedTime + (beatTargetTime - beatRenderedTime) * 0.22;
        if (Math.abs(next - beatRenderedTime) > 0.001) {
          beatRenderedTime = next;
          try { beatVideo.currentTime = beatRenderedTime; } catch (e) { /* not seekable yet */ }
        }
      }
      tick(beatLoop);
    })();
  } else if (beatVideo) {
    beatVideo.pause();
  }

  /* ------------------------------------------------------------------
     "What we do" background — scroll-linked like the hero/beat clips:
     scrubs forward/back with scroll direction, and scales + fades in as
     a reveal rather than sitting there autoplaying and static.
     ------------------------------------------------------------------ */
  var gatewaySection = document.querySelector(".gateway");
  var gatewayVideo = gatewaySection ? gatewaySection.querySelector(".gateway-media video") : null;
  if (gatewaySection && gatewayVideo && !reducedMotion) {
    var GATEWAY_MAX_OPACITY = 0.22;
    var GATEWAY_START_SCALE = 0.85;
    var GATEWAY_REVEAL_COMPLETE = 0.5; // fully scaled/opaque by the halfway point of its time on screen

    var gatewayDuration = 0;
    var gatewayTargetTime = 0;
    var gatewayRenderedTime = -1;

    gatewayVideo.addEventListener("loadedmetadata", function () {
      gatewayDuration = gatewayVideo.duration || 0;
      primeScrubVideo(gatewayVideo);
    });
    if (gatewayVideo.readyState >= 1) gatewayDuration = gatewayVideo.duration || 0;
    primeScrubVideo(gatewayVideo);

    // Same full-visibility progress mapping as the beat: 0 as the section
    // appears at the bottom of the viewport, 1 as it exits at the top.
    function gatewayProgress() {
      var rect = gatewaySection.getBoundingClientRect();
      var vh = window.innerHeight;
      var span = vh + rect.height;
      if (span <= 0) return 0;
      return Math.min(1, Math.max(0, (vh - rect.top) / span));
    }

    (function gatewayLoop() {
      var overall = gatewayProgress();
      var reveal = Math.min(1, overall / GATEWAY_REVEAL_COMPLETE);
      gatewayVideo.style.opacity = reveal * GATEWAY_MAX_OPACITY;
      gatewayVideo.style.transform = "scale(" + (GATEWAY_START_SCALE + (1 - GATEWAY_START_SCALE) * reveal) + ")";
      if (gatewayDuration > 0) {
        gatewayTargetTime = overall * Math.max(0, gatewayDuration - 0.05);
        var next = gatewayRenderedTime < 0 ? gatewayTargetTime : gatewayRenderedTime + (gatewayTargetTime - gatewayRenderedTime) * 0.22;
        if (Math.abs(next - gatewayRenderedTime) > 0.001) {
          gatewayRenderedTime = next;
          try { gatewayVideo.currentTime = gatewayRenderedTime; } catch (e) { /* not seekable yet */ }
        }
      }
      tick(gatewayLoop);
    })();
  } else if (gatewayVideo) {
    gatewayVideo.pause();
  }

  /* ------------------------------------------------------------------
     "The people" background — scroll-linked like the hero/beat/gateway
     clips: scrubs forward/back with scroll direction, and fades + scales
     in as a reveal rather than autoplaying on a loop.
     ------------------------------------------------------------------ */
  var peopleSection = document.querySelector(".people");
  var peopleVideo = peopleSection ? peopleSection.querySelector(".people-media video") : null;
  if (peopleSection && peopleVideo && !reducedMotion) {
    var PEOPLE_MAX_OPACITY = 0.5;
    var PEOPLE_START_SCALE = 0.85;
    var PEOPLE_REVEAL_COMPLETE = 0.5; // fully scaled/opaque by the halfway point of its time on screen

    var peopleDuration = 0;
    var peopleTargetTime = 0;
    var peopleRenderedTime = -1;

    peopleVideo.addEventListener("loadedmetadata", function () {
      peopleDuration = peopleVideo.duration || 0;
      primeScrubVideo(peopleVideo);
    });
    if (peopleVideo.readyState >= 1) peopleDuration = peopleVideo.duration || 0;
    primeScrubVideo(peopleVideo);

    // Same full-visibility progress mapping as the other scroll-scrubbed
    // sections: 0 as the section appears at the bottom of the viewport,
    // 1 as it exits at the top.
    function peopleProgress() {
      var rect = peopleSection.getBoundingClientRect();
      var vh = window.innerHeight;
      var span = vh + rect.height;
      if (span <= 0) return 0;
      return Math.min(1, Math.max(0, (vh - rect.top) / span));
    }

    (function peopleLoop() {
      var overall = peopleProgress();
      var reveal = Math.min(1, overall / PEOPLE_REVEAL_COMPLETE);
      peopleVideo.style.opacity = reveal * PEOPLE_MAX_OPACITY;
      peopleVideo.style.transform = "scale(" + (PEOPLE_START_SCALE + (1 - PEOPLE_START_SCALE) * reveal) + ")";
      if (peopleDuration > 0) {
        peopleTargetTime = overall * Math.max(0, peopleDuration - 0.05);
        var next = peopleRenderedTime < 0 ? peopleTargetTime : peopleRenderedTime + (peopleTargetTime - peopleRenderedTime) * 0.22;
        if (Math.abs(next - peopleRenderedTime) > 0.001) {
          peopleRenderedTime = next;
          try { peopleVideo.currentTime = peopleRenderedTime; } catch (e) { /* not seekable yet */ }
        }
      }
      tick(peopleLoop);
    })();
  } else if (peopleVideo) {
    peopleVideo.pause();
  }

  /* ------------------------------------------------------------------
     Fog hero (Four One Five Visuals) — pinned scroll choreography on the
     same skeleton as the homepage hero: the stage holds while the mark
     lifts and fades, the tagline follows it up, reveals, then fades back
     out before the services panel arrives. Cloud layers keep their CSS
     drift; scroll adds a slow sink for depth. If a clip exists in
     .fog-media it scrubs against the same progress automatically.
     ------------------------------------------------------------------ */
  var fogHero = document.querySelector(".fog-hero");
  var fogVideo = fogHero ? fogHero.querySelector(".fog-media video") : null;
  if (fogHero && !reducedMotion) {
    var fogSky = fogHero.querySelector(".fog-sky");
    var fogLogo = fogHero.querySelector(".fog-logo");
    var fogTag = fogHero.querySelector(".fog-tag");
    var fogHint = fogHero.querySelector(".hero-scroll-hint");

    var fogDuration = 0;
    var fogTargetTime = 0;
    var fogRenderedTime = -1;
    if (fogVideo) {
      fogVideo.addEventListener("loadedmetadata", function () {
        fogDuration = fogVideo.duration || 0;
        primeScrubVideo(fogVideo);
      });
      if (fogVideo.readyState >= 1) fogDuration = fogVideo.duration || 0;
      primeScrubVideo(fogVideo);
    }

    // 0 while the stage first pins, 1 when the track has fully scrolled
    // through — same mapping as the homepage hero scrub.
    function fogProgress() {
      var rect = fogHero.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      if (total <= 0) return 0;
      return Math.min(1, Math.max(0, -rect.top / total));
    }
    // Normalize a sub-window [from, to] of overall progress to 0..1.
    function fogPhase(p, from, to) {
      return Math.min(1, Math.max(0, (p - from) / (to - from)));
    }

    (function fogLoop() {
      var p = fogProgress();
      // The mark holds alone, then slowly lifts away and fades.
      var logoOut = fogPhase(p, 0.08, 0.42);
      if (fogLogo) {
        fogLogo.style.transform = "translateY(" + (-logoOut * 90) + "px)";
        fogLogo.style.opacity = 1 - logoOut;
      }
      // The tagline follows the mark up: rises in behind it, holds,
      // then fades out well before the stage unpins.
      if (fogTag) {
        var tagIn = fogPhase(p, 0.3, 0.52);
        var tagOut = fogPhase(p, 0.72, 0.9);
        fogTag.style.transform = "translateY(" + ((1 - tagIn) * 44 - tagOut * 60) + "px)";
        fogTag.style.opacity = tagIn * (1 - tagOut);
      }
      if (fogSky) fogSky.style.transform = "translateY(" + p * 60 + "px)";
      if (fogHint) fogHint.classList.toggle("is-hidden", p > 0.05);
      // Future background clip: scrub forward/back with scroll, same
      // easing lerp as the homepage hero.
      if (fogDuration > 0) {
        fogTargetTime = p * Math.max(0, fogDuration - 0.05);
        var next = fogRenderedTime < 0 ? fogTargetTime : fogRenderedTime + (fogTargetTime - fogRenderedTime) * 0.22;
        if (Math.abs(next - fogRenderedTime) > 0.001) {
          fogRenderedTime = next;
          try { fogVideo.currentTime = fogRenderedTime; } catch (e) { /* not seekable yet */ }
        }
      }
      tick(fogLoop);
    })();
  } else if (fogHero) {
    // Reduced motion: everything rests visible (CSS handles the tag);
    // any future clip just holds its first frame.
    if (fogVideo) fogVideo.pause();
  }

  /* ------------------------------------------------------------------
     Portfolio modal: click tile to expand into fullscreen video player
     ------------------------------------------------------------------ */
  var portfolioTiles = document.querySelectorAll(".portfolio-tile");
  var portfolioModal = document.getElementById("portfolio-modal");
  var portfolioModalVideo = document.querySelector(".portfolio-modal-video");
  var portfolioModalClose = document.querySelector(".portfolio-modal-close");
  var portfolioModalBackdrop = document.querySelector(".portfolio-modal-backdrop");

  if (!portfolioModal) return;

  function closePortfolioModal() {
    portfolioModal.classList.remove("open");
    portfolioModalVideo.pause();
    portfolioModalVideo.removeAttribute("src");
    setTimeout(function () {
      portfolioModal.setAttribute("aria-hidden", "true");
    }, 400);
  }

  portfolioTiles.forEach(function (tile) {
    tile.addEventListener("click", function (e) {
      var videoSrc = tile.getAttribute("data-video");
      if (!videoSrc) return;

      portfolioModal.setAttribute("aria-hidden", "false");
      portfolioModalVideo.setAttribute("src", videoSrc);
      portfolioModal.classList.add("open");
      portfolioModalVideo.play().catch(function () {});
    });
  });

  portfolioModalClose.addEventListener("click", closePortfolioModal);
  portfolioModalBackdrop.addEventListener("click", closePortfolioModal);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && portfolioModal.classList.contains("open")) {
      closePortfolioModal();
    }
  });
})();
