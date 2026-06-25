from __future__ import annotations

from playwright.sync_api import Locator, Page, expect

from qa.ui.pages.base_page import BasePage


class ProductDetailPage(BasePage):
    def __init__(self, page: Page) -> None:
        super().__init__(page)
        self.title: Locator = page.locator(".detail-title")
        self.contact_textarea: Locator = page.locator(".detail-contact-textarea")
        self.contact_button: Locator = page.locator("button", has_text="联系卖家")
        self.purchase_button: Locator = page.locator("button", has_text="发起购买意向")
        self.tip_text: Locator = page.locator(".detail-tip")

    def open_detail(self, product_id: str) -> None:
        self.open(f"/products/{product_id}")
        expect(self.title).to_be_visible()

    def create_purchase_intent(self, remark: str) -> None:
        self.contact_textarea.fill(remark)
        self.purchase_button.click()

    def contact_seller(self, message: str) -> None:
        self.contact_textarea.fill(message)
        self.contact_button.click()

    def wait_tip(self, expected_text: str) -> None:
        expect(self.tip_text).to_contain_text(expected_text)
