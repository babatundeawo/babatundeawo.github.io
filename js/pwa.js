/* ==========================================================================
   App behaviour: offline support, install prompt, update notice.
   Optional: the site works fully without this file.
   ========================================================================== */
(function () {
  "use strict";

  function read(key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } }
  function write(key, value) { try { window.localStorage.setItem(key, value); } catch (e) { /* ignore */ } }

  var standalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  /* ---- Reload button on the offline page ---- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-reload]"), function (button) {
    button.addEventListener("click", function () { window.location.href = "/index.html"; });
  });

  /* ---- A small card that sits above the page, used for install and update ---- */
  var current = null;
  function closeCard(returnFocusTo) {
    if (!current) return;
    var node = current;
    current = null;
    node.classList.remove("is-visible");
    window.setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, reduceMotion ? 0 : 300);
    if (returnFocusTo && returnFocusTo.focus) returnFocusTo.focus();
  }

  function showCard(options) {
    closeCard();
    var card = el("div", "pwa-card");
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-label", options.title);
    var title = el("p", "pwa-card__title", options.title);
    var body = el("p", "pwa-card__body", options.body);
    card.appendChild(title);
    card.appendChild(body);
    if (options.extra) card.appendChild(options.extra);
    var actions = el("div", "pwa-card__actions");
    if (options.primaryLabel) {
      var primary = el("button", "btn btn--primary btn--small", options.primaryLabel);
      primary.type = "button";
      primary.addEventListener("click", function () { options.onPrimary(); });
      actions.appendChild(primary);
    }
    var secondary = el("button", "btn btn--ghost btn--small", options.secondaryLabel || "Not now");
    secondary.type = "button";
    secondary.addEventListener("click", function () { if (options.onDismiss) options.onDismiss(); closeCard(); });
    actions.appendChild(secondary);
    card.appendChild(actions);
    card.addEventListener("keydown", function (event) {
      if (event.key === "Escape") { if (options.onDismiss) options.onDismiss(); closeCard(); }
    });
    document.body.appendChild(card);
    current = card;
    window.requestAnimationFrame(function () { card.classList.add("is-visible"); });
    return card;
  }

  /* ---- Online and offline notice (announced to screen readers) ---- */
  var live = el("div", "pwa-live");
  live.setAttribute("role", "status");
  live.setAttribute("aria-live", "polite");
  document.body.appendChild(live);
  var liveTimer = null;
  function say(message) {
    live.textContent = message;
    live.classList.add("is-visible");
    window.clearTimeout(liveTimer);
    liveTimer = window.setTimeout(function () { live.classList.remove("is-visible"); }, 4000);
  }
  window.addEventListener("offline", function () { say("You are offline. Pages you have already opened still work."); });
  window.addEventListener("online", function () { say("Back online."); });

  /* ---- Service worker and update notice ---- */
  var reloading = false;
  function offerUpdate(worker) {
    showCard({
      title: "A new version is ready",
      body: "Refresh to see the latest content.",
      primaryLabel: "Refresh",
      secondaryLabel: "Later",
      onPrimary: function () { worker.postMessage("SKIP_WAITING"); }
    });
  }
  if ("serviceWorker" in navigator && (window.location.protocol === "https:" || window.location.hostname === "localhost")) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).then(function (registration) {
        if (registration.waiting && navigator.serviceWorker.controller) offerUpdate(registration.waiting);
        registration.addEventListener("updatefound", function () {
          var worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", function () {
            if (worker.state === "installed" && navigator.serviceWorker.controller) offerUpdate(worker);
          });
        });
        /* Look for a new version when the visitor returns to the tab. */
        document.addEventListener("visibilitychange", function () {
          if (document.visibilityState === "visible") registration.update().catch(function () { /* offline */ });
        });
      }).catch(function () { /* the site still works without offline support */ });
      navigator.serviceWorker.addEventListener("controllerchange", function () {
        if (reloading) return;
        reloading = true;
        window.location.reload();
      });
    });
  }

  /* ---- Install prompt ---- */
  var DISMISS_KEY = "install-dismissed";
  var DAY = 86400000;
  function recentlyDismissed() {
    var at = parseInt(read(DISMISS_KEY) || "0", 10);
    return at && Date.now() - at < 30 * DAY;
  }
  function remember() { write(DISMISS_KEY, String(Date.now())); }
  if (standalone || recentlyDismissed()) return;

  var deferred = null;
  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferred = event;
    window.setTimeout(function () {
      if (!deferred || current) return;
      showCard({
        title: "Install this site",
        body: "Add it to your home screen. It opens like an app and works offline.",
        primaryLabel: "Install",
        onPrimary: function () {
          var prompt = deferred;
          deferred = null;
          closeCard();
          prompt.prompt();
          prompt.userChoice.then(function (choice) { if (choice.outcome !== "accepted") remember(); });
        },
        onDismiss: remember
      });
    }, 25000);
  });
  window.addEventListener("appinstalled", function () { deferred = null; closeCard(); });

  /* iPhone and iPad have no install event, so show the steps instead. */
  var ua = window.navigator.userAgent;
  var isIos = /iPad|iPhone|iPod/.test(ua) || (ua.indexOf("Mac") !== -1 && window.navigator.maxTouchPoints > 1);
  var isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  if (isIos && isSafari) {
    window.setTimeout(function () {
      if (current) return;
      var steps = el("ol", "pwa-steps");
      ["Tap the Share button in Safari.", "Scroll down and tap Add to Home Screen.", "Tap Add."].forEach(function (text) {
        steps.appendChild(el("li", "", text));
      });
      showCard({
        title: "Add this site to your Home Screen",
        body: "It then opens like an app and works offline.",
        extra: steps,
        secondaryLabel: "Got it",
        onDismiss: remember
      });
    }, 25000);
  }
})();
