#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import os from 'node:os';

const CDN = 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf';
const FILES = [
  'DejaVuSans.ttf',
  'DejaVuSans-Bold.ttf',
  'DejaVuSansMono.ttf',
  'DejaVuSansMono-Bold.ttf',
];

const targetRoot = process.argv[2]
  ? path.resolve(process.argv[2])
  : process.cwd();
const outDir = path.join(targetRoot, 'public', 'fonts');
fs.mkdirSync(outDir, { recursive: true });
console.log(`Ciel: ${outDir}`);

const LOCAL_DIRS = [
  path.join(
    os.homedir(),
    '.cache/codex-runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/Resources/fonts/truetype'
  ),
  path.join(
    os.homedir(),
    'Library/Mobile Documents/com~apple~CloudDocs/Kali install iOS/kali-ios_2.0/19/usr/share/fonts/truetype/dejavu'
  ),
  '/usr/share/fonts/truetype/dejavu',
  '/opt/homebrew/share/fonts/dejavu',
  '/usr/local/share/fonts/dejavu',
];

function isValidTtf(buf) {
  return buf.length > 1000 && buf.readUInt32BE(0) === 0x00010000;
}

function copyLocal(file) {
  for (const dir of LOCAL_DIRS) {
    const src = path.join(dir, file);
    if (!fs.existsSync(src)) continue;
    const buf = fs.readFileSync(src);
    if (!isValidTtf(buf)) continue;
    fs.writeFileSync(path.join(outDir, file), buf);
    console.log(`COPY ${file} from ${src} (${buf.length} bytes)`);
    return true;
  }
  return false;
}

function download(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          download(res.headers.location).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

async function downloadRemote(file) {
  const buf = await download(`${CDN}/${file}`);
  if (!isValidTtf(buf)) throw new Error(`Invalid CDN payload for ${file}`);
  fs.writeFileSync(path.join(outDir, file), buf);
  console.log(`CDN  ${file} (${buf.length} bytes)`);
}

for (const file of FILES) {
  if (copyLocal(file)) continue;
  await downloadRemote(file);
}

const bad = FILES.filter((f) => {
  const buf = fs.readFileSync(path.join(outDir, f));
  return !isValidTtf(buf);
});
if (bad.length) {
  console.error('STALE INVALID:', bad.join(', '));
  process.exit(1);
}
console.log('Vsetky fonty OK');