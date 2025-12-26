#!/usr/bin/env python3
from __future__ import annotations

import json
import os
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any, Dict


def json_bytes(payload: Dict[str, Any]) -> bytes:
    return json.dumps(payload, ensure_ascii=True).encode("utf-8")


class ApiHandler(BaseHTTPRequestHandler):
    def _send(self, status: int, payload: Dict[str, Any]) -> None:
        body = json_bytes(payload)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler expects this name
        path = self.path.split("?", 1)[0]

        if path == "/api/health":
            self._send(
                HTTPStatus.OK,
                {
                    "status": "ok",
                    "service": "kenetg-backend",
                },
            )
            return

        if path.startswith("/api/analytics"):
            self._send(
                HTTPStatus.OK,
                {
                    "status": "ok",
                    "message": "analytics stub (login disabled)",
                },
            )
            return

        if path.startswith("/api/blog"):
            self._send(
                HTTPStatus.OK,
                {
                    "status": "ok",
                    "message": "blog stub (login disabled)",
                },
            )
            return

        if path.startswith("/api/"):
            self._send(
                HTTPStatus.OK,
                {
                    "status": "ok",
                    "message": "api stub",
                },
            )
            return

        self._send(
            HTTPStatus.NOT_FOUND,
            {
                "status": "error",
                "message": "not found",
            },
        )

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A002
        return


def main() -> None:
    host = os.getenv("BACKEND_BIND_HOST", "127.0.0.1")
    port = int(os.getenv("BACKEND_PORT", "8080"))

    server = HTTPServer((host, port), ApiHandler)
    print(f"kenetg-backend listening on http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
