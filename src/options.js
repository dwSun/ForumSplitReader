// options.js — 扩展设置页逻辑：读取/保存面板外观（chrome.storage.local）。
// 保存即生效——列表页 content script 监听 chrome.storage.onChanged 实时更新。
(() => {
  const { DEFAULT_SETTINGS, STORAGE_KEY } = globalThis.ForumHelperConfig;
  const COLOR_KEYS = ['headerBg', 'titleColor', 'borderColor'];

  const inputs = Object.fromEntries(COLOR_KEYS.map((key) => [key, document.getElementById(key)]));
  const status = document.getElementById('status');
  let statusTimer = null;

  const flash = (text) => {
    status.textContent = text;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
      status.textContent = '';
    }, 1500);
  };

  const load = async () => {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    const settings = { ...DEFAULT_SETTINGS, ...(data?.[STORAGE_KEY] ?? {}) };
    for (const key of COLOR_KEYS) {
      if (inputs[key] && /^#[0-9a-fA-F]{6}$/.test(settings[key])) {
        inputs[key].value = settings[key];
      }
    }
  };

  const save = async (key, value) => {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    const settings = { ...DEFAULT_SETTINGS, ...(data?.[STORAGE_KEY] ?? {}) };
    settings[key] = value;
    await chrome.storage.local.set({ [STORAGE_KEY]: settings });
    flash('已保存');
  };

  for (const key of COLOR_KEYS) {
    inputs[key]?.addEventListener('change', () => save(key, inputs[key].value));
  }

  document.getElementById('reset')?.addEventListener('click', async () => {
    for (const key of COLOR_KEYS) {
      inputs[key].value = DEFAULT_SETTINGS[key];
    }
    await chrome.storage.local.set({ [STORAGE_KEY]: { ...DEFAULT_SETTINGS } });
    flash('已恢复默认');
  });

  load();
})();
