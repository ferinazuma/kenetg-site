# KenetG - Sitio oficial
Version del README: v4
Docs clave: `docs/ARCHITECTURE.md` y `docs/DEPLOY_GCP.md`.

## Version academica (ES, no tecnica)
### Que es este proyecto?
Es el sitio oficial de KenetG. Su objetivo es dar acceso a enlaces verificados y canales oficiales, evitando confusiones o enlaces falsos.

### Objetivo del proyecto
Ofrecer una experiencia clara, segura y rapida para la comunidad, con paginas publicas simples y sin dependencia de datos sensibles.

### Alcance actual
- Incluye: paginas publicas `/redes/` y `/contacto/`, assets estaticos y errores personalizados.
- Incluye tambien: `/analytics-prueba/` como panel privado con datos simulados (sin BD real).
- Incluye una API interna minima para salud del sistema.
- No incluye todavia: inicio, tienda activa, login, pagos, blog en produccion ni panel de admin.

### Paginas principales
- `/redes` Centro de enlaces oficiales.
- `/contacto` Canales oficiales de contacto.
- `/analytics-prueba` Panel privado con datos simulados (no indexable).
- `/disabled` Pagina informativa de secciones deshabilitadas.
- `/` y `/tienda` estan deshabilitados (410 via Nginx).

### Como navegar
- Para usuarios: entrar directo a `/redes/` y `/contacto/`.
- Para pruebas internas: usar `/analytics-prueba/` (no se indexa).
- Si alguien entra a `/` o `/tienda/` vera un aviso de deshabilitado.

### Como ejecutarlo en local
- Opcion sencilla: `python -m http.server 8080 -d edge/web` y abrir `http://localhost:8080/redes/`.
- Opcion con Docker: `docker compose -f dev/docker/docker-compose.yml up` y abrir `http://localhost:8080/redes/`.

### Estado del proyecto
En construccion activa; algunas secciones estan deshabilitadas por seguridad y foco en despliegue.

### Contacto
Usa los canales publicos de KenetG en redes sociales.

## Version tecnica (ES)
### Detalles tecnicos (ES)
- Arquitectura: 2 VPS (EDGE publica + BACKEND privada) y DB privada.
- EDGE sirve solo estaticos y actua como proxy para `/api/`.
- BACKEND ejecuta la API y se conecta a la DB por red privada.
- No hay secretos en el frontend.

### Estructura del repo
- `edge/` estaticos, Nginx y scripts de deploy del EDGE.
- `backend/` API, systemd y scripts de deploy del BACKEND.
- `db/` esquema SQL inicial.
- `docs/` arquitectura y despliegue en GCP.
- `dev/` utilidades locales.

### Rutas y estado
- Publicas: `/redes/`, `/contacto/`.
- Deshabilitadas: `/` y `/tienda/` (410).
- Internas de prueba: `/analytics-prueba/` (noindex).
- Error pages: `/errors/403.html`, `/errors/404.html`, `/errors/500.html`.
- Pagina de seccion deshabilitada: `/disabled/`.

### API (BACKEND)
- Endpoint base: `/api/health`.
- Stubs preparados: `/api/analytics` y `/api/blog`.
- Sin login habilitado.
- Binding controlado por `BACKEND_BIND_HOST` y `BACKEND_PORT`.

### Despliegue (resumen)
- VPS1: clonar repo, configurar `edge/.env.example` -> `/etc/kenetg/edge.env`, ejecutar `edge/scripts/deploy.sh`.
- VPS2: clonar repo, configurar `backend/.env.example` -> `/etc/kenetg/backend.env`, ejecutar `backend/scripts/deploy.sh`.
- DB: usar `db/schema.sql` como base.

### Variables de entorno (sin datos sensibles)
- EDGE: `EDGE_WEB_ROOT`, `EDGE_SERVER_NAME`, `BACKEND_PRIVATE_IP`, `BACKEND_PORT`.
- BACKEND: `BACKEND_BIND_HOST`, `BACKEND_PORT`, `DB_*`, `PUBLIC_BASE_URL`.
- Los archivos reales van fuera del repo.

### Build y desarrollo local
- TS -> JS: `npm run build:ts`.
- Sitemap: `npm run build:sitemap`.
- Build completo: `npm run build` (genera `edge/web/dist/` y no se commitea).
- Local sin Docker: `python -m http.server 8080 -d edge/web`.
- Local con Docker: `docker compose -f dev/docker/docker-compose.yml up`.

