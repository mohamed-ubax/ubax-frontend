import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '..');

const ASSETS = [
 {
  file: 'apps/ubax-web/public/dashboard-comptable/kpi-revenue.webp',
  url: 'https://www.figma.com/api/mcp/asset/3b88a9bd-391a-4905-add7-fc379cf9c02a',
 },
 {
  file: 'apps/ubax-web/public/dashboard-comptable/kpi-rent.webp',
  url: 'https://www.figma.com/api/mcp/asset/5a28ea5c-3064-4435-a200-3bcd22fd7ca8',
 },
 {
  file: 'apps/ubax-web/public/dashboard-comptable/kpi-pending.webp',
  url: 'https://www.figma.com/api/mcp/asset/6590af08-dc0b-46d6-aa5f-b0c0c4a1f488',
 },
 {
  file: 'apps/ubax-web/public/dashboard-comptable/kpi-commission.webp',
  url: 'https://www.figma.com/api/mcp/asset/ca55374a-8644-4fb2-9cf6-392e293cf2fb',
 },
 {
  file: 'apps/ubax-web/public/dashboard-comptable/cta-add-expense.webp',
  url: 'https://www.figma.com/api/mcp/asset/01f2f1a8-b548-4708-a204-82443db1b30f',
 },
 {
  file: 'apps/ubax-web/public/dashboard-comptable/balance-eye-off.webp',
  url: 'https://www.figma.com/api/mcp/asset/071d9c59-b926-4e73-b7c5-e479c689469a',
 },
 {
  file: 'apps/ubax-web/public/dashboard-comptable/expense-entretien.webp',
  url: 'https://www.figma.com/api/mcp/asset/7131eed8-2482-4b4a-8727-d1ddb533fd41',
 },
 {
  file: 'apps/ubax-web/public/dashboard-comptable/expense-marketing.webp',
  url: 'https://www.figma.com/api/mcp/asset/c1b09f62-1728-4933-bf05-45ffef76b85e',
 },
 {
  file: 'apps/ubax-web/public/dashboard-comptable/expense-salaires.webp',
  url: 'https://www.figma.com/api/mcp/asset/2d8ed2c2-8dd0-46af-a085-b34a21db1f9f',
 },
 {
  file: 'apps/ubax-web/public/dashboard-comptable/expense-locale.webp',
  url: 'https://www.figma.com/api/mcp/asset/36115240-8834-4b1c-b89f-373ed07f8c4c',
 },
 {
  file: 'apps/ubax-web/public/dashboard-comptable/expense-total.webp',
  url: 'https://www.figma.com/api/mcp/asset/e8dfd516-a0f4-4f8d-895a-e7faeb5c59d8',
 },
 {
  file: 'apps/ubax-web/public/dashboard-comptable/payment-momo.webp',
  url: 'https://www.figma.com/api/mcp/asset/c126aeae-e22d-4ded-bb19-2ff835503747',
 },
 {
  file: 'apps/ubax-web/public/dashboard-comptable/transaction-arrow.webp',
  url: 'https://www.figma.com/api/mcp/asset/bb892726-634c-4dc4-800a-5e9ef743cc13',
 },
 {
  file: 'apps/ubax-web/public/dashboard-comptable/transaction-check.webp',
  url: 'https://www.figma.com/api/mcp/asset/a9e1a0eb-7ef5-4d65-ac9f-503264f988af',
 },
 {
  file: 'apps/ubax-web/public/dashboard-comptable/warning.webp',
  url: 'https://www.figma.com/api/mcp/asset/470b4c17-c780-4163-8847-d07a7793be5c',
 },
 {
  file: 'apps/ubax-web/public/dashboard-comptable/modal-close.webp',
  url: 'https://www.figma.com/api/mcp/asset/f0e1d69d-5017-4d62-91a7-71df2cf24e3a',
 },
 {
  file: 'apps/ubax-web/public/dashboard-comptable/modal-chevron.webp',
  url: 'https://www.figma.com/api/mcp/asset/2667da7a-fc28-408c-8739-c385c9bd034d',
 },
 {
  file: 'apps/ubax-web/public/dashboard-comptable/modal-category-icon.webp',
  url: 'https://www.figma.com/api/mcp/asset/848a1285-e315-45bc-8d1e-9119aab31677',
 },
 {
  file: 'apps/ubax-web/public/dashboard-comptable/modal-calendar.webp',
  url: 'https://www.figma.com/api/mcp/asset/54aa7613-34f6-4952-9ff3-1387cff55333',
 },
 {
  file: 'apps/ubax-web/public/dashboard-comptable/modal-file.webp',
  url: 'https://www.figma.com/api/mcp/asset/cf43928a-52c5-4f98-ad46-e8a1dc946e38',
 },
 {
  file: 'apps/ubax-web/public/dashboard-comptable/modal-file-check.webp',
  url: 'https://www.figma.com/api/mcp/asset/90604a3b-b634-40ea-b218-452e91007b79',
 },
];

function resolveTarget(relativePath) {
 return path.join(workspaceRoot, relativePath);
}

async function ensureTargetDirectory(targetPath) {
 await fs.mkdir(path.dirname(targetPath), { recursive: true });
}

async function downloadAsset(asset, force) {
 const targetPath = resolveTarget(asset.file);

 if (!force) {
  try {
   await fs.access(targetPath);
   console.log(`Skipping existing file: ${asset.file}`);
   return;
  } catch {
   // Missing file, continue.
  }
 }

 const response = await fetch(asset.url, {
  headers: { Accept: 'image/*' },
 });

 if (!response.ok) {
  throw new Error(`Request failed with status ${response.status}`);
 }

 const buffer = Buffer.from(await response.arrayBuffer());
 await ensureTargetDirectory(targetPath);
 await sharp(buffer, { density: 144 })
  .webp({ quality: 90, alphaQuality: 100 })
  .toFile(targetPath);

 console.log(`Downloaded ${asset.file}`);
}

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
