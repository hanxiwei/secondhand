# 校园二手交易平台

一个基于 `Vue 3 + NestJS + MySQL` 的前后端分离校园二手交易平台，同时配套落地了 `pytest` 接口自动化、`Playwright` UI 自动化、`Allure` 报告、`Jenkins` 持续集成、飞书通知与 `DeepSeek` AI 测试分析能力。

## 项目亮点

- 面向校园场景，覆盖商品发布、商品浏览、收藏、聊天、订单流转、个人中心等核心功能。
- 前后端分离：前端基于 `Vue 3 + Vite + TypeScript`，后端基于 `NestJS + TypeORM + MySQL`。
- 内置测试工程：同时包含接口自动化与 UI 自动化，适合做毕业设计项目和测试开发项目实践。
- 工程化质量保障：支持 `Allure Report`、`Jenkins Pipeline`、飞书摘要通知、`DeepSeek` 中文测试报告。

## 功能模块

- 用户注册、登录、个人信息维护
- 商品发布、商品详情、商品搜索、分类浏览
- 收藏商品、发起购买意向
- 买家下单、卖家确认交易、卖家完成订单
- 消息会话与站内沟通
- 我的订单、个人中心

## 技术栈

- 前端：`Vue 3`、`Vite`、`TypeScript`、`Pinia`、`Vue Router`、`Axios`
- 后端：`NestJS`、`TypeORM`、`MySQL`
- 测试：`Python`、`pytest`、`requests`、`Playwright`、`Allure`
- 工程化：`Jenkins`、飞书机器人、`DeepSeek`

## 目录结构

```text
second-hand02/
├─ web/                     前端项目
├─ server/                  后端项目
├─ qa/                      测试工程
│  ├─ api/                  接口自动化
│  ├─ ui/                   Playwright UI 自动化
│  ├─ config/               测试配置
│  ├─ scripts/              摘要、通知、质量门禁脚本
│  └─ README.md             测试工程说明
├─ Jenkinsfile              Jenkins 流水线脚本
└─ README.md
```

## 环境要求

- `Node.js` 18+
- `MySQL` 8.x
- `Python` 3.11+ 或更高版本
- 建议本地已安装 `Git`

## 快速开始

### 1. 初始化数据库

1. 创建数据库：`campus_second_hand`
2. 根据需要执行 `server/sql/` 下的建表脚本
3. 复制 `server/.env.example` 为 `server/.env`，并填写数据库连接信息

示例：

```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=campus_second_hand
```

### 2. 启动后端

```bash
cd server
npm install
npm run start
```

默认启动地址：

- API：`http://127.0.0.1:3000`

### 3. 启动前端

```bash
cd web
npm install
npm run dev
```

默认访问地址：

- Web：`http://127.0.0.1:5173`

如果你需要与当前自动化测试默认配置对齐，也可以改成：

```bash
npm run dev -- --host 127.0.0.1 --port 5191
```

## 测试工程

根目录内置完整 `qa/` 测试工程，支持：

- 接口自动化测试
- `Playwright + POM` UI 自动化测试
- `Allure` 测试报告
- 质量门禁校验
- 飞书通知
- `DeepSeek` AI 测试摘要与中文报告

详细说明见 [qa/README.md](file:///d:/python/second-hand02/qa/README.md)。

### 安装测试依赖

```bash
pip install -r qa/requirements.txt
playwright install chromium
```

### 配置测试环境

1. 复制 `qa/config/env.example.yaml` 为 `qa/config/env.yaml`
2. 填写接口地址、前端地址、测试账号等信息
3. 如需启用飞书或 `DeepSeek`，建议通过本地环境变量或 `Jenkins` 凭据注入，不要把真实密钥提交到仓库

### 运行自动化测试

执行全部测试：

```bash
python qa/scripts/run_all_tests.py
```

仅运行接口自动化：

```bash
pytest -c qa/pytest.ini qa/api/cases -m api
```

仅运行 UI 自动化：

```bash
pytest -c qa/pytest.ini qa/ui/cases -m ui
```

### 生成摘要与通知

```bash
python qa/scripts/ai_summary.py
python qa/scripts/check_quality_gate.py
python qa/scripts/notify_feishu.py
```

## Jenkins 集成

项目根目录提供了 [Jenkinsfile](file:///d:/python/second-hand02/Jenkinsfile)，支持：

- 自动安装测试依赖
- 自动启动前后端服务
- 自动执行接口与 UI 自动化
- 发布 `Allure Report`
- 归档 `deepseek-report.md`
- 飞书推送精简摘要与报告链接
- 执行质量门禁

推荐在 `Jenkins` 中配置以下凭据：

- `FEISHU_WEBHOOK`
- `FEISHU_SECRET`
- `DEEPSEEK_API_KEY`

## 相关文档

- `校园二手交易平台-PRD产品需求文档.md`
- `校园二手交易平台-规范目标文档.md`
- `校园二手交易平台-接口设计文档.md`
- `校园二手交易平台-数据库表结构设计文档.md`
- `校园二手交易平台-测试开发计划文档.md`
- `校园二手交易平台-项目开发排期表.md`

## 注意事项

- 请勿将真实数据库密码、飞书 `webhook`、`DeepSeek API Key` 直接提交到仓库。
- `qa/config/env.yaml` 应仅保留在本地，仓库中使用 `qa/config/env.example.yaml` 作为示例配置。
- 如果使用 `Jenkins` 运行测试，建议优先在 `Jenkins` 页面查看 `Allure Report` 和 `deepseek-report.md`。
