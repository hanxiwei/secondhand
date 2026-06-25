from __future__ import annotations

from playwright.sync_api import Locator, Page, expect

from qa.ui.pages.base_page import BasePage


class HomePage(BasePage):
    def __init__(self, page: Page) -> None:
        super().__init__(page)
        self.search_input: Locator = page.locator('input[placeholder*="搜索"]')
        self.search_button: Locator = page.locator("button", has_text="搜索")
        self.product_cards: Locator = page.locator(".product-card")

    def open_home(self) -> None:
        self.open("/")
        expect(self.search_input).to_be_visible()

    def search(self, keyword: str) -> None:
        self.search_input.fill(keyword)
        self.search_button.click()

    def product_count(self) -> int:
        self.product_cards.first.wait_for(state="visible")
        return self.product_cards.count()

    def any_card_contains(self, keyword: str) -> bool:
        titles = self.page.locator(".product-card h3")
        total = titles.count()

        for index in range(total):
            if keyword in titles.nth(index).inner_text():
                return True

        return False
