from __future__ import annotations

import pytest
from playwright.sync_api import Page, expect

from qa.config_loader import load_test_config
from qa.ui.pages.login_page import LoginPage


@pytest.mark.ui
@pytest.mark.smoke
def test_login_success_flow(page: Page):
    config = load_test_config()
    buyer = config["accounts"]["buyer"]

    login_page = LoginPage(page)
    login_page.open_login()
    login_page.login(buyer["username"], buyer["password"])

    expect(page).to_have_url(f"{config['web']['base_url'].rstrip('/')}/")
