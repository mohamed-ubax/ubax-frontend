import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '..');

const ASSETS = [
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/media/profile-hero.webp',
  url: 'https://www.figma.com/api/mcp/asset/83e53609-676f-4b63-a019-7a365b2fabd8',
 },
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/media/property-main.webp',
  url: 'https://www.figma.com/api/mcp/asset/985410d9-88f6-4461-a37d-eccb965f1cdc',
 },
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/media/property-tenant.webp',
  url: 'https://www.figma.com/api/mcp/asset/c098712c-dba8-4aaa-b0a2-3fdb196c3321',
 },
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/media/payment-orange.webp',
  url: 'https://www.figma.com/api/mcp/asset/4e3a3b42-2fc3-4b18-902a-6825ff2fde54',
 },
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/media/payment-wave.webp',
  url: 'https://www.figma.com/api/mcp/asset/57d279bf-b258-4102-89ca-d274c7e42d94',
 },
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/icons/back-shell.webp',
  url: 'https://www.figma.com/api/mcp/asset/d5158200-38d9-42cc-bc7a-eaff41dce363',
 },
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/icons/back-arrow.webp',
  url: 'https://www.figma.com/api/mcp/asset/91fcccf9-da98-4857-a924-a5f7a001d89c',
 },
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/icons/action-shell.webp',
  url: 'https://www.figma.com/api/mcp/asset/c0c32d66-b8cd-49de-adc6-bb13f1e2109c',
 },
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/icons/doc-action-shell.webp',
  url: 'https://www.figma.com/api/mcp/asset/72186570-8902-4dc7-b321-bbe13abb0348',
 },
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/icons/property-action-shell.webp',
  url: 'https://www.figma.com/api/mcp/asset/6845dd65-cffd-4b8a-af19-dcc95c7adf49',
 },
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/icons/cancel.webp',
  url: 'https://www.figma.com/api/mcp/asset/33262d32-ffc3-417e-ab49-f50485e456f4',
 },
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/icons/edit.webp',
  url: 'https://www.figma.com/api/mcp/asset/14cc8644-c7ef-49e0-9fcf-b9ae05d92b7b',
 },
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/icons/phone.webp',
  url: 'https://www.figma.com/api/mcp/asset/002c4783-45e3-442a-baa6-ef7a8e76dbae',
 },
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/icons/mail.webp',
  url: 'https://www.figma.com/api/mcp/asset/c3ea3f7a-d561-47fa-a9ac-a8106f7ae65e',
 },
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/icons/id-card.webp',
  url: 'https://www.figma.com/api/mcp/asset/a3be06cc-e6ad-4b41-bbce-f4867c0b1eb8',
 },
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/icons/work.webp',
  url: 'https://www.figma.com/api/mcp/asset/d8903286-7d15-420b-8be3-dfc6f322c80a',
 },
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/icons/file.webp',
  url: 'https://www.figma.com/api/mcp/asset/fb6b1bf0-8e99-4c47-9d27-e5fec07b2d31',
 },
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/icons/calendar.webp',
  url: 'https://www.figma.com/api/mcp/asset/fd6246c7-cf6f-4058-aa7c-fe20317a9701',
 },
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/icons/document-title.webp',
  url: 'https://www.figma.com/api/mcp/asset/aed6726e-1148-42ab-b4a5-3b566852a576',
 },
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/icons/document.webp',
  url: 'https://www.figma.com/api/mcp/asset/b373e181-c9ba-4ff5-af7a-480ac5fefa85',
 },
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/icons/eye.webp',
  url: 'https://www.figma.com/api/mcp/asset/5f2b8372-a672-4e96-8db1-af71171bb215',
 },
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/icons/download.webp',
  url: 'https://www.figma.com/api/mcp/asset/7ab1459f-bc0b-4d4c-a45c-2901425f29ae',
 },
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/icons/history-title.webp',
  url: 'https://www.figma.com/api/mcp/asset/897d5638-959d-4ebc-99d2-94e9c1ab83c1',
 },
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/icons/payment-check.webp',
  url: 'https://www.figma.com/api/mcp/asset/d453b6cf-96de-4c62-bd55-6f004a09d98d',
 },
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/icons/payment-chevron.webp',
  url: 'https://www.figma.com/api/mcp/asset/365c0e9c-b44d-47bc-b9d5-3f0bd0a727c6',
 },
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/icons/location.webp',
  url: 'https://www.figma.com/api/mcp/asset/eb22e83d-bd45-457c-ab6f-9765d2bd6de6',
 },
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/icons/property-open-arrow.webp',
  url: 'https://www.figma.com/api/mcp/asset/d0a06435-ff5a-495a-ac84-75e9f677299b',
 },
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/icons/star-filled.webp',
  url: 'https://www.figma.com/api/mcp/asset/854c9a2f-ad07-4914-88c5-2fd49b5acb2a',
 },
 {
  file: 'apps/ubax-web/public/reservations/locataire-detail/icons/star-empty.webp',
  url: 'https://www.figma.com/api/mcp/asset/2f3a645a-6bfb-4dac-a449-64fdaab2cb09',
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
 console.log(`Generated ${asset.file}`);
}

async function main() {
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

 console.log(
  `\nFinished: ${ASSETS.length - failures.length}/${ASSETS.length} assets generated.`,
 );

 if (failures.length > 0) {
  process.exitCode = 1;
 }
}

main();
