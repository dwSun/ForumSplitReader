#!/usr/bin/env bash
# Forum Helper 构建脚本：校验 manifest、打包 src/ 为可上传 Chrome Web Store 的 zip。
# 用法：
#   scripts/build.sh          # 产出 dist/forum-helper-v<version>.zip
#   scripts/build.sh --check  # 仅校验，不打包
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/src"
DIST="$ROOT/dist"

# ── 校验 ──────────────────────────────────────────────
if [[ ! -f "$SRC/manifest.json" ]]; then
  echo "error: $SRC/manifest.json 不存在" >&2
  exit 1
fi

# manifest 必须是合法 JSON，且关键字段齐全；name/description 走 _locales 时解析实际值
node -e '
  const fs = require("fs");
  const path = require("path");
  const dir = path.dirname(process.argv[1]);
  const m = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  for (const key of ["manifest_version", "name", "version"]) {
    if (!m[key]) { console.error(`error: manifest 缺少 ${key}`); process.exit(1); }
  }
  if (m.manifest_version !== 3) { console.error("error: 需要 manifest_version 3"); process.exit(1); }
  const resolve = (v) => {
    const match = /^__MSG_(.+)__$/.exec(v ?? "");
    if (!match) return v;
    const locale = m.default_locale ?? "en";
    const msgs = JSON.parse(fs.readFileSync(path.join(dir, "_locales", locale, "messages.json"), "utf8"));
    return msgs[match[1]]?.message ?? v;
  };
  console.log(`manifest OK: ${resolve(m.name)} v${m.version}`);
' "$SRC/manifest.json"

# content_scripts 声明的每个 js/css 文件都必须存在
node -e '
  const fs = require("fs");
  const path = require("path");
  const src = process.argv[1];
  const m = JSON.parse(fs.readFileSync(path.join(src, "manifest.json"), "utf8"));
  const files = [];
  for (const cs of m.content_scripts ?? []) files.push(...(cs.js ?? []), ...(cs.css ?? []));
  if (m.options_page) files.push(m.options_page);
  let missing = 0;
  for (const f of files) {
    if (!fs.existsSync(path.join(src, f))) { console.error(`error: 缺失文件 ${f}`); missing = 1; }
  }
  process.exit(missing);
' "$SRC"

if [[ "${1:-}" == "--check" ]]; then
  exit 0
fi

# ── 打包 ──────────────────────────────────────────────
VERSION="$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).version)' "$SRC/manifest.json")"
ZIP="forum-split-reader-v${VERSION}.zip"

rm -rf "$DIST"
mkdir -p "$DIST"

# zip 根目录必须是 manifest.json（Chrome Web Store 要求）
(cd "$SRC" && zip -qr "$DIST/$ZIP" . -x '*.DS_Store')

echo "built: dist/$ZIP"
unzip -l "$DIST/$ZIP" | tail -3
