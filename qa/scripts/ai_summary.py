from __future__ import annotations

import json
import os
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any
from datetime import datetime, timezone

import requests

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from qa.config_loader import load_test_config

DEFAULT_RESULTS_DIR = ROOT_DIR / "allure-results"
DEFAULT_OUTPUT_PATH = ROOT_DIR / "qa" / "reports" / "summary.json"
DEFAULT_MARKDOWN_PATH = ROOT_DIR / "qa" / "reports" / "deepseek-report.md"
DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com"
DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash"

FAILURE_RULES = {
    "超时问题": [r"timeout", r"timed out", r"TimeoutError"],
    "服务端异常": [r"500", r"Internal Server Error", r"Traceback", r"SQL", r"Exception"],
    "环境问题": [r"connection refused", r"ECONNREFUSED", r"not reachable", r"环境"],
    "断言失败": [r"AssertionError", r"assert ", r"断言"],
}

DEEPSEEK_SYSTEM_PROMPT = """你是一名资深测试开发负责人，负责阅读自动化测试执行结果并产出正式的中文测试报告。

请严格遵守以下要求：
1. 只能基于输入数据分析，不要虚构不存在的原因、模块、环境或风险。
2. 输出面向研发团队和项目负责人，语气专业、客观、简洁。
3. 重点突出：执行概况、失败分布、主要风险、排查建议、是否建议发布。
4. 如果失败主要是环境问题，要明确指出是环境阻塞，不要误判为功能缺陷。
5. 如果全部通过，也要给出简短结论和后续建议。
6. 最终必须输出 Markdown，且固定包含以下一级标题：
   # 测试执行报告
   ## 执行概况
   ## 风险判断
   ## 失败归因
   ## 处理建议
   ## 发布建议
7. 在“发布建议”中只能给出以下三种之一：建议发布 / 有条件发布 / 暂不发布。
"""


def classify_failure(message: str) -> str:
    normalized = message or ""

    for category, patterns in FAILURE_RULES.items():
        if any(re.search(pattern, normalized, flags=re.IGNORECASE) for pattern in patterns):
            return category

    return "未分类问题"


def build_local_markdown_report(summary: dict[str, Any]) -> str:
    failed_cases = summary.get("failed_cases", [])
    failed_lines = "\n".join(
        f"- `{item['module']}` / `{item['name']}` / {item['category']}" for item in failed_cases[:5]
    )
    if not failed_lines:
        failed_lines = "- 无"

    failure_categories = summary.get("failure_categories", {})
    if failure_categories:
        category_lines = "\n".join(f"- {key}: {value}" for key, value in failure_categories.items())
    else:
        category_lines = "- 无失败"

    failed = summary.get("failed", 0)
    pass_rate = summary.get("pass_rate", 0)
    if failed == 0:
        release_advice = "建议发布"
        risk_line = "本次自动化执行未发现失败用例，核心流程表现稳定。"
    elif "环境问题" in failure_categories and len(failure_categories) == 1:
        release_advice = "有条件发布"
        risk_line = "当前失败主要由环境问题引起，建议先修复环境并复跑后再确认发布。"
    elif pass_rate >= 90:
        release_advice = "有条件发布"
        risk_line = "存在少量失败用例，建议优先排查高频失败模块和 P0 用例后再决定发布。"
    else:
        release_advice = "暂不发布"
        risk_line = "失败比例偏高，当前质量风险较大，不建议直接发布。"

    report_url = summary.get("report_url", "")
    ai_report_url = summary.get("ai_report_url", "")
    report_line = f"- Allure 报告：{report_url}" if report_url else "- Allure 报告：未配置"
    ai_report_line = f"- AI 报告：{ai_report_url}" if ai_report_url else "- AI 报告：未配置"

    return (
        "# 测试执行报告\n\n"
        "## 执行概况\n"
        f"- 项目名称：{summary.get('project_name', '自动化测试项目')}\n"
        f"- 生成时间：{summary.get('generated_at', '未知')}\n"
        f"- 总用例数：{summary.get('total', 0)}\n"
        f"- 通过数：{summary.get('passed', 0)}\n"
        f"- 失败数：{summary.get('failed', 0)}\n"
        f"- 通过率：{summary.get('pass_rate', 0)}%\n"
        f"{report_line}\n"
        f"{ai_report_line}\n\n"
        "## 风险判断\n"
        f"- {risk_line}\n\n"
        "## 失败归因\n"
        f"{category_lines}\n\n"
        "- 典型失败用例：\n"
        f"{failed_lines}\n\n"
        "## 处理建议\n"
        "- 优先排查失败数量最多的模块，并结合 Allure 报告查看完整堆栈。\n"
        "- 对环境问题与真实功能缺陷分开处理，避免误判。\n"
        "- 修复后重新执行自动化，确认失败是否收敛。\n\n"
        "## 发布建议\n"
        f"- {release_advice}\n"
    )


def get_deepseek_config(config: dict[str, Any]) -> dict[str, Any]:
    deepseek_config = config.get("deepseek", {})
    return {
        "enabled": deepseek_config.get("enabled", False),
        "base_url": os.getenv("DEEPSEEK_BASE_URL", deepseek_config.get("base_url", DEFAULT_DEEPSEEK_BASE_URL)),
        "model": os.getenv("DEEPSEEK_MODEL", deepseek_config.get("model", DEFAULT_DEEPSEEK_MODEL)),
        "api_key": os.getenv("DEEPSEEK_API_KEY", deepseek_config.get("api_key", "")),
        "temperature": deepseek_config.get("temperature", 0.3),
        "max_tokens": deepseek_config.get("max_tokens", 1200),
        "timeout": deepseek_config.get("timeout", 30),
    }


