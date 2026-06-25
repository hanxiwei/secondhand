from __future__ import annotations

import allure
import pytest

from qa.api.base.assertions import assert_status_code, assert_text_contains
from qa.api.base.data_loader import load_yaml


@pytest.mark.api
@pytest.mark.smoke
@allure.feature("认证模块")
def test_login_success(api_client, buyer_account):
    response = api_client.post(
        "/auth/login",
        json={"account": buyer_account["username"], "password": buyer_account["password"]},
    )

    assert_status_code(response, 201)
    data = response.json()
    assert data["token"], "登录成功后应返回 token"
    assert data["userInfo"]["username"] == buyer_account["username"]


@pytest.mark.api
@pytest.mark.parametrize("case", load_yaml("auth/login_negative_cases.yaml"), ids=lambda case: case["name"])
@allure.feature("认证模块")
def test_login_negative_cases(api_client, case):
    response = api_client.post("/auth/login", json=case["payload"])

    assert_status_code(response, case["expected_status"])
    data = response.json()
    assert_text_contains(str(data.get("message", "")), case["expected_message"])
