#!/usr/bin/env python3
"""Generate private MediaMTX config without printing password or hash."""
import base64
import hashlib
import os
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
SECRET = HERE / "secrets" / "mediamtx.yml"
TEMPLATE = HERE / "mediamtx.yml.template"

def main():
    password = os.environ.get("TVATTUAL_PUBLISH_PASSWORD", "")
    if len(password) < 24 or any(c.isspace() for c in password):
        sys.exit("Defina TVATTUAL_PUBLISH_PASSWORD com ao menos 24 caracteres, sem espacos.")
    if SECRET.exists():
        sys.exit("Config ja existe; parada segura. Nao sobrescrevemos segredos.")
    digest = base64.b64encode(hashlib.sha256(password.encode("utf-8")).digest()).decode("ascii")
    content = TEMPLATE.read_text(encoding="utf-8").replace("__PASSWORD_SHA256_BASE64__", digest)
    if "__PASSWORD_" in content:
        sys.exit("Template incompleto.")
    SECRET.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chmod(SECRET.parent, 0o700)
    fd = os.open(SECRET, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write(content)
    print("Config gerada com seguranca; senha nao exibida.")

if __name__ == "__main__":
    main()
