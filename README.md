# KenetG - Sitio oficial
Version del README: v2
Docs clave: `docs/ARCHITECTURE.md` y `docs/DEPLOY_GCP.md`.

## Version academica (ES, no tecnica)
### Que es este proyecto?
Es la pagina web oficial de KenetG. Sirve como punto de encuentro para su comunidad, reune enlaces verificados a sus redes y muestra un catalogo de ejemplo para futuros productos.

### Objetivo del proyecto
Ofrecer un sitio claro y confiable donde cualquier persona pueda conocer a KenetG, seguir sus canales oficiales y explorar una tienda de muestra sin riesgo ni friccion.

### Alcance actual
- Incluye: paginas publicas `/redes/` y `/contacto/`, assets estaticos y errores personalizados.
- Incluye tambien: `/analytics-prueba/` como panel privado con datos inventados para pruebas (sin conexion a BD ni datos reales).
- No incluye todavia: pagina de inicio, tienda activa, procesamiento de pagos, blog en produccion ni panel de administracion; esas partes estan planificadas para fases futuras.

### Paginas principales
- `/redes` Centro de enlaces oficiales.
- `/contacto` Canales oficiales de contacto.
- `/analytics-prueba` Panel privado de analytics con datos simulados/inventados (solo prueba interna, no indexable).
- `/` y `/tienda` estan deshabilitados (410 via Nginx).

### Como ejecutarlo en local
- Opcion sencilla: sirve la carpeta `edge/web/` con cualquier servidor estatico (por ejemplo, `python -m http.server 8000 -d edge/web`) y abre `http://localhost:8000/redes/`.
- Opcion con Docker: desde la carpeta del repo, usa `docker compose up` con la configuracion incluida y accede al servicio que entregue los archivos estaticos.

### Estado del proyecto
En construccion activa: contenidos, tienda y secciones nuevas pueden cambiar mientras se recogen pruebas y feedback.

### Contacto
Usa los canales publicos de KenetG en redes sociales para dudas o sugerencias.

## Version tecnica (ES)
### Detalles tecnicos (ES)
- Estructura del repo: `edge/` (estaticos y Nginx), `backend/` (API), `db/` (schema), `docs/` (despliegue), `dev/` (utilidades).
- Rutas principales: `/redes/` y `/contacto/` publicas; `/` y `/tienda/` deshabilitadas (410).
- Rutas de prueba interna: `/analytics-prueba/` panel privado con datos simulados/inventados (sin datos reales ni BD).
- SEO/GEO: metadatos de titulo y descripcion, etiqueta canonical, Open Graph y Twitter Cards, y JSON-LD basico para describir el sitio.
- Desarrollo local: se puede servir `edge/web/` con un servidor estatico sencillo; existe Docker Compose como opcion opcional para entornos locales.
- Produccion: el sitio estatico en `edge/web/` se sirve mediante Nginx en VPS1; la API corre en VPS2 sin Docker.
- Gestion de media: los archivos `.webm` grandes se controlan con Git LFS para no inflar el repositorio.
- Buenas practicas: no se incluyen credenciales ni archivos `.env` en el repo; revisar configuracion local antes de publicar y mantener fuera del control de versiones cualquier secreto.
- Frontend en TypeScript: el JS vive en `edge/web/assets/ts/` y se compila a `edge/web/assets/js/` con `npm run build:ts`.
- Sitemap automatizado: `npm run build:sitemap` (Python) genera `edge/web/sitemap.xml` con rutas publicas.
- Minificado/build: `npm run build` ejecuta Python+Node, compila TS y genera `edge/web/dist/` (no se commitea).

