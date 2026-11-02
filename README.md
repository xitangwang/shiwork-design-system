# ShiWork 设计规范 v1.1

ShiWork 外贸工作台的视觉与组件规范。**给人看的版本**：用浏览器打开 `index.html`，每个组件都有实时示例和“查看代码”。**给 AI 看的版本**：就是这份 README，加上下面列出的源文件。

> 写给 AI 编码助手：生成任何 ShiWork 界面前，先读完本文件，再读 `tokens.css` 和 `components.css`；做图表时再读 `charts.js` 文件头注释。只使用这里定义的令牌和 `sw-` 类名；示例 HTML 以 `index.html` 中对应章节为准，照抄结构，不要自创样式。

## 文件

| 文件 | 内容 |
|---|---|
| `tokens.css` | 唯一取值来源（CSS 变量）：颜色、图表色、字体、字号、圆角、间距、尺寸、阴影、动效、层级；含浅色、深色两套值。由 `src/tokens.src.css` 生成，不要手改 |
| `tokens.json` | 同一份令牌的 JSON 版本，每个令牌带 `light` / `dark` 值（生成，不要手改） |
| `charts.js` | 零依赖 SVG 图表：line / column / bar / diverging / segmented / heatmap / sparkline；`SW.charts.theme()` 给 ECharts、AntV 用 |
| `components.css` | 全部组件样式，类名前缀 `sw-`，只引用令牌 |
| `components.js` | 交互行为：标签页、分段、开关、下拉、对话框、抽屉、通知 `SW.toast()` |
| `assets/icons.svg` · `icons.json` | 189 个图标的 SVG sprite 与分类清单（由 `tools/icons.py` 生成） |
| `assets/shiwork-logo-light.png` · `-dark.png` | 界面中使用的 Logo，浅色 / 深色主题各一版（透明底） |
| `assets/shiwork-mark-light.png` · `-dark.png` | 图形标，浅色 / 深色各一版 |
| `assets/shiwork-logo.png` · `shiwork-logo-trim.png` · `shiwork-mark.png` | 原始文件与裁切版（素材来源，界面中不直接使用） |
| `pages/` | 14 个可交互页面原型（今日工作、审核中心、产品资料、内容、找客、背调、开发触达、询盘、报价、订单、投流、经营、数据接入、流程权限），入口 `pages/index.html`。由 `src/pages/*.html` 经 `tools/pages.py` 生成 |
| `index.html` | 规范文档站（由 `src/index.src.html` 构建，修改请改 src 后运行 `python3 tools/build.py`） |

## 接入

```html
<link rel="stylesheet" href="tokens.css">
<link rel="stylesheet" href="components.css">
<script src="components.js" defer></script>
<script src="charts.js" defer></script>   <!-- 用到图表时 -->

<body class="sw-root">
  <!-- 在 body 开头内联一次 assets/icons.svg 的内容 -->
  <button class="sw-btn sw-btn--primary">提交报价审核</button>
</body>
```

图标：`<svg class="sw-ic" aria-hidden="true"><use href="#i-check"/></svg>`，尺寸修饰 `sw-ic--sm`（14）/ 默认 16 / `sw-ic--lg`（20）。

React / Vue 实现时：类名、ARIA 属性、DOM 结构与 `index.html` 示例保持一致；`components.js` 的行为用组件状态重写即可（`aria-selected`、`aria-pressed`、`aria-checked`、`aria-expanded` 语义不变）。

## 硬性规则（违反即视为不合规）

1. **不写字面量**：业务代码里不出现色值、字号、圆角、阴影、z-index 数字，一律用 `var(--*)`。
2. **主色只给动作**：`--brand`（朱橙 #EF4B32）只用于主按钮、选中态、进度条、Logo 句点。每屏最多一个 `sw-btn--primary`。朱橙不表达任何状态。
3. **浅底橙字用 `--brand-strong`**（#C8381F），不用 `--brand`。
4. **状态分四个维度**，颜色固定：
   - 数据连接：未连接 `neutral` / 待导入 `warning` / 已同步 `success` / 失败 `danger`
   - 事实可信度：未核 `outline` / 待核 `warning` / 已核 `success` / 冲突 `danger`
   - 审核流程：草稿 `neutral` / 待审核 `warning` / 已批准 `success` / 已退回 `danger`
   - 对外执行：未发送 `outline` / 已发送 `success` / 发送失败 `danger`
   - 类名：`sw-tag sw-tag--{neutral|outline|success|warning|danger}`；颜色必须配文字或图标。
