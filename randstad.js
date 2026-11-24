(function () {
  "use strict";
    // Videos are HLS (small chunks): Safari/iOS play it natively, others use hls.js
  function attach(v, url) {
    if (v.dataset.attached) return;
    v.dataset.attached = "1";
    if (v.canPlayType("application/vnd.apple.mpegurl")) { v.src = url; return; }
    if (window.Hls && window.Hls.isSupported()) {
      var h = new window.Hls({ capLevelToPlayerSize: true, maxBufferLength: 12 });
      h.on(window.Hls.Events.ERROR, function (ev, d) { if (d && d.fatal) { h.destroy(); v._hls = null; fallback(v); } });
      h.loadSource(url); h.attachMedia(v); v._hls = h; return;
    }
    v.src = url;
  }
  // if a browser can't stream the clip here, the tile opens it on the original portfolio page instead
  function fallback(v) {
    if (v.dataset.fb) return; v.dataset.fb = "1";
    var b = v.parentNode.querySelector(".sound");
    var a = document.createElement("a");
    a.className = "sound"; a.href = "/torc/#" + (v.closest("section") || {}).id;
    a.target = "_blank"; a.rel = "noopener"; a.textContent = "watch it here >";
    if (b) b.replaceWith(a); else v.parentNode.appendChild(a);
    v.addEventListener("click", function (e) { e.stopImmediatePropagation(); window.open(a.href, "_blank", "noopener"); }, true);
  }
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Work clips: load when near, play muted while visible, tap for sound
  var clips = Array.prototype.slice.call(document.querySelectorAll("video.clip"));
  function load(v) { if (v.dataset.src) attach(v, v.dataset.src); }
  function btnOf(v) { return v.parentNode.querySelector(".sound"); }
  function setSound(v, on) {
    v.muted = !on;
    var b = btnOf(v);
    if (b) {
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.textContent = on ? "sound on" : "tap for sound";
    }
  }
  function toggle(v) {
    load(v);
    var turnOn = v.muted;
    clips.forEach(function (o) { if (o !== v) setSound(o, false); });
    setSound(v, turnOn);
    if (turnOn) { try { v.currentTime = 0; } catch (e) {} }
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  }
  clips.forEach(function (v) {
    v.addEventListener("click", function () { toggle(v); });
    var b = btnOf(v); if (b) b.addEventListener("click", function () { toggle(v); });
  });

  if ("IntersectionObserver" in window) {
    var near = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { load(e.target); near.unobserve(e.target); } });
    }, { rootMargin: "600px 0px" });
    var vis = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && e.intersectionRatio >= 0.5) {
          if (!reduce || !v.muted) { load(v); var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        } else {
          v.pause();
          if (!v.muted) setSound(v, false);
        }
      });
    }, { threshold: [0, 0.5] });
    clips.forEach(function (v) { near.observe(v); vis.observe(v); });
  } else {
    clips.forEach(load);
  }
})();
