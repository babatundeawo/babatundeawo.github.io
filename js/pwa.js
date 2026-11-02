/* ==========================================================================
   App behaviour: offline support, updates and installation. No dependencies.
   The site is fully usable without this file; it only adds extras.

   1. Offline support and updates     3. Install prompt (Android, desktop)
   2. Offline status                  4. Add to Home Screen guide (iPhone, iPad)
   ========================================================================== */
(function () {
  "use strict";

  /* Start when the browser is idle after the page has loaded, so this extra
     layer never competes with the first screen. */
  function whenIdle(task) {
    var run = function () {
      if (window.requestIdleCallback) window.requestIdleCallback(task, { timeout: 2000 });
      else window.setTimeout(task, 200);
    };
    if (document.readyState === "complete") run();
    else window.addEventListener("load", run);
  }
  /* The browser may offer installation before the page is idle, so this one
     listener is attached straight away and hands the offer over later. */
  var heldPrompt = null;
  var onPrompt = null;
  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    heldPrompt = event;
    if (onPrompt) onPrompt();
  });

  whenIdle(init);

  function init() {
    var doc = document;
    var root = doc.documentElement;

    function $$(selector, scope) { return Array.prototype.slice.call((scope || doc).querySelectorAll(selector)); }

    /* Storage can throw (private windows, blocked cookies); never let that break the page. */
    function readStore(key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } }
    function writeStore(key, value) { try { window.localStorage.setItem(key, value); } catch (e) { /* ignore */ } }

    function toast(message) {
      doc.dispatchEvent(new CustomEvent("ba:toast", { detail: { message: message, error: false } }));
    }

    /* A small fixed area at the bottom of the screen that holds the update
       notice, the install card and the offline chip, so they never overlap. */
    var stack = doc.createElement("div");
    stack.className = "app-stack";
    doc.body.appendChild(stack);

    function card(className, label, html) {
      var el = doc.createElement("section");
      el.className = "app-card " + className;
      el.setAttribute("aria-label", label);
      el.innerHTML = html; /* static strings written in this file, never visitor input */
      return el;
    }


    /* ======================================================================
       1. Offline support and updates
       A new version is never forced on the visitor: it waits until they tap
       "Refresh" (or they close and reopen the site).
       ====================================================================== */
    var updateCard = null;
    var refreshing = false;

    function showUpdate(worker) {
      if (updateCard) return;
      updateCard = card(
        "app-card--update",
        "Update available",
        '<p class="app-card__title" role="status">A new version of this site is ready.</p>' +
        '<div class="app-card__row">' +
        '<button class="btn btn--primary btn--small" type="button" data-update-now>Refresh</button>' +
        '<button class="btn btn--ghost btn--small" type="button" data-update-later>Later</button>' +
        "</div>"
      );
      stack.appendChild(updateCard);

      updateCard.querySelector("[data-update-now]").addEventListener("click", function () {
        refreshing = true;
        if (worker) {
          worker.postMessage({ type: "SKIP_WAITING" });
          /* Safety net: if the switch event never arrives, reload anyway. */
          window.setTimeout(function () { window.location.reload(); }, 3000);
        } else {
          window.location.reload();
        }
      });
      updateCard.querySelector("[data-update-later]").addEventListener("click", function () {
        updateCard.remove();
        updateCard = null;
      });
    }

    function startWorker() {
      if (!("serviceWorker" in navigator) || !window.isSecureContext) return;

      var hadController = Boolean(navigator.serviceWorker.controller);

      navigator.serviceWorker.addEventListener("controllerchange", function () {
        /* The very first install also fires this event; that is not an update. */
        if (!hadController) { hadController = true; return; }
        if (refreshing) { window.location.reload(); return; }
        showUpdate(null);
      });

      navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(function (registration) {
        if (registration.waiting && navigator.serviceWorker.controller) showUpdate(registration.waiting);

        registration.addEventListener("updatefound", function () {
          var incoming = registration.installing;
          if (!incoming) return;
          incoming.addEventListener("statechange", function () {
            if (incoming.state === "installed" && navigator.serviceWorker.controller) showUpdate(incoming);
          });
        });

        var check = function () { registration.update().catch(function () { /* offline: try again later */ }); };
        doc.addEventListener("visibilitychange", function () { if (doc.visibilityState === "visible") check(); });
        window.setInterval(check, 60 * 60 * 1000);
      }).catch(function () { /* the site keeps working without offline support */ });
    }

    startWorker();


    /* ======================================================================
       2. Offline status
       A quiet chip for sighted visitors and a polite announcement for screen
       readers. Browsers only know for sure when they are offline.
       ====================================================================== */
    var netChip = doc.createElement("p");
    netChip.className = "app-chip";
    netChip.setAttribute("aria-hidden", "true");
    netChip.textContent = "You are offline. Saved pages still work.";
    netChip.hidden = true;

    var netLive = doc.createElement("p");
    netLive.className = "sr-only";
    netLive.setAttribute("role", "status");

    stack.appendChild(netChip);
    doc.body.appendChild(netLive);

    function syncNetwork(announce) {
      var offline = navigator.onLine === false;
      netChip.hidden = !offline;
      if (offline) netLive.textContent = "You are offline. Saved pages still work.";
      else if (announce) netLive.textContent = "You are back online.";
    }
    window.addEventListener("online", function () { syncNetwork(true); });
    window.addEventListener("offline", function () { syncNetwork(true); });
    syncNetwork(false);


    /* ======================================================================
       3. Install prompt (Android, desktop Chrome and Edge)
       The browser decides when installing is possible. We keep its offer,
       show our own card at a calm moment (after the visitor has scrolled a
       little or stayed a while), and remember a "Not now" for 30 days.
       ====================================================================== */
    var DISMISS_KEY = "ba-install-dismissed";
    var DISMISS_MS = 30 * 24 * 60 * 60 * 1000;

    var standalone = window.matchMedia("(display-mode: standalone)");
    var ua = window.navigator.userAgent || "";
    var isIOS = /iPad|iPhone|iPod/.test(ua) || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);

    var deferredPrompt = null;
    var installCard = null;
    var armed = false;

    function isInstalled() { return standalone.matches || window.navigator.standalone === true; }
    function canInstall() { return !isInstalled() && (deferredPrompt !== null || isIOS); }
    function recentlyDismissed() {
      var stamp = Number(readStore(DISMISS_KEY));
      return Boolean(stamp) && Date.now() - stamp < DISMISS_MS;
    }

    function syncInstallButtons() {
      $$("[data-install]").forEach(function (button) { button.hidden = !canInstall(); });
    }

    var footerWatcher = null;

    function closeInstallCard() {
      if (footerWatcher) { footerWatcher.disconnect(); footerWatcher = null; }
      if (installCard) { installCard.remove(); installCard = null; }
      root.classList.remove("has-app-card");
    }

    function showInstallCard() {
      if (installCard || !canInstall()) return;
      installCard = card(
        "app-card--install",
        "Install this site as an app",
        '<p class="app-card__title">Install this site as an app</p>' +
        '<p class="app-card__text">Open it from your home screen and read saved pages without a connection.</p>' +
        '<div class="app-card__row">' +
        '<button class="btn btn--primary btn--small" type="button" data-install-now>Install</button>' +
        '<button class="btn btn--ghost btn--small" type="button" data-install-later>Not now</button>' +
        "</div>"
      );
      stack.insertBefore(installCard, stack.firstChild);
      root.classList.add("has-app-card");

      /* Step aside when the footer (which has its own Install button) is on screen. */
      var footer = doc.querySelector(".site-footer");
      if (footer && "IntersectionObserver" in window) {
        footerWatcher = new IntersectionObserver(function (entries) {
          var atFooter = entries[0].isIntersecting;
          installCard.hidden = atFooter;
          root.classList.toggle("has-app-card", !atFooter);
        });
        footerWatcher.observe(footer);
      }

      installCard.querySelector("[data-install-now]").addEventListener("click", function () {
        closeInstallCard();
        startInstall();
      });
      installCard.querySelector("[data-install-later]").addEventListener("click", function () {
        writeStore(DISMISS_KEY, String(Date.now()));
        closeInstallCard();
      });
      installCard.addEventListener("keydown", function (event) {
        if (event.key === "Escape") { writeStore(DISMISS_KEY, String(Date.now())); closeInstallCard(); }
      });
    }

    function armInstallCard() {
      if (armed || recentlyDismissed() || !canInstall()) return;
      armed = true;

      var timer = null;
      function show() {
        window.clearTimeout(timer);
        window.removeEventListener("scroll", onScroll);
        showInstallCard();
      }
      function onScroll() {
        var max = root.scrollHeight - window.innerHeight;
        if (max > 0 && (window.scrollY || window.pageYOffset) / max > 0.4) show();
      }
      timer = window.setTimeout(show, 30000);
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    function startInstall() {
      if (deferredPrompt) {
        var offer = deferredPrompt;
        deferredPrompt = null;
        syncInstallButtons();
        offer.prompt();
        return Promise.resolve(offer.userChoice).then(function (choice) {
          if (choice && choice.outcome === "dismissed") writeStore(DISMISS_KEY, String(Date.now()));
        });
      }
      if (isIOS) openHomeScreenGuide();
      return Promise.resolve();
    }

    onPrompt = function () {
      deferredPrompt = heldPrompt;
      syncInstallButtons();
      armInstallCard();
    };

    window.addEventListener("appinstalled", function () {
      deferredPrompt = null;
      closeInstallCard();
      syncInstallButtons();
      toast("App installed");
    });

    if (standalone.addEventListener) standalone.addEventListener("change", syncInstallButtons);

    $$("[data-install]").forEach(function (button) {
      button.addEventListener("click", startInstall);
    });

    syncInstallButtons();
    if (heldPrompt) onPrompt();
    if (isIOS) armInstallCard();


    /* ======================================================================
       4. Add to Home Screen guide (iPhone and iPad have no install event)
       Uses the native <dialog>, which traps focus, closes on Escape and
       returns focus to the button that opened it.
       ====================================================================== */
    var guide = null;

    function buildGuide() {
      var dialog = doc.createElement("dialog");
      dialog.className = "dialog";
      dialog.setAttribute("aria-labelledby", "guide-title");
      dialog.innerHTML =
        '<div class="dialog__body">' +
        '<h2 class="dialog__title" id="guide-title">Add to your Home Screen</h2>' +
        '<p class="dialog__lead">Put this site on your iPhone or iPad in three taps. It then opens like an app and keeps saved pages available offline.</p>' +
        '<ol class="steps">' +
        '<li><span class="steps__icon"><svg class="icon" aria-hidden="true" focusable="false"><use href="#i-share"/></svg></span><span>Open the <strong>Share</strong> menu in your browser.</span></li>' +
        '<li><span class="steps__icon"><svg class="icon" aria-hidden="true" focusable="false"><use href="#i-square-plus"/></svg></span><span>Scroll down and tap <strong>Add to Home Screen</strong>.</span></li>' +
        '<li><span class="steps__icon"><svg class="icon" aria-hidden="true" focusable="false"><use href="#i-check"/></svg></span><span>Tap <strong>Add</strong>. The icon now sits on your Home Screen.</span></li>' +
        "</ol>" +
        '<button class="btn btn--primary" type="button" data-guide-close>Got it</button>' +
        "</div>";
      dialog.querySelector("[data-guide-close]").addEventListener("click", function () { dialog.close(); });
      /* A click on the dimmed backdrop (the dialog element itself) closes it. */
      dialog.addEventListener("click", function (event) { if (event.target === dialog) dialog.close(); });
      doc.body.appendChild(dialog);
      return dialog;
    }

    function openHomeScreenGuide() {
      if (!guide) guide = buildGuide();
      if (typeof guide.showModal === "function") guide.showModal();
      else toast("Open the Share menu, then choose Add to Home Screen.");
    }
  }
})();
