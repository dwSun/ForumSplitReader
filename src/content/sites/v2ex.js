// content/sites/v2ex.js — V2EX 站点适配器：列表/帖子链接识别与详情页精简样式。
(() => {
  const V2EX_TOPIC_LINK = 'a.topic-link';

  const V2EX_PREVIEW_CSS = `
    body { width: 100% !important; min-width: 100% !important; }
    #Top, #Bottom, #Rightbar, #Leftbar, #Wrapper > .sep20:first-child { display: none !important; }
    #Wrapper, #Wrapper > .content, #Main { width: 100% !important; min-width: 100% !important; max-width: 900px !important; margin: 0 auto !important; }
    #Main { float: none !important; padding: 8px 12px 32px !important; box-sizing: border-box !important; }
  `;

  globalThis.ForumHelperV2exAdapter = {
    id: 'v2ex',
    previewCss: V2EX_PREVIEW_CSS,

    matches(location) {
      return location.hostname.endsWith('v2ex.com');
    },

    isListPage(document) {
      return document.querySelectorAll(V2EX_TOPIC_LINK).length >= 5;
    },

    findTopicAnchor(target) {
      return target instanceof Element ? target.closest(V2EX_TOPIC_LINK) : null;
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
        return parsed.hostname.endsWith('v2ex.com') && /^\/t\/\d+/.test(parsed.pathname);
      } catch {
        return false;
      }
    },

    decoratePreviewDocument(doc) {
      if (!doc?.body) {
        return;
      }
      doc.body.style.background = 'var(--box-background-color, #fff)';
    },
  };
})();
