import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';

const directory = '.visual-review/reference-audit';
const files = await readdir(directory);
const pages = [];
for (const file of files.filter(name => name.endsWith('.json'))) {
  const data = JSON.parse(await readFile(`${directory}/${file}`, 'utf8'));
  if (!data.url?.startsWith('https://tinhocngoisao.com/')) continue;
  pages.push({ name: file.replace('.json', ''), url: data.url, title: data.title, status: data.status, desktop: data.dimensions, pageErrors: data.errors, visibleControlCount: data.controls.filter(item => item.visible).length });
}
const interactions = [];
for (const file of ['interactions.json', 'commerce-interactions.json']) {
  const data = JSON.parse(await readFile(`${directory}/${file}`, 'utf8'));
  interactions.push(...data.cases.map(item => ({ ...item, detail: typeof item.detail === 'string' ? item.detail.replace(/\u001b\[[\d;]*m/g, '') : item.detail })));
}
const screenshots = [];
for (const file of files.filter(name => name.endsWith('.png') && !name.startsWith('local-'))) {
  const buffer = await readFile(`${directory}/${file}`);
  screenshots.push({ file, bytes: buffer.length, sha256: createHash('sha256').update(buffer).digest('hex') });
}
await mkdir('../docs/audits', { recursive: true });
await writeFile('../docs/audits/tinhocngoisao-2026-11-06.json', JSON.stringify({
  date: '2026-11-06', timezone: 'Asia/Ho_Chi_Minh', method: 'Playwright Chromium, public pages, isolated guest contexts',
  limitations: ['No authenticated account access', 'No order submission or payment', 'No claim of exhaustive product/filter/backend coverage', 'Screenshots and DOM are ignored local artifacts; hashes identify the reviewed captures'],
  artifactDirectory: 'front/.visual-review/reference-audit', pages, interactions, screenshots,
}, null, 2) + '\n');
console.log(JSON.stringify({ pages: pages.length, interactions: interactions.length, screenshots: screenshots.length, results: interactions.reduce((sum, item) => ({ ...sum, [item.result]: (sum[item.result] ?? 0) + 1 }), {}) }));
