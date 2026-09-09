// content/core/viewer.js — 侧栏预览面板控制器。
// 负责面板 DOM 构建（标题栏 + iframe）、打开/切换/关闭、外观设置（宽度、
// 颜色变量）应用。面板内导航不由本模块负责（见 content/index.js 预览帧分支）。
(() => {
  const { injectStyle, isModifierClick } = globalThis.ForumSplitReaderDom;

  const ROOT_ID = 'fsr-preview-root';
  const FRAME_ID = 'fsr-preview-frame';
  const TITLE_ID = 'fsr-preview-title';
  const STYLE_ID = 'fsr-preview-inline-style';

  const sanitizeTitle = (url) => {
    try {
      const { pathname, search } = new URL(url, window.location.href);
      return `${pathname}${search}`;
    } catch {
      return url;
    }
  };

  // 面板内导航已由 iframe 自己的 content script（all_frames + document_start）
  // 接管，父页面不再通过 same-origin contentDocument 绑定，避免双重导航。

  // 面板颜色：写入 root 行内 CSS 变量（styles.css 消费，见 --fsr-*）。
  // 仅接受 #rrggbb（options 页 input[type=color] 的唯一产出格式）；
  // 其余值忽略，保留 CSS 默认值。
  const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

  const applyPanelColors = (rootEl, settings) => {
    const vars = [
      ['--fsr-header-bg', settings.headerBg],
      ['--fsr-title-color', settings.titleColor],
      ['--fsr-border-color', settings.borderColor],
    ];
    for (const [name, value] of vars) {
      if (typeof value === 'string' && HEX_COLOR.test(value)) {
        rootEl.style.setProperty(name, value);
      }
    }
  };

  const createViewerController = (adapter, options) => {
    let root = null;
    let frame = null;
    let title = null;
    let currentKey = null;

    const ensureRoot = () => {
      if (root) {
        return root;
      }

      document.documentElement.classList.add('fsr-preview-open');
      document.body.classList.add('fsr-preview-open');
      document.documentElement.style.setProperty('--fsr-preview-width', options.width);
      document.documentElement.style.setProperty('--fsr-preview-min-width', options.minWidth);

      root = document.createElement('aside');
      root.id = ROOT_ID;
      root.dataset.side = options.side;
      root.dataset.loading = 'false';
      applyPanelColors(root, options);
      // "加载中"提示文案经 CSS 变量传给 styles.css 的 ::after content，
      // 随浏览器语言切换（_locales）。
      const loadingText = chrome.i18n.getMessage('loading');
      if (loadingText) {
        root.style.setProperty('--fsr-loading-text', `'${loadingText}'`);
      }

      const header = document.createElement('div');
      header.id = 'fsr-preview-header';

      title = document.createElement('div');
      title.id = TITLE_ID;
      title.textContent = `${adapter.id} preview`;

      const close = document.createElement('button');
      close.id = 'fsr-preview-close';
      close.type = 'button';
      close.setAttribute('aria-label', chrome.i18n.getMessage('closeLabel') || 'Close preview');
      close.textContent = '×';
      close.addEventListener('click', () => {
        destroy();
      });

      header.appendChild(title);
      header.appendChild(close);

      frame = document.createElement('iframe');
      frame.id = FRAME_ID;
      frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      frame.addEventListener('load', () => {
        if (!root || !frame) {
          return;
        }
        root.dataset.loading = 'false';
        title.textContent = frame.contentDocument?.title || sanitizeTitle(frame.src);
        injectStyle(frame.contentDocument, adapter.previewCss, STYLE_ID);
        adapter.decoratePreviewDocument(frame.contentDocument);
      });

      root.appendChild(header);
      root.appendChild(frame);
      document.body.appendChild(root);
      return root;
    };

    const open = (url) => {
      ensureRoot();
      root.dataset.loading = 'true';
      title.textContent = sanitizeTitle(url);
      currentKey = adapter.getTopicKey(url);
      frame.src = url;
    };

    const toggle = (url) => {
      const nextKey = adapter.getTopicKey(url);
      if (currentKey && currentKey === nextKey) {
        destroy();
        return;
      }
      open(url);
    };

    const destroy = () => {
      currentKey = null;
      if (frame) {
        frame.src = 'about:blank';
      }
      root?.remove();
      root = null;
      frame = null;
      title = null;
      document.documentElement.classList.remove('fsr-preview-open');
      document.body.classList.remove('fsr-preview-open');
    };

    return { open, toggle, destroy };
  };

  globalThis.ForumSplitReaderViewer = { createViewerController, applyPanelColors };
})();
