"""Minimal ux-ping mock server for CI smoke tests.
Listens on 127.0.0.1:8765 and 127.0.0.1:8877, responds {"ok": true} to /ux-ping.
"""
from http.server import BaseHTTPRequestHandler, HTTPServer
import json, threading, time, sys


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _ok(self):
        body = json.dumps({"ok": True, "port": self.server.server_port}).encode()
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        try:
            self.wfile.write(body)
        except Exception:
            pass

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if "/ux-ping" in self.path:
            self._ok()
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        if length:
            self.rfile.read(length)
        if "/ux-ping" in self.path:
            self._ok()
        else:
            self.send_response(404)
            self.end_headers()


def serve(port):
    srv = HTTPServer(("127.0.0.1", port), Handler)
    print(f"ux-ping ready on port {port}", flush=True)
    srv.serve_forever()


if __name__ == "__main__":
    ports = [8765, 8877]
    for p in ports:
        t = threading.Thread(target=serve, args=(p,), daemon=True)
        t.start()
    print("ux-ping servers started on ports:", ports, flush=True)
    try:
        while True:
            time.sleep(60)
    except (KeyboardInterrupt, SystemExit):
        sys.exit(0)
