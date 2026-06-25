from __future__ import annotations

import random
import sys
import threading
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit
from uuid import uuid4

import requests
from locust import HttpUser, between, events, task

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from qa.config_loader import load_test_config


@dataclass
class PerfContext:
    base_api_url: str
    api_prefix: str
    timeout: int
    keyword: str
    seller_account: dict[str, str]
    buyer_account: dict[str, str]
    product_pool_size: int
    order_enabled: bool
    seller_token: str = ""
    buyer_token: str = ""
    category_id: int | None = None
    product_ids: list[int] = field(default_factory=list)
    initialized: bool = False
    lock: threading.Lock = field(default_factory=threading.Lock)


def _build_context() -> PerfContext:
    config = load_test_config()
    api_config = config.get("api", {})
    perf_config = config.get("performance", {})
    search_config = config.get("search", {})
    api_url = str(api_config.get("base_url", "http://127.0.0.1:3000/api")).rstrip("/")
    parsed = urlsplit(api_url)
    api_prefix = parsed.path.rstrip("/")
    base_api_url = f"{parsed.scheme}://{parsed.netloc}"
    return PerfContext(
        base_api_url=base_api_url,
        api_prefix=api_prefix or "/api",
        timeout=int(api_config.get("timeout", 10)),
        keyword=str(perf_config.get("keyword", search_config.get("keyword", "小桌"))),
        seller_account=config["accounts"]["seller"],
        buyer_account=config["accounts"]["buyer"],
        product_pool_size=max(int(perf_config.get("product_pool_size", 3)), 1),
        order_enabled=bool(perf_config.get("enable_order_creation", True)),
    )


PERF_CONTEXT = _build_context()


def _api_path(path: str) -> str:
    return f"{PERF_CONTEXT.api_prefix}{path}"


def _request_session() -> requests.Session:
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def _login(account: dict[str, str]) -> str:
    session = _request_session()
    response = session.post(
        f"{PERF_CONTEXT.base_api_url}{_api_path('/auth/login')}",
        json={"account": account["username"], "password": account["password"]},
        timeout=PERF_CONTEXT.timeout,
    )
    response.raise_for_status()
    return response.json()["token"]


def _get_first_category_id() -> int:
    session = _request_session()
    response = session.get(
        f"{PERF_CONTEXT.base_api_url}{_api_path('/categories/tree')}",
        timeout=PERF_CONTEXT.timeout,
    )
    response.raise_for_status()
    categories = response.json()
    if not categories:
        raise RuntimeError("当前环境没有可用分类，无法初始化性能测试商品池。")
    return int(categories[0]["id"])


def _create_product(token: str, category_id: int) -> int:
    session = _request_session()
    session.headers.update({"Authorization": f"Bearer {token}"})
    suffix = uuid4().hex[:8]
    payload = {
        "categoryId": category_id,
        "title": f"性能压测商品-{suffix}",
        "description": "Locust 性能测试临时商品",
        "price": 66.6,
        "originalPrice": 99.0,
        "conditionLevel": 4,
        "campus": "主校区",
        "tradeMethod": 1,
        "contactInfo": "站内私信",
        "imageUrls": [],
    }
    response = session.post(
        f"{PERF_CONTEXT.base_api_url}{_api_path('/products')}",
        json=payload,
        timeout=PERF_CONTEXT.timeout,
    )
    response.raise_for_status()
    return int(response.json()["id"])


def _delete_product(token: str, product_id: int) -> None:
    session = _request_session()
    session.headers.update({"Authorization": f"Bearer {token}"})
    session.delete(
        f"{PERF_CONTEXT.base_api_url}{_api_path(f'/products/{product_id}')}",
        timeout=PERF_CONTEXT.timeout,
    )


def _ensure_initialized() -> None:
    if PERF_CONTEXT.initialized:
        return

    with PERF_CONTEXT.lock:
        if PERF_CONTEXT.initialized:
            return

        PERF_CONTEXT.seller_token = _login(PERF_CONTEXT.seller_account)
        PERF_CONTEXT.buyer_token = _login(PERF_CONTEXT.buyer_account)
        PERF_CONTEXT.category_id = _get_first_category_id()
        PERF_CONTEXT.product_ids = [
            _create_product(PERF_CONTEXT.seller_token, PERF_CONTEXT.category_id)
            for _ in range(PERF_CONTEXT.product_pool_size)
        ]
        PERF_CONTEXT.initialized = True


@events.test_start.add_listener
def on_test_start(_environment, **_kwargs) -> None:
    _ensure_initialized()


@events.test_stop.add_listener
def on_test_stop(_environment, **_kwargs) -> None:
    if not PERF_CONTEXT.initialized or not PERF_CONTEXT.seller_token:
        return
    for product_id in PERF_CONTEXT.product_ids:
        _delete_product(PERF_CONTEXT.seller_token, product_id)


class BasePerfUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self) -> None:
        _ensure_initialized()


class ProductBrowseUser(BasePerfUser):
    weight = 3

    @task(5)
    def search_products(self) -> None:
        self.client.get(
            _api_path("/products"),
            params={"keyword": PERF_CONTEXT.keyword},
            name="GET /api/products?keyword",
        )

    @task(3)
    def view_product_detail(self) -> None:
        if not PERF_CONTEXT.product_ids:
            return
        product_id = random.choice(PERF_CONTEXT.product_ids)
        self.client.get(
            _api_path(f"/products/{product_id}"),
            name="GET /api/products/:id",
        )

    @task(1)
    def view_categories(self) -> None:
        self.client.get(_api_path("/categories/tree"), name="GET /api/categories/tree")


class BuyerOrderUser(BasePerfUser):
    weight = 1

    def on_start(self) -> None:
        super().on_start()
        self.client.headers.update({"Authorization": f"Bearer {PERF_CONTEXT.buyer_token}"})

    @task(3)
    def list_my_orders(self) -> None:
        self.client.get(_api_path("/orders/my"), name="GET /api/orders/my")

    @task(1)
    def create_order(self) -> None:
        if not PERF_CONTEXT.order_enabled or not PERF_CONTEXT.product_ids:
            return
        product_id = random.choice(PERF_CONTEXT.product_ids)
        self.client.post(
            _api_path("/orders"),
            json={"productId": product_id, "remark": "Locust 压测下单"},
            name="POST /api/orders",
        )
