# ShiWork 设计规范 v1.0

ShiWork 外贸工作台的视觉与组件规范。**给人看的版本**：用浏览器打开 `index.html`，每个组件都有实时示例和“查看代码”。**给 AI 看的版本**：就是这份 README，加上下面列出的源文件。

> 写给 AI 编码助手：生成任何 ShiWork 界面前，先读完本文件，再读 `tokens.css` 和 `components.css`。只使用这里定义的令牌和 `sw-` 类名；示例 HTML 以 `index.html` 中对应章节为准，照抄结构，不要自创样式。

## 文件

| 文件 | 内容 |
|---|---|
| `tokens.css` | 唯一取值来源：颜色、字体、字号、圆角、间距、尺寸、阴影、动效、层级（CSS 变量） |
| `tokens.json` | 同一份令牌的 JSON 版本（由 `tools/build.py` 从 tokens.css 生成，不要手改） |
| `components.css` | 全部组件样式，类名前缀 `sw-`，只引用令牌 |
| `components.js` | 交互行为：标签页、分段、开关、下拉、对话框、抽屉、通知 `SW.toast()` |
| `assets/icons.svg` | 62 个图标的 SVG sprite（由 `tools/icons.py` 生成） |
| `assets/shiwork-logo.png` · `shiwork-logo-trim.png` · `shiwork-mark.png` | 原始 Logo、裁切版 Logo（界面中使用）、图形标 |
| `index.html` | 规范文档站（由 `src/index.src.html` 构建，修改请改 src 后运行 `python3 tools/build.py`） |

## 接入

```html
<link rel="stylesheet" href="tokens.css">
<link rel="stylesheet" href="components.css">
<script src="components.js" defer></script>

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
- 暂未提供深色主题；如需要，只需在 `tokens.css` 增加 `[data-theme="dark"]` 覆盖令牌。

## 修改规范

1. 改令牌：编辑 `tokens.css`。改组件：编辑 `components.css` / `components.js`。改文档或示例：编辑 `src/index.src.html`。
2. 运行 `python3 tools/build.py`，重新生成 `index.html`、`tokens.json`、`assets/icons.svg`。
3. 新增组件先在 `src/index.src.html` 写示例和使用规则，再在业务中使用。
