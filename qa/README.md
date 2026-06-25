# 校园二手交易平台测试工程

## 1. 目录说明

```text
qa/
├─ api/       接口自动化
├─ perf/      Locust 性能测试
├─ ui/        Playwright UI 自动化
├─ config/    环境配置
├─ scripts/   报告摘要与飞书通知脚本
├─ reports/   生成后的测试摘要
└─ requirements.txt
```

## 2. 安装依赖

```bash
pip install -r qa/requirements.txt
playwright install chromium
```

## 3. 配置环境

1. 复制 `qa/config/env.example.yaml` 为 `qa/config/env.yaml`
2. 补充接口地址、前端地址、测试账号和飞书 webhook
3. 可选配置：
   1. `report.report_url`：Jenkins 或静态站点上的 Allure 报告访问地址
   2. `quality_gate.min_pass_rate`：最低通过率门槛
   3. `quality_gate.allow_failed_cases`：允许失败用例数
   4. `deepseek.*`：DeepSeek 报告生成配置，可通过 `DEEPSEEK_API_KEY` 环境变量覆盖

## 4. 运行接口自动化

```bash
pytest -c qa/pytest.ini qa/api/cases -m api
```

## 5. 运行 UI 自动化

```bash
pytest -c qa/pytest.ini qa/ui/cases -m ui
```

当前已落地的 UI 链路包括：

1. 登录成功冒烟。
2. 首页搜索商品。
3. 买家发起购买意向。
4. 卖家确认交易并完成交易。

## 6. 生成摘要与通知

```bash
python qa/scripts/ai_summary.py
python qa/scripts/notify_feishu.py
```

说明：

1. `ai_summary.py` 会解析 `allure-results` 并输出 `qa/reports/summary.json`
2. 同时会输出 `qa/reports/summary_report.md`，作为正式中文测试报告
3. 当 `deepseek.enabled=true` 且已配置 `DEEPSEEK_API_KEY` 时，会调用 DeepSeek 生成正式报告
4. 如果未启用 DeepSeek 或接口调用失败，会自动回退到本地规则生成报告
5. `notify_feishu.py` 在未配置 `webhook` 时会自动跳过，不会直接报错中断

## 7. 运行性能测试

```bash
python qa/scripts/run_perf_tests.py
```

说明：

1. 性能测试基于 `Locust`，脚本位于 `qa/perf/locustfile.py`
2. 当前默认覆盖商品搜索、商品详情、分类树查询、订单列表与下单请求
3. 压测会自动登录买家/卖家账号，并创建临时商品池用于模拟下单流量
4. 运行完成后会在 `qa/reports/perf/` 下输出 HTML 与 CSV 报告
5. 可通过 `performance.users / spawn_rate / run_time / product_pool_size` 调整压测强度

## 8. 推荐执行顺序

```bash
python qa/scripts/run_all_tests.py
python qa/scripts/ai_summary.py
python qa/scripts/check_quality_gate.py
python qa/scripts/notify_feishu.py
```

说明：

1. `run_all_tests.py` 会先清空旧的 `allure-results`，再串行执行接口和 UI 自动化。
2. 如果你只想单独调试某一层，也可以分别执行 `run_api_tests.py` 和 `run_ui_tests.py`。
3. 如果你在 Jenkins 中接入 Allure 插件，建议直接在 Jenkins 页面查看报告。

## 9. Jenkins 集成

项目根目录已提供 `Jenkinsfile` 初版，可用于：

1. 安装依赖与浏览器驱动。
2. 执行接口自动化与 UI 自动化。
3. 生成测试摘要。
4. 发布 Jenkins 内置 Allure 报告。
5. 执行基础质量门禁。
6. 将摘要和 AI 报告结论推送到飞书群。

建议在 Jenkins 中配置以下凭据：

1. `FEISHU_WEBHOOK`
2. `FEISHU_SECRET`
3. `DEEPSEEK_API_KEY`

如果当前飞书机器人没有开启签名校验，可以将 `FEISHU_SECRET` 留空。
如果启用 DeepSeek，建议优先通过 Jenkins 环境变量或凭据注入 `DEEPSEEK_API_KEY`，不要把真实密钥直接写入配置文件。

## 10. Allure 使用说明

当前推荐方式：

1. 在 Jenkins 中安装 `Allure Jenkins Plugin`
2. 在 `全局工具配置` 中配置 `Allure Commandline`
3. 通过 Jenkins 页面直接查看 Allure 报告

## 11. DeepSeek 报告生成说明

配置方式如下：

```yaml
deepseek:
  enabled: true
  base_url: "https://api.deepseek.com"
  model: "deepseek-v4-flash"
  api_key: ""
  temperature: 0.3
  max_tokens: 1200
  timeout: 30
```

也可以通过环境变量覆盖：

```bash
set DEEPSEEK_API_KEY=你的密钥
set DEEPSEEK_MODEL=deepseek-v4-flash
```

脚本会先生成结构化统计摘要，再将摘要投喂给 DeepSeek，输出正式中文测试报告。
