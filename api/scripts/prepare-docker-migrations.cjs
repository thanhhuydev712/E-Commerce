// Tạo history dành riêng cho DB Docker mới, từ SQL canonical đã có.
// Không kết nối DB, không sửa hay đánh dấu lại history của database hiện hữu.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const original = path.join(root, 'prisma/migrations');
const target = path.join(root, 'prisma/docker-migrations');
const cutover = '20261105010000_upgrade_v2_vnd';
const baseline = '20261105000000_commerce_v2_baseline';
const sources = [
  [
    baseline,
    path.join(root, 'prisma/v2/migrations', baseline, 'migration.sql'),
  ],
  ...fs
    .readdirSync(original, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name > cutover)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => [
      entry.name,
      path.join(original, entry.name, 'migration.sql'),
    ]),
];
fs.mkdirSync(target, { recursive: true });
for (const [name, source] of sources) {
  const directory = path.join(target, name);
  fs.mkdirSync(directory, { recursive: true });
  fs.copyFileSync(source, path.join(directory, 'migration.sql'));
}
fs.writeFileSync(
  path.join(target, 'migration_lock.toml'),
  'provider = "postgresql"\n',
);
console.log(
  JSON.stringify({ freshDockerMigrations: sources.map(([name]) => name) }),
);
