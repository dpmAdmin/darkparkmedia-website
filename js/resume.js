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

  /* ---------- credit pop-up ---------- */
  var CREDITS = window.CREDITS || {};
  var sheet = document.getElementById("sheet");
  var sPanel = document.getElementById("sheet-panel");
  var sStage = document.getElementById("sheet-stage");
  var sThumbs = document.getElementById("sheet-thumbs");
  var sMedia = document.getElementById("sheet-media");
  var sCap = document.createElement("p");
  sCap.className = "stage-cap";
  sMedia.insertBefore(sCap, sThumbs);
  var CAT = { motors: "Motorsports and auto", comp: "Competition", outdoor: "Outdoor and Sportsman", docs: "Documentary", life: "Lifestyle and food" };
  var curRows = [];
  var curIdx = 0;
  var curMedia = [];

  function visibleRows() { return rows.filter(function (li) { return !li.hidden; }); }
  function posterOf(item) {
    if (item.k === "yt") return "https://i.ytimg.com/vi/" + item.id + "/hqdefault.jpg";
    return item.poster || item.src;
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }
  function loadPlayer(item) {
    sStage.innerHTML = "";
    if (item.k === "yt") {
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(item.id) + "?autoplay=1&rel=0&modestbranding=1&playsinline=1" + (item.start ? "&start=" + item.start : "");
      f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      f.allowFullscreen = true;
      f.title = item.label || "Video";
      f.referrerPolicy = "strict-origin-when-cross-origin";
      sStage.appendChild(f);
    } else {
      var v = document.createElement("video");
      v.src = item.src;
      v.controls = true;
      v.autoplay = true;
      v.setAttribute("playsinline", "");
      sStage.appendChild(v);
    }
  }
  function showMedia(i, info) {
    sStage.innerHTML = "";
    sStage.classList.remove("is-empty");
    var item = curMedia[i];
    if (!item) {
      sStage.classList.add("is-empty");
      var card = el("div", "stage-card");
      card.appendChild(el("span", "stage-net", info.net));
      card.appendChild(el("small", "", info.role));
      sStage.appendChild(card);
      sCap.textContent = "";
      return;
    }
    sCap.textContent = item.label || "";
    if (item.k === "img") {
      var im = document.createElement("img");
      im.src = item.src;
      im.alt = info.title + ": " + (item.label || "still");
      sStage.appendChild(im);
    } else {
      var b = el("button", "stage-play");
      b.type = "button";
      b.setAttribute("aria-label", "Play: " + (item.label || info.title));
      var pi = document.createElement("img");
      pi.src = posterOf(item);
      pi.alt = "";
      b.appendChild(pi);
      var ring = el("span", "play-ring");
      ring.setAttribute("aria-hidden", "true");
      ring.appendChild(el("span", "play-tri"));
      b.appendChild(ring);
      b.addEventListener("click", function () { loadPlayer(item); });
      sStage.appendChild(b);
    }
    [].forEach.call(sThumbs.children, function (t, n) { t.classList.toggle("is-on", n === i); t.setAttribute("aria-pressed", n === i ? "true" : "false"); });
  }
  function rowInfo(li) {
    var em = li.querySelector("em");
    var roleEl = li.querySelector(".l-role");
    var role = roleEl.cloneNode(true);
    var emmy = role.querySelector(".emmy");
    if (emmy) role.removeChild(emmy);
    return {
      title: li.querySelector("b").textContent,
      season: em ? em.textContent : "",
      role: role.textContent.trim(),
      net: li.querySelector(".l-net").textContent.trim(),
      emmy: !!emmy,
      cat: CAT[li.getAttribute("data-cat")] || ""
    };
  }
  function renderSheet() {
    var li = curRows[curIdx];
    var info = rowInfo(li);
    var d = CREDITS[li.getAttribute("data-credit")] || {};
    document.getElementById("sheet-title").textContent = info.title;
    document.getElementById("sheet-eyebrow").textContent = info.net + (info.cat ? "  /  " + info.cat : "");
    var meta = info.role + (info.season ? "  /  " + info.season : "");
    var metaEl = document.getElementById("sheet-meta");
    metaEl.textContent = meta;
    if (info.emmy) metaEl.appendChild(el("span", "emmy", "Daytime Emmy winner"));
    document.getElementById("sheet-blurb").textContent = d.blurb || "";
    var sr = document.getElementById("sheet-series");
    var list = document.getElementById("sheet-series-list");
    list.innerHTML = "";
    if (d.series && d.series.length) {
      d.series.forEach(function (t) { list.appendChild(el("li", "", t)); });
      sr.hidden = false;
    } else sr.hidden = true;
    document.getElementById("sheet-count").textContent = (curIdx + 1) + " of " + curRows.length;
    curMedia = d.media || [];
    sThumbs.innerHTML = "";
    if (curMedia.length > 1) {
      curMedia.forEach(function (item, n) {
        var t = el("button", "thumb-btn");
        t.type = "button";
        t.setAttribute("aria-label", item.label || "Media " + (n + 1));
        t.title = item.label || "";
        var ti = document.createElement("img");
        ti.src = posterOf(item);
        ti.alt = "";
        ti.loading = "lazy";
        t.appendChild(ti);
        if (item.k !== "img") t.appendChild(el("i", "thumb-play"));
        t.addEventListener("click", function () { showMedia(n, info); });
        sThumbs.appendChild(t);
      });
    }
    showMedia(0, info);
    sPanel.scrollTop = 0;
  }
  function openSheet(li) {
    curRows = visibleRows();
    curIdx = Math.max(0, curRows.indexOf(li));
    renderSheet();
    sheet.hidden = false;
    document.body.classList.add("modal-open");
    sheet.querySelector(".sheet-x").focus();
  }
  function stepSheet(dir) {
    if (!curRows.length) return;
    curIdx = (curIdx + dir + curRows.length) % curRows.length;
    renderSheet();
  }
  function closeSheet() {
    if (sheet.hidden) return;
    sStage.innerHTML = "";
    sheet.hidden = true;
    document.body.classList.remove("modal-open");
    var row = curRows[curIdx];
    if (row) {
      row.focus({ preventScroll: true });
      var r = row.getBoundingClientRect();
      var head = document.querySelector(".credits-head");
      var top = (head ? head.getBoundingClientRect().bottom : 70) + 8;
      if (r.top < top || r.bottom > window.innerHeight) row.scrollIntoView({ block: "center" });
    }
  }
  rows.forEach(function (li) {
    li.addEventListener("click", function () { openSheet(li); });
    li.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openSheet(li); }
    });
  });
  document.getElementById("sheet-prev").addEventListener("click", function () { stepSheet(-1); });
  document.getElementById("sheet-next").addEventListener("click", function () { stepSheet(1); });
  sheet.addEventListener("click", function (e) { if (e.target.hasAttribute("data-sheet-close")) closeSheet(); });
  document.addEventListener("keydown", function (e) {
    if (sheet.hidden) return;
    if (e.key === "Escape") closeSheet();
    else if (e.key === "ArrowRight") stepSheet(1);
    else if (e.key === "ArrowLeft") stepSheet(-1);
  });
})();