5. **AI 必须可识别**：AI 产出至少带一个标识——`sw-ai-avatar`、`sw-tag--ai`（“AI 生成”）或 `sw-suggest` 建议卡。AI 不引入新颜色（墨色 + ✦ + 朱橙圆点）。禁止紫蓝渐变、机器人、大脑图标。
6. **AI 事实带引用**：正文中的事实后跟 `sw-cite` 编号；没有已核来源的说法包在 `sw-claim` 里，并用 `sw-claim-note` 写明缺什么。
7. **AI 不直接对外**：AI 建议默认“未发送”；发送、发布、回传前必须弹出 `sw-modal` 确认，并用 `sw-checklist` 列出检查项。
8. **不编数字**：未确认的金额、日期、评分写“未确认 / 待定 / 待补充”，不填估算值；不输出“高意向”“匹配度 92 分”这类无依据评分。
9. **危险按钮** `sw-btn--danger` 只出现在确认弹窗中，且不可逆操作要求填写原因。
10. **无障碍**：图标按钮必须有 `aria-label`；表单控件必须有关联 `label`；焦点可见；文字对比度 ≥ 4.5:1。
11. **两种主题都要能用**：不写死白色 / 黑色背景；需要两版的图片用 `sw-only-light` / `sw-only-dark`；危险按钮底色用 `--danger-solid`。
12. **图表颜色只用 `--chart-*`**：分类色按固定顺序分配，不循环，第 8 类起归入“其他”（`--chart-other`）；`--chart-1` 朱橙只给主系列（本期 / 实际值 / 我方），渠道用固定配色；不做双 Y 轴；不同口径的指标不连成漏斗。

## 令牌速查

| 类别 | 令牌 |
|---|---|
| 品牌 | `--brand` #EF4B32 · `--brand-hover` · `--brand-active` · `--brand-strong` #C8381F · `--brand-soft` #FFF0EC · `--brand-softer` · `--brand-line` |
| 中性 | `--ink` #141414 · `--text-2` #555 · `--text-3` #737373 · `--text-4` · `--line` #E9E9E5 · `--line-strong` · `--bg` #FAFAF8 · `--surface` #FFF · `--surface-2` · `--surface-3` |
| 语义 | `--success` #1A7A44 · `--warning` #9A6200 · `--danger` #B42318（各有 `-soft`、`-line`） |
| AI | `--ai` #141414 · `--ai-soft` · `--ai-line` · `--ai-accent` #EF4B32 |
| 字号 | 12 · 13 · 14（正文）· 16 · 18 · 22 · 28 · 32（页面标题）· 40 → `--fs-{n}` |
| 圆角 | `--r-xs` 4 复选框 · `--r-sm` 6 标签/小按钮 · `--r-md` 10 按钮/输入框 · `--r-lg` 14 卡片 · `--r-xl` 20 弹窗/助手 · `--r-full` 胶囊/头像 |
| 间距 | `--sp-1` 4 · `--sp-2` 8 · `--sp-3` 12 · `--sp-4` 16 · `--sp-5` 20 · `--sp-6` 24 · `--sp-8` 32 · `--sp-10` 40 · `--sp-12` 48 |
| 控件高 | `--ctl-sm` 32 · `--ctl-md` 40 · `--ctl-lg` 48 |
| 阴影 | 卡片不用阴影；`--shadow-md` 下拉/通知 · `--shadow-lg` 弹窗/抽屉/助手 · `--shadow-brand` 主按钮悬停 |

## 组件清单

**通用**：按钮 `sw-btn`（primary / dark / secondary / soft / ghost / ai / danger / danger-ghost；sm / lg / pill / icon；`sw-btn-group`）· 表单 `sw-field` `sw-label` `sw-input` `sw-select` `sw-textarea` `sw-input-group` `sw-help` · `sw-check` `sw-radio` `sw-switch` `sw-segmented` · `sw-tag` `sw-status` `sw-count` `sw-dot-wrap` · `sw-avatar` `sw-avatar-group` · `sw-tabs`（下划线 / `--pill`）· `sw-sidebar` `sw-nav-item` `sw-nav-sub` `sw-topbar` `sw-breadcrumb` · `sw-page-title`（自带朱橙句点）`sw-page-head` · `sw-stat` `sw-stat-row` `sw-stat-card` `sw-trend` · `sw-progress` `sw-ring` `sw-steps` `sw-milestones` · `sw-table`（`is-num`、`aria-selected` 行）`sw-pagination` · `sw-list-item` · `sw-kanban` · `sw-timeline` · `sw-alert` `sw-banner` · `sw-empty` `sw-skeleton` · `sw-tooltip` `sw-popover` `sw-dropdown` `sw-menu` · `sw-dialog` `sw-modal` `sw-checklist` · `sw-drawer` · `sw-toast`

