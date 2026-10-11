/* ==========================================================================
   Site behaviour. No dependencies. Every feature is optional: the pages are
   fully readable and navigable without this file.

   1. Theme            5. Scroll reveal
   2. Mobile menu      6. Card spotlight
   3. Scroll effects   7. Copy to clipboard and toast
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
    if (remember) writeStore("theme", theme);
  }

  applyTheme(currentTheme(), false);

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      applyTheme(currentTheme() === "dark" ? "light" : "dark", true);
    });
  }
  /* Follow the system setting until the visitor makes their own choice. */
  var onSystemChange = function (event) {
    if (!readStore("theme")) applyTheme(event.matches ? "dark" : "light", false);
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
        items.push({ el: li, group: group, text: li.textContent.toLowerCase().replace(/\s+/g, " ") });
      });
    });

    var state = { filter: "all", query: "" };

    var render = function () {
      var terms = state.query.toLowerCase().split(/\s+/).filter(Boolean);
      var shown = 0;
      var perGroup = new Map();

      items.forEach(function (item) {
        var inGroup = state.filter === "all" || item.group.getAttribute("data-group") === state.filter;
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
})();
