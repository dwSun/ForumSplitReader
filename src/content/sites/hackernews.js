// content/sites/hackernews.js — Hacker News 站点适配器。
// 两类链接分流：comments/AskHN/ShowHN（item?id=）→ 侧栏预览；
// titleline 站外标题 → 新标签页打开（第三方站 XFO/CSP 禁嵌不可穷举，
// 放弃侧栏加载与 DNR strip，依据见 design.md §7 HN 小节）。
// 实测记录（2026-09-08，真实扩展环境）：comments/标题/面板内导航/话题切换全通过。
(() => {
  const HN_TITLE_LINK = 'span.titleline > a[href]';
  const HN_ITEM_LINK = 'a[href^="item?id="]';

  // HN 无 XFO/CSP、表格布局，天然 iframe 友好；仅补原生背景防白闪。
  const HN_PREVIEW_CSS = `
    body { background: #f6f6ef !important; }
  `;

  globalThis.ForumHelperHackernewsAdapter = {
    id: 'hackernews',
    previewCss: HN_PREVIEW_CSS,

    matches(location) {
      return location.hostname === 'news.ycombinator.com';
    },

    isListPage(document) {
      return document.querySelectorAll('span.titleline').length >= 5;
    },

    findTopicAnchor(target) {
      if (!(target instanceof Element)) {
        return null;
      }
      const itemAnchor = target.closest(HN_ITEM_LINK);
      if (itemAnchor instanceof HTMLAnchorElement) {
        return itemAnchor;
      }
      const titleAnchor = target.closest(HN_TITLE_LINK);
      return titleAnchor instanceof HTMLAnchorElement ? titleAnchor : null;
    },

    getTopicUrl(anchor) {
      return anchor?.href ?? null;
    },

    getTopicKey(url) {
      try {
        const id = new URL(url).searchParams.get('id');
        return id ?? url;
      } catch {
        return url;
      }
    },

    getTopicAction(anchor) {
      const href = anchor.getAttribute('href') || '';
      if (href.startsWith('item?id=')) {
        return 'panel';
      }
      if (anchor.closest('span.titleline')) {
        return 'tab';
      }
      return null;
    },

    shouldHandleUrl(url) {
      try {
        return new URL(url, window.location.href).hostname === 'news.ycombinator.com';
      } catch {
        return false;
      }
    },
  };
})();
