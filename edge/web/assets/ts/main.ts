type ActionHandler = (target: HTMLElement) => void;
type GeoApi = {
  init?: (options: typeof GEO_OPTIONS) => void;
  request?: () => Promise<any>;
  clearStored?: () => void;
  getStored?: () => any;
  _save?: (payload: any) => void;
  config?: { storageKey?: string };
  EVENT?: string;
};

const DEMO_ALERT_MESSAGE =
  "Esta es una demo visual de la tienda de KenetG.\n\nEn la version real aqui iria el flujo de carrito / checkout.";

const GEO_OPTIONS = {
  enabled: true,
  endpoint: null,
  storageKey: "kg_geo"
};

const ACTION_HANDLERS: Record<string, ActionHandler> = {
  "scroll-to-store": scrollToStore,
  "demo-alert": showDemoAlert
};

document.addEventListener("DOMContentLoaded", () => {
  bindActionButtons();
  initGeoFeature();
});

function bindActionButtons(): void {
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const actionTarget = target?.closest<HTMLElement>("[data-action]");
    if (!actionTarget) return;

    const actionKey = actionTarget.dataset.action;
    if (!actionKey) return;

    const handler = ACTION_HANDLERS[actionKey];
    if (typeof handler !== "function") return;

    event.preventDefault();
    handler(actionTarget);
  });
}

function scrollToStore(): void {
  const store = document.getElementById("tienda");
  store?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showDemoAlert(): void {
  alert(DEMO_ALERT_MESSAGE);
}

function initGeoFeature(): void {
  const geoApi = getGeoApi();
  if (!geoApi) return;
  if (typeof geoApi.init === "function") {
    geoApi.init(GEO_OPTIONS);
  }
  setupGeoBanner(geoApi, GEO_OPTIONS);
}

function getGeoApi(): GeoApi | null {
  return window.KGGeo || null;
}

function setupGeoBanner(geoApi: GeoApi, geoOptions: typeof GEO_OPTIONS): void {
  const banner = document.getElementById("kg-geo-banner");
  if (!banner || !geoApi) return;

  const bannerEl = banner as HTMLElement;
  const status = bannerEl.querySelector<HTMLElement>("[data-geo-status]");
  const actions = bannerEl.querySelector<HTMLElement>("[data-geo-actions]");
  const allowBtn = bannerEl.querySelector<HTMLButtonElement>("[data-geo-allow]");
  const declineBtn = bannerEl.querySelector<HTMLButtonElement>("[data-geo-decline]");
  const resetBtn = bannerEl.querySelector<HTMLButtonElement>("[data-geo-reset]");
  const geoEventName = geoApi.EVENT || "kggeo:update";
  const defaultPrompt =
    "Quieres activar geolocalizacion para ajustar horarios y contenidos cercanos? (opcional)";

  if (!geoOptions.enabled) {
    bannerEl.classList.remove("is-visible");
    return;
  }

  hydrateFromStored(getStoredSafe());

  allowBtn?.addEventListener("click", () => {
    if (typeof geoApi.request !== "function") {
      bannerEl.classList.remove("is-visible");
      return;
    }
    setBusy(true);
    geoApi.request().then(
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
    if (typeof geoApi.clearStored === "function") {
      geoApi.clearStored();
    }
    hydrateFromStored(null);
    window.setTimeout(() => bannerEl.classList.add("is-visible"), 0);
  });

  window.addEventListener(geoEventName, () => hydrateFromStored(getStoredSafe()));

  function getStoredSafe() {
    return typeof geoApi.getStored === "function" ? geoApi.getStored() : null;
  }

  function hydrateFromStored(storedPayload: unknown, statusHint = "") {
    const actionState = resolveActionState(storedPayload, statusHint);
    const message = getGeoMessage(storedPayload, statusHint);
    if (status) status.textContent = message;

    if (!actionState) {
      bannerEl.classList.add("is-visible");
      bannerEl.classList.remove("is-status");
      allowBtn?.removeAttribute("hidden");
      declineBtn?.removeAttribute("hidden");
      resetBtn?.setAttribute("hidden", "hidden");
      actions?.removeAttribute("data-state");
      return;
    }

    bannerEl.classList.add("is-visible", "is-status");
    allowBtn?.setAttribute("hidden", "hidden");
    declineBtn?.setAttribute("hidden", "hidden");
    resetBtn?.removeAttribute("hidden");
    actions?.setAttribute("data-state", actionState);
  }

  function setBusy(isBusy: boolean) {
    if (!actions) return;
    if (isBusy) {
      actions.setAttribute("data-state", "requesting");
      allowBtn?.setAttribute("disabled", "disabled");
      declineBtn?.setAttribute("disabled", "disabled");
      if (status) status.textContent = "Calculando zona aproximada (max 8s)...";
      bannerEl.classList.add("is-visible");
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
    geoApi._save?.(payload);
    if (geoApi._save) return payload;
    try {
      const key =
        (geoApi.config && geoApi.config.storageKey) ||
        geoOptions.storageKey ||
        "kg_geo";
      localStorage.setItem(key, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent(geoEventName, { detail: payload }));
    } catch {
      /* noop */
    }
    return payload;
  }

  function getGeoMessage(payload: any, statusHint: string): string {
    if (statusHint === "error") return "No se pudo obtener tu ubicacion. Revisa permisos e intentalo de nuevo.";
    if (statusHint === "disabled") return "Geolocalizacion desactivada para esta version.";
    if (!payload) return defaultPrompt;
    if (payload.insecureContext) return "Geolocalizacion necesita https o localhost; no se pidio tu ubicacion.";
    if (payload.unsupported) return "Tu navegador no admite geolocalizacion; no se recopilaron datos.";
    if (payload.denied) return "Se nego geolocalizacion desde el navegador. Puedes reactivarla en ajustes.";
    if (payload.declined) return "Marcaste que ahora no. Puedes cambiarlo cuando quieras.";
    if (payload.lat != null && payload.lon != null) {
      const date = payload.timestamp ? new Date(payload.timestamp).toLocaleString("es-ES") : "";
      const hasAccuracy = typeof payload.accuracy === "number" && !Number.isNaN(payload.accuracy);
      const accuracy = hasAccuracy ? " (precision ~" + Math.round(payload.accuracy) + " m)" : "";
      return date
        ? "Geolocalizacion activada" + accuracy + ". Ultimo guardado " + date + "."
        : "Geolocalizacion activada" + accuracy + ".";
    }
    return "Preferencia registrada.";
  }

  function resolveActionState(payload: any, statusHint: string): string | null {
    if (statusHint === "disabled") return "disabled";
    if (statusHint === "insecure") return "insecure";
    if (statusHint === "unsupported") return "unsupported";
    if (statusHint === "denied") return "denied";
    if (statusHint === "declined") return "declined";
    if (statusHint === "stored" || statusHint === "ok") return "stored";
    if (payload?.insecureContext) return "insecure";
    if (payload?.unsupported) return "unsupported";
    if (payload?.declined) return "declined";
    if (payload?.denied) return "denied";
    if (payload && (payload.lat != null || payload.lon != null)) return "stored";
    return null;
  }
}
