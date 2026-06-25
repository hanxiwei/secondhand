from __future__ import annotations

import pytest
from playwright.sync_api import Page

from qa.api.base.test_data_factory import create_product_for_seller, delete_product_by_id, login_and_get_token
from qa.config_loader import load_test_config
from qa.ui.pages.login_page import LoginPage
from qa.ui.pages.orders_page import OrdersPage
from qa.ui.pages.product_detail_page import ProductDetailPage


@pytest.mark.ui
def test_seller_can_confirm_and_complete_order(page: Page):
    config = load_test_config()
    seller = config["accounts"]["seller"]
    buyer = config["accounts"]["buyer"]
    seller_token = login_and_get_token(seller["username"], seller["password"])

    product = create_product_for_seller(token=seller_token)
    product_title = product["payload"]["title"]

    try:
        login_page = LoginPage(page)
        login_page.open_login()
        login_page.login(buyer["username"], buyer["password"])
        login_page.wait_login_success()

        detail_page = ProductDetailPage(page)
        detail_page.open_detail(product["id"])
        detail_page.create_purchase_intent("UI 自动化测试卖家确认与完成交易")

        orders_page = OrdersPage(page)
        orders_page.wait_order_visible(product_title)
        assert "我是买家" in orders_page.role_text(product_title)

        login_page.open_login()
        login_page.login(seller["username"], seller["password"])
        login_page.wait_login_success()

        orders_page.open_orders()
        orders_page.wait_order_visible(product_title)
        assert "我是卖家" in orders_page.role_text(product_title)
        orders_page.wait_status_text(product_title, "待确认")
        orders_page.wait_action_visible(product_title, "确认交易")

        orders_page.click_action(product_title, "确认交易")
        orders_page.wait_status_text(product_title, "交易中")
        orders_page.wait_action_visible(product_title, "完成交易")

        orders_page.click_action(product_title, "完成交易")
        orders_page.wait_status_text(product_title, "已成交")
    finally:
        delete_product_by_id(seller_token, product["id"])
