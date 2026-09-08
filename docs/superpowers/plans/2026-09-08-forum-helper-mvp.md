# Forum Helper MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个无需安装依赖即可作为 Chrome MV3 unpacked extension 加载的 MVP，让 V2EX 列表页点击帖子时在当前页面右侧 iframe 预览，并为 Linux.do 预留同构适配器。

**Architecture:** 采用 content script 注入的站内双栏布局。通用 SplitViewController 负责右侧容器、iframe 生命周期、导航与样式注入；站点差异封装在 `sites/*` adapter 中，先完整支持 V2EX，再接入 Linux.do 的保守选择器。

**Tech Stack:** Chrome Extension Manifest V3、原生 JavaScript、原生 CSS、same-origin iframe、chrome.storage.local。

## Global Constraints

- 不安装任何新工具或依赖；MVP 必须可通过 Chrome「加载已解压的扩展程序」直接运行。
- 只支持 `v2ex.com` 与 `linux.do`；不做通用论坛抽象到配置文件层。
- 默认保留原生新标签语义：`Ctrl/Cmd/Shift/Alt` 或中键点击不拦截。
- 右侧预览只处理同站帖子链接；外链、用户页、登录页保留原生行为或升级为新标签。
- 文档与代码必须反映 iframe 路线，不再提 Side Panel 为主方案。

---

### Task 1: 冻结路线文档

**Files:**
- Modify: `README.md`
- Modify: `docs/design.md`
- Create: `docs/superpowers/plans/2026-09-08-forum-helper-mvp.md`

**Interfaces:**
- Consumes: 当前调研结论与 `ref/v2ex-topic-viewer/` 参考实现。
- Produces: 明确的 iframe 双站适配设计、MVP 范围、后续代码目录。

- [ ] **Step 1: 重写 README 概述与路线结论**
- [ ] **Step 2: 重写 design 文档的架构、生命周期、风险与里程碑**
- [ ] **Step 3: 写出本实施计划并落盘**
- [ ] **Step 4: 人工复查三份文档措辞一致，均不再以 Side Panel 为主路线**

### Task 2: 搭建无依赖扩展骨架

**Files:**
- Create: `src/manifest.json`
- Create: `src/content/index.js`
- Create: `src/content/core/config.js`
- Create: `src/content/core/dom.js`
- Create: `src/content/core/viewer.js`
- Create: `src/content/styles.css`

**Interfaces:**
- Consumes: Task 1 中冻结的目录与 MVP 范围。
- Produces:
  - `createViewerController(adapter, options)`
  - `detectSiteAdapter(location)`
  - `DEFAULT_SETTINGS`

- [ ] **Step 1: 写 manifest，matches 仅覆盖 V2EX 与 Linux.do**
- [ ] **Step 2: 建立 content script bootstrap，负责站点探测与初始化**
- [ ] **Step 3: 建立 viewer controller，负责打开/关闭/切换右侧 iframe**
- [ ] **Step 4: 建立全局样式文件，定义右侧固定容器与页面收缩样式**
- [ ] **Step 5: 用 `node --check` 校验新增 JS 语法**

### Task 3: 实现 V2EX 适配器

**Files:**
- Create: `src/content/sites/v2ex.js`
- Modify: `src/content/index.js`
- Modify: `src/content/core/viewer.js`

**Interfaces:**
- Consumes: `createViewerController(adapter, options)`
- Produces:
  - `v2exAdapter.isListPage(): boolean`
  - `v2exAdapter.findTopicAnchor(target): HTMLAnchorElement | null`
  - `v2exAdapter.getTopicItem(anchor): HTMLElement | null`
  - `v2exAdapter.decoratePreviewDocument(doc): void`

- [ ] **Step 1: 识别 `a.topic-link`，保守限定为列表页**
- [ ] **Step 2: 拦截点击并保留原生 modifier 语义**
- [ ] **Step 3: 在 iframe load 后注入 V2EX 精简样式**
- [ ] **Step 4: 实现再次点击同一帖子关闭预览**
- [ ] **Step 5: 用 `node --check` 再校验相关文件语法**

### Task 4: 接入 Linux.do 适配器

**Files:**
- Create: `src/content/sites/linuxdo.js`
- Modify: `src/content/index.js`
- Modify: `src/content/core/viewer.js`

**Interfaces:**
- Consumes: 与 V2EX 相同的 adapter 接口。
- Produces:
  - `linuxdoAdapter.isListPage(): boolean`
  - `linuxdoAdapter.findTopicAnchor(target): HTMLAnchorElement | null`
  - `linuxdoAdapter.decoratePreviewDocument(doc): void`

- [ ] **Step 1: 用 Discourse 常见 topic link 选择器实现保守识别**
- [ ] **Step 2: 为动态列表页补 `MutationObserver` 或事件代理，无需逐项绑定**
- [ ] **Step 3: 在 iframe 内隐藏 Linux.do 顶栏/时间线/建议阅读等干扰区块**
- [ ] **Step 4: 明确无法识别的页面直接不启用预览**
- [ ] **Step 5: 用 `node --check` 校验语法**

### Task 5: 本地验证与交付

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: 前四个任务的全部实现。
- Produces: 明确的本地加载方式与验证证据。

- [ ] **Step 1: 运行 `node --check` 覆盖全部 JS 文件**
- [ ] **Step 2: 用 Python 解析 `src/manifest.json`，确认 JSON 合法**
- [ ] **Step 3: 更新 README 的加载说明与当前支持范围**
- [ ] **Step 4: 记录下一步人工浏览器验证清单（V2EX 5 次点击、Linux.do 3 次点击）**
