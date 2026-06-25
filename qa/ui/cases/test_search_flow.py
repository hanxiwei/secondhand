from __future__ import annotations

import pytest
from playwright.sync_api import Page

from qa.config_loader import load_test_config
from qa.ui.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.smoke
def test_home_search_flow(page: Page):
    config = load_test_config()
    keyword = config["search"]["keyword"]

    home_page = HomePage(page)
    home_page.open_home()
    home_page.search(keyword)

    assert home_page.product_count() > 0, "搜索后应至少展示 1 个商品卡片"
    assert home_page.any_card_contains(keyword), f"搜索结果中未找到包含 {keyword} 的商品标题"
