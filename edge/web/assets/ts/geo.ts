type GeoStatus =
  | "empty"
  | "insecure"
  | "unsupported"
  | "denied"
  | "declined"
  | "ok"
  | "stored";

type GeoStoredPayload =
  | {
      lat: number;
      lon: number;
      accuracy?: number;
      timestamp: number;
      insecureContext?: false;
      unsupported?: false;
      denied?: false;
      declined?: false;
    }
  | {
      insecureContext: true;
      timestamp: number;
      unsupported?: true;
      denied?: boolean;
      declined?: boolean;
    }
  | {
      unsupported: true;
      timestamp: number;
      insecureContext?: boolean;
      denied?: boolean;
      declined?: boolean;
    }
  | {
      denied?: boolean;
      declined?: boolean;
      timestamp: number;
      insecureContext?: boolean;
      unsupported?: boolean;
    };

type GeoRequestResult =
  | { status: "disabled" }
  | { status: "insecure"; payload: GeoStoredPayload }
  | { status: "unsupported"; payload: GeoStoredPayload }
  | { status: "denied" | "error" | "stored"; payload: GeoStoredPayload };

type GeoStoredStatus = { status: GeoStatus; payload: GeoStoredPayload | null };

interface GeoConfig {
  storageKey: string;
  endpoint: string | null;
  enabled: boolean;
  requestTimeout: number;
  maximumAge: number;
  fetchTimeout: number;
}

const EVENT_NAME = "kggeo:update";

const defaults: GeoConfig = {
  storageKey: "kg_geo",
  endpoint: null,
  enabled: false,
  requestTimeout: 8000,
  maximumAge: 600_000,
  fetchTimeout: 3000
};

function notifyUpdate(payload: GeoStoredPayload | null) {
  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload }));
  } catch {
    /* noop */
  }
}

function sanitizeConfig(options: Partial<GeoConfig> = {}): GeoConfig {
  const cfg: GeoConfig = { ...defaults, ...options };
  cfg.enabled = Boolean(cfg.enabled);
  cfg.endpoint =
    typeof cfg.endpoint === "string" && cfg.endpoint.trim() ? cfg.endpoint.trim() : null;
  cfg.requestTimeout = Number.isFinite(cfg.requestTimeout)
    ? cfg.requestTimeout
    : defaults.requestTimeout;
  cfg.maximumAge = Number.isFinite(cfg.maximumAge) ? cfg.maximumAge : defaults.maximumAge;
  cfg.fetchTimeout = Number.isFinite(cfg.fetchTimeout) ? cfg.fetchTimeout : defaults.fetchTimeout;
  return cfg;
}

function hasCoords(payload: GeoStoredPayload): payload is GeoStoredPayload & { lat: number; lon: number } {
  return (payload as any).lat != null && (payload as any).lon != null;
}

class GeoService {
  public EVENT?: string;
  public config: GeoConfig = { ...defaults };

  init(options: Partial<GeoConfig> = {}) {
    this.config = sanitizeConfig(options);
  }

  private storageKey(): string {
    return this.config.storageKey || defaults.storageKey;
  }

  getStored(): GeoStoredPayload | null {
    try {
      const raw = window.localStorage.getItem(this.storageKey());
      return raw ? (JSON.parse(raw) as GeoStoredPayload) : null;
    } catch {
      return null;
    }
  }

  clearStored(): void {
    try {
      window.localStorage.removeItem(this.storageKey());
    } catch {
      /* noop */
    }
    notifyUpdate(null);
  }

  _save(payload: GeoStoredPayload): GeoStoredPayload {
    try {
      window.localStorage.setItem(this.storageKey(), JSON.stringify(payload));
    } catch {
      /* noop */
    }
    notifyUpdate(payload);
    return payload;
  }

  private async sendToEndpoint(payload: GeoStoredPayload): Promise<void> {
    if (!this.config.endpoint) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), this.config.fetchTimeout);
    try {
      await fetch(this.config.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
        signal: controller.signal
      });
    } catch {
      /* silent fail */
    } finally {
      window.clearTimeout(timer);
    }
  }

  getStatus(): GeoStoredStatus {
    const payload = this.getStored();
    if (!payload) return { status: "empty", payload: null };
    if (payload.insecureContext) return { status: "insecure", payload };
    if (payload.unsupported) return { status: "unsupported", payload };
    if (payload.denied) return { status: "denied", payload };
    if (payload.declined) return { status: "declined", payload };
    if (hasCoords(payload)) return { status: "ok", payload };
    return { status: "stored", payload };
  }

  request(): Promise<GeoRequestResult> {
    if (!this.config.enabled) {
      return Promise.resolve({ status: "disabled" });
    }
    if (window.isSecureContext === false) {
      const payload = this._save({
        unsupported: true,
        insecureContext: true,
        timestamp: Date.now()
      });
      return Promise.resolve({ status: "insecure", payload });
    }
    if (!("geolocation" in window.navigator)) {
      const payload = this._save({ unsupported: true, timestamp: Date.now() });
      return Promise.resolve({ status: "unsupported", payload });
    }

    const options: PositionOptions = {
      enableHighAccuracy: false,
      timeout: this.config.requestTimeout || defaults.requestTimeout,
      maximumAge: this.config.maximumAge
    };

    return new Promise((resolve) => {
      const onSuccess = (pos: GeolocationPosition) => {
        const payload: GeoStoredPayload = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: Date.now()
        };
        this._save(payload);
        void this.sendToEndpoint(payload);
        resolve({ status: "stored", payload });
      };

      const onError = (err: GeolocationPositionError) => {
        const payload = this._save({
          denied: err.code === 1,
          timestamp: Date.now(),
          code: err.code,
          message: err.message
        } as GeoStoredPayload);
        const status: GeoRequestResult["status"] = err.code === 1 ? "denied" : "error";
        resolve({ status, payload });
      };

      window.navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
    });
  }
}

declare global {
  interface Window {
    KGGeo?: GeoService & { EVENT?: string };
  }
}

const KGGeo = new GeoService();
KGGeo.EVENT = EVENT_NAME;
window.KGGeo = KGGeo;

export {};
