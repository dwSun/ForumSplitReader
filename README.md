# Forum Helper

像邮件客户端一样浏览论坛：**左侧列表，右侧预览**，不再来回跳转。

支持 V2EX、Linux.do、Hacker News。

## 功能

- **侧栏预览**：在帖子列表页点击讨论链接，右侧就地打开预览；点击另一条就地切换；点击同一条关闭。
- **列表常驻**：预览时列表始终保留在左侧，滚动位置不丢。
- **面板内导航**：预览里点击同站链接（下一页、评论、用户）继续在面板内打开。
- **Hacker News 分流**：comments 侧栏预览；标题链接（第三方站点）新标签页打开，列表不动。
- **自定义外观**：标题栏背景色、标题文字颜色、边框颜色均可在设置页调整，实时生效。

## 安装

**Chrome Web Store**：上架后补充链接。

**开发者模式（本地）**：

1. 克隆本仓库
2. 打开 `chrome://extensions`，开启右上角「开发者模式」
3. 点「加载已解压的扩展程序」，选择本仓库的 `src/` 目录

## 使用

| 站点 | 点击行为 |
| --- | --- |
| V2EX / Linux.do | 点帖子标题 → 右侧预览 |
| Hacker News | 点 **comments** → 右侧预览；点**标题** → 新标签页打开 |
| 所有站点 | 预览面板内的同站链接 → 面板内继续；`Ctrl/Cmd/中键` → 原生行为 |

## 自定义外观

`chrome://extensions` → Forum Helper →「扩展程序选项」，可调：

- 标题栏背景色
- 标题文字颜色
- 边框颜色

保存即生效，无需刷新页面；「恢复默认」一键重置。

## 开发

纯 MV3，无构建依赖、无打包器。目录结构：

```
src/
├── manifest.json          # MV3 清单（三站 content_scripts + options 页）
├── options.html/.js       # 设置页（面板外观）
└── content/
    ├── index.js           # 入口：列表页点击分流 + 预览帧内导航
    ├── styles.css         # 面板样式（--fh-* 变量驱动）
    ├── core/              # config（存储）/ dom（工具）/ viewer（面板控制器）
    └── sites/             # v2ex / linuxdo / hackernews 适配器
docs/design.md             # 详细设计（技术路线、实测记录、风险）
scripts/build.sh           # 校验 + 打包 zip（上传商店用）
```

构建与发布：

```bash
scripts/build.sh          # 产出 dist/forum-helper-v<version>.zip
scripts/build.sh --check  # 仅校验 manifest 与文件完整性
```

详细技术决策（含 iframe 嵌入可行性实测、Linux.do 布局三轮排查记录）
见 [docs/design.md](docs/design.md)。

## 权限与隐私

- 权限仅 `storage`（保存外观设置）与三个站点的 content script 注入。
- 不收集任何数据，无网络请求，无分析代码。
- 所有设置只存在本地浏览器。

## 许可

[MIT](LICENSE)