**AI**：`sw-ai-avatar`（`is-working`）· `sw-chat` `sw-msg--user|customer|ai` `sw-translation` · `sw-trace`（检索过程）· `sw-thinking` `sw-caret` · `sw-cite` `sw-sources` `sw-claim` · `sw-composer` `sw-chip` `sw-prompt-chip` · `sw-suggest`（`--inline`，`sw-diff-add/del`）· `sw-evidence` · `sw-extract` · `sw-decision` · `sw-run`（`is-done|is-running|is-human|is-failed`）· `sw-copilot` `sw-launcher` · `sw-selbar` · `sw-feedback` · `sw-ai-welcome`

## 深色主题

- `<html>` 不设置时跟随系统；`data-theme="light"` / `"dark"` 强制切换；任意容器设置 `data-theme` 只影响该区域。
- 用户选择存在 `localStorage['sw-theme']`（`auto` / `light` / `dark`），在 `<head>` 最前面读取并设置，避免刷新闪白（示例见 `index.html` 深色主题章节）。
- 深色不是反色：每个颜色按深色底单独取阶并校验对比度。底色 `#0F0F0E` / 卡片 `#1A1A19`；文字 `#F2F1EE` / `#C3C2BB` / `#9C9B94`。
- “墨色元素”（`--ink` 做底的：用户气泡、AI 头像、提示气泡、`sw-btn--dark`）在深色下反转为米白，上面的字用 `--on-ink`。
- 浅底上的橙色文字在深色下改为 `#FF8A5C`（`--brand-strong` 自动切换）；主色 `--brand` 两种主题相同。

## 图表

| 用途 | 令牌 | 规则 |
|---|---|---|
| 分类（是谁） | `--chart-1` … `--chart-7`，`--chart-other`，`--chart-prev` | 固定顺序，色盲校验通过（相邻 ΔE 浅 16.3 / 深 13.0）；散点、地图最多 3 类 |
| 顺序（有多少） | `--seq-1` … `--seq-7` | 单一蓝色；深色下小值贴近底色 |
| 发散（高于 / 低于） | `--div-neg` `--div-neg-weak` `--div-mid` `--div-pos-weak` `--div-pos` | 蓝 ↔ 朱橙，灰色中点 |
| 状态（好坏） | `--chart-good` `--chart-warning` `--chart-serious` `--chart-critical` | 只在数据本身表示好坏时用，配图标和文字 |
| 图表框架 | `--chart-grid` `--chart-axis` | 1px 实线；文字用 `--text-3` / `--ink`，不用系列色 |

渠道固定配色：Google `chart-2` · Meta `chart-3` · LinkedIn `chart-4` · 阿里巴巴 `chart-5` · 官网/自然 `chart-6` · 展会 `chart-7` · 未知归因/其他 `chart-other`。

```html
<figure class="sw-chart" data-sw-chart='{"type":"column","title":"核心指标：本期与上期","format":"usd",
  "categories":["订单金额","确认收入","现金到账"],
  "series":[{"name":"本期","color":"chart-1","values":[15500,4000,4100]},
            {"name":"上期","color":"chart-prev","values":[13800,3700,3560]}]}'></figure>
```

图形规格：柱宽 ≤ 24px、数据端 4px 圆角；折线 2px、端点 8px 带 2px 底色描边；相邻色块 2px 间隙；两个以上系列必须有图例；每个图表有“数据表”视图；筛选放在所有图表上方一行。

## 页面原型

