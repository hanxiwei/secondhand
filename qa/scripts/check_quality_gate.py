from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from qa.config_loader import load_test_config

SUMMARY_PATH = ROOT_DIR / "qa" / "reports" / "summary.json"


def main() -> None:
    config = load_test_config()
    quality_gate = config.get("quality_gate", {})
    min_pass_rate = float(quality_gate.get("min_pass_rate", 90))
    allow_failed_cases = int(quality_gate.get("allow_failed_cases", 0))

    if not SUMMARY_PATH.exists():
        raise FileNotFoundError(f"未找到测试摘要文件: {SUMMARY_PATH}")

    with SUMMARY_PATH.open("r", encoding="utf-8") as file:
        summary = json.load(file)

    pass_rate = float(summary.get("pass_rate", 0))
    failed = int(summary.get("failed", 0))

    if pass_rate < min_pass_rate or failed > allow_failed_cases:
        raise SystemExit(
            f"质量门禁未通过: 通过率 {pass_rate}% / 最低要求 {min_pass_rate}% ; "
            f"失败数 {failed} / 允许上限 {allow_failed_cases}"
        )

    print(
        f"质量门禁通过: 通过率 {pass_rate}% / 最低要求 {min_pass_rate}% ; "
        f"失败数 {failed} / 允许上限 {allow_failed_cases}"
    )


if __name__ == "__main__":
    main()
