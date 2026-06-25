from __future__ import annotations

from uuid import uuid4

import pytest

from qa.api.base.http_client import ApiClient
from qa.api.base.assertions import assert_status_code
from qa.config_loader import load_test_config


@pytest.fixture(scope="session")
def test_config() -> dict:
    return load_test_config()


@pytest.fixture
def api_client() -> ApiClient:
    return ApiClient()


@pytest.fixture(scope="session")
def seller_account(test_config: dict) -> dict:
    return test_config["accounts"]["seller"]


@pytest.fixture(scope="session")
def buyer_account(test_config: dict) -> dict:
    return test_config["accounts"]["buyer"]


@pytest.fixture(scope="session")
def seller_token(test_config: dict) -> str:
    account = test_config["accounts"]["seller"]
    client = ApiClient()
    response = client.post(
        "/auth/login",
        json={"account": account["username"], "password": account["password"]},
    )
    response.raise_for_status()
    return response.json()["token"]


@pytest.fixture(scope="session")
def buyer_token(test_config: dict) -> str:
    account = test_config["accounts"]["buyer"]
    client = ApiClient()
    response = client.post(
        "/auth/login",
        json={"account": account["username"], "password": account["password"]},
    )
    response.raise_for_status()
    return response.json()["token"]


@pytest.fixture(scope="session")
def active_category_id() -> int:
    client = ApiClient()
    response = client.get("/categories/tree")
    response.raise_for_status()
    categories = response.json()

    if not categories:
        raise AssertionError("当前环境没有可用分类，无法创建测试商品")

    return int(categories[0]["id"])


@pytest.fixture
def create_test_product(seller_token: str, active_category_id: int):
    created_product_ids: list[str] = []

    def _create(**overrides) -> dict:
        client = ApiClient()
        client.set_token(seller_token)
        unique_suffix = uuid4().hex[:8]
        payload = {
            "categoryId": active_category_id,
            "title": f"自动化测试商品-{unique_suffix}",
            "description": "自动化测试临时创建的商品，用于验证下单与订单流转。",
            "price": 66.6,
            "originalPrice": 99.0,
            "conditionLevel": 4,
            "campus": "主校区",
            "tradeMethod": 1,
            "contactInfo": "站内私信",
            "imageUrls": [],
        }
        payload.update(overrides)

        response = client.post("/products", json=payload)
        data = response.json()
        if "id" in data:
            created_product_ids.append(data["id"])
        assert_status_code(response, 201)
        return {"id": data["id"], "payload": payload}

    yield _create

    cleanup_client = ApiClient()
    cleanup_client.set_token(seller_token)
    for product_id in created_product_ids:
        cleanup_client.request("DELETE", f"/products/{product_id}")


@pytest.fixture
def create_order_for_product(buyer_token: str):
    def _create(product_id: str, remark: str = "自动化测试下单") -> dict:
        client = ApiClient()
        client.set_token(buyer_token)
        response = client.post(
            "/orders",
            json={"productId": int(product_id), "remark": remark},
        )
        assert_status_code(response, 201)
        return response.json()

    return _create
