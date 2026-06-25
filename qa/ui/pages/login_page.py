from __future__ import annotations

from playwright.sync_api import Locator, Page, expect

from qa.ui.pages.base_page import BasePage


class LoginPage(BasePage):
    def __init__(self, page: Page) -> None:
        super().__init__(page)
        self.account_input: Locator = page.locator('input[placeholder*="用户名"]')
        self.password_input: Locator = page.locator('input[type="password"]')
        self.submit_button: Locator = page.locator("button", has_text="立即登录")
        self.message_text: Locator = page.locator(".form-message")

    def open_login(self) -> None:
        self.open("/login")
        expect(self.account_input).to_be_visible()

    def login(self, account: str, password: str) -> None:
        self.account_input.fill(account)
        self.password_input.fill(password)
        self.submit_button.click()

    def wait_login_success(self) -> None:
        expect(self.page).to_have_url(f"{self.base_url}/")

    def wait_error_message(self, expected_text: str) -> None:
        expect(self.message_text).to_contain_text(expected_text)
