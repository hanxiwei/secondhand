from __future__ import annotations

from playwright.sync_api import Locator, Page, expect

from qa.ui.pages.base_page import BasePage


class OrdersPage(BasePage):
    def __init__(self, page: Page) -> None:
        super().__init__(page)
        self.page_title: Locator = page.locator("h2", has_text="我的订单")
        self.order_cards: Locator = page.locator(".order-card")

    def open_orders(self) -> None:
        self.open("/orders")
        expect(self.page_title).to_be_visible()

    def card_by_title(self, title: str) -> Locator:
        return self.page.locator(".order-card").filter(has_text=title).first

    def wait_order_visible(self, title: str) -> None:
        expect(self.card_by_title(title)).to_be_visible()

    def has_action(self, title: str, action_text: str) -> bool:
        return self.card_by_title(title).locator("button", has_text=action_text).count() > 0

    def click_action(self, title: str, action_text: str) -> None:
        self.card_by_title(title).locator("button", has_text=action_text).click()

    def role_text(self, title: str) -> str:
        return self.card_by_title(title).locator(".order-info-grid p").first.inner_text()

    def status_text(self, title: str) -> str:
        return self.card_by_title(title).locator(".product-tag").inner_text()

    def wait_action_visible(self, title: str, action_text: str) -> None:
        expect(self.card_by_title(title).locator("button", has_text=action_text)).to_be_visible()

    def wait_status_text(self, title: str, expected_text: str) -> None:
        expect(self.card_by_title(title).locator(".product-tag")).to_have_text(expected_text)
