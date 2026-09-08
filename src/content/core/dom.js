// content/core/dom.js — 小型 DOM 工具：事件目标匹配、组合键判定、
// document_start 安全的样式注入（head 未解析时挂 documentElement）。
(() => {
  const dom = {
    closest(target, selector) {
      if (!(target instanceof Element)) {
        return null;
      }
      return target.closest(selector);
    },

    isModifierClick(event) {
      return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
    },

    // document_start 时 head 可能尚未解析：挂到 documentElement 同样生效，
    // 保证预览样式早于首帧渲染，避免侧栏/顶栏闪现。
    injectStyle(doc, cssText, styleId) {
      if (!doc || !doc.documentElement) {
        return;
      }

      if (styleId && doc.getElementById(styleId)) {
        return;
      }

      const style = doc.createElement('style');
      if (styleId) {
        style.id = styleId;
      }
      style.textContent = cssText;
      (doc.head || doc.documentElement).appendChild(style);
    },
  };

  globalThis.ForumHelperDom = dom;
})();
