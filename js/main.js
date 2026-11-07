/* ==========================================================================
   Site behaviour. No dependencies. Every feature is optional: the pages are
   fully readable and navigable without this file.

   1. Theme            5. Scroll reveal              9. Sun path (About figure)
   2. Mobile menu      6. Card spotlight            10. Share and retry buttons
   3. Scroll effects   7. Copy, toast
   4. Section spy      8. Project filter and search
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(selector, scope) { return (scope || document).querySelector(selector); }
  function $$(selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); }

  /* Storage can throw (private windows, blocked cookies); never let that break the page. */
  function readStore(key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } }
  function writeStore(key, value) { try { window.localStorage.setItem(key, value); } catch (e) { /* ignore */ } }

  /* ---- Footer year ---- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });


  /* ======================================================================
     1. Theme
     The inline script in <head> has already set data-theme before first
     paint. This keeps the toggle, labels and browser UI colour in sync.
     ====================================================================== */
  /* This web address is shared with many other projects, so the saved choice
     gets a name of its own instead of the generic "theme". */
  var THEME_KEY = "ba-theme";
  var themeToggle = $("[data-theme-toggle]");
  var systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  var THEME_COLORS = { light: "#fbfaf7", dark: "#090e1a" };

  function currentTheme() {
    return root.getAttribute("data-theme") || (systemDark.matches ? "dark" : "light");
  }

  function applyTheme(theme, remember) {
    root.setAttribute("data-theme", theme);
    $$('meta[name="theme-color"]').forEach(function (meta) { meta.setAttribute("content", THEME_COLORS[theme]); });
    if (themeToggle) {
      themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    }
    if (remember) writeStore(THEME_KEY, theme);
  }

  applyTheme(currentTheme(), false);

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      applyTheme(currentTheme() === "dark" ? "light" : "dark", true);
    });
  }
  /* Follow the system setting until the visitor makes their own choice. */
  var onSystemChange = function (event) {
    if (!readStore(THEME_KEY)) applyTheme(event.matches ? "dark" : "light", false);
  };
  if (systemDark.addEventListener) systemDark.addEventListener("change", onSystemChange);


  /* ======================================================================
     2. Mobile menu
     ====================================================================== */
  var header = $(".site-header");
  var menuToggle = $("[data-menu-toggle]");
  var menuQuery = window.matchMedia("(max-width: 62rem)");

  function setMenu(open, returnFocus) {
    if (!header || !menuToggle) return;
    header.classList.toggle("is-open", open);
    root.classList.toggle("menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (!open && returnFocus) menuToggle.focus();
  }

  if (header && menuToggle) {
    menuToggle.addEventListener("click", function () {
      setMenu(!header.classList.contains("is-open"), false);
    });

    $$(".nav__link", header).forEach(function (link) {
      link.addEventListener("click", function () { setMenu(false, false); });
    });

    document.addEventListener("keydown", function (event) {
      if (!header.classList.contains("is-open")) return;
      if (event.key === "Escape") { setMenu(false, true); return; }
      if (event.key !== "Tab") return;
      /* Keep keyboard focus inside the open menu. */
      var focusable = $$("a[href], button:not([disabled])", header).filter(function (el) { return el.offsetParent !== null; });
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });

    document.addEventListener("click", function (event) {
      if (header.classList.contains("is-open") && !header.contains(event.target)) setMenu(false, false);
    });

    var onMenuQueryChange = function (event) { if (!event.matches) setMenu(false, false); };
    if (menuQuery.addEventListener) menuQuery.addEventListener("change", onMenuQueryChange);
  }


  /* ======================================================================
     3. Scroll effects: header state, progress bar, back-to-top
     ====================================================================== */
  var progress = $(".progress");
  var toTop = $("[data-to-top]");
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var max = root.scrollHeight - window.innerHeight;
    if (header) header.classList.toggle("is-scrolled", y > 8);
    if (progress) progress.style.setProperty("--p", max > 0 ? Math.min(y / max, 1).toFixed(4) : "0");
    if (toTop) toTop.classList.toggle("is-visible", y > 600);
    ticking = false;
  }
  function requestScrollUpdate() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }
  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate);
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }


  /* ======================================================================
     4. Section spy: marks the nav link for the section in view
     ====================================================================== */
  var spyLinks = $$("[data-section]");
  if (spyLinks.length && "IntersectionObserver" in window) {
    var sectionMap = {};
    spyLinks.forEach(function (link) { sectionMap[link.getAttribute("data-section")] = link; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        spyLinks.forEach(function (link) { link.removeAttribute("aria-current"); });
        var active = sectionMap[entry.target.id];
        if (active) active.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(sectionMap).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }


  /* ======================================================================
     5. Scroll reveal (with a small stagger inside [data-stagger] groups)
     ====================================================================== */
  $$("[data-stagger]").forEach(function (group) {
    $$(".reveal", group).forEach(function (item, index) { item.style.setProperty("--i", Math.min(index, 6)); });
  });

  var revealItems = $$(".reveal");
  if (revealItems.length) {
    if (!("IntersectionObserver" in window) || reduceMotion) {
      revealItems.forEach(function (item) { item.classList.add("is-in"); });
    } else {
      var revealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
      revealItems.forEach(function (item) { revealObserver.observe(item); });
    }
  }


  /* ======================================================================
     6. Card spotlight: a soft glow that follows the pointer
     ====================================================================== */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches && !reduceMotion) {
    document.addEventListener("pointermove", function (event) {
      var card = event.target.closest && event.target.closest(".card");
      if (!card) return;
      var rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", (event.clientX - rect.left) + "px");
      card.style.setProperty("--my", (event.clientY - rect.top) + "px");
    }, { passive: true });
  }


  /* ======================================================================
     7. Copy to clipboard and toast
     ====================================================================== */
  var toast = $("[data-toast]");
  var toastTimer = null;

  function showToast(message, isError) {
    if (!toast) return;
    var text = $("[data-toast-text]", toast);
    if (text) text.textContent = message;
    toast.classList.toggle("toast--error", Boolean(isError));
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove("is-visible"); }, 2600);
  }

  function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(value);
    return new Promise(function (resolve, reject) {
      var field = document.createElement("textarea");
      field.value = value;
      field.setAttribute("readonly", "");
      field.className = "sr-only";
      document.body.appendChild(field);
      field.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(field);
      return ok ? resolve() : reject(new Error("copy failed"));
    });
  }

  /* Other scripts (pwa.js) ask for a toast through this event. */
  document.addEventListener("ba:toast", function (event) {
    var detail = event.detail || {};
    showToast(detail.message || "", Boolean(detail.error));
  });

  $$("[data-copy]").forEach(function (button) {
    button.addEventListener("click", function () {
      copyText(button.getAttribute("data-copy")).then(
        function () { showToast("Email address copied", false); },
        function () { showToast("Could not copy. Please select the address instead.", true); }
      );
    });
  });


  /* ======================================================================
     8. Project filter and search (projects page)
     ====================================================================== */
  var projects = $("[data-projects]");
  if (projects) {
    var filterButtons = $$("[data-filter]", projects);
    var searchInput = $("[data-search]", projects);
    var groups = $$(".group", projects);
    var emptyState = $("[data-empty]", projects);
    var status = $("[data-status]", projects);
    var items = [];

    groups.forEach(function (group) {
      $$(".cards > li", group).forEach(function (li) {
        items.push({ el: li, group: group, account: li.getAttribute("data-account"), text: li.textContent.toLowerCase().replace(/\s+/g, " ") });
      });
    });

    var state = { filter: "all", query: "" };

    var render = function () {
      var terms = state.query.toLowerCase().split(/\s+/).filter(Boolean);
      var shown = 0;
      var perGroup = new Map();

      items.forEach(function (item) {
        var inGroup = state.filter === "all" || item.account === state.filter;
        var matches = terms.every(function (term) { return item.text.indexOf(term) !== -1; });
        var visible = inGroup && matches;
        item.el.hidden = !visible;
        if (visible) {
          shown += 1;
          perGroup.set(item.group, (perGroup.get(item.group) || 0) + 1);
        }
      });

      groups.forEach(function (group) { group.hidden = !perGroup.get(group); });
      filterButtons.forEach(function (button) {
        button.setAttribute("aria-pressed", String(button.getAttribute("data-filter") === state.filter));
      });
      if (emptyState) emptyState.hidden = shown !== 0;
      if (status) {
        status.textContent = shown === items.length
          ? "Showing all " + items.length + " projects"
          : "Showing " + shown + " of " + items.length + " projects";
      }
    };

    var setFilter = function (name, updateHash) {
      state.filter = name;
      if (updateHash && window.history && window.history.replaceState) {
        window.history.replaceState(null, "", name === "all" ? window.location.pathname + window.location.search : "#" + name);
      }
      render();
    };

    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () { setFilter(button.getAttribute("data-filter"), true); });
    });

    if (searchInput) {
      searchInput.addEventListener("input", function () { state.query = searchInput.value.trim(); render(); });
    }

    var emptyReset = $("[data-reset]", projects);
    if (emptyReset) {
      emptyReset.addEventListener("click", function () {
        if (searchInput) searchInput.value = "";
        state.query = "";
        setFilter("all", true);
      });
    }

    /* Deep links such as projects.html#techbase open with that group selected. */
    var fromHash = window.location.hash.replace("#", "");
    var known = filterButtons.some(function (button) { return button.getAttribute("data-filter") === fromHash; });
    state.filter = known ? fromHash : "all";
    render();
  }

  /* ======================================================================
     9. Sun path: the About illustration becomes explorable
     The slider moves the sun along the drawn curve. Every number shown is
     read from that drawing, so it is an idealised picture of a clear day,
     not measured data (the caption says so).
     ====================================================================== */
  var sunFigure = $("[data-sun-figure]");
  var sunPanel = sunFigure && $("[data-sunpath]", sunFigure);
  var sunCurve = sunFigure && $(".fig-curve", sunFigure);

  var setUpSunPath = function () {
    var sunRange = $("[data-sun-range]", sunFigure);
    var sunOut = $("[data-sun-out]", sunFigure);
    var sunDot = $(".fig-sun", sunFigure);
    var sunHalo = $(".fig-halo", sunFigure);
    var sunClip = $(".fig-clip", sunFigure);

    /* Sample the curve once; the curve runs left to right. */
    var STEPS = 240;
    var pathLength = sunCurve.getTotalLength();
    var points = [];
    for (var s = 0; s <= STEPS; s += 1) {
      var point = sunCurve.getPointAtLength((pathLength * s) / STEPS);
      points.push({ x: point.x, y: point.y });
    }
    var baseline = points[0].y;
    var peak = points.reduce(function (min, p) { return Math.min(min, p.y); }, baseline);
    var area = [0];
    for (var a = 1; a <= STEPS; a += 1) {
      var h = (baseline - points[a].y + baseline - points[a - 1].y) / 2;
      area.push(area[a - 1] + h * (points[a].x - points[a - 1].x));
    }
    var areaTotal = area[STEPS];
    var xStart = points[0].x;
    var xEnd = points[STEPS].x;

    var describe = function (fraction) {
      if (fraction < 0.04) return "Sunrise";
      if (fraction < 0.22) return "Early morning";
      if (fraction < 0.4) return "Morning";
      if (fraction <= 0.6) return "Midday";
      if (fraction <= 0.78) return "Afternoon";
      if (fraction <= 0.96) return "Late afternoon";
      return "Sunset";
    };

    var placeSun = function (value) {
      var fraction = Math.min(Math.max(value / 100, 0), 1);
      var x = xStart + (xEnd - xStart) * fraction;
      var i = 1;
      while (i < STEPS && points[i].x < x) i += 1;
      var p0 = points[i - 1];
      var p1 = points[i];
      var t = p1.x === p0.x ? 0 : (x - p0.x) / (p1.x - p0.x);
      var y = p0.y + (p1.y - p0.y) * t;
      var received = (area[i - 1] + (area[i] - area[i - 1]) * t) / areaTotal;
      var strength = Math.max(0, Math.round(((baseline - y) / (baseline - peak)) * 100));

      sunDot.setAttribute("cx", x.toFixed(1));
      sunDot.setAttribute("cy", y.toFixed(1));
      sunHalo.setAttribute("cx", x.toFixed(1));
      sunHalo.setAttribute("cy", y.toFixed(1));
      sunClip.setAttribute("width", x.toFixed(1));
      sunFigure.style.setProperty("--day", (strength / 100).toFixed(2));
      sunRange.style.setProperty("--pct", value + "%");

      var words = describe(fraction);
      var text = words + ": " + strength + "% of the midday peak, " + Math.round(received * 100) + "% of the day\u2019s solar energy so far.";
      sunOut.textContent = text;
      sunRange.setAttribute("aria-valuetext", text);
    };

    sunRange.addEventListener("input", function () { placeSun(Number(sunRange.value)); });
    sunPanel.hidden = false;
    placeSun(Number(sunRange.value));
  };

  /* Prepare it only when the figure is about to be seen, so the first screen is not delayed. */
  if (sunPanel && sunCurve && typeof sunCurve.getTotalLength === "function") {
    if ("IntersectionObserver" in window) {
      var sunWatcher = new IntersectionObserver(function (entries, observer) {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        setUpSunPath();
      }, { rootMargin: "300px 0px" });
      sunWatcher.observe(sunFigure);
    } else {
      setUpSunPath();
    }
  }


  /* ======================================================================
     10. Share and retry buttons
     ====================================================================== */
  var shareButtons = $$("[data-share]");
  if (shareButtons.length) {
    var canonical = $('link[rel="canonical"]');
    var shareData = {
      title: document.title,
      text: "Babatunde Ayoola Awoyemi: atmospheric physicist, STEM educator and climate researcher.",
      url: canonical ? canonical.href : window.location.href
    };
    var copyLink = function () {
      copyText(shareData.url).then(
        function () { showToast("Link copied", false); },
        function () { showToast("Could not copy the link", true); }
      );
    };
    shareButtons.forEach(function (button) {
      button.hidden = false;
      button.addEventListener("click", function () {
        if (navigator.share) {
          navigator.share(shareData).catch(function (error) {
            if (!error || error.name !== "AbortError") copyLink();
          });
        } else {
          copyLink();
        }
      });
    });
  }

  $$("[data-reload]").forEach(function (button) {
    button.addEventListener("click", function () { window.location.reload(); });
  });
})();
