from __future__ import annotations

import subprocess
import sys
from datetime import datetime
import os
from pathlib import Path
from urllib.parse import urlsplit

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from qa.config_loader import load_test_config


def get_perf_host(api_base_url: str) -> str:
    parsed = urlsplit(api_base_url.rstrip("/"))
    return f"{parsed.scheme}://{parsed.netloc}"


def main() -> None:
    config = load_test_config()
    api_base_url = str(config.get("api", {}).get("base_url", "http://127.0.0.1:3000/api"))
    perf_config = config.get("performance", {})

    users = int(os.getenv("PERF_USERS", perf_config.get("users", 10)))
    spawn_rate = float(os.getenv("PERF_SPAWN_RATE", perf_config.get("spawn_rate", 2)))
    run_time = str(os.getenv("PERF_RUN_TIME", perf_config.get("run_time", "1m")))

    reports_dir = ROOT_DIR / "qa" / "reports" / "perf"
    reports_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    html_report = reports_dir / f"locust-report-{timestamp}.html"
    csv_prefix = reports_dir / f"locust-report-{timestamp}"

    command = [
        sys.executable,
        "-m",
        "locust",
        "-f",
        str(ROOT_DIR / "qa" / "perf" / "locustfile.py"),
        "--host",
        get_perf_host(api_base_url),
        "--headless",
        "-u",
        str(users),
        "-r",
        str(spawn_rate),
        "--run-time",
        run_time,
        "--html",
        str(html_report),
        "--csv",
        str(csv_prefix),
    ]

    print("执行 Locust 压测命令:")
    print(" ".join(command))
    subprocess.run(command, cwd=ROOT_DIR, check=True)
    print(f"性能测试完成，HTML 报告: {html_report}")


if __name__ == "__main__":
    main()
