(() => {
  const DEMO_ALERT_MESSAGE =
    "Esta es una demo visual de la tienda de KenetG.\n\n" +
    "En la version real aqui iria el flujo de carrito / checkout.";

  const GEO_OPTIONS = {
    enabled: true, // sigue siendo opt-in: solo se pide al pulsar "Permitir"
    endpoint: null, // definir si se quiere enviar la geo a un backend
    storageKey: "kg_geo"
  };

  const ACTION_HANDLERS = {
    "scroll-to-store": scrollToStore,
    "demo-alert": showDemoAlert
  };

  document.addEventListener("DOMContentLoaded", () => {
    bindActionButtons();
    initGeoFeature();
  });

  function bindActionButtons() {
    document.addEventListener("click", (event) => {
      const actionTarget = event.target.closest("[data-action]");
      if (!actionTarget) return;

      const handler = ACTION_HANDLERS[actionTarget.dataset.action];
      if (typeof handler !== "function") return;

      event.preventDefault();
      handler(actionTarget);
    });
  }

  function scrollToStore() {
    const store = document.getElementById("tienda");
    if (!store) return;
    store.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function showDemoAlert() {
    alert(DEMO_ALERT_MESSAGE);
  }

  function initGeoFeature() {
    if (window.KGGeo && typeof window.KGGeo.init === "function") {
      window.KGGeo.init(GEO_OPTIONS);
    }
    setupGeoBanner(GEO_OPTIONS);
  }

  function setupGeoBanner(geoOptions) {
    const banner = document.getElementById("kg-geo-banner");
    if (!banner || !window.KGGeo) return;

    const status = banner.querySelector("[data-geo-status]");
    const actions = banner.querySelector("[data-geo-actions]");

    const allowBtn = banner.querySelector("[data-geo-allow]");
    const declineBtn = banner.querySelector("[data-geo-decline]");
    const resetBtn = banner.querySelector("[data-geo-reset]");
    const geoEventName = (window.KGGeo && window.KGGeo.EVENT) || "kggeo:update";
    const defaultPrompt =
      "Quieres activar geolocalizacion para ajustar horarios y contenidos cercanos? (opcional)";

    if (!geoOptions.enabled) {
      banner.classList.remove("is-visible");
      return;
    }

    hydrateFromStored(getStoredSafe());

    allowBtn?.addEventListener("click", () => {
      if (!window.KGGeo || typeof window.KGGeo.request !== "function") {
        banner.classList.remove("is-visible");
        return;
      }

      setBusy(true);

      window.KGGeo.request().then(
        (result) => {
          setBusy(false);
          hydrateFromStored(getStoredSafe(), result ? result.status : "");
        },
        () => {
          setBusy(false);
          hydrateFromStored(getStoredSafe(), "error");
        }
      );
    });

    declineBtn?.addEventListener("click", () => {
      const payload = saveDeclined();
      hydrateFromStored(payload, "declined");
    });

    resetBtn?.addEventListener("click", () => {
      if (typeof window.KGGeo.clearStored === "function") {
        window.KGGeo.clearStored();
      }
      hydrateFromStored(null);
      setTimeout(() => banner.classList.add("is-visible"), 0);
    });

    window.addEventListener(geoEventName, () => {
      hydrateFromStored(getStoredSafe());
    });

    function getStoredSafe() {
      return typeof window.KGGeo.getStored === "function" ? window.KGGeo.getStored() : null;
    }

    function hydrateFromStored(storedPayload, statusHint) {
      const actionState = resolveActionState(storedPayload, statusHint);
      const message = getGeoMessage(storedPayload, statusHint);

      if (status) status.textContent = message;

      if (!actionState) {
        banner.classList.add("is-visible");
        banner.classList.remove("is-status");
        allowBtn?.removeAttribute("hidden");
        declineBtn?.removeAttribute("hidden");
        resetBtn?.setAttribute("hidden", "hidden");
        actions?.removeAttribute("data-state");
        return;
      }

      banner.classList.add("is-visible", "is-status");
      allowBtn?.setAttribute("hidden", "hidden");
      declineBtn?.setAttribute("hidden", "hidden");
      resetBtn?.removeAttribute("hidden");

      actions?.setAttribute("data-state", actionState);
    }

    function setBusy(isBusy) {
      if (!actions) return;
      if (isBusy) {
        actions.setAttribute("data-state", "requesting");
        allowBtn?.setAttribute("disabled", "disabled");
        declineBtn?.setAttribute("disabled", "disabled");
        if (status) status.textContent = "Calculando zona aproximada (max 8s)...";
        banner.classList.add("is-visible");
        return;
      }

      allowBtn?.removeAttribute("disabled");
      declineBtn?.removeAttribute("disabled");
      if (actions.getAttribute("data-state") === "requesting") {
        actions.removeAttribute("data-state");
      }
    }

    function saveDeclined() {
      const payload = { declined: true, timestamp: Date.now() };
      if (typeof window.KGGeo._save === "function") {
        window.KGGeo._save(payload);
        return payload;
      }

      try {
        const key =
          (window.KGGeo && window.KGGeo.config && window.KGGeo.config.storageKey) ||
          geoOptions.storageKey ||
          "kg_geo";
        localStorage.setItem(key, JSON.stringify(payload));
        window.dispatchEvent(new CustomEvent(geoEventName, { detail: payload }));
      } catch (err) {
        /* noop */
      }
      return payload;
    }

    function getGeoMessage(payload, statusHint) {
      if (statusHint === "error")
        return "No se pudo obtener tu ubicacion. Revisa permisos e intentalo de nuevo.";
      if (statusHint === "disabled") return "Geolocalizacion desactivada para esta version.";
      if (!payload) return defaultPrompt;
      if (payload.insecureContext)
        return "Geolocalizacion necesita https o localhost; no se pidio tu ubicacion.";
      if (payload.unsupported) return "Tu navegador no admite geolocalizacion; no se recopilaron datos.";
      if (payload.denied) return "Se nego geolocalizacion desde el navegador. Puedes reactivarla en ajustes.";
      if (payload.declined) return "Marcaste que ahora no. Puedes cambiarlo cuando quieras.";
      if (payload.lat && payload.lon) {
        const date = payload.timestamp ? new Date(payload.timestamp).toLocaleString("es-ES") : "";
        const hasAccuracy = typeof payload.accuracy === "number" && !Number.isNaN(payload.accuracy);
        const accuracy = hasAccuracy ? " (precision ~" + Math.round(payload.accuracy) + " m)" : "";
        return date
          ? "Geolocalizacion activada" + accuracy + ". Ultimo guardado " + date + "."
          : "Geolocalizacion activada" + accuracy + ".";
      }
      return "Preferencia registrada.";
    }

    function resolveActionState(payload, statusHint) {
      if (statusHint === "disabled") return "disabled";
      if (statusHint === "insecure") return "insecure";
      if (statusHint === "unsupported") return "unsupported";
      if (statusHint === "denied") return "denied";
      if (statusHint === "declined") return "declined";
      if (statusHint === "stored" || statusHint === "ok") return "stored";

      if (payload && payload.insecureContext) return "insecure";
      if (payload && payload.unsupported) return "unsupported";
      if (payload && payload.declined) return "declined";
      if (payload && payload.denied) return "denied";
      if (payload && (payload.lat || payload.lon)) return "stored";

      return null;
    }
  }
})();
