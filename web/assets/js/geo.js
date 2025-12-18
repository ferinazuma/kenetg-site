"use strict";
(function (global) {
    const EVENT_NAME = "kggeo:update";
    const defaults = {
        storageKey: "kg_geo",
        endpoint: null,
        enabled: false,
        requestTimeout: 8000,
        maximumAge: 600000
    };
    function notifyUpdate(payload) {
        try {
            global.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload || null }));
        }
        catch (err) {
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
        return cfg;
    }
    const KGGeo = {
        config: { ...defaults },
        init(options = {}) {
            this.config = sanitizeConfig(options);
        },
        _getStorageKey() {
            return this.config.storageKey || defaults.storageKey;
        },
        getStored() {
            try {
                const raw = global.localStorage.getItem(this._getStorageKey());
                return raw ? JSON.parse(raw) : null;
            }
            catch (err) {
                return null;
            }
        },
        clearStored() {
            try {
                global.localStorage.removeItem(this._getStorageKey());
            }
            catch (err) {
                /* noop */
            }
            notifyUpdate(null);
        },
        _save(payload) {
            try {
                global.localStorage.setItem(this._getStorageKey(), JSON.stringify(payload));
            }
            catch (err) {
                /* noop */
            }
            notifyUpdate(payload);
            return payload;
        },
        _sendToEndpoint(payload) {
            if (!this.config.endpoint)
                return;
            fetch(this.config.endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                keepalive: true
            }).catch(() => {
                /* silent fail */
            });
        },
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
            if (payload.lat != null && payload.lon != null)
                return { status: "ok", payload };
            return { status: "stored", payload };
        },
        request() {
            if (!this.config.enabled) {
                return Promise.resolve({ status: "disabled" });
            }
            if (global.isSecureContext === false) {
                const payload = this._save({
                    unsupported: true,
                    insecureContext: true,
                    timestamp: Date.now()
                });
                return Promise.resolve({ status: "insecure", payload });
            }
            if (!("geolocation" in global.navigator)) {
                const payload = this._save({ unsupported: true, timestamp: Date.now() });
                return Promise.resolve({ status: "unsupported", payload });
            }
            const options = {
                enableHighAccuracy: false,
                timeout: this.config.requestTimeout || defaults.requestTimeout,
                maximumAge: this.config.maximumAge
            };
            return new Promise((resolve) => {
                global.navigator.geolocation.getCurrentPosition((pos) => {
                    const payload = {
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                        timestamp: Date.now()
                    };
                    this._save(payload);
                    this._sendToEndpoint(payload);
                    resolve({ status: "stored", payload });
                }, (err) => {
                    const payload = this._save({
                        denied: err.code === 1,
                        code: err.code,
                        message: err.message,
                        timestamp: Date.now()
                    });
                    const status = err.code === 1 ? "denied" : "error";
                    resolve({ status, payload });
                }, options);
            });
        }
    };
    global.KGGeo = KGGeo;
    KGGeo.EVENT = EVENT_NAME;
})(window);
