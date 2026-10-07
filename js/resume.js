/* ANTHONY SLEZAK, interactive resume.
   Nav state and scrollspy, hero loop control, count-up numbers, credit
   filters, and the video player (YouTube embeds
   and direct mp4s, both loaded only when someone presses play). */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;

  /* ---------- nav frost ---------- */
  var nav = document.getElementById("nav");
  function onScroll() { nav.classList.toggle("is-solid", (window.scrollY || 0) > 40); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- scrollspy ---------- */
  var links = {};
  [].forEach.call(document.querySelectorAll("[data-spy]"), function (a) { links[a.getAttribute("data-spy")] = a; });
  if (hasIO) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        Object.keys(links).forEach(function (k) { links[k].classList.toggle("is-active", k === e.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(links).forEach(function (k) { var s = document.getElementById(k); if (s) spy.observe(s); });
  }

  /* ---------- reveal ---------- */
  var revealEls = [].slice.call(document.querySelectorAll(".reveal"));
  if (hasIO && !reduced) {
    var rv = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); rv.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 60 + "ms";
      rv.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- hero loop: play while on screen ---------- */
  var heroVideo = document.querySelector(".hero-video");
  if (heroVideo) heroVideo.addEventListener("playing", function () { heroVideo.classList.add("is-playing"); });
  if (heroVideo && !reduced && hasIO) {
    new IntersectionObserver(function (entries) {
      var p;
      if (entries[0].isIntersecting) { p = heroVideo.play(); if (p && p.catch) p.catch(function () {}); }
      else heroVideo.pause();
    }, { threshold: 0.1 }).observe(heroVideo);
  }

  /* ---------- count-up ---------- */
  var nums = [].slice.call(document.querySelectorAll(".num[data-count]"));
  function runCount(el) {
    var end = parseInt(el.getAttribute("data-count"), 10);
    var suffix = el.getAttribute("data-suffix") || "";
    var t0 = null, dur = 1300;
    function tick(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    setTimeout(function () { el.textContent = end + suffix; }, dur + 250);
  }
  if (hasIO && !reduced) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { co.observe(n); });
  }

  /* ---------- credit filters ---------- */
  var chips = [].slice.call(document.querySelectorAll(".chip"));
  var rows = [].slice.call(document.querySelectorAll("#ledger li"));
  var countEl = document.getElementById("ledger-count");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var f = chip.getAttribute("data-filter");
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle("is-on", on);
        c.setAttribute("aria-pressed", on ? "true" : "false");
      });
      var shown = 0;
      rows.forEach(function (li) {
        var match = f === "all" || li.getAttribute("data-cat") === f;
        li.hidden = !match;
        if (match) {
          shown++;
          li.style.animation = "none";
          void li.offsetWidth;
          li.style.animation = "";
          li.style.animationDelay = Math.min(shown, 10) * 35 + "ms";
        }
      });
      if (countEl) countEl.textContent = shown;
    });
  });

  /* ---------- video player ---------- */
  var modal = document.getElementById("modal");
  var stage = document.getElementById("stage");
  var titleEl = document.getElementById("modal-title");
  var lastFocus = null;

  function openPlayer(btn) {
    var type = btn.getAttribute("data-play");
    lastFocus = btn;
    stage.innerHTML = "";
    if (type === "yt") {
      var id = btn.getAttribute("data-id");
      var start = parseInt(btn.getAttribute("data-start"), 10) || 0;
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1&rel=0&modestbranding=1&playsinline=1" + (start ? "&start=" + start : "");
      f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      f.allowFullscreen = true;
      f.title = btn.getAttribute("data-title") || "Video";
      f.referrerPolicy = "strict-origin-when-cross-origin";
      stage.appendChild(f);
    } else {
      var v = document.createElement("video");
      v.src = btn.getAttribute("data-src");
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      v.setAttribute("playsinline", "");
      stage.appendChild(v);
    }
    titleEl.textContent = btn.getAttribute("data-title") || "";
    modal.hidden = false;
    document.body.classList.add("modal-open");
    modal.querySelector(".modal-x").focus();
  }
  function closePlayer() {
    if (modal.hidden) return;
    var v = stage.querySelector("video");
    if (v) v.pause();
    stage.innerHTML = "";
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    if (lastFocus) lastFocus.focus();
  }
  [].forEach.call(document.querySelectorAll("[data-play]"), function (b) {
    b.addEventListener("click", function () { openPlayer(b); });
  });
  modal.addEventListener("click", function (e) { if (e.target.hasAttribute("data-close")) closePlayer(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closePlayer();
  });
})();
