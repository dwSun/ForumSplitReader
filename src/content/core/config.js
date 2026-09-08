// content/core/config.js — 设置存取（chrome.storage.local）。
// DEFAULT_SETTINGS 的每一项都可能被 options 页覆盖；读取方必须做合并兜底。
(() => {
  const settings = {
    STORAGE_KEY: 'forumHelperSettings',
    DEFAULT_SETTINGS: {
      width: '48vw',
      minWidth: '420px',
      side: 'right',
      // 面板外观（options 页可改；input[type=color] 仅支持 #rrggbb，
      // 故默认值一律 hex。borderColor 等效于原 rgba(0,0,0,0.08) 白底视觉）。
      headerBg: '#fafafa',
      titleColor: '#444444',
      borderColor: '#ececec',
    },
    async loadSettings() {
      if (!globalThis.chrome?.storage?.local) {
        return this.DEFAULT_SETTINGS;
      }

      const data = await chrome.storage.local.get(this.STORAGE_KEY);
      return {
        ...this.DEFAULT_SETTINGS,
        ...(data?.[this.STORAGE_KEY] ?? {}),
      };
    },
  };

  globalThis.ForumHelperConfig = settings;
})();
