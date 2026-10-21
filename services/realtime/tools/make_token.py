"""Genera un JWT de prueba para probar el protocolo (no genera posiciones ni movimiento).

Uso: WS_JWT_SECRET=... python tools/make_token.py --role gps --user u1
     WS_JWT_SECRET=... python tools/make_token.py --role map --user u2 --allow u1,u3
"""
import argparse
import os
import sys
import time

import jwt

p = argparse.ArgumentParser()
p.add_argument("--role", choices=["gps", "map"], required=True)
p.add_argument("--user", required=True)
p.add_argument("--allow", default="", help="ids separados por coma (solo role=map)")
p.add_argument("--ttl", type=int, default=300, help="segundos de vigencia")
a = p.parse_args()

secret = os.environ.get("WS_JWT_SECRET")
if not secret:
    sys.exit("Define WS_JWT_SECRET en el entorno.")
claims = {"sub": a.user, "role": a.role, "exp": int(time.time()) + a.ttl}
if a.role == "map":
    claims["allow"] = [x for x in a.allow.split(",") if x]
print(jwt.encode(claims, secret, algorithm="HS256"))
