#!/usr/bin/env python3
"""
Ressincroniza sequences do Postgres com o MAX(id) existente.

Útil após restore/seed quando o cadastro começa a falhar com:
  duplicate key value violates unique constraint "users_pkey"

Uso:
  python fix_sequences.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.db import sync_users_id_sequence


def main() -> None:
    sync_users_id_sequence()
    print("[OK] users_id_seq sincronizada com MAX(users.id)")


if __name__ == "__main__":
    main()

