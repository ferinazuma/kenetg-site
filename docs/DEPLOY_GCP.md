# Despliegue en GCP (2 VPS + DB)

## Topologia
- VPS1 (EDGE): publico, solo 80/443. Sirve estaticos y proxy /api/.
- VPS2 (BACKEND): privado. Solo accesible desde VPS1 por IP privada/VPC.
- DB: Cloud SQL con IP privada o VM privada. Solo accesible desde VPS2.

## Reglas de firewall (GCP)
- Inbound a VPS1:
  - 80/tcp y 443/tcp desde Internet.
  - SSH solo desde IP admin o VPN.
- Inbound a VPS2:
  - TODO cerrado desde Internet.
  - SSH solo desde IP admin o VPN.
  - Permitir trafico interno desde VPS1 -> VPS2: `BACKEND_PORT` (IP privada).
- DB:
  - Permitir solo desde la IP privada de VPS2.

## Variables de entorno (fuera del repo)
- VPS1: `/etc/kenetg/edge.env` (basado en `edge/.env.example`)
- VPS2: `/etc/kenetg/backend.env` (basado en `backend/.env.example`)
- Nunca commitear `.env` reales.

### Variables clave
- `EDGE_WEB_ROOT`: raiz de estaticos en VPS1 (ej: `/var/www/kenetg/web`).
- `EDGE_SERVER_NAME`: dominio publico.
- `BACKEND_PRIVATE_IP`: IP privada de VPS2.
- `BACKEND_PORT`: puerto privado del backend.
- `BACKEND_BIND_HOST`: IP privada o `127.0.0.1` segun topologia.

## Despliegue VPS1 (EDGE)
1) Clonar repo:
   - `git clone https://github.com/<org>/<repo>.git`
2) Crear env:
   - `sudo mkdir -p /etc/kenetg`
   - `sudo cp edge/.env.example /etc/kenetg/edge.env`
   - Editar `/etc/kenetg/edge.env`
3) Ejecutar deploy:
   - `chmod +x edge/scripts/deploy.sh`
   - `bash edge/scripts/deploy.sh`
4) Validar:
   - `sudo nginx -t`
   - `sudo systemctl reload nginx`

## Despliegue VPS2 (BACKEND)
1) Clonar repo:
   - `git clone https://github.com/<org>/<repo>.git`
2) Crear env:
   - `sudo mkdir -p /etc/kenetg`
   - `sudo cp backend/.env.example /etc/kenetg/backend.env`
   - Editar `/etc/kenetg/backend.env`
2.1) Crear usuario de servicio (si no existe):
   - `sudo useradd -r -s /usr/sbin/nologin kenetg`
3) Ejecutar deploy:
   - `chmod +x backend/scripts/deploy.sh`
   - `bash backend/scripts/deploy.sh`
4) Validar:
   - `sudo systemctl status kenetg-backend --no-pager`
   - `curl http://BACKEND_BIND_HOST:BACKEND_PORT/api/health`

## Notas operativas
- Requisitos: `nginx` en VPS1, `python3` en VPS2.
- Si usas Nginx en VPS2, manten el backend en `127.0.0.1` y deja Nginx escuchando en IP privada.
- Si no usas Nginx en VPS2, setea `BACKEND_BIND_HOST` a la IP privada de la VM.
- Ajusta `BACKEND_PRIVATE_IP` en EDGE para apuntar a la IP privada de VPS2.
