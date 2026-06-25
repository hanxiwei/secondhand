from __future__ import annotations

from typing import Any


def assert_status_code(response, expected_status: int) -> None:
    assert (
        response.status_code == expected_status
    ), f"状态码不符合预期，实际 {response.status_code}，预期 {expected_status}，响应体: {response.text}"


def assert_json_contains(data: dict[str, Any], expected: dict[str, Any]) -> None:
    for key, value in expected.items():
        assert data.get(key) == value, f"字段 {key} 断言失败，实际 {data.get(key)!r}，预期 {value!r}"


def assert_text_contains(text: str, expected_text: str) -> None:
    assert expected_text in text, f"文本断言失败，未找到 {expected_text!r}，实际内容: {text!r}"
