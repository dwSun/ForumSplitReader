// content/sites/linuxdo.js — Linux.do（Discourse）站点适配器。
// 列表/帖子链接识别、详情页精简样式（隐藏侧栏顶栏、绕开 grid 空轨道、
// 虚拟滚动占位的骨架提示）。实测结论见文件内注释（2026-09-08 三轮）。
(() => {
  const LINUX_DO_TOPIC_LINK = 'a.raw-topic-link, a.title.raw-link.raw-topic-link, .topic-list a.title';
  const LINUX_DO_LIST_PATH = /^\/(latest|new|top|c\/|tag\/|u\/[^/]+\/activity\/topics)/;

  // 实测结论（2026-09-08，三轮：小视口 → 桌面宽度 iframe → 用户大屏 2560×1440）：
  // 1. 底部空白两来源：a) .more-topics__container（类名 token 与 .more-topics
  //    不匹配，450px 区块留存）——已隐藏；b) Discourse 虚拟滚动：只预渲染
  //    首屏附近楼层，其下全是 .post-stream--cloaked 空占位（首屏下实测
  //    3700px+）。b 是站点原生行为，无法关闭；渲染淡骨架提示"还有内容"。
  // 2. 左侧空列：#main-outlet-wrapper 是 grid 双列（"sidebar content" areas），
  //    sidebar 隐藏后 273px 轨道视觉留存；grid-template-columns 加 !important
  //    也清不掉（见下方第三轮注释）。最终修复：display:block 绕开轨道系统。
  // 3. 闪现：预览样式由本帧 content script 在 document_start 注入（见 index.js），
  //    早于首帧渲染，侧栏/顶栏不再先闪现再消失。
  // 第三轮实测（2026-09-08，用户大屏 2560×1440 复现）：
  // - display:grid 下给 grid-template-columns 设 !important（含 inline important）
  //   均无法清零第一列轨道——Chrome 对带 grid-template-areas（"sidebar content"）
  //   的 grid 返回 areas 解析后的 used 轨道，273px sidebar 轨道视觉上留存，
  //   大视口下形成左侧空条 + 内容窄条。display:block 直接绕开轨道系统，
  //   实测 outletLeft 285→11、内容 918→1192 铺满 iframe。
  // - 底部空白首屏构成：Discourse 虚拟滚动只预渲染首屏附近楼层，
  //   其下为 .post-stream--cloaked 空占位；骨架可见度从 5% 提到 9%。
  const LINUX_DO_PREVIEW_CSS = `
    body { background: var(--secondary, #fff) !important; overflow-x: hidden !important; }
    .d-header, .sidebar-wrapper, #d-sidebar,
    .more-topics__container, .more-topics, .suggested-topics,
    .topic-navigation, .timeline-container, .footer-nav,
    .discourse-post-event, .floating-footer, .topic-progress { display: none !important; }
    #main-outlet-wrapper { display: block !important; }
    .post-stream--cloaked {
      background-image: repeating-linear-gradient(
        to bottom,
        color-mix(in srgb, var(--primary, #999) 9%, transparent) 0px,
        color-mix(in srgb, var(--primary, #999) 9%, transparent) 44px,
        transparent 44px,
        transparent 72px
      );
      border-radius: 4px;
    }
  `;

  globalThis.ForumSplitReaderLinuxDoAdapter = {
    id: 'linuxdo',
    previewCss: LINUX_DO_PREVIEW_CSS,

    matches(location) {
      return location.hostname === 'linux.do';
    },

    isListPage(document, location) {
      return LINUX_DO_LIST_PATH.test(location.pathname) && document.querySelectorAll(LINUX_DO_TOPIC_LINK).length >= 3;
    },

    findTopicAnchor(target) {
      const anchor = target instanceof Element ? target.closest(LINUX_DO_TOPIC_LINK) : null;
      return anchor instanceof HTMLAnchorElement ? anchor : null;
    },

    getTopicUrl(anchor) {
      return anchor?.href ?? null;
    },

    getTopicKey(url) {
      try {
        return new URL(url).pathname;
      } catch {
        return url;
      }
    },

    shouldHandleUrl(url) {
      try {
        const parsed = new URL(url, window.location.href);
        return parsed.hostname === 'linux.do' && /^\/t\//.test(parsed.pathname);
      } catch {
        return false;
      }
    },

    // 预览帧 DOM ready 后：走官方侧栏收起逻辑（Ember 状态一致 + localStorage 持久化）。
    // 点击后 body.has-sidebar-page 移除、grid 轨道归零（实测验证）。
    // CSS 已在 document_start 兜底单列布局，此处失败也无视觉回归。
    onPreviewReady(doc) {
      if (!doc.body?.classList.contains('has-sidebar-page')) {
        return;
      }
      doc.querySelector('.btn-sidebar-toggle')?.click();
    },

    decoratePreviewDocument(doc) {
      if (!doc?.body) {
        return;
      }
      doc.body.classList.add('fh-linuxdo-preview');
    },
  };
})();
