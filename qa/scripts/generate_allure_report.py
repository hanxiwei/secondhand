from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from qa.config_loader import load_test_config


def main() -> None:
    config = load_test_config()
    report_config = config.get("report", {})
    results_dir = ROOT_DIR / report_config.get("allure_results_dir", "allure-results")
    report_dir = ROOT_DIR / report_config.get("allure_report_dir", "allure-report")

    allure_cmd = shutil.which("allure")
    if not allure_cmd:
        print("未检测到 Allure CLI，请先安装 Allure Commandline 后再生成 HTML 报告。")
        print(f"结果目录已保留: {results_dir}")
        return

    command = [allure_cmd, "generate", str(results_dir), "-o", str(report_dir), "--clean"]
    subprocess.run(command, cwd=ROOT_DIR, check=True)
    print(f"Allure HTML 报告已生成: {report_dir}")


if __name__ == "__main__":
    main()
