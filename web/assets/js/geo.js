(function (global) {
  const defaults = {
    storageKey: "kg_geo",
    endpoint: null,
    enabled: false
  };

  const KGGeo = {
    config: { ...defaults },

    init(options = {}) {
      this.config = { ...defaults, ...options };
    },

    getStored() {
      try {
        const raw = localStorage.getItem(this.config.storageKey || defaults.storageKey);
        return raw ? JSON.parse(raw) : null;
      } catch (err) {
        return null;
      }
    },

    clearStored() {
      try {
        localStorage.removeItem(this.config.storageKey || defaults.storageKey);
      } catch (err) {
        /* noop */
      }
    },

    _save(payload) {
      try {
        localStorage.setItem(
          this.config.storageKey || defaults.storageKey,
          JSON.stringify(payload)
        );
      } catch (err) {
        /* noop */
      }
    },

    request() {
      if (!this.config.enabled) {
        return { status: "disabled" };
      }

      if (!("geolocation" in navigator)) {
        this._save({ unsupported: true, timestamp: Date.now() });
        return { status: "unsupported" };
      }

      const options = {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 600000
      };

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
        },
        (err) => {
          this._save({
            denied: true,
            code: err.code,
            message: err.message,
            timestamp: Date.now()
          });
        },
        options
      );
    }
  };

  global.KGGeo = KGGeo;
})(window);
