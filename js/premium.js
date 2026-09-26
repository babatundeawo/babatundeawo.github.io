/* =============================================================
   Premium interaction layer — additive, progressive, safe.
   Loaded after js/script.js. Auto-detects elements already in
   the DOM (no markup changes required) and layers scroll reveal,
   magnetic tilt, button ripple and a cursor glow on top of the
   existing site. Respects prefers-reduced-motion and coarse
   pointers throughout.
   ============================================================= */
(function () {
  "use strict";

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;

  document.documentElement.classList.add("is-ready");

  /* ---- broaden scroll-reveal to elements the existing .reveal system doesn't cover ---- */
  (function revealAuto() {
    if (reduced) return;
    var groupSelectors = [
      ".projects-grid > .project-card", ".credentials-grid > .credential-card",
      ".skills-grid > .skill-card", ".education-grid > .education-card",
      ".about-stats > .stat-card"
    ];
    groupSelectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el, i) {
        if (el.classList.contains("reveal")) return;
        el.classList.add("reveal-auto");
        el.style.setProperty("--ri", Math.min(i, 8));
      });
    });
    var targets = document.querySelectorAll(".reveal-auto");
    if (!("IntersectionObserver" in window) || !targets.length) {
      targets.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    targets.forEach(function (el) { io.observe(el); });
  })();

  /* ---- magnetic tilt on cards (fine pointer only) ---- */
  (function tilt() {
    if (reduced || !fine) return;
    var els = document.querySelectorAll(
      ".project-card, .feature-card, .credential-card, .skill-card, .hero-avatar .avatar-box"
    );
    els.forEach(function (el) {
      el.classList.add("tilt-el");
      function onMove(e) {
        var rect = el.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width - 0.5;
        var py = (e.clientY - rect.top) / rect.height - 0.5;
        var rx = (py * -5).toFixed(2);
        var ry = (px * 6).toFixed(2);
        el.style.transform = "perspective(900px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateY(-4px)";
      }
      function onLeave() { el.style.transform = ""; }
      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", onLeave);
    });
  })();

  /* ---- button ripple ---- */
  (function ripple() {
    document.addEventListener("pointerdown", function (e) {
      var btn = e.target.closest && e.target.closest(".btn, .theme-toggle, .filter-btn, .project-link, .contact-links a");
      if (!btn) return;
      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height) * 1.6;
      var span = document.createElement("span");
      span.className = "ripple";
      span.style.width = span.style.height = size + "px";
      span.style.left = (e.clientX - rect.left - size / 2) + "px";
      span.style.top = (e.clientY - rect.top - size / 2) + "px";
      var prevPos = getComputedStyle(btn).position;
      if (prevPos === "static") btn.style.position = "relative";
      btn.style.overflow = "hidden";
      btn.appendChild(span);
      window.setTimeout(function () { span.remove(); }, 650);
    });
  })();

  /* ---- cursor glow (fine pointer only, desktop) ---- */
  (function cursorGlow() {
    if (reduced || !fine) return;
    var glow = document.createElement("div");
    glow.className = "cursor-glow";
    glow.setAttribute("aria-hidden", "true");
    document.body.appendChild(glow);
    var raf = null;
    document.addEventListener("mousemove", function (e) {
      glow.classList.add("is-active");
      if (raf) return;
      raf = requestAnimationFrame(function () {
        glow.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px) translate(-50%,-50%)";
        raf = null;
      });
    });
    document.addEventListener("mouseleave", function () { glow.classList.remove("is-active"); });
  })();
})();
