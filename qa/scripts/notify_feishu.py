from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import sys
import time
from pathlib import Path
from typing import Any

import requests

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from qa.config_loader import load_test_config

DEFAULT_SUMMARY_PATH = ROOT_DIR / "qa" / "reports" / "summary.json"


def load_summary(summary_path: Path) -> dict[str, Any]:
    if not summary_path.exists():
        raise FileNotFoundError(f"未找到测试摘要文件: {summary_path}")

    with summary_path.open("r", encoding="utf-8") as file:
        return json.load(file)


def build_sign(secret: str) -> tuple[str, str]:
    timestamp = str(int(time.time()))
    string_to_sign = f"{timestamp}\n{secret}"
    sign = base64.b64encode(
        hmac.new(string_to_sign.encode("utf-8"), digestmod=hashlib.sha256).digest()
    ).decode("utf-8")
    return timestamp, sign


def build_message(project_name: str, summary: dict[str, Any]) -> str:
    report_url = summary.get("report_url", "")
    ai_report_url = summary.get("ai_report_url", "")
    llm_brief = summary.get("llm_brief", "")
    summary_line = llm_brief.splitlines()[0].strip() if llm_brief else ""
    failure_categories = summary.get("failure_categories", {})
    failure_text = "，".join(f"{name} {count}" for name, count in failure_categories.items())
    failure_line = f"失败分类: {failure_text}" if failure_text else "失败分类: 无"
    links: list[str] = []
    if report_url:
        links.append(f"Allure 报告: {report_url}")
    if ai_report_url:
        links.append(f"DeepSeek 报告: {ai_report_url}")
    links_text = "\n".join(links)

    return (
        f"{project_name} 测试执行完成\n"
        f"生成时间: {summary.get('generated_at', '未知')}\n"
        f"总用例: {summary.get('total', 0)}\n"
        f"通过: {summary.get('passed', 0)}\n"
        f"失败: {summary.get('failed', 0)}\n"
        f"通过率: {summary.get('pass_rate', 0)}%\n"
        f"{failure_line}\n"
        f"摘要: {summary_line or '详见报告'}"
        f"{f'\\n{links_text}' if links_text else ''}"
    )


def send_feishu_message(webhook: str, secret: str, text: str) -> requests.Response:
    payload: dict[str, Any] = {
        "msg_type": "text",
        "content": {
            "text": text,
        },
    }

    if secret:
        timestamp, sign = build_sign(secret)
        payload["timestamp"] = timestamp
        payload["sign"] = sign

    return requests.post(webhook, json=payload, timeout=10)


def main() -> None:
    config = load_test_config()
    feishu_config = config.get("feishu", {})
    project_name = config.get("project", {}).get("name", "自动化测试项目")
    webhook = os.getenv("FEISHU_WEBHOOK", feishu_config.get("webhook", ""))
    secret = os.getenv("FEISHU_SECRET", feishu_config.get("secret", ""))

    if not webhook:
        print("未配置飞书 webhook，跳过飞书通知。")
        return

    summary = load_summary(DEFAULT_SUMMARY_PATH)
    message = build_message(project_name, summary)
    response = send_feishu_message(webhook, secret, message)
    response.raise_for_status()
    print("飞书通知发送成功")


if __name__ == "__main__":
    main()
