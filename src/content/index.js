// content/index.js — 内容脚本入口。
// 顶层（列表页）：拦截帖子链接点击，按 adapter 分流到侧栏预览或新标签页；
// 预览帧内：注入预览样式，接管面板内导航（同站留面板，其余放行）。
(() => {
  const { DEFAULT_SETTINGS, STORAGE_KEY, loadSettings } = globalThis.ForumSplitReaderConfig;
  const { createViewerController, applyPanelColors } = globalThis.ForumSplitReaderViewer;
  const { injectStyle, isModifierClick } = globalThis.ForumSplitReaderDom;
  const ADAPTERS = [globalThis.ForumSplitReaderV2exAdapter, globalThis.ForumSplitReaderLinuxDoAdapter, globalThis.ForumSplitReaderHackernewsAdapter];

  const adapter = ADAPTERS.find((a) => a.matches(window.location)) ?? null;
  if (!adapter) {
    return;
  }

  const inPreviewFrame = () => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  };

  const onReady = (callback) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
      return;
    }
    callback();
  };

  // ── iframe 内：被父页面预览的帖子页 ─────────────────────────────
  // document_start 注入预览样式：早于首帧渲染，消除"侧栏/顶栏先闪现再消失"。
  const initPreviewFrame = () => {
    injectStyle(document, adapter.previewCss, 'fh-preview-frame-style');

    onReady(() => {
      adapter.onPreviewReady?.(document);
    });

    // 面板内导航：同站帖子留在面板，其余走新标签。
    // 不依赖父页面 same-origin 访问，由本帧自己的 content script 负责。
    document.addEventListener(
      'click',
      (event) => {
        if (isModifierClick(event)) {
          return;
        }
        const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
        if (!anchor || !anchor.href) {
          return;
        }
        if (!adapter.shouldHandleUrl(anchor.href)) {
          return;
        }
        event.preventDefault();
        window.location.assign(anchor.href);
      },
      true,
    );
  };

  // ── 顶层：论坛列表页 ───────────────────────────────────────────
  // 注意：不把 isListPage 当作激活门槛。linux.do 是 Ember SPA，
  // DOMContentLoaded 时话题链接尚未渲染（document_start 场景），一次性判定会
  // 导致扩展完全不激活（点击直接原生跳转的回归）。改为点击时惰性判定：
  // findTopicAnchor 本身就是 closest 匹配，非列表页返回 null 自然放行。
  const shouldBypassClick = (event, anchor) => {
    if (!anchor) return true;
    if (event.defaultPrevented) return true;
    if (event.button !== 0) return true;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return true;
    if (anchor.target && anchor.target.toLowerCase() === '_blank') return true;
    return false;
  };

  const initListPage = () => {
    let controller = null;
    let settingsPromise = null;

    const ensureController = async () => {
      if (!controller) {
        settingsPromise ??= loadSettings.call(globalThis.ForumSplitReaderConfig);
        const settings = { ...DEFAULT_SETTINGS, ...(await settingsPromise) };
        controller = createViewerController(adapter, settings);
        window.addEventListener('beforeunload', () => {
          controller.destroy();
        });
      }
      return controller;
    };

    // options 页改色后实时生效：失效设置缓存；面板已开则直接更新 CSS 变量。
    chrome.storage?.onChanged?.addListener((changes, area) => {
      if (area !== 'local' || !changes[STORAGE_KEY]) {
        return;
      }
      settingsPromise = null;
      const root = document.getElementById('fh-preview-root');
      if (root) {
        applyPanelColors(root, { ...DEFAULT_SETTINGS, ...(changes[STORAGE_KEY].newValue ?? {}) });
      }
    });

    document.addEventListener(
      'click',
      (event) => {
        const anchor = adapter.findTopicAnchor(event.target);
        if (!anchor || shouldBypassClick(event, anchor)) {
          return;
        }

        const url = adapter.getTopicUrl(anchor);
        if (!url) {
          return;
        }

        // 分流：adapter 可选 getTopicAction 决定 'panel' | 'tab' | null；
        // 未实现的 adapter 保持旧行为（同站帖子 → panel，其余放行）。
        const action =
          typeof adapter.getTopicAction === 'function'
            ? adapter.getTopicAction(anchor, url)
            : adapter.shouldHandleUrl(url)
              ? 'panel'
              : null;
        if (!action) {
          return;
        }

        event.preventDefault();
        if (action === 'tab') {
          window.open(url, '_blank', 'noopener');
          return;
        }

        ensureController()
          .then((ready) => ready.toggle(url))
          .catch((error) => {
            console.error(`[${STORAGE_KEY}] preview failed`, error);
          });
      },
      true,
    );
  };

  if (inPreviewFrame()) {
    initPreviewFrame();
  } else {
    onReady(initListPage);
  }
})();
