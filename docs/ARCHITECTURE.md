# Arquitectura (2 VPS + DB)

## Resumen rapido
- VPS1 (EDGE) solo sirve estaticos y actua como proxy de /api/ hacia la red privada.
- VPS2 (BACKEND) ejecuta la API y se conecta a la DB por red privada.
- DB vive fuera del edge y nunca se expone a Internet.

## VPS1 (EDGE)
- Ubicacion en repo: `edge/`
- Publico: solo 80/443.
- Sirve estaticos desde `edge/web`:
  - `/redes/`, `/contacto/`, `/analytics-prueba/`, `/errors/*`, `/assets/*`.
- Rutas deshabilitadas:
  - `/` y `/tienda/` responden 410 y muestran `/disabled/` via Nginx.
- Proxy interno:
  - `/api/` -> `BACKEND_PRIVATE_IP:BACKEND_PORT`.
- Sin secretos ni endpoints internos hardcodeados.

## VPS2 (BACKEND)
- Ubicacion en repo: `backend/`
- No publico. Solo accesible desde VPS1 (IP privada/VPC).
- API minima:
  - `/api/health` (healthcheck)
  - `/api/analytics*` (stub)
  - `/api/blog*` (stub)
- Bind solo a `BACKEND_BIND_HOST` (privado o localhost).
- systemd: `backend/systemd/kenetg-backend.service`.
- Sin `/login` por ahora.

## DB
- Ubicacion en repo: `db/schema.sql`
- Tablas base:
  - `blog_posts`
  - `analytics_snapshots`

## Layout del repo
- `edge/`
  - `web/` estaticos publicos
  - `nginx/` templates Nginx edge
  - `scripts/` deploy edge
- `backend/`
  - `app/` API
  - `nginx/` template Nginx backend (opcional)
  - `systemd/` servicios
  - `scripts/` deploy backend
- `db/` schema SQL
- `docs/` documentacion despliegue
