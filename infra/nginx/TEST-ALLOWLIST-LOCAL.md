# Prueba local allowlist /analytics-prueba/

Esta prueba es solo para entorno local. Confiar en `X-Real-IP` es inseguro en produccion.

## Bloqueado (debe dar 403)
```bash
curl -i -H "X-Real-IP: 8.8.8.8" http://localhost/analytics-prueba/
```

## Permitido (debe NO dar 403)
1) Anade `allow 1.2.3.4;` dentro del bloque `location ^~ /analytics-prueba/` (sin quitar `allow 127.0.0.1`).
2) Recarga nginx.
3) Prueba:
```bash
curl -i -H "X-Real-IP: 1.2.3.4" http://localhost/analytics-prueba/
```

## Recarga (ajusta segun tu setup)
- Ejemplo clasico:
  `nginx -s reload`
- Si estas en Docker/Compose:
  `docker compose exec nginx nginx -s reload`
