#!/usr/bin/env python3
"""Genera los íconos de la app (una "W" blanca sobre verde marino) sin dependencias externas.

    python3 scripts/generar-iconos.py

Escribe en public/: icons/icon-192.png, icons/icon-512.png, icons/maskable-512.png y apple-touch-icon.png.
"""
import math
import os
import struct
import zlib

BG = (7, 46, 40)        # brand-900 #072E28
FG = (255, 255, 255)
ACCENT = (227, 242, 238)  # brand-100


def png(path, size, pixels):
    raw = b"".join(b"\x00" + bytes(c for px in pixels[y * size:(y + 1) * size] for c in px) for y in range(size))
    def chunk(tag, data):
        body = tag + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)
    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
                + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


def seg_dist(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def render(size, scale):
    """`scale` encoge la W hacia el centro (el ícono 'maskable' necesita margen de seguridad)."""
    # W con trazo grueso y puntas redondeadas, en coordenadas de 0 a 1
    pts = [(0.17, 0.30), (0.34, 0.72), (0.50, 0.42), (0.66, 0.72), (0.83, 0.30)]
    pts = [(0.5 + (x - 0.5) * scale, 0.5 + (y - 0.5) * scale) for x, y in pts]
    half = 0.052 * scale
    segs = list(zip(pts, pts[1:]))
    ss = 3  # supersampling para bordes suaves
    out = []
    for yi in range(size):
        for xi in range(size):
            hits = 0
            for sy in range(ss):
                for sx in range(ss):
                    px, py = (xi + (sx + 0.5) / ss) / size, (yi + (sy + 0.5) / ss) / size
                    if min(seg_dist(px, py, a[0], a[1], b[0], b[1]) for a, b in segs) <= half:
                        hits += 1
            a = hits / (ss * ss)
            # Una barra de acento debajo, como detalle de marca
            out.append(tuple(round(BG[i] * (1 - a) + FG[i] * a) for i in range(3)))
    return out


def main():
    base = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public")
    os.makedirs(os.path.join(base, "icons"), exist_ok=True)
    for name, size, scale in [("icons/icon-512.png", 512, 1.0), ("icons/icon-192.png", 192, 1.0),
                              ("icons/maskable-512.png", 512, 0.72), ("apple-touch-icon.png", 180, 0.92)]:
        png(os.path.join(base, name), size, render(size, scale))
        print("listo", name)


if __name__ == "__main__":
    main()