## Dominios y redirecciones (ES — explicado facil)
- La web oficial vive en `kenetg.com`. Si entras por otro dominio, se te redirige con un 301 (mudanza permanente) para que siempre aterrices en el sitio correcto.
- Esto evita enlaces falsos, concentra todo en la web oficial y mantiene la experiencia ordenada.
- El comando `!redes` del bot de Twitch usa una URL corta (`kenetg.gg/redes`) que envia automaticamente a `https://kenetg.com/redes/`.
- Ejemplo: escribes `kenetg.gg/redes`, el navegador te lleva a `https://kenetg.com/redes/` y ves los enlaces oficiales.

## Dominios y redirecciones (ES — tecnico)
- Dominio canonico: `kenetg.com` es el unico indexable para evitar contenido duplicado y consolidar autoridad SEO/GEO.
- Redirecciones 301 deseadas:
  - `kenetg.gg/redes` -> `https://kenetg.com/redes/` (alias para el comando `!redes`).
- `kenetg.store/` -> pendiente (tienda deshabilitada por ahora).
  - `kenetg.es/` -> `https://kenetg.com/` (alias general, a la espera de estrategia multi-idioma).
- Buenas practicas: siempre HTTPS, coherencia con la barra final `/`, usar etiquetas `canonical` en las paginas, y definir las redirecciones 301 en el proveedor de DNS/hosting o en Nginx (sin exponer configuraciones sensibles).

## Paginas de error personalizadas
- Que son: paginas que explican errores habituales: 404 (no encontrada), 403 (acceso denegado) y 500 (error interno).
- Donde estan: en `edge/web/errors/` (archivos `404.html`, `403.html` y `500.html`).
- Diseno: mantienen el mismo estilo visual, header y fondo de video que el resto del sitio.

### Detalles tecnicos - errores
- Rutas: `/errors/404.html`, `/errors/403.html`, `/errors/500.html`.
- Enlace desde Nginx (conceptual): usar `error_page 404 /errors/404.html;` (igual para 403 y 500) dentro del bloque del sitio; sin credenciales ni IPs.
- Uso local: se pueden abrir directamente en el navegador o servir la carpeta `edge/web/` con un servidor estatico para verlas integradas.

## Technical details (EN)
- Repository layout: `edge/` (static + Nginx), `backend/` (API), `db/` (schema), `docs/` (deployment), `dev/` (local utilities).
- Main routes: `/redes/` and `/contacto/` public; `/` and `/tienda/` disabled (410).
- Internal test route: `/analytics-prueba/` private analytics panel with simulated/invented data (no real data or DB).
- SEO/GEO: title and description meta tags, canonical tag, Open Graph and Twitter Cards, plus basic JSON-LD to describe the site.
- Local development: serve `edge/web/` with a simple static server; Docker Compose is available as an optional local setup.
- Production: the static site in `edge/web/` is served by Nginx on the edge VM; the API runs on the backend VM without Docker.
- Media handling: large `.webm` files are tracked with Git LFS to avoid bloating the repository.
- Good practices: no credentials or `.env` files are kept in the repo; review local configuration before publishing and keep any secrets out of version control.
- Sitemap automated: `npm run build:sitemap` (Python) generates `edge/web/sitemap.xml` with public routes.
- Build/minify: `npm run build` runs Python+Node, compiles TS, and produces `edge/web/dist/` (not committed).

## Domains & redirects (EN — technical)
- Canonical domain: `kenetg.com` is the only indexable host to avoid duplicate content and concentrate SEO/GEO authority.
- Target 301 redirects:
  - `kenetg.gg/redes` -> `https://kenetg.com/redes/` (alias for the `!redes` command).
- `kenetg.store/` -> pending (store disabled for now).
  - `kenetg.es/` -> `https://kenetg.com/` (general alias until a multi-language strategy is defined).
- Best practices: enforce HTTPS, keep trailing slashes consistent, set `canonical` tags on pages, and configure the 301s at the DNS/hosting provider or in Nginx (without exposing sensitive configuration).

## Changelog
- v2: Anadida explicacion de dominios/redirecciones, uso de `!redes` y documentacion de paginas de error personalizadas.
