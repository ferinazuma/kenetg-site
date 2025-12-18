interface GeoPayload {
  lat?: number;
  lon?: number;
  accuracy?: number;
  timestamp?: number;
  insecureContext?: boolean;
  unsupported?: boolean;
  denied?: boolean;
  declined?: boolean;
}

interface GeoConfig {
  storageKey: string;
  endpoint: string | null;
  enabled: boolean;
  requestTimeout: number;
  maximumAge: number;
}

interface KGGeoAPI {
  EVENT: string;
  init(options: GeoConfig | Partial<GeoConfig>): void;
  request(): Promise<{ status: string; payload?: GeoPayload | null }>;
  getStored(): GeoPayload | null;
  clearStored(): void;
  _save?(payload: GeoPayload): GeoPayload;
  config?: { storageKey?: string };
}

type ActionKey = "scroll-to-store" | "demo-alert";

type GeoActionState =
  | "disabled"
  | "insecure"
  | "unsupported"
  | "denied"
  | "declined"
  | "stored"
  | null;

type GeoStatusHint = GeoActionState | "ok" | "error" | "";

type GeoInitOptions = Pick<GeoConfig, "enabled" | "endpoint" | "storageKey">;

(() => {
  const DEMO_ALERT_MESSAGE =
    "Esta es una demo visual de la tienda de KenetG.\n\n" +
    "En la version real aqui iria el flujo de carrito / checkout.";

  const GEO_OPTIONS: GeoInitOptions = {
    enabled: true,
    endpoint: null,
    storageKey: "kg_geo"
  };

  const ACTION_HANDLERS: Record<ActionKey, (el: HTMLElement) => void> = {
    "scroll-to-store": scrollToStore,
    "demo-alert": showDemoAlert
  };

  document.addEventListener("DOMContentLoaded", () => {
    bindActionButtons();
    initGeoFeature();
  });

  function bindActionButtons() {
    document.addEventListener("click", (event) => {
      const actionTarget = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-action]");
      if (!actionTarget) return;

      const actionKey = actionTarget.dataset.action as ActionKey | undefined;
      if (!actionKey) return;

      const handler = ACTION_HANDLERS[actionKey];
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
    const geoApi = getGeoApi();
    if (geoApi && typeof geoApi.init === "function") {
      geoApi.init(GEO_OPTIONS);
    }
    setupGeoBanner(geoApi, GEO_OPTIONS);
  }

  function getGeoApi(): KGGeoAPI | undefined {
    return (window as Window & { KGGeo?: KGGeoAPI }).KGGeo;
  }

  function setupGeoBanner(geoApi: KGGeoAPI | undefined, geoOptions: GeoInitOptions) {
    const banner = document.getElementById("kg-geo-banner");
    if (!banner || !geoApi) return;
    const bannerEl = banner;
    const geoApiRef = geoApi;

    const status = bannerEl.querySelector<HTMLElement>("[data-geo-status]");
    const actions = bannerEl.querySelector<HTMLElement>("[data-geo-actions]");

    const allowBtn = bannerEl.querySelector<HTMLButtonElement>("[data-geo-allow]");
    const declineBtn = bannerEl.querySelector<HTMLButtonElement>("[data-geo-decline]");
    const resetBtn = bannerEl.querySelector<HTMLButtonElement>("[data-geo-reset]");
    const geoEventName = geoApiRef.EVENT || "kggeo:update";
    const defaultPrompt =
      "Quieres activar geolocalizacion para ajustar horarios y contenidos cercanos? (opcional)";

    if (!geoOptions.enabled) {
      bannerEl.classList.remove("is-visible");
      return;
    }

    hydrateFromStored(getStoredSafe());

    allowBtn?.addEventListener("click", () => {
      if (typeof geoApiRef.request !== "function") {
        bannerEl.classList.remove("is-visible");
        return;
      }

      setBusy(true);

      geoApiRef.request().then(
        (result: { status: string; payload?: GeoPayload | null }) => {
          setBusy(false);
          hydrateFromStored(getStoredSafe(), result ? (result.status as GeoStatusHint) : "");
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
      if (typeof geoApiRef.clearStored === "function") {
        geoApiRef.clearStored();
      }
      hydrateFromStored(null);
      setTimeout(() => bannerEl.classList.add("is-visible"), 0);
    });

    window.addEventListener(geoEventName, () => {
      hydrateFromStored(getStoredSafe());
    });

    function getStoredSafe(): GeoPayload | null {
      return typeof geoApiRef.getStored === "function" ? geoApiRef.getStored() : null;
    }

    function hydrateFromStored(storedPayload: GeoPayload | null, statusHint: GeoStatusHint = "") {
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

    function saveDeclined(): GeoPayload {
      const payload: GeoPayload = { declined: true, timestamp: Date.now() };
      if (typeof geoApiRef._save === "function") {
        geoApiRef._save(payload);
        return payload;
      }

      try {
        const key =
          (geoApiRef && geoApiRef.config && geoApiRef.config.storageKey) ||
          geoOptions.storageKey ||
          "kg_geo";
        localStorage.setItem(key, JSON.stringify(payload));
        window.dispatchEvent(new CustomEvent(geoEventName, { detail: payload }));
      } catch (err) {
        /* noop */
      }
      return payload;
    }

    function getGeoMessage(payload: GeoPayload | null, statusHint: GeoStatusHint): string {
      if (statusHint === "error")
        return "No se pudo obtener tu ubicacion. Revisa permisos e intentalo de nuevo.";
      if (statusHint === "disabled") return "Geolocalizacion desactivada para esta version.";
      if (!payload) return defaultPrompt;
      if (payload.insecureContext)
        return "Geolocalizacion necesita https o localhost; no se pidio tu ubicacion.";
      if (payload.unsupported) return "Tu navegador no admite geolocalizacion; no se recopilaron datos.";
      if (payload.denied) return "Se nego geolocalizacion desde el navegador. Puedes reactivarla en ajustes.";
      if (payload.declined) return "Marcaste que ahora no. Puedes cambiarlo cuando quieras.";
      if (payload.lat != null && payload.lon != null) {
        const date = payload.timestamp ? new Date(payload.timestamp).toLocaleString("es-ES") : "";
        const hasAccuracy =
          typeof payload.accuracy === "number" && !Number.isNaN(payload.accuracy);
        const accuracy =
          hasAccuracy && payload.accuracy !== undefined
            ? " (precision ~" + Math.round(payload.accuracy) + " m)"
            : "";
        return date
          ? "Geolocalizacion activada" + accuracy + ". Ultimo guardado " + date + "."
          : "Geolocalizacion activada" + accuracy + ".";
      }
      return "Preferencia registrada.";
    }

    function resolveActionState(payload: GeoPayload | null, statusHint: GeoStatusHint): GeoActionState {
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
})();
