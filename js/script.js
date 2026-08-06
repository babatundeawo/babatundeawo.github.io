const header = document.querySelector("[data-header]");
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector("[data-nav]");
const navLinks = document.querySelectorAll(".nav-links a");
const revealItems = document.querySelectorAll(".reveal");
const yearSpan = document.getElementById("year");

if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
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
    { threshold: 0.16 }
  );

  revealItems.forEach(item => revealObserver.observe(item));
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

