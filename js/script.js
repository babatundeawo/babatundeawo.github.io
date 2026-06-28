const header = document.querySelector("[data-header]");
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector("[data-nav]");
const navLinks = document.querySelectorAll(".nav-links a");
const revealItems = document.querySelectorAll(".reveal");
const sections = document.querySelectorAll("main section[id]");
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

  const activeNavObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        const link = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);

        if (entry.isIntersecting && link) {
          navLinks.forEach(navLink => navLink.classList.remove("is-active"));
          link.classList.add("is-active");
        }
      });
    },
    { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
  );

  sections.forEach(section => activeNavObserver.observe(section));
} else {
  revealItems.forEach(item => item.classList.add("is-visible"));
}

window.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeMenu();
  }
});

// ---------- Header weather widget ----------
// Uses the visitor's browser geolocation (with permission) plus the
// free, keyless Open-Meteo and BigDataCloud APIs. Fails silently and
// removes the pill entirely if location isn't available or granted.

const weatherWidget = document.getElementById("weather-widget");

const weatherIcons = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
  45: "🌫️", 48: "🌫️",
  51: "🌦️", 53: "🌦️", 55: "🌦️",
  56: "🌧️", 57: "🌧️",
  61: "🌧️", 63: "🌧️", 65: "🌧️",
  66: "🌧️", 67: "🌧️",
  71: "🌨️", 73: "🌨️", 75: "❄️", 77: "❄️",
  80: "🌦️", 81: "🌧️", 82: "⛈️",
  85: "🌨️", 86: "❄️",
  95: "⛈️", 96: "⛈️", 99: "⛈️"
};

async function loadWeather(lat, lon) {
  const icon = weatherWidget?.querySelector(".weather-icon");
  const temp = weatherWidget?.querySelector(".weather-temp");
  const place = weatherWidget?.querySelector(".weather-place");

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
    );

    if (!res.ok) throw new Error("weather request failed");

    const data = await res.json();
    const reading = Math.round(data?.current?.temperature_2m);
    const code = data?.current?.weather_code;

    if (Number.isNaN(reading)) throw new Error("no reading");

    if (temp) temp.textContent = `${reading}°C`;
    if (icon) icon.textContent = weatherIcons[code] ?? "🌡️";
    weatherWidget?.classList.add("is-ready");

    // Place name is a nice-to-have; skip quietly if it fails.
    try {
      const geoRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );
      const geoData = await geoRes.json();
      const name = geoData?.city || geoData?.locality || geoData?.principalSubdivision;
      if (name && place) place.textContent = name;
    } catch (_) {
      /* optional, ignore */
    }
  } catch (_) {
    weatherWidget?.remove();
  }
}

if (weatherWidget) {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      position => loadWeather(position.coords.latitude, position.coords.longitude),
      () => weatherWidget.remove(),
      { timeout: 8000, maximumAge: 600000 }
    );
  } else {
    weatherWidget.remove();
  }
}
