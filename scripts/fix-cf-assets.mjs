// Cloudflare Pages silently drops any file whose path contains `node_modules`
// when uploading the build output. Expo emits the vector-icon fonts under
// `dist/assets/node_modules/@expo/vector-icons/...`, so those fonts never deploy
// and icons render as empty boxes. This post-export step renames that folder to
// `assets/nm` and rewrites every reference in the build so the fonts ship.
import { promises as fs } from 'fs';
import path from 'path';

const DIST = 'dist';
const FROM = 'assets/node_modules';
const TO = 'assets/nm';
const REWRITE_EXT = new Set(['.js', '.css', '.html', '.json', '.map']);

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const files = await walk(DIST);
let rewrote = 0;
for (const f of files) {
  if (!REWRITE_EXT.has(path.extname(f))) continue;
  const text = await fs.readFile(f, 'utf8');
  if (text.includes(FROM)) {
    await fs.writeFile(f, text.split(FROM).join(TO));
    rewrote++;
  }
}

const oldDir = path.join(DIST, 'assets', 'node_modules');
const newDir = path.join(DIST, 'assets', 'nm');
try {
  await fs.rm(newDir, { recursive: true, force: true });
  await fs.rename(oldDir, newDir);
  console.log(`fix-cf-assets: renamed assets/node_modules -> assets/nm, rewrote ${rewrote} files`);
} catch (e) {
  console.log(`fix-cf-assets: no assets/node_modules dir (${e.code}); rewrote ${rewrote} files`);
}
