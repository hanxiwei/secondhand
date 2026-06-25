from __future__ import annotations

import allure
import pytest

from qa.api.base.assertions import assert_status_code
from qa.api.base.http_client import ApiClient


def _find_order(order_list: list[dict], order_id: str) -> dict:
    for item in order_list:
        if item["id"] == order_id:
            return item

    raise AssertionError(f"未在订单列表中找到订单 {order_id}")


@pytest.mark.api
@pytest.mark.smoke
@allure.feature("订单模块")
def test_order_full_flow(create_test_product, create_order_for_product, seller_token, buyer_token):
    product = create_test_product()
    order = create_order_for_product(product["id"], remark="自动化测试完整流转")

    seller_client = ApiClient()
    seller_client.set_token(seller_token)
    buyer_client = ApiClient()
    buyer_client.set_token(buyer_token)

    seller_orders_before_confirm = seller_client.get("/orders/my")
    assert_status_code(seller_orders_before_confirm, 200)
    seller_order = _find_order(seller_orders_before_confirm.json()["list"], order["id"])
    assert seller_order["role"] == "seller"
    assert seller_order["status"] == 0
    assert seller_order["canConfirm"] is True

    confirm_response = seller_client.patch(f"/orders/{order['id']}/confirm")
    assert_status_code(confirm_response, 200)

    seller_orders_after_confirm = seller_client.get("/orders/my")
    assert_status_code(seller_orders_after_confirm, 200)
    confirmed_order = _find_order(seller_orders_after_confirm.json()["list"], order["id"])
    assert confirmed_order["status"] == 1
    assert confirmed_order["canComplete"] is True

    complete_response = seller_client.patch(f"/orders/{order['id']}/complete")
    assert_status_code(complete_response, 200)

    buyer_orders_after_complete = buyer_client.get("/orders/my")
    assert_status_code(buyer_orders_after_complete, 200)
    completed_order = _find_order(buyer_orders_after_complete.json()["list"], order["id"])
    assert completed_order["role"] == "buyer"
    assert completed_order["status"] == 2


@pytest.mark.api
@allure.feature("订单模块")
def test_order_cancel_and_clear(create_test_product, create_order_for_product, buyer_token):
    product = create_test_product(title="自动化取消订单测试商品")
    order = create_order_for_product(product["id"], remark="自动化测试取消流转")

    buyer_client = ApiClient()
    buyer_client.set_token(buyer_token)

    cancel_response = buyer_client.patch(f"/orders/{order['id']}/cancel")
    assert_status_code(cancel_response, 200)

    buyer_orders_after_cancel = buyer_client.get("/orders/my")
    assert_status_code(buyer_orders_after_cancel, 200)
    canceled_order = _find_order(buyer_orders_after_cancel.json()["list"], order["id"])
    assert canceled_order["status"] == 3
    assert canceled_order["canCancel"] is False

    clear_response = buyer_client.post("/orders/clear-canceled")
    assert_status_code(clear_response, 201)
    clear_data = clear_response.json()
    assert clear_data["count"] >= 1
