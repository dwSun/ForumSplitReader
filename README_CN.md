# ForumSplitReader

像邮件客户端一样浏览论坛：**左侧列表，右侧预览**，不再来回跳转。

[English README](README.md)

## 介绍

在 V2EX、Linux.do 这类论坛浏览时，常规交互是「列表 → 点开帖子 → 返回列表」，
往返碎、加载慢、列表滚动位置还经常丢。Thunderbird 的邮件客户端给了启发：
**列表常驻，预览就地**——点哪条看哪条，再点一条就地换。

调研过现有 Chrome 扩展，四类方案都不完全贴合：

| 类别 | 代表 | 缺什么 |
| --- | --- | --- |
| 悬浮预览 | MaxFocus、Hover 等 | 弹层不是真分栏，弹层内点链接就跑掉 |
| 标签内分屏 | TabBoost、Split View 等 | 需手动命令，不接管列表链接点击 |
| 论坛专属 | V2EX Plus 等 | 只覆盖单站，多基于 iframe 壳 |
| 任意侧栏打开 | Page Sidebar 等 | 不识别列表页，不改写链接行为 |

ForumSplitReader 的空白点：**自动激活 + 多论坛 + 原生 tab 渲染**（不是 iframe 包壳
弹层）。HN 的标题链接指向第三方站，iframe 嵌入被各站 `X-Frame-Options`/`CSP`
策略拦截且不可穷举，故标题走新标签页、comments 走侧栏（详见下文技术实现）。

## 功能

- **侧栏预览**：列表页点击讨论链接，右侧就地打开；点另一条就地切换；点同一条关闭。
- **列表常驻**：预览时列表始终在左侧，滚动位置不丢。
- **面板内导航**：预览里点同站链接（分页、评论、用户）继续在面板内打开。
- **新标签打开**：标题栏「↗」按钮把当前预览页在新标签页打开。
- **自定义外观**：标题栏背景、标题文字、边框颜色可在设置页调整，实时生效。
- **中英文界面**：跟随浏览器语言自动切换。

## 截图

**Hacker News** — comments 侧栏预览，列表保持不动：

![Hacker News 预览](assets/screenshots/hacker-news-light.png)

**Linux.do** — 完整帖子渲染，保留站点样式：

![Linux.do 预览](assets/screenshots/linuxdo-light.png)

**自定义外观** — 标题栏/标题/边框颜色可在设置页调整：

![深色自定义外观](assets/screenshots/hacker-news-dark.png)

## 支持的站点与点击行为

| 站点 | 点击行为 |
| --- | --- |
| V2EX / Linux.do | 点帖子标题 → 右侧预览 |
| Hacker News | 点 **comments** → 右侧预览；点**标题**（第三方站点）→ 新标签页打开 |
| 所有站点 | 面板内同站链接 → 面板内继续；`Ctrl/Cmd/中键` → 原生行为（新标签等） |

## 安装

**Chrome Web Store**：上架后补充链接。

**开发者模式（本地）**：

1. 克隆本仓库
2. 打开 `chrome://extensions`，开启右上角「开发者模式」
3. 点「加载已解压的扩展程序」，选择本仓库的 `src/` 目录

> 注：Chrome 136+ 的 stable 通道已移除 `--load-extension` 命令行 flag；
> 开发者模式加载不受影响。

## 自定义外观

`chrome://extensions` → ForumSplitReader →「扩展程序选项」，可调标题栏背景色、
标题文字颜色、边框颜色。保存即生效（已打开的面板实时更新），「恢复默认」一键重置。

## 技术实现

纯 MV3，无构建依赖、无打包器、无 background/service worker。

- **架构**：`content_scripts`（`document_start` + `all_frames`）+ 同页 iframe 面板。
  顶层脚本拦截列表点击；预览帧内脚本注入站点精简样式并接管帧内导航
  （同站 `location.assign` 留面板，其余放行）。面板内导航不依赖父页面的
  same-origin 访问，天然不受跨域限制。
- **adapter 模式**：每个站点一个适配器（`content/sites/*.js`），统一接口
  `matches / isListPage / findTopicAnchor / getTopicUrl / getTopicKey /
  shouldHandleUrl / getTopicAction / previewCss`，新增站点只需加一个文件并注册。
- **HN 分流依据**（实测 14 个常见被链站点）：github/wired 为 `DENY`，
  techcrunch/stackoverflow 为 `SAMEORIGIN`，verge 白名单制，其余无限制——
  不可穷举，放弃侧栏加载与 DNR strip 头方案（需 `<all_urls>` 权限、全局副作用、
  仍治不了 frame-busting）。
- **关键实测坑**（详见 git 历史与设计文档演进）：
  - linux.do 站点全局 `iframe { max-height: min(1000px, 200vh) }` 会钳住预览
    面板高度（视口高 >1040px 时底部出现随窗口增大的空白），需显式
    `max-height: none !important`；
  - Discourse 的 `#main-outlet-wrapper` 是带 `grid-template-areas` 的双列 grid，
    sidebar 隐藏后轨道视觉留存，加 `!important` 也清不掉
    （Chrome 对带 areas 的 grid 返回 used 轨道），需 `display: block` 绕开；
  - 预览样式必须由**帧内** content script 在 `document_start` 注入
    （`all_frames: true`），早于首帧渲染，否则侧栏/顶栏先闪现再消失。

## 开发

目录结构：

```
src/
├── manifest.json            # MV3 清单（三站 content_scripts + options 页 + _locales）
├── options.html/.js         # 设置页（面板外观，i18n）
├── _locales/                # en / zh_CN 文案
└── content/
    ├── index.js             # 入口：列表页点击分流 + 预览帧内导航 + 设置热更新
    ├── styles.css           # 面板样式（--fsr-* 变量驱动）
    ├── core/                # config（存储）/ dom（工具）/ viewer（面板控制器）
    └── sites/               # v2ex / linuxdo / hackernews 适配器
scripts/build.sh             # 校验 + 打包 zip（上传商店用）
```

构建与测试：

```bash
scripts/build.sh          # 产出 dist/forum-split-reader-v<version>.zip（根目录即 manifest）
scripts/build.sh --check  # 仅校验 manifest 与文件完整性
```

自动化测试：Chrome DevTools Protocol 的 `Extensions.loadUnpacked` 可在带
`--remote-debugging-port` 的浏览器实例里加载/重载扩展，适合 CI 或本地验证。

## 权限与隐私

- 权限仅 `storage`（保存外观设置）与三个站点的 content script 注入。
- 不收集任何数据，无网络请求，无分析代码；所有设置只存在本地浏览器。

## 许可

[MIT](LICENSE)
