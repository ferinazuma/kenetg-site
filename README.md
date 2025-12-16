# KenetG - Sitio oficial

## Versión académica (ES, no técnica)
### ¿Qué es este proyecto?
Es la página web oficial de KenetG. Sirve como punto de encuentro para su comunidad, reúne enlaces verificados a sus redes y muestra un catálogo de ejemplo para futuros productos.

### Objetivo del proyecto
Ofrecer un sitio claro y confiable donde cualquier persona pueda conocer a KenetG, seguir sus canales oficiales y explorar una tienda de muestra sin riesgo ni fricción.

### Alcance actual
- Incluye: página principal, hub de redes con reproductor del directo de Twitch incrustado y una tienda de demostración sin pagos activos.
- No incluye todavía: procesamiento de pagos, blog en producción ni panel de administración; esas partes están planificadas para fases futuras.

### Páginas principales
- `/` Página de inicio con la presentación y llamadas a la acción hacia redes y tienda, sin incrustaciones.
- `/redes` Centro de enlaces oficiales con el directo de Twitch incrustado.
- `/tienda` Catálogo de muestra (solo visual) para probar futuros productos.

### Cómo ejecutarlo en local
- Opción sencilla: sirve la carpeta `web/` con cualquier servidor estático (por ejemplo, `python -m http.server 8000 -d web`) y abre `http://localhost:8000`.
- Opción con Docker: desde la carpeta del repo, usa `docker compose up` con la configuración incluida y accede al servicio que entregue los archivos estáticos.

### Estado del proyecto
En construcción activa: contenidos, tienda y secciones nuevas pueden cambiar mientras se recogen pruebas y feedback.

### Contacto
Usa los canales públicos de KenetG en redes sociales para dudas o sugerencias.

## Versión técnica (ES)
### Detalles técnicos (ES)
- Estructura del repo: `web/` (sitio para producción), `dev/` (utilidades y soporte local), `infra/` (configuración de servidor y despliegue).
- Rutas principales: `/` landing principal, `/redes/` hub de enlaces con embed, `/tienda/` catálogo demo sin pagos.
- SEO/GEO: metadatos de título y descripción, etiqueta canonical, Open Graph y Twitter Cards, y JSON-LD básico para describir el sitio.
- Desarrollo local: se puede servir `web/` con un servidor estático sencillo; existe Docker Compose como opción opcional para entornos locales.
- Producción: el sitio estático en `web/` se sirve mediante Nginx sin usar Docker en el entorno productivo.
- Gestión de media: los archivos `.webm` grandes se controlan con Git LFS para no inflar el repositorio.
- Buenas prácticas: no se incluyen credenciales ni archivos `.env` en el repo; revisar configuración local antes de publicar y mantener fuera del control de versiones cualquier secreto.

## Technical details (EN)
- Repository layout: `web/` (production-ready site), `dev/` (local utilities and tooling), `infra/` (server and deployment configuration).
- Main routes: `/` main landing, `/redes/` link hub with embed, `/tienda/` demo catalog without payments.
- SEO/GEO: title and description meta tags, canonical tag, Open Graph and Twitter Cards, plus basic JSON-LD to describe the site.
- Local development: serve `web/` with a simple static server; Docker Compose is available as an optional local setup.
- Production: the static site in `web/` is served by Nginx without Docker in production.
- Media handling: large `.webm` files are tracked with Git LFS to avoid bloating the repository.
- Good practices: no credentials or `.env` files are kept in the repo; review local configuration before publishing and keep any secrets out of version control.
