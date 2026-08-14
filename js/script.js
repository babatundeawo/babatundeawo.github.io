const header = document.querySelector("[data-header]");
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector("[data-nav]");
const navLinks = document.querySelectorAll(".nav-links a[href^='#']");
const revealItems = document.querySelectorAll(".reveal");
const yearSpan = document.getElementById("year");

if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

// ---------- Dark mode toggle ----------

const themeToggle = document.getElementById("themeToggle");

const applyTheme = theme => {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  themeToggle?.setAttribute("aria-pressed", String(theme === "dark"));
};

themeToggle?.addEventListener("click", () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const next = isDark ? "light" : "dark";
  localStorage.setItem("theme", next);
  applyTheme(next);
});

// ---------- One-page scroll-spy navigation ----------

const sections = Array.from(navLinks)
  .map(link => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const setActiveLink = id => {
  navLinks.forEach(link => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
  });
};

if ("IntersectionObserver" in window && sections.length) {
  const spyObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveLink(entry.target.id);
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
  );

  sections.forEach(section => spyObserver.observe(section));
}

// Respect reduced-motion: strip the SMIL sun animation so it stays parked
// at its resting position on the arc instead of sweeping across it.
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (prefersReducedMotion) {
  document.querySelectorAll(".sun-motion").forEach(node => node.remove());
}

const setHeaderState = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
};

const closeMenu = () => {
  navToggle?.classList.remove("is-active");
  navToggle?.setAttribute("aria-expanded", "false");
  navMenu?.classList.remove("is-open");
  document.body.classList.remove("nav-open");
};

navToggle?.addEventListener("click", () => {
  const isOpen = navMenu?.classList.toggle("is-open") ?? false;
  navToggle.classList.toggle("is-active", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
  document.body.classList.toggle("nav-open", isOpen);
});

navLinks.forEach(link => {
  link.addEventListener("click", closeMenu);
});

window.addEventListener("scroll", setHeaderState, { passive: true });
setHeaderState();

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.delay;

          if (delay) {
            entry.target.style.setProperty("--delay", `${delay}ms`);
          }

          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0, rootMargin: "200px 0px -5% 0px" }
  );

  revealItems.forEach(item => revealObserver.observe(item));

  // Fallback safety net: IntersectionObserver can miss short sections
  // during very fast or instant scrolls (trackpad flicks, Page Down,
  // jumping straight to a #hash). Periodically sweep for any reveal
  // items that are already on-screen (or scrolled past) and are still
  // hidden, and reveal them directly, so nothing gets stuck invisible.
  let sweepScheduled = false;
  const sweepReveals = () => {
    sweepScheduled = false;
    document.querySelectorAll(".reveal:not(.is-visible)").forEach(item => {
      const rect = item.getBoundingClientRect();
      // Reveal anything at or above ~1.5 screens below the viewport —
      // i.e. don't hold back content that's already been scrolled past,
      // only content that's genuinely still well below the fold.
      if (rect.top < window.innerHeight * 1.5) {
        item.classList.add("is-visible");
        revealObserver.unobserve(item);
      }
    });
  };
  const scheduleSweep = () => {
    if (!sweepScheduled) {
      sweepScheduled = true;
      requestAnimationFrame(sweepReveals);
    }
  };
  window.addEventListener("scroll", scheduleSweep, { passive: true });
  window.addEventListener("resize", scheduleSweep);
  scheduleSweep();

  // Belt-and-suspenders: also sweep on a short interval regardless of
  // scroll events, since automated/fast scrolls can sometimes outrun
  // scroll-event dispatch. Cheap once most items are already revealed.
  const sweepInterval = setInterval(() => {
    const remaining = document.querySelectorAll(".reveal:not(.is-visible)").length;
    sweepReveals();
    if (remaining === 0) {
      clearInterval(sweepInterval);
    }
  }, 400);
} else {
  revealItems.forEach(item => item.classList.add("is-visible"));
}

window.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeMenu();
  }
});

// ---------- Project filter tabs ----------

const filterButtons = document.querySelectorAll(".filter-btn");
const projectCards = document.querySelectorAll("[data-project-category]");
const projectGroupHeadings = document.querySelectorAll(".project-group-heading");

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach(btn => btn.classList.remove("is-active"));
    button.classList.add("is-active");

    projectCards.forEach(card => {
      const show = filter === "all" || card.dataset.projectCategory === filter;
      card.classList.toggle("is-hidden", !show);
    });

    projectGroupHeadings.forEach(heading => {
      const matches = filter === heading.dataset.group;
      heading.classList.toggle("is-hidden", filter !== "all" && !matches);
    });
  });
});

