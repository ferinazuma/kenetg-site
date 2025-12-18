(function (global) {
  const EVENT_NAME = "kggeo:update";
  const defaults = {
    storageKey: "kg_geo",
    endpoint: null,
    enabled: false,
    requestTimeout: 8000
  };

  function notifyUpdate(payload) {
    try {
      global.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload || null }));
    } catch (err) {
      /* noop */
    }
  }

  const KGGeo = {
    config: { ...defaults },

    init(options = {}) {
      this.config = { ...defaults, ...options };
    },

    _getStorageKey() {
      return this.config.storageKey || defaults.storageKey;
    },

    getStored() {
      try {
        const raw = localStorage.getItem(this._getStorageKey());
        return raw ? JSON.parse(raw) : null;
      } catch (err) {
        return null;
      }
    },

    clearStored() {
      try {
        localStorage.removeItem(this._getStorageKey());
      } catch (err) {
        /* noop */
      }
      notifyUpdate(null);
    },

    _save(payload) {
      try {
        localStorage.setItem(this._getStorageKey(), JSON.stringify(payload));
      } catch (err) {
        /* noop */
      }
      notifyUpdate(payload);
      return payload;
    },

    getStatus() {
      const payload = this.getStored();
      if (!payload) return { status: "empty", payload: null };
      if (payload.insecureContext) return { status: "insecure", payload };
      if (payload.unsupported) return { status: "unsupported", payload };
      if (payload.denied) return { status: "denied", payload };
      if (payload.declined) return { status: "declined", payload };
      if (payload.lat && payload.lon) return { status: "ok", payload };
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

      if (!("geolocation" in navigator)) {
        const payload = this._save({ unsupported: true, timestamp: Date.now() });
        return Promise.resolve({ status: "unsupported", payload });
      }

      const options = {
        enableHighAccuracy: false,
        timeout: this.config.requestTimeout || defaults.requestTimeout,
        maximumAge: 600000
      };

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const payload = {
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              timestamp: Date.now()
            };

            this._save(payload);

            if (this.config.endpoint) {
              fetch(this.config.endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
              }).catch(() => {
                /* silent fail */
              });
            }

            resolve({ status: "stored", payload });
          },
          (err) => {
            const payload = this._save({
              denied: err.code === 1,
              code: err.code,
              message: err.message,
              timestamp: Date.now()
            });
            resolve({ status: err.code === 1 ? "denied" : "error", payload });
          },
          options
        );
      });
    }
  };

  global.KGGeo = KGGeo;
  KGGeo.EVENT = EVENT_NAME;
})(window);
