from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml


ROOT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG_PATH = ROOT_DIR / "qa" / "config" / "env.yaml"
EXAMPLE_CONFIG_PATH = ROOT_DIR / "qa" / "config" / "env.example.yaml"


@lru_cache(maxsize=1)
def load_test_config(config_path: str | None = None) -> dict[str, Any]:
    path = Path(config_path) if config_path else DEFAULT_CONFIG_PATH

    if not path.exists():
        raise FileNotFoundError(
            f"未找到测试配置文件: {path}，请先复制 {EXAMPLE_CONFIG_PATH.name} 为 env.yaml 并补充配置。"
        )

    with path.open("r", encoding="utf-8") as file:
        data = yaml.safe_load(file) or {}

    return data
