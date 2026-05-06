import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '..');

const ASSETS = [
 // Toolbar / view-mode icons
 {
  file: 'apps/ubax-web/public/biens/icons/grid-view.webp',
  url: 'https://www.figma.com/api/mcp/asset/a3395e9c-0140-4d15-8e27-c62f9e413242',
 },
 {
  file: 'apps/ubax-web/public/biens/icons/list-view.webp',
  url: 'https://www.figma.com/api/mcp/asset/fb3c7b52-9fec-4c87-bc40-3f8a49741320',
 },
 {
  file: 'apps/ubax-web/public/biens/icons/chevron.webp',
  url: 'https://www.figma.com/api/mcp/asset/86daf4b9-f7f0-44d2-bb03-7d98311f009b',
 },
 {
  file: 'apps/ubax-web/public/biens/icons/add.webp',
  url: 'https://www.figma.com/api/mcp/asset/787c6e72-0b6a-4671-80f1-73ed60203660',
 },
 {
  file: 'apps/ubax-web/public/biens/icons/trend.webp',
  url: 'https://www.figma.com/api/mcp/asset/57d3047b-920e-47a4-ad69-e474ee443a28',
 },
 {
  file: 'apps/ubax-web/public/biens/icons/grid-location.webp',
  url: 'https://www.figma.com/api/mcp/asset/49956718-6daf-4e3d-9aa4-8f3c295cfaff',
 },
 {
  file: 'apps/ubax-web/public/biens/icons/grid-arrow.webp',
  url: 'https://www.figma.com/api/mcp/asset/dae5dfe5-5012-458d-93c8-619314893376',
 },
 {
  file: 'apps/ubax-web/public/biens/icons/list-location-outer.webp',
  url: 'https://www.figma.com/api/mcp/asset/f786dbe7-71e4-47c7-942c-08d51b50fb61',
 },
 {
  file: 'apps/ubax-web/public/biens/icons/list-location-inner.webp',
  url: 'https://www.figma.com/api/mcp/asset/4dcca9fa-196a-4ae5-9cee-c7372a208670',
 },
 {
  file: 'apps/ubax-web/public/biens/icons/list-arrow.webp',
  url: 'https://www.figma.com/api/mcp/asset/6ac6d82e-a489-4322-baf9-e4ffa4554bfa',
 },
 // Summary card orbs
 {
  file: 'apps/ubax-web/public/biens/icons/orb-tous.webp',
  url: 'https://www.figma.com/api/mcp/asset/74a52733-4b72-4585-a52a-34e28faf3190',
 },
 {
  file: 'apps/ubax-web/public/biens/icons/orb-annonces.webp',
  url: 'https://www.figma.com/api/mcp/asset/3769ce0a-f4e2-4935-aa35-6efc56057d34',
 },
 {
  file: 'apps/ubax-web/public/biens/icons/orb-loues.webp',
  url: 'https://www.figma.com/api/mcp/asset/4817705a-6738-48ec-8a50-5b38256d3368',
 },
 {
  file: 'apps/ubax-web/public/biens/icons/orb-vendus.webp',
  url: 'https://www.figma.com/api/mcp/asset/c01cae6d-564b-4cac-a146-61321dc56338',
 },
 // Summary card icons
 {
  file: 'apps/ubax-web/public/biens/icons/stat-tous.webp',
  url: 'https://www.figma.com/api/mcp/asset/781a21e1-737d-400e-b9ad-14a19d85dcbe',
 },
 {
  file: 'apps/ubax-web/public/biens/icons/stat-annonces.webp',
  url: 'https://www.figma.com/api/mcp/asset/745dde1e-a423-412c-aafd-e650a8a0e55a',
 },
 {
  file: 'apps/ubax-web/public/biens/icons/stat-loues.webp',
  url: 'https://www.figma.com/api/mcp/asset/4b03a51a-f8c6-41da-a747-51f5796eef28',
 },
 {
  file: 'apps/ubax-web/public/biens/icons/stat-vendus.webp',
  url: 'https://www.figma.com/api/mcp/asset/617aaacc-b9de-4461-89fe-474a0c272322',
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
