from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml


DATA_DIR = Path(__file__).resolve().parents[1] / "data"


def load_yaml(relative_path: str) -> list[dict[str, Any]]:
    file_path = DATA_DIR / relative_path

    with file_path.open("r", encoding="utf-8") as file:
        data = yaml.safe_load(file) or []

    if not isinstance(data, list):
        raise ValueError(f"YAML 数据格式错误，应为列表: {file_path}")

    return data
