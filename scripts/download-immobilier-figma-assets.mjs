import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '..');

const ASSETS = [
 // Liste biens
 {
  file: 'apps/ubax-web/public/biens/list/grid-property-02.png',
  url: 'https://www.figma.com/api/mcp/asset/24734119-47fb-4cac-a156-e677eaf653e8',
 },
 {
  file: 'apps/ubax-web/public/biens/list/grid-property-04.png',
  url: 'https://www.figma.com/api/mcp/asset/fb893cb3-e2e8-4808-b5a3-966b95089ca3',
 },
 {
  file: 'apps/ubax-web/public/biens/list/grid-property-05.png',
  url: 'https://www.figma.com/api/mcp/asset/814fadf4-1524-471d-bec3-c615b079a916',
 },
 {
  file: 'apps/ubax-web/public/biens/list/grid-property-06.png',
  url: 'https://www.figma.com/api/mcp/asset/4c569179-8705-42aa-8864-a92b1de42a5a',
 },
 {
  file: 'apps/ubax-web/public/biens/list/grid-tenant-04.png',
  url: 'https://www.figma.com/api/mcp/asset/62643cec-2209-45f7-82a9-e550cfadc78b',
 },
 {
  file: 'apps/ubax-web/public/biens/list/grid-tenant-05.png',
  url: 'https://www.figma.com/api/mcp/asset/40a949ae-efd9-4a9e-84b2-1846a9366026',
 },
 {
  file: 'apps/ubax-web/public/biens/list/grid-tenant-06.png',
  url: 'https://www.figma.com/api/mcp/asset/6a9ed538-f53c-4c3d-aa91-350d4e886ded',
 },
 {
  file: 'apps/ubax-web/public/biens/list/list-property-02.png',
  url: 'https://www.figma.com/api/mcp/asset/4fef8473-dc5e-4f95-8843-1bfab179227f',
 },
 {
  file: 'apps/ubax-web/public/biens/list/list-property-06.png',
  url: 'https://www.figma.com/api/mcp/asset/925c29b4-785e-4bed-b464-55f77b974a1f',
 },
 {
  file: 'apps/ubax-web/public/biens/list/list-property-07.png',
  url: 'https://www.figma.com/api/mcp/asset/0c7cb452-e65c-4419-9ff8-f299cfea6cde',
 },
 {
  file: 'apps/ubax-web/public/biens/list/list-tenant-01.png',
  url: 'https://www.figma.com/api/mcp/asset/407fce30-89be-4b63-8f9a-2c4097d24b58',
 },

 // Détail bien
 {
  file: 'apps/ubax-web/public/biens/detail/property-side-01.png',
  url: 'https://www.figma.com/api/mcp/asset/90bbcd7c-9f7c-4e4c-bf09-3060c7d03df2',
 },
 {
  file: 'apps/ubax-web/public/biens/detail/property-side-02.png',
  url: 'https://www.figma.com/api/mcp/asset/35e95213-05ea-4067-a8cd-63f4d33695b6',
 },
 {
  file: 'apps/ubax-web/public/biens/detail/property-side-03.png',
  url: 'https://www.figma.com/api/mcp/asset/619a5e56-c80b-4431-bc2c-cd6b7f9647b9',
 },
 {
  file: 'apps/ubax-web/public/biens/detail/owner-avatar.png',
  url: 'https://www.figma.com/api/mcp/asset/1445d3ab-af86-4df0-8853-47216e00df20',
 },
 {
  file: 'apps/ubax-web/public/biens/detail/location-map.png',
  url: 'https://www.figma.com/api/mcp/asset/7cb75bf6-d885-435d-b3fa-eb8a92d1e801',
 },
 {
  file: 'apps/ubax-web/public/biens/detail/comment-user-01.png',
  url: 'https://www.figma.com/api/mcp/asset/939a4ddc-4897-47d2-958b-119cb8408da1',
 },
 {
  file: 'apps/ubax-web/public/biens/detail/comment-user-02.png',
  url: 'https://www.figma.com/api/mcp/asset/f9a06a0b-5bc1-45dd-88c1-f25cc7bbd859',
 },
 {
  file: 'apps/ubax-web/public/biens/detail/comment-user-03.png',
  url: 'https://www.figma.com/api/mcp/asset/ad1c7b22-7261-4449-97a3-c9c2b2fabbe2',
 },

 // Profil locataire
 // Détail bailleur
 {
  file: 'apps/ubax-web/public/biens/bailleur/profile-cover.png',
  url: 'https://www.figma.com/api/mcp/asset/de8b642b-b5c7-4635-806d-0899a6e014ed',
 },
 {
  file: 'apps/ubax-web/public/biens/bailleur/profile-avatar.png',
  url: 'https://www.figma.com/api/mcp/asset/52e0c6b8-c245-4a23-9bef-1319e095202c',
 },
 {
  file: 'apps/ubax-web/public/biens/bailleur/tenant-02.png',
  url: 'https://www.figma.com/api/mcp/asset/c0d22c59-b65c-4bbd-a4b7-8b8d8537c6b2',
 },
 {
  file: 'apps/ubax-web/public/biens/bailleur/payment-orange.png',
  url: 'https://www.figma.com/api/mcp/asset/32234ba1-f9fa-4173-bab6-2b77830cbaf0',
 },
 {
  file: 'apps/ubax-web/public/biens/bailleur/payment-wave.png',
  url: 'https://www.figma.com/api/mcp/asset/bd4e74b1-289a-4fd3-ae84-fac3060df928',
 },

 // Ajouter bien
 {
  file: 'apps/ubax-web/public/biens/add/step1-main.png',
  url: 'https://www.figma.com/api/mcp/asset/677fba05-c82c-49de-b6c5-34445d830ccf',
 },
 {
  file: 'apps/ubax-web/public/biens/add/step1-thumb-01.png',
  url: 'https://www.figma.com/api/mcp/asset/31d1060b-8672-48f6-ab15-ba9578ca2107',
 },
 {
  file: 'apps/ubax-web/public/biens/add/step1-thumb-02.png',
  url: 'https://www.figma.com/api/mcp/asset/3868125f-0149-47ba-894c-01a151ca4b30',
 },
 {
  file: 'apps/ubax-web/public/biens/add/step1-thumb-03.png',
  url: 'https://www.figma.com/api/mcp/asset/f9862eb9-7087-4c68-8b16-4ee7b8041835',
 },
 {
  file: 'apps/ubax-web/public/biens/add/step1-thumb-04.png',
  url: 'https://www.figma.com/api/mcp/asset/7160a1ec-172a-45d4-8482-fab2f0861f1c',
 },
 {
  file: 'apps/ubax-web/public/biens/add/step1-thumb-05.png',
  url: 'https://www.figma.com/api/mcp/asset/0f8ad56b-8d81-47ad-be38-05b1c523edfd',
 },
 {
  file: 'apps/ubax-web/public/biens/add/step3-main.png',
  url: 'https://www.figma.com/api/mcp/asset/73a75b0f-bffa-4153-88b3-b5a2b529d7bb',
 },
 {
  file: 'apps/ubax-web/public/biens/add/step3-background.png',
  url: 'https://www.figma.com/api/mcp/asset/3c53455e-4e85-4aae-a4b1-27b933f3de71',
 },
 {
  file: 'apps/ubax-web/public/biens/add/step3-thumb-01.png',
  url: 'https://www.figma.com/api/mcp/asset/ea324dc6-94fa-4cc6-bc5e-2e023b84b13b',
 },
 {
  file: 'apps/ubax-web/public/biens/add/step3-thumb-02.png',
  url: 'https://www.figma.com/api/mcp/asset/c0eb2b12-e845-496f-b257-f46c3d2d4ba5',
 },
 {
  file: 'apps/ubax-web/public/biens/add/step3-thumb-03.png',
  url: 'https://www.figma.com/api/mcp/asset/06767483-0253-4364-90e9-45a2eb06374b',
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
 await fs.writeFile(targetPath, Buffer.from(arrayBuffer));
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

 console.log(`\nFinished: ${ASSETS.length - failures.length}/${ASSETS.length} assets downloaded.`);

 if (failures.length > 0) {
  process.exitCode = 1;
 }
}

main();