- 每个页面只写内容区（`src/pages/<id>.html`，开头的 `<!--page {...} -->` 写标题、面包屑、改动说明、助手推荐指令），外壳（侧边栏、顶栏、浮动助手、设计说明抽屉）由 `tools/pages.py` 统一生成，导航不会各页不同。
- 新增页面：在 `src/pages/` 新建文件，在 `tools/pages.py` 的 `NAV` 里加一项，运行 `python3 tools/pages.py --thumbs`。
- 布局类：`sw-app` · `sw-content` · `sw-cols--2|3|4|main-side|side-main|3pane|2-1` · `sw-stack` · `sw-row` · `sw-kv` · `sw-tree` · `sw-prose`。
- 示例数据是一套故事：BrightParts 询盘、Apex 背调与报价 Q-20261015-01、MetalWorks 订单 SO-202610-08（$8,500）、投流 10-01 至 10-14（预算 $4,309、消耗 $1,307.04、投放询盘 9）。新页面请沿用，不要另编数字。

## 业务 AI 组件（外贸场景）

| 环节 | 组件 |
|---|---|
| 可信与依据 | `sw-citeref` + `sw-citepop` 引用悬停卡 · `sw-factguard` 事实护栏条 · `sw-coverage` 数据覆盖 · `sw-strength[data-level=1|2|3]` 证据充分度 |
| 询盘理解 | `sw-triage`（`sw-hl` 原文高亮、`sw-signals`、`sw-risk--mid|high`）· `sw-localtime` + `sw-dayline` 客户当地时间 · `sw-match` 型号匹配 · `sw-askback` 追问生成 |
| 语言与客户 | `sw-bilingual` + `sw-term(--new)` 术语对照翻译 · `sw-memory` 客户记忆 |
| 报价与文档 | `sw-calc` 报价计算（`is-pending`、`is-total`）· `sw-annot` + `sw-comment` 文档批注 |
| 获客触达 | `sw-hook` 开发信切入点（`is-stale` 不可选）· `sw-preflight` 发送前预检（block / warn / pass）· `sw-batch` 批量任务 |
| 投流经营 | `sw-insight` + `sw-kind--fact|guess|advice` 洞察卡 · `sw-proposal` 改动提议 · `sw-digest` AI 简报 |

规则：
- AI 写出的每个结论标明“原文 / 推断 / 待补”；分析类结论附 `sw-coverage` 或 `sw-strength`，不输出 0–100 分或百分比匹配度。
- 未知金额、交期、运费一律“待确认”；`sw-calc` 的合计只算到能算出的那一步。
- 需要改线上设置（预算、出价、否词、价格）时只能用 `sw-proposal` 提议，写明执行方式；系统不直接改广告平台或发送邮件。
- 开发信必须至少选一个有来源的 `sw-hook`；发送前必须通过 `sw-preflight` 的“阻止发送”项。
- 客户记忆只记业务偏好，每条可看来源、可删除，不记个人社交信息。

## 文案

- 按钮写动作：“提交报价审核”，不写“确定”。确认弹窗标题写成问题：“把这封开发信提交审核？”
- 错误写原因和改法：“邮箱缺少域名后缀，例如 apex.com”。
- 空状态写原因和下一步：“还没有询盘。连接邮箱后，新的咨询会出现在这里。”
- 加载写进行时：“保存中…”“AI 起草中…”。
- 日期：今天 11:00 / 10 月 13 日 / 2026-10-14；金额：$8,500，千分位。

## 已知事项

- 朱橙 #EF4B32 上的白字对比度 3.67:1，满足大字和控件 3:1 标准，低于正文 4.5:1。如需无障碍认证，把 `--brand` 改为 #D23D23（4.74:1）即可，组件无需改动。
- `--text-3` 由原稿 #777 微调为 #737373 以满足 4.5:1，肉眼无差别。
- Logo 目前只有浅色底 PNG；深色底、SVG 矢量版需设计补充。
- 深色 Logo 由 `tools/pngtool.py` 从原图转换，建议设计补 SVG 矢量版。
- 浅色主题下图表的青、琥珀、品红三色与白底对比度 < 3:1：这些颜色的系列必须有数值标签或数据表视图（`charts.js` 已默认提供）。

## 修改规范

1. 改令牌：编辑 `src/tokens.src.css`（`@@LIGHT` 浅色值、`@@DARK` 深色覆盖）。改组件：编辑 `components.css` / `components.js`。改文档或示例：编辑 `src/index.src.html`。
2. 运行 `python3 tools/build.py`，重新生成 `tokens.css`、`tokens.json`、`index.html`、`assets/icons.svg`。改 Logo 原图后运行 `python3 tools/pngtool.py` 重新生成浅 / 深两版。
3. 新增组件先在 `src/index.src.html` 写示例和使用规则，再在业务中使用。
