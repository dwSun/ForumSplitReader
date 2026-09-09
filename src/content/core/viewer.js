// content/core/viewer.js — 侧栏预览面板控制器。
// 负责面板 DOM 构建（标题栏 + iframe）、打开/切换/关闭、外观设置（宽度、
// 颜色变量）应用。面板内导航不由本模块负责（见 content/index.js 预览帧分支）。
(() => {
  const { injectStyle, isModifierClick } = globalThis.ForumSplitReaderDom;

  const ROOT_ID = 'fh-preview-root';
  const FRAME_ID = 'fh-preview-frame';
  const TITLE_ID = 'fh-preview-title';
  const STYLE_ID = 'fh-preview-inline-style';

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

  // 面板颜色：写入 root 行内 CSS 变量（styles.css 消费，见 --fh-*）。
  // 仅接受 #rrggbb（options 页 input[type=color] 的唯一产出格式）；
  // 其余值忽略，保留 CSS 默认值。
  const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

  const applyPanelColors = (rootEl, settings) => {
    const vars = [
      ['--fh-header-bg', settings.headerBg],
      ['--fh-title-color', settings.titleColor],
      ['--fh-border-color', settings.borderColor],
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

      document.documentElement.classList.add('fh-preview-open');
      document.body.classList.add('fh-preview-open');
      document.documentElement.style.setProperty('--fh-preview-width', options.width);
      document.documentElement.style.setProperty('--fh-preview-min-width', options.minWidth);

      root = document.createElement('aside');
      root.id = ROOT_ID;
      root.dataset.side = options.side;
      root.dataset.loading = 'false';
      applyPanelColors(root, options);

      const header = document.createElement('div');
      header.id = 'fh-preview-header';

      title = document.createElement('div');
      title.id = TITLE_ID;
      title.textContent = `${adapter.id} preview`;

      const close = document.createElement('button');
      close.id = 'fh-preview-close';
      close.type = 'button';
      close.setAttribute('aria-label', '关闭预览');
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
      document.documentElement.classList.remove('fh-preview-open');
      document.body.classList.remove('fh-preview-open');
    };

    return { open, toggle, destroy };
  };

  globalThis.ForumSplitReaderViewer = { createViewerController, applyPanelColors };
})();
