import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '..');

const ASSETS = [
 {
  file: 'apps/ubax-web/public/dashboard-sav/detail/profile-shell.webp',
  url: 'https://www.figma.com/api/mcp/asset/7ccaa6a2-caff-4239-a1c7-ba96f601ff98',
 },
 {
  file: 'apps/ubax-web/public/dashboard-sav/detail/profile-avatar.webp',
  url: 'https://www.figma.com/api/mcp/asset/813e01de-4d4b-4e08-abb5-23c559cb2992',
 },
 {
  file: 'apps/ubax-web/public/dashboard-sav/detail/back-arrow.webp',
  url: 'https://www.figma.com/api/mcp/asset/b90d5b62-79e8-487f-bddb-6f044a19aeb0',
 },
 {
  file: 'apps/ubax-web/public/dashboard-sav/detail/phone.webp',
  url: 'https://www.figma.com/api/mcp/asset/952f3e26-90dc-4d14-a8d3-fc9675b055d7',
 },
 {
  file: 'apps/ubax-web/public/dashboard-sav/detail/id-card.webp',
  url: 'https://www.figma.com/api/mcp/asset/2be48ec7-fb19-4cf0-9ced-d0a523b97025',
 },
 {
  file: 'apps/ubax-web/public/dashboard-sav/detail/date.webp',
  url: 'https://www.figma.com/api/mcp/asset/ec41a4cf-fcd9-4df4-ac7e-83c64335e724',
 },
 {
  file: 'apps/ubax-web/public/dashboard-sav/detail/edit.webp',
  url: 'https://www.figma.com/api/mcp/asset/93c24d71-83b7-4690-b4c4-d2c39fd9cf52',
 },
 {
  file: 'apps/ubax-web/public/dashboard-sav/detail/history-search.webp',
  url: 'https://www.figma.com/api/mcp/asset/b4c32ab3-f762-4aba-9c65-3b2d6c775cd6',
 },
 {
  file: 'apps/ubax-web/public/dashboard-sav/detail/history-status.webp',
  url: 'https://www.figma.com/api/mcp/asset/8764cb48-1f31-4d43-a5da-9ec6b4263dcf',
 },
 {
  file: 'apps/ubax-web/public/dashboard-sav/detail/stat-resolved-orb.webp',
  url: 'https://www.figma.com/api/mcp/asset/eef56cc0-4288-4d59-a762-7f9391ba83cb',
 },
 {
  file: 'apps/ubax-web/public/dashboard-sav/detail/stat-resolved.webp',
  url: 'https://www.figma.com/api/mcp/asset/c8271020-92df-4ab5-a721-386093c73e3b',
 },
 {
  file: 'apps/ubax-web/public/dashboard-sav/detail/stat-paid-orb.webp',
  url: 'https://www.figma.com/api/mcp/asset/3e1c779e-d8b8-4520-a25a-5ccd47693532',
 },
 {
  file: 'apps/ubax-web/public/dashboard-sav/detail/stat-paid.webp',
  url: 'https://www.figma.com/api/mcp/asset/04f4be92-b179-4880-940a-5f1601745a6a',
 },
 {
  file: 'apps/ubax-web/public/dashboard-sav/detail/history-avatar-01.webp',
  url: 'https://www.figma.com/api/mcp/asset/b145ce24-94f0-49e4-bd3e-6ad54860e58a',
 },
 {
  file: 'apps/ubax-web/public/dashboard-sav/detail/history-avatar-02.webp',
  url: 'https://www.figma.com/api/mcp/asset/594a444e-33f1-48ad-ba8f-98e5ab2f427c',
 },
 {
  file: 'apps/ubax-web/public/dashboard-sav/detail/history-avatar-03.webp',
  url: 'https://www.figma.com/api/mcp/asset/8717944d-2616-4613-87ca-dd05a618d690',
 },
 {
  file: 'apps/ubax-web/public/dashboard-sav/detail/history-avatar-04.webp',
  url: 'https://www.figma.com/api/mcp/asset/e7b00c3d-b60a-44e4-b4c1-765df31b3802',
 },
 {
  file: 'apps/ubax-web/public/dashboard-sav/detail/history-avatar-05.webp',
  url: 'https://www.figma.com/api/mcp/asset/fc8cf777-6e57-4595-a463-8ca4c0f696dc',
 },
 {
  file: 'apps/ubax-web/public/dashboard-sav/detail/history-avatar-06.webp',
  url: 'https://www.figma.com/api/mcp/asset/c64df4e6-5a2c-44b8-88db-bab21204d05e',
 },
 {
  file: 'apps/ubax-web/public/dashboard-sav/detail/history-avatar-07.webp',
  url: 'https://www.figma.com/api/mcp/asset/40e65a4a-eaf4-40fc-834a-9418f9ca85ca',
 },
 {
  file: 'apps/ubax-web/public/dashboard-sav/detail/history-avatar-08.webp',
  url: 'https://www.figma.com/api/mcp/asset/b5c31dd2-778d-4b44-9bf7-d3e09c717781',
 },
 {
  file: 'apps/ubax-web/public/dashboard-sav/detail/history-avatar-09.webp',
  url: 'https://www.figma.com/api/mcp/asset/b295b98c-cb0c-40c3-b6b0-77019edab699',
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
