from __future__ import annotations

from playwright.sync_api import Page

from qa.config_loader import load_test_config


class BasePage:
    def __init__(self, page: Page) -> None:
        self.page = page
        self.config = load_test_config()
        self.base_url = self.config["web"]["base_url"].rstrip("/")

    def open(self, path: str = "/") -> None:
        self.page.goto(f"{self.base_url}{path}")
