import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '..');

const ASSETS = [
 {
  file: 'apps/ubax-web/public/dashboard-commercial/icons/search.webp',
  url: 'https://www.figma.com/api/mcp/asset/ae633928-4ec0-4cd5-9eb1-469fc9dd8f5d',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/icons/export.webp',
  url: 'https://www.figma.com/api/mcp/asset/df03f6e1-b892-4c4c-897d-f96de9262cd4',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/icons/calendar.webp',
  url: 'https://www.figma.com/api/mcp/asset/f5edda55-8182-4617-9684-8d45d78807be',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/icons/chevron-down.webp',
  url: 'https://www.figma.com/api/mcp/asset/a7f5198d-5095-47bf-a79f-59bf4e1a6aaf',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/icons/kpi-home.webp',
  url: 'https://www.figma.com/api/mcp/asset/aae40776-9914-486d-a2b0-2468dd46ff7c',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/icons/kpi-users.webp',
  url: 'https://www.figma.com/api/mcp/asset/283518e2-c3c6-4530-a973-bcbf0e9745ff',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/icons/kpi-appointments.webp',
  url: 'https://www.figma.com/api/mcp/asset/386c4491-2ce2-4689-a9e0-2da489ee64eb',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/icons/kpi-success.webp',
  url: 'https://www.figma.com/api/mcp/asset/14942d9e-0d11-48b7-90f6-8842309235bb',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/icons/add.webp',
  url: 'https://www.figma.com/api/mcp/asset/afdb7ce0-3bfe-4672-bf99-dc974ec263e0',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/icons/event-arrow-confirmed.webp',
  url: 'https://www.figma.com/api/mcp/asset/04447ef8-c88f-4a7f-a2e0-ff870ea4eef6',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/icons/event-arrow-upcoming.webp',
  url: 'https://www.figma.com/api/mcp/asset/3fae0aa1-66de-456f-b607-3d9095508049',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/icons/event-arrow-cancelled.webp',
  url: 'https://www.figma.com/api/mcp/asset/f3651bc2-950a-4e47-a41c-5e30cf21c7fe',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/icons/property-arrow.webp',
  url: 'https://www.figma.com/api/mcp/asset/9cb26dfe-242c-4803-aa3d-4c8bb08fecbf',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/icons/location.webp',
  url: 'https://www.figma.com/api/mcp/asset/5f27b38e-302f-4ea7-8dc1-0e4ccbd0eb14',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/planning/filter-calendar.webp',
  url: 'https://www.figma.com/api/mcp/asset/817bc0cc-feaa-47ed-9632-d163126304e9',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/planning/sidebar.webp',
  url: 'https://www.figma.com/api/mcp/asset/2bc6a2a4-b3aa-478d-b49f-2e291bbb5beb',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/planning/grid.webp',
  url: 'https://www.figma.com/api/mcp/asset/e04f2f0a-8ea2-4930-96f2-605f25f7476c',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/state/progress-bar.webp',
  url: 'https://www.figma.com/api/mcp/asset/76137946-43d5-46f5-80b4-a446a0fce57d',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/people/event-avatar-01.webp',
  url: 'https://www.figma.com/api/mcp/asset/d143603c-8d16-464e-818b-a7495adf910a',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/people/event-avatar-02.webp',
  url: 'https://www.figma.com/api/mcp/asset/4a2e1916-3fe9-4ec4-9e67-d4bb14d4ad04',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/people/event-avatar-03.webp',
  url: 'https://www.figma.com/api/mcp/asset/f1add4a2-2048-4a4c-9c76-b2edae0bff84',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/people/event-avatar-04.webp',
  url: 'https://www.figma.com/api/mcp/asset/c3f49189-b154-44b0-b3e1-ca058fab74f7',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/people/event-avatar-05.webp',
  url: 'https://www.figma.com/api/mcp/asset/b0a269f6-99d8-4f00-9d2d-a139ffb5365e',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/people/event-avatar-06.webp',
  url: 'https://www.figma.com/api/mcp/asset/ffaf1abd-4c5a-40a9-a299-0330bee25684',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/people/event-avatar-07.webp',
  url: 'https://www.figma.com/api/mcp/asset/87d19037-8d44-4679-aef0-4f0d5ec7e043',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/people/event-avatar-08.webp',
  url: 'https://www.figma.com/api/mcp/asset/5ba8a454-4414-4e6d-90d1-65f7898e4510',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/people/event-avatar-09.webp',
  url: 'https://www.figma.com/api/mcp/asset/2de3386e-86b4-4898-b0fb-135263421eee',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/people/event-avatar-10.webp',
  url: 'https://www.figma.com/api/mcp/asset/bd76a0d1-ec96-43df-b755-67eb1666e68a',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/people/event-avatar-11.webp',
  url: 'https://www.figma.com/api/mcp/asset/2aae3113-e710-4122-b990-5b0a21a3a78e',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/people/property-owner-01.webp',
  url: 'https://www.figma.com/api/mcp/asset/e6afa726-e242-4294-8bc0-abca1bf91b62',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/people/property-owner-02.webp',
  url: 'https://www.figma.com/api/mcp/asset/6a6b32ad-7305-4e8a-9867-2b04104db997',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/people/property-owner-03.webp',
  url: 'https://www.figma.com/api/mcp/asset/04e5cbb2-1f17-4e65-815e-f98cf27a18b3',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/properties/property-01.webp',
  url: 'https://www.figma.com/api/mcp/asset/a134f837-5ad9-4702-9871-ca197a142b28',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/properties/property-02.webp',
  url: 'https://www.figma.com/api/mcp/asset/787b2a0e-12fa-4878-aa6b-0a860398fd44',
 },
 {
  file: 'apps/ubax-web/public/dashboard-commercial/properties/property-03.webp',
  url: 'https://www.figma.com/api/mcp/asset/682ba8fa-67d4-4a9c-84c7-57c70dc820ce',
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
 const inputBuffer = Buffer.from(arrayBuffer);
 await ensureParentDirectory(targetPath);
 await sharp(inputBuffer, { density: 300, failOn: 'none' })
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
  `\nFinished: ${ASSETS.length - failures.length}/${ASSETS.length} assets downloaded.`
 );

 if (failures.length > 0) {
  process.exitCode = 1;
 }
}

main();
