#!/usr/bin/env python3
"""Utility script to prep and run the Lifecaller dev stack.

Steps:
1. Run Django migrations.
2. Build the frontend assets (Vite).
3. Start the Django dev server on 0.0.0.0:5344.
4. Start the Vite dev server with `npm run dev -- --host`.

Stop both servers with Ctrl+C.
"""

from __future__ import annotations

import platform
import signal
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "lifecaller"

IS_WINDOWS = platform.system() == "Windows"
PYTHON_PATH = ROOT / ".venv" / ("Scripts" if IS_WINDOWS else "bin") / ("python.exe" if IS_WINDOWS else "python")
NPM_COMMAND = "npm.cmd" if IS_WINDOWS else "npm"


def run(cmd: list[str], cwd: Path) -> None:
    print(f"\n→ Running {' '.join(cmd)} (cwd={cwd})")
    subprocess.run(cmd, cwd=cwd, check=True)


def main() -> None:
    if not PYTHON_PATH.exists():
        print("Python virtualenv not found at", PYTHON_PATH)
        sys.exit(1)

    run([str(PYTHON_PATH), "manage.py", "migrate"], BACKEND_DIR)
    run([NPM_COMMAND, "run", "build"], FRONTEND_DIR)

    back_proc = subprocess.Popen([str(PYTHON_PATH), "manage.py", "runserver", "0.0.0.0:5344"], cwd=BACKEND_DIR)
    front_proc = subprocess.Popen([NPM_COMMAND, "run", "dev", "--", "--host"], cwd=FRONTEND_DIR)

    print("\n✅ Backend and frontend dev servers are running.")
    print("   Backend: http://127.0.0.1:5344/")
    print("   Frontend: http://127.0.0.1:5173/")
    print("Press Ctrl+C to stop both servers.")

    try:
        back_proc.wait()
    except KeyboardInterrupt:
        pass
    finally:
        for proc in (back_proc, front_proc):
            if proc.poll() is None:
                if IS_WINDOWS:
                    proc.send_signal(signal.CTRL_BREAK_EVENT)
                else:
                    proc.terminate()
        for proc in (back_proc, front_proc):
            try:
                proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                proc.kill()


if __name__ == "__main__":
    main()