### Archivos clave
- Nginx EDGE: `edge/nginx/kenetg-edge.conf`.
- Nginx local: `edge/nginx/dev-local.conf`.
- systemd backend: `backend/systemd/kenetg-backend.service`.
- API: `backend/app/server.py`.
- Schema DB: `db/schema.sql`.

### Buenas practicas
- No subir `.env` reales.
- No hardcodear IPs internas en el frontend.
- Probar cambios en local antes de subir.
- Mantener `/` y `/tienda/` fuera de la navegacion.

### Problemas comunes (local)
- 404 en `/redes/`: verifica que estas sirviendo `edge/web` y no `web`.
- Docker 404: recrea el contenedor (`docker compose ... down` y `up --force-recreate`).
- Si `/` responde 410, es esperado.

## Dominios y redirecciones (ES)
- Dominio canonico: `kenetg.com`.
- Redirecciones 301 deseadas:
  - `kenetg.gg/redes` -> `https://kenetg.com/redes/`.
  - `kenetg.es/` -> `https://kenetg.com/`.
  - `kenetg.store/` -> pendiente (tienda deshabilitada).

## Paginas de error personalizadas
- 403, 404, 500 en `edge/web/errors/`.
- 410 (seccion deshabilitada) en `edge/web/disabled/`.
- Integradas via `error_page` en Nginx.

## Technical details (EN)
- Architecture: 2 VMs (public EDGE + private BACKEND) and private DB.
- EDGE serves static files and proxies `/api/` to BACKEND.
- BACKEND runs the API and talks to the DB over private network.
- No secrets live in the frontend.

### Repo layout
- `edge/` static site, Nginx, edge deploy scripts.
- `backend/` API, systemd, backend deploy scripts.
- `db/` initial SQL schema.
- `docs/` architecture and GCP deployment.
- `dev/` local utilities.

### Routes and status
- Public: `/redes/`, `/contacto/`.
- Disabled: `/` and `/tienda/` (410).
- Internal test: `/analytics-prueba/` (noindex).
- Error pages: `/errors/403.html`, `/errors/404.html`, `/errors/500.html`.
- Disabled page: `/disabled/`.

### API (BACKEND)
- Base endpoint: `/api/health`.
- Prepared stubs: `/api/analytics` and `/api/blog`.
- Login is disabled.
- Binding via `BACKEND_BIND_HOST` and `BACKEND_PORT`.

### Deployment (summary)
- EDGE: clone repo, copy `edge/.env.example` to `/etc/kenetg/edge.env`, run `edge/scripts/deploy.sh`.
- BACKEND: clone repo, copy `backend/.env.example` to `/etc/kenetg/backend.env`, run `backend/scripts/deploy.sh`.
- DB: bootstrap with `db/schema.sql`.

### Env vars (safe overview)
- EDGE: `EDGE_WEB_ROOT`, `EDGE_SERVER_NAME`, `BACKEND_PRIVATE_IP`, `BACKEND_PORT`.
- BACKEND: `BACKEND_BIND_HOST`, `BACKEND_PORT`, `DB_*`, `PUBLIC_BASE_URL`.
- Real env files live outside the repo.

### Build and local dev
- TS -> JS: `npm run build:ts`.
- Sitemap: `npm run build:sitemap`.
- Full build: `npm run build` (generates `edge/web/dist/`, not committed).
- Local without Docker: `python -m http.server 8080 -d edge/web`.
- Local with Docker: `docker compose -f dev/docker/docker-compose.yml up`.

### Key files
- EDGE Nginx: `edge/nginx/kenetg-edge.conf`.
- Local Nginx: `edge/nginx/dev-local.conf`.
- Backend systemd: `backend/systemd/kenetg-backend.service`.
- API server: `backend/app/server.py`.
- DB schema: `db/schema.sql`.

### Common local issues
- 404 on `/redes/`: make sure you serve `edge/web`.
- Docker 404: recreate the container (`docker compose ... down` then `up --force-recreate`).
- 410 on `/`: expected by design.

## Changelog
- v4: README reescrito desde cero con la nueva arquitectura EDGE/BACKEND.
