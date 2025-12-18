"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EVENT_NAME = "kggeo:update";
const defaults = {
    storageKey: "kg_geo",
    endpoint: null,
    enabled: false,
    requestTimeout: 8000,
    maximumAge: 600000,
    fetchTimeout: 3000
};
function notifyUpdate(payload) {
    try {
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload }));
    }
    catch {
        /* noop */
    }
}
function sanitizeConfig(options = {}) {
    const cfg = { ...defaults, ...options };
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
function hasCoords(payload) {
    return payload.lat != null && payload.lon != null;
}
class GeoService {
    constructor() {
        this.config = { ...defaults };
    }
    init(options = {}) {
        this.config = sanitizeConfig(options);
    }
    storageKey() {
        return this.config.storageKey || defaults.storageKey;
    }
    getStored() {
        try {
            const raw = window.localStorage.getItem(this.storageKey());
            return raw ? JSON.parse(raw) : null;
        }
        catch {
            return null;
        }
    }
    clearStored() {
        try {
            window.localStorage.removeItem(this.storageKey());
        }
        catch {
            /* noop */
        }
        notifyUpdate(null);
    }
    _save(payload) {
        try {
            window.localStorage.setItem(this.storageKey(), JSON.stringify(payload));
        }
        catch {
            /* noop */
        }
        notifyUpdate(payload);
        return payload;
    }
    async sendToEndpoint(payload) {
        if (!this.config.endpoint)
            return;
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
        }
        catch {
            /* silent fail */
        }
        finally {
            window.clearTimeout(timer);
        }
    }
    getStatus() {
        const payload = this.getStored();
        if (!payload)
            return { status: "empty", payload: null };
        if (payload.insecureContext)
            return { status: "insecure", payload };
        if (payload.unsupported)
            return { status: "unsupported", payload };
        if (payload.denied)
            return { status: "denied", payload };
        if (payload.declined)
            return { status: "declined", payload };
        if (hasCoords(payload))
            return { status: "ok", payload };
        return { status: "stored", payload };
    }
    request() {
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
        const options = {
            enableHighAccuracy: false,
            timeout: this.config.requestTimeout || defaults.requestTimeout,
            maximumAge: this.config.maximumAge
        };
        return new Promise((resolve) => {
            const onSuccess = (pos) => {
                const payload = {
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    timestamp: Date.now()
                };
                this._save(payload);
                void this.sendToEndpoint(payload);
                resolve({ status: "stored", payload });
            };
            const onError = (err) => {
                const payload = this._save({
                    denied: err.code === 1,
                    timestamp: Date.now(),
                    code: err.code,
                    message: err.message
                });
                const status = err.code === 1 ? "denied" : "error";
                resolve({ status, payload });
            };
            window.navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
        });
    }
}
const KGGeo = new GeoService();
KGGeo.EVENT = EVENT_NAME;
window.KGGeo = KGGeo;
