function scrollToStore() {
  const store = document.getElementById("tienda");
  if (!store) return;
  store.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showDemoAlert() {
  alert(
    "Esta es una demo visual de la tienda de KenetG.\n\n" +
      "En la versión real aquí iría el flujo de carrito / checkout."
  );
}

function toggleMenu() {
  const menu = document.querySelector(".kg-nav-menu-dropdown");
  menu.classList.toggle("open");
}

// Geolocalizacion preparada (sin activar por defecto)
(function () {
  const geoOptions = {
    // TODO: activar en produccion con consentimiento explicito
    enabled: false,
    // TODO: definir endpoint real (ej. "https://api.kenetg.com/geo")
    endpoint: null,
    storageKey: "kg_geo"
  };

  if (window.KGGeo && typeof window.KGGeo.init === "function") {
    window.KGGeo.init(geoOptions);
  }

  setupGeoBanner(geoOptions);
})();

function setupGeoBanner(geoOptions) {
  const banner = document.getElementById("kg-geo-banner");
  if (!banner || !window.KGGeo) return;

  const stored = typeof window.KGGeo.getStored === "function" ? window.KGGeo.getStored() : null;

  if (!geoOptions.enabled || stored) {
    banner.classList.remove("is-visible");
    return;
  }

  const allowBtn = banner.querySelector("[data-geo-allow]");
  const declineBtn = banner.querySelector("[data-geo-decline]");

  banner.classList.add("is-visible");

  allowBtn?.addEventListener("click", () => {
    window.KGGeo.request();
    banner.classList.remove("is-visible");
  });

  declineBtn?.addEventListener("click", () => {
    try {
      const payload = { declined: true, timestamp: Date.now() };
      const key = (window.KGGeo && window.KGGeo.config && window.KGGeo.config.storageKey) || "kg_geo";
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (err) {
      /* noop */
    }
    banner.classList.remove("is-visible");
  });
}
