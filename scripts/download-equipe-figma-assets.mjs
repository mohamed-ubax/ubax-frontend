import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '..');

const ASSETS = [
 {
  file: 'apps/ubax-web/public/equipe/promo-backdrop.webp',
  url: 'https://www.figma.com/api/mcp/asset/b8eef614-f125-41d4-be91-c08a21e31aeb',
 },
 {
  file: 'apps/ubax-web/public/equipe/promo-image.webp',
  url: 'https://www.figma.com/api/mcp/asset/8333bdb6-b124-4abb-af6c-2763f66389b0',
 },
 {
  file: 'apps/ubax-web/public/equipe/role-sort-icon.webp',
  url: 'https://www.figma.com/api/mcp/asset/7759e876-c630-4d2f-8ad7-2eeebb07e59d',
 },
 {
  file: 'apps/ubax-web/public/equipe/members-empty.webp',
  url: 'https://www.figma.com/api/mcp/asset/f1a345aa-0603-4b2e-872f-0d9edc18c22e',
 },
 {
  file: 'apps/ubax-web/public/equipe/drawer-close-texture.webp',
  url: 'https://www.figma.com/api/mcp/asset/c4ec08bc-4d4c-4369-abe5-0cc0f58f27d7',
 },
 {
  file: 'apps/ubax-web/public/equipe/pagination-arrow-left.webp',
  url: 'https://www.figma.com/api/mcp/asset/934d8cf3-8a97-4ced-a530-7c8eef886fc2',
 },
 {
  file: 'apps/ubax-web/public/equipe/pagination-arrow-right.webp',
  url: 'https://www.figma.com/api/mcp/asset/30d686d3-8a8e-4a47-a42a-0036ce831eb6',
 },
];

function getTargetPath(relativeFile) {
 return path.join(workspaceRoot, relativeFile);
}

async function ensureParentDirectory(filePath) {
 await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function fetchBuffer(url) {
 const response = await fetch(url, {
  headers: { Accept: 'image/*' },
 });

 if (!response.ok) {
  throw new Error(`Request failed with status ${response.status}`);
 }

 return Buffer.from(await response.arrayBuffer());
}

async function assetExists(targetPath) {
 try {
  await fs.access(targetPath);
  return true;
 } catch {
  return false;
 }
}

async function writeWebp(buffer, targetPath) {
 await ensureParentDirectory(targetPath);

 await sharp(buffer, {
  density: 300,
  failOn: 'none',
 })
  .webp({ lossless: true })
  .toFile(targetPath);
}

async function downloadAsset(asset, force) {
 const targetPath = getTargetPath(asset.file);

 if (!force && (await assetExists(targetPath))) {
  console.log(`Skipping existing file: ${asset.file}`);
  return;
 }

 const buffer = await fetchBuffer(asset.url);
 await writeWebp(buffer, targetPath);
 console.log(`Downloaded ${asset.file}`);
}

const force = process.argv.includes('--force');
const failures = [];

for (const asset of ASSETS) {
 try {
  await downloadAsset(asset, force);
 } catch (error) {
  failures.push({ asset: asset.file, error });
  console.error(`Failed ${asset.file}: ${error.message}`);
 }
}

const total = ASSETS.length;
console.log(`\nFinished: ${total - failures.length}/${total} assets generated.`);

if (failures.length > 0) {
 process.exitCode = 1;
}
