# KenetG - Sitio oficial

## Qué es este proyecto
Web oficial de KenetG para centralizar su comunidad: presentación, enlaces verificados a redes y una tienda demo visual.

## Páginas principales
- `/` Landing principal con CTA hacia redes y tienda, sin embeds.
- `/redes` Hub de enlaces oficiales e incrustación del directo de Twitch.
- `/tienda` Catálogo demo (sin pagos activos) para futuros drops y productos.

## Cómo ejecutarlo en local
- Docker (si lo prefieres): en la carpeta del repo, usa `docker compose up` con la configuración existente y accede al servicio que exponga los archivos estáticos.
- Servidor estático sencillo: sirve la carpeta `web/` con cualquier servidor estático (por ejemplo, `python -m http.server 8000 -d web`) y abre `http://localhost:8000`.

## Estado del proyecto
En construcción: contenidos, tienda y blog aún pueden cambiar.

## Contacto
Canales públicos de KenetG en redes sociales.

## Apartado técnico
- Stack: HTML, CSS, JavaScript (estático).
- Estructura: web/ (producción), dev/ (herramientas locales), infra/ (config de servidor).
- Estilos: enfoque neón/oscuro, responsive.
- SEO/GEO: meta tags, Open Graph/Twitter Cards, JSON-LD básico.
- Desarrollo local: Docker opcional (solo dev), producción sin Docker (servido por Nginx).

## Creado por
Fernando Aporta Franco (creador y desarrollador del proyecto).
