from __future__ import annotations

from uuid import uuid4

from qa.api.base.assertions import assert_status_code
from qa.api.base.http_client import ApiClient


def login_and_get_token(account: str, password: str) -> str:
    client = ApiClient()
    response = client.post("/auth/login", json={"account": account, "password": password})
    response.raise_for_status()
    return response.json()["token"]


def get_active_category_id() -> int:
    client = ApiClient()
    response = client.get("/categories/tree")
    response.raise_for_status()
    categories = response.json()

    if not categories:
        raise AssertionError("当前环境没有可用分类")

    return int(categories[0]["id"])


def create_product_for_seller(token: str, **overrides) -> dict:
    client = ApiClient()
    client.set_token(token)
    payload = {
        "categoryId": get_active_category_id(),
        "title": f"UI自动化测试商品-{uuid4().hex[:8]}",
        "description": "供 UI 自动化下单流程使用的临时测试商品。",
        "price": 59.9,
        "originalPrice": 99.0,
        "conditionLevel": 4,
        "campus": "主校区",
        "tradeMethod": 1,
        "contactInfo": "站内私信",
        "imageUrls": [],
    }
    payload.update(overrides)
    response = client.post("/products", json=payload)
    assert_status_code(response, 201)
    data = response.json()
    return {"id": data["id"], "payload": payload}


def delete_product_by_id(token: str, product_id: str) -> None:
    client = ApiClient()
    client.set_token(token)
    client.request("DELETE", f"/products/{product_id}")


def clear_canceled_orders(token: str) -> None:
    client = ApiClient()
    client.set_token(token)
    client.post("/orders/clear-canceled")