def build_deepseek_user_prompt(summary: dict[str, Any]) -> str:
    payload = {
        "project_name": summary.get("project_name"),
        "generated_at": summary.get("generated_at"),
        "total": summary.get("total"),
        "passed": summary.get("passed"),
        "failed": summary.get("failed"),
        "pass_rate": summary.get("pass_rate"),
        "module_distribution": summary.get("module_distribution"),
        "failure_categories": summary.get("failure_categories"),
        "failed_cases": summary.get("failed_cases"),
        "report_url": summary.get("report_url"),
        "ai_report_url": summary.get("ai_report_url"),
    }
    return (
        "请根据以下自动化测试摘要生成正式中文测试报告，输出 Markdown。\n\n"
        "输入数据如下：\n"
        f"{json.dumps(payload, ensure_ascii=False, indent=2)}\n"
    )


def call_deepseek_report(summary: dict[str, Any], config: dict[str, Any]) -> tuple[str | None, str | None]:
    deepseek_config = get_deepseek_config(config)
    if not deepseek_config["enabled"]:
        return None, "DeepSeek 未启用，已使用本地规则报告。"
    if not deepseek_config["api_key"]:
        return None, "未配置 DeepSeek API Key，已使用本地规则报告。"

    endpoint = f"{str(deepseek_config['base_url']).rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {deepseek_config['api_key']}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": deepseek_config["model"],
        "temperature": deepseek_config["temperature"],
        "max_tokens": deepseek_config["max_tokens"],
        "messages": [
            {"role": "system", "content": DEEPSEEK_SYSTEM_PROMPT},
            {"role": "user", "content": build_deepseek_user_prompt(summary)},
        ],
    }

    response = requests.post(
        endpoint,
        headers=headers,
        json=payload,
        timeout=deepseek_config["timeout"],
    )
    response.raise_for_status()
    data = response.json()
    content = (
        data.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
        .strip()
    )
    if not content:
        raise ValueError("DeepSeek 返回内容为空")
    return content, None


def build_report_excerpt(report_text: str, max_lines: int = 4) -> str:
    lines = [line.strip() for line in report_text.splitlines() if line.strip()]
    cleaned = [line for line in lines if not line.startswith("#")]
    return "\n".join(cleaned[:max_lines])


def build_summary(results_dir: Path) -> dict[str, Any]:
    config = load_test_config()
    project_config = config.get("project", {})
    report_config = config.get("report", {})
    report_url = os.getenv("REPORT_URL", report_config.get("report_url", ""))
    ai_report_url = os.getenv("AI_REPORT_URL", "")
    total = 0
    passed = 0
    failed = 0
    failure_categories: Counter[str] = Counter()
    module_distribution: Counter[str] = Counter()
    failed_cases: list[dict[str, str]] = []

    for file_path in results_dir.glob("*-result.json"):
        with file_path.open("r", encoding="utf-8") as file:
            data = json.load(file)

        total += 1
        status = data.get("status", "unknown")
        full_name = data.get("fullName", data.get("name", file_path.name))
        module_name = full_name.split(".")[0]
        module_distribution[module_name] += 1

        if status == "passed":
            passed += 1
            continue

        if status in {"failed", "broken"}:
            failed += 1
            detail = data.get("statusDetails", {}) or {}
            message = detail.get("message", "") or detail.get("trace", "")
            category = classify_failure(message)
            failure_categories[category] += 1
            failed_cases.append(
                {
                    "name": data.get("name", "未命名用例"),
                    "module": module_name,
                    "category": category,
                    "message": message[:300],
                }
            )

    pass_rate = round((passed / total) * 100, 2) if total else 0

    return {
        "project_name": project_config.get("name", "自动化测试项目"),
        "report_name": project_config.get("report_name", "自动化测试报告"),
        "generated_at": datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds"),
        "total": total,
        "passed": passed,
        "failed": failed,
        "pass_rate": pass_rate,
        "module_distribution": dict(module_distribution),
        "failure_categories": dict(failure_categories),
        "failed_cases": failed_cases[:10],
        "report_url": report_url,
        "ai_report_url": ai_report_url,
    }


def ensure_parent_dir(file_path: Path) -> None:
    file_path.parent.mkdir(parents=True, exist_ok=True)


def main() -> None:
    config = load_test_config()
    report_config = config.get("report", {})
    results_dir = ROOT_DIR / report_config.get("allure_results_dir", str(DEFAULT_RESULTS_DIR.name))
    output_path = DEFAULT_OUTPUT_PATH

    summary = build_summary(results_dir)
    local_report = build_local_markdown_report(summary)

    llm_report = None
    llm_error = None
    try:
        llm_report, llm_error = call_deepseek_report(summary, config)
    except Exception as exc:
        llm_error = f"DeepSeek 生成报告失败：{exc}"

    final_report = llm_report or local_report
    summary["report_markdown_path"] = str(DEFAULT_MARKDOWN_PATH.relative_to(ROOT_DIR))
    summary["llm_enabled"] = bool(config.get("deepseek", {}).get("enabled", False))
    summary["llm_report_used"] = bool(llm_report)
    summary["llm_error"] = llm_error or ""
    summary["llm_brief"] = build_report_excerpt(final_report)

    ensure_parent_dir(output_path)
    ensure_parent_dir(DEFAULT_MARKDOWN_PATH)
    output_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    DEFAULT_MARKDOWN_PATH.write_text(final_report, encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print(f"测试报告已输出: {DEFAULT_MARKDOWN_PATH}")


if __name__ == "__main__":
    main()
