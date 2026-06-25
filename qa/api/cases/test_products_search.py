from __future__ import annotations

import allure
import pytest

from qa.api.base.assertions import assert_status_code
from qa.api.base.data_loader import load_yaml


@pytest.mark.api
@pytest.mark.smoke
@pytest.mark.parametrize("case", load_yaml("products/search_cases.yaml"), ids=lambda case: case["name"])
@allure.feature("商品模块")
def test_product_search(api_client, case):
    response = api_client.get("/products", params={"keyword": case["keyword"]})

    assert_status_code(response, 200)
    data = response.json()

    assert data["total"] >= case["expected_min_total"]

    if case["expected_title_contains"]:
        titles = [item["title"] for item in data["list"]]
        assert any(case["expected_title_contains"] in title for title in titles), (
            f"搜索结果中未找到包含 {case['expected_title_contains']} 的商品标题，"
            f"实际标题列表: {titles}"
        )
