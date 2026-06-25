from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[2]
ALLURE_RESULTS_DIR = ROOT_DIR / "allure-results"


def run_command(command: list[str]) -> None:
    subprocess.run(command, cwd=ROOT_DIR, check=True)


def main() -> None:
    if ALLURE_RESULTS_DIR.exists():
        shutil.rmtree(ALLURE_RESULTS_DIR)

    run_command([sys.executable, "qa/scripts/run_api_tests.py"])
    run_command([sys.executable, "qa/scripts/run_ui_tests.py"])


if __name__ == "__main__":
    main()
