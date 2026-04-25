import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '..');

const ASSETS = [
 {
  file: 'apps/ubax-web/public/dashboard-sav/technicians/avatar-06.webp',
  url: 'https://www.figma.com/api/mcp/asset/cb9f47d6-45ac-45bb-bb7d-2be8c00a99a5',
 },
 {
  file: 'apps/ubax-web/public/dashboard-sav/technicians/avatar-07.webp',
  url: 'https://www.figma.com/api/mcp/asset/b0bce5e4-2bf7-4ee2-b64a-0de48ee7ddd6',
 },
 {
  file: 'apps/ubax-web/public/dashboard-sav/technicians/avatar-08.webp',
  url: 'https://www.figma.com/api/mcp/asset/c241aeaa-8791-4e8a-a388-ea71c13e0c38',
 },
];

function getTargetPath(relativeFile) {
 return path.join(workspaceRoot, relativeFile);
}

async function ensureParentDirectory(filePath) {
 await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function downloadAsset(asset, force) {
 const targetPath = getTargetPath(asset.file);

 if (!force) {
  try {
   await fs.access(targetPath);
   console.log(`Skipping existing file: ${asset.file}`);
   return;
  } catch {
   // File does not exist yet.
  }
 }

 const response = await fetch(asset.url, {
  headers: { Accept: 'image/*' },
 });

 if (!response.ok) {
  throw new Error(`Request failed with status ${response.status}`);
 }

 const arrayBuffer = await response.arrayBuffer();
 await ensureParentDirectory(targetPath);
 await sharp(Buffer.from(arrayBuffer), { density: 300, failOn: 'none' })
  .webp({ quality: 92 })
  .toFile(targetPath);
 console.log(`Downloaded ${asset.file}`);
}

async function main() {
 const force = process.argv.includes('--force');
 const failures = [];

 for (const asset of ASSETS) {
  try {
   await downloadAsset(asset, force);
  } catch (error) {
   failures.push({ asset, error });
   console.error(`Failed ${asset.file}: ${error.message}`);
  }
 }

 console.log(
  `\nFinished: ${ASSETS.length - failures.length}/${ASSETS.length} assets downloaded.`,
 );

 if (failures.length > 0) {
  process.exitCode = 1;
 }
}

await main();
