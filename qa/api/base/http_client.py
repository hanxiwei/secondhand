from __future__ import annotations

from typing import Any

import requests

from qa.config_loader import load_test_config


class ApiClient:
    def __init__(self, base_url: str | None = None, timeout: int | None = None) -> None:
        config = load_test_config()
        api_config = config.get("api", {})
        self.base_url = (base_url or api_config.get("base_url", "")).rstrip("/")
        self.timeout = timeout or api_config.get("timeout", 10)
        self.session = requests.Session()

    def set_token(self, token: str | None) -> None:
        if token:
            self.session.headers.update({"Authorization": f"Bearer {token}"})
        else:
            self.session.headers.pop("Authorization", None)

    def request(self, method: str, path: str, **kwargs: Any) -> requests.Response:
        url = f"{self.base_url}/{path.lstrip('/')}"
        kwargs.setdefault("timeout", self.timeout)
        return self.session.request(method=method, url=url, **kwargs)

    def get(self, path: str, **kwargs: Any) -> requests.Response:
        return self.request("GET", path, **kwargs)

    def post(self, path: str, **kwargs: Any) -> requests.Response:
        return self.request("POST", path, **kwargs)

    def patch(self, path: str, **kwargs: Any) -> requests.Response:
        return self.request("PATCH", path, **kwargs)
