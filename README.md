# KenetG - Sitio oficial
Version del README: v2

## Version academica (ES, no tecnica)
### Que es este proyecto?
Es la pagina web oficial de KenetG. Sirve como punto de encuentro para su comunidad, reune enlaces verificados a sus redes y muestra un catalogo de ejemplo para futuros productos.

### Objetivo del proyecto
Ofrecer un sitio claro y confiable donde cualquier persona pueda conocer a KenetG, seguir sus canales oficiales y explorar una tienda de muestra sin riesgo ni friccion.

### Alcance actual
- Incluye: pagina principal, hub de redes con reproductor del directo de Twitch incrustado y una tienda de demostracion sin pagos activos.
- No incluye todavia: procesamiento de pagos, blog en produccion ni panel de administracion; esas partes estan planificadas para fases futuras.

### Paginas principales
- `/` Pagina de inicio con la presentacion y llamadas a la accion hacia redes y tienda, sin incrustaciones.
- `/redes` Centro de enlaces oficiales con el directo de Twitch incrustado.
- `/tienda` Catalogo de muestra (solo visual) para probar futuros productos.

### Como ejecutarlo en local
- Opcion sencilla: sirve la carpeta `web/` con cualquier servidor estatico (por ejemplo, `python -m http.server 8000 -d web`) y abre `http://localhost:8000`.
- Opcion con Docker: desde la carpeta del repo, usa `docker compose up` con la configuracion incluida y accede al servicio que entregue los archivos estaticos.

### Estado del proyecto
En construccion activa: contenidos, tienda y secciones nuevas pueden cambiar mientras se recogen pruebas y feedback.

### Contacto
Usa los canales publicos de KenetG en redes sociales para dudas o sugerencias.

## Version tecnica (ES)
### Detalles tecnicos (ES)
- Estructura del repo: `web/` (sitio para produccion), `dev/` (utilidades y soporte local), `infra/` (configuracion de servidor y despliegue).
- Rutas principales: `/` landing principal, `/redes/` hub de enlaces con embed, `/tienda/` catalogo demo sin pagos.
- SEO/GEO: metadatos de titulo y descripcion, etiqueta canonical, Open Graph y Twitter Cards, y JSON-LD basico para describir el sitio.
- Desarrollo local: se puede servir `web/` con un servidor estatico sencillo; existe Docker Compose como opcion opcional para entornos locales.
- Produccion: el sitio estatico en `web/` se sirve mediante Nginx sin usar Docker en el entorno productivo.
- Gestion de media: los archivos `.webm` grandes se controlan con Git LFS para no inflar el repositorio.
- Buenas practicas: no se incluyen credenciales ni archivos `.env` en el repo; revisar configuracion local antes de publicar y mantener fuera del control de versiones cualquier secreto.
- Frontend en TypeScript: el JS vive en `web/assets/ts/` y se compila a `web/assets/js/` con `npm run build:ts`.
- Minificado/build: `npm run build` limpia `web/dist/`, compila TS, genera `*.min.js`, `styles.min.css`, HTML comprimido en `web/dist/` y copia los assets a `web/dist/assets/` para empaquetar o servir estatico (esa carpeta se ignora en git para no duplicar binarios/pesados).

## Dominios y redirecciones (ES — explicado facil)
- La web oficial vive en `kenetg.com`. Si entras por otro dominio, se te redirige con un 301 (mudanza permanente) para que siempre aterrices en el sitio correcto.
- Esto evita enlaces falsos, concentra todo en la web oficial y mantiene la experiencia ordenada.
- El comando `!redes` del bot de Twitch usa una URL corta (`kenetg.gg/redes`) que envia automaticamente a `https://kenetg.com/redes/`.
- Ejemplo: escribes `kenetg.gg/redes`, el navegador te lleva a `https://kenetg.com/redes/` y ves los enlaces oficiales.

## Dominios y redirecciones (ES — tecnico)
- Dominio canonico: `kenetg.com` es el unico indexable para evitar contenido duplicado y consolidar autoridad SEO/GEO.
- Redirecciones 301 deseadas:
  - `kenetg.gg/redes` -> `https://kenetg.com/redes/` (alias para el comando `!redes`).
  - `kenetg.store/` -> `https://kenetg.com/tienda/` (alias de la tienda).
  - `kenetg.es/` -> `https://kenetg.com/` (alias general, a la espera de estrategia multi-idioma).
- Buenas practicas: siempre HTTPS, coherencia con la barra final `/`, usar etiquetas `canonical` en las paginas, y definir las redirecciones 301 en el proveedor de DNS/hosting o en Nginx (sin exponer configuraciones sensibles).

## Paginas de error personalizadas
- Que son: paginas que explican errores habituales: 404 (no encontrada), 403 (acceso denegado) y 500 (error interno).
- Donde estan: en `web/errors/` (archivos `404.html`, `403.html` y `500.html`).
- Diseno: mantienen el mismo estilo visual, header y fondo de video que el resto del sitio.

### Detalles tecnicos - errores
- Rutas: `/errors/404.html`, `/errors/403.html`, `/errors/500.html`.
- Enlace desde Nginx (conceptual): usar `error_page 404 /errors/404.html;` (igual para 403 y 500) dentro del bloque del sitio; sin credenciales ni IPs.
- Uso local: se pueden abrir directamente en el navegador o servir la carpeta `web/` con un servidor estatico para verlas integradas.

## Technical details (EN)
- Repository layout: `web/` (production-ready site), `dev/` (local utilities and tooling), `infra/` (server and deployment configuration).
- Main routes: `/` main landing, `/redes/` link hub with embed, `/tienda/` demo catalog without payments.
- SEO/GEO: title and description meta tags, canonical tag, Open Graph and Twitter Cards, plus basic JSON-LD to describe the site.
- Local development: serve `web/` with a simple static server; Docker Compose is available as an optional local setup.
- Production: the static site in `web/` is served by Nginx without Docker in production.
- Media handling: large `.webm` files are tracked with Git LFS to avoid bloating the repository.
- Good practices: no credentials or `.env` files are kept in the repo; review local configuration before publishing and keep any secrets out of version control.

## Domains & redirects (EN — technical)
- Canonical domain: `kenetg.com` is the only indexable host to avoid duplicate content and concentrate SEO/GEO authority.
- Target 301 redirects:
  - `kenetg.gg/redes` -> `https://kenetg.com/redes/` (alias for the `!redes` command).
  - `kenetg.store/` -> `https://kenetg.com/tienda/` (store alias).
  - `kenetg.es/` -> `https://kenetg.com/` (general alias until a multi-language strategy is defined).
- Best practices: enforce HTTPS, keep trailing slashes consistent, set `canonical` tags on pages, and configure the 301s at the DNS/hosting provider or in Nginx (without exposing sensitive configuration).

## Changelog
- v2: Anadida explicacion de dominios/redirecciones, uso de `!redes` y documentacion de paginas de error personalizadas.
