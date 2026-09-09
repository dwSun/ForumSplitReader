// options.js — 扩展设置页逻辑：读取/保存面板外观（chrome.storage.local）。
// 保存即生效——列表页 content script 监听 chrome.storage.onChanged 实时更新。
// 注意：连续改多个颜色时必须合并后一次写入，否则并发 get-modify-set
// 互相覆盖（实测：三次连续 change 只有最后一次生效，其余被默认值覆盖）。
(() => {
  const { DEFAULT_SETTINGS, STORAGE_KEY } = globalThis.ForumSplitReaderConfig;
  const COLOR_KEYS = ['headerBg', 'titleColor', 'borderColor'];

  const inputs = Object.fromEntries(COLOR_KEYS.map((key) => [key, document.getElementById(key)]));
  const status = document.getElementById('status');
  let statusTimer = null;
  let current = { ...DEFAULT_SETTINGS };
  let saveTimer = null;

  const flash = (text) => {
    status.textContent = text;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
      status.textContent = '';
    }, 1500);
  };

  const scheduleSave = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      chrome.storage.local
        .set({ [STORAGE_KEY]: { ...current } })
        .then(() => flash('已保存'));
    }, 150);
  };

  const load = async () => {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    current = { ...DEFAULT_SETTINGS, ...(data?.[STORAGE_KEY] ?? {}) };
    for (const key of COLOR_KEYS) {
      if (inputs[key] && /^#[0-9a-fA-F]{6}$/.test(current[key])) {
        inputs[key].value = current[key];
      }
    }
  };

  for (const key of COLOR_KEYS) {
    inputs[key]?.addEventListener('change', () => {
      current[key] = inputs[key].value;
      scheduleSave();
    });
  }

  document.getElementById('reset')?.addEventListener('click', () => {
    for (const key of COLOR_KEYS) {
      inputs[key].value = DEFAULT_SETTINGS[key];
    }
    current = { ...DEFAULT_SETTINGS };
    clearTimeout(saveTimer);
    chrome.storage.local.set({ [STORAGE_KEY]: { ...current } }).then(() => flash('已恢复默认'));
  });

  load();
})();
