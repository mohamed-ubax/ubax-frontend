import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '..');

const ASSETS = [
  {
    file: 'apps/ubax-web/public/archivages/commercial/icons/search.webp',
    url: 'https://www.figma.com/api/mcp/asset/49761520-908e-450b-aec9-e783ebb6807e',
  },
  {
    file: 'apps/ubax-web/public/archivages/commercial/icons/calendar-toolbar.webp',
    url: 'https://www.figma.com/api/mcp/asset/808ac279-f6c3-49be-87bb-5f11aa19ee7f',
  },
  {
    file: 'apps/ubax-web/public/archivages/commercial/icons/calendar-filter.webp',
    url: 'https://www.figma.com/api/mcp/asset/a7b63d69-5e69-4e18-95e9-13f9a2077c9e',
  },
  {
    file: 'apps/ubax-web/public/archivages/commercial/icons/export.webp',
    url: 'https://www.figma.com/api/mcp/asset/f6c6eda7-5826-4fb8-ba8f-3b6dbbb5d6c3',
  },
  {
    file: 'apps/ubax-web/public/archivages/commercial/icons/chevron-down.webp',
    url: 'https://www.figma.com/api/mcp/asset/298cd6ee-2cfc-466d-8e36-32d3ff86985a',
  },
  {
    file: 'apps/ubax-web/public/archivages/commercial/icons/paginator-previous.webp',
    url: 'https://www.figma.com/api/mcp/asset/0a107c16-aa0f-46eb-9c8c-8797c2ca669a',
  },
  {
    file: 'apps/ubax-web/public/archivages/commercial/icons/paginator-next.webp',
    url: 'https://www.figma.com/api/mcp/asset/828df0cd-efa4-4daa-8c9d-9440e201efb1',
  },
  {
    file: 'apps/ubax-web/public/archivages/commercial/people/locataire-01.webp',
    url: 'https://www.figma.com/api/mcp/asset/087e0128-0ebe-40ee-b6d4-179dd989d498',
  },
  {
    file: 'apps/ubax-web/public/archivages/commercial/people/locataire-02.webp',
    url: 'https://www.figma.com/api/mcp/asset/a4c427ab-e635-4bb8-a593-99c71d055973',
  },
  {
    file: 'apps/ubax-web/public/archivages/commercial/people/locataire-03.webp',
    url: 'https://www.figma.com/api/mcp/asset/0bdaf5a4-37bc-4106-92d1-7b2659a3e4fc',
  },
  {
    file: 'apps/ubax-web/public/archivages/commercial/people/locataire-04.webp',
    url: 'https://www.figma.com/api/mcp/asset/9c3ddc13-740b-4df9-a034-ca1c73b4906e',
  },
  {
    file: 'apps/ubax-web/public/archivages/commercial/people/locataire-05.webp',
    url: 'https://www.figma.com/api/mcp/asset/0e62e581-841d-46b3-909b-148ebcbe6e71',
  },
  {
    file: 'apps/ubax-web/public/archivages/commercial/people/locataire-06.webp',
    url: 'https://www.figma.com/api/mcp/asset/00240bff-250a-41cd-9d1b-39b0ab82c865',
  },
  {
    file: 'apps/ubax-web/public/archivages/commercial/people/facture-01.webp',
    url: 'https://www.figma.com/api/mcp/asset/250e9294-7700-45a7-b12e-a24741f6c3a0',
  },
  {
    file: 'apps/ubax-web/public/archivages/commercial/people/facture-02.webp',
    url: 'https://www.figma.com/api/mcp/asset/54bc2a08-3ab7-4701-af1e-913593498b6c',
  },
  {
    file: 'apps/ubax-web/public/archivages/commercial/people/facture-03.webp',
    url: 'https://www.figma.com/api/mcp/asset/e74f3652-b145-4ae9-8417-85422f19b6c6',
  },
  {
    file: 'apps/ubax-web/public/archivages/commercial/people/facture-05.webp',
    url: 'https://www.figma.com/api/mcp/asset/ddc78885-0b8e-4bb4-a8a9-3dbe8b91dc5b',
  },
  {
    file: 'apps/ubax-web/public/archivages/commercial/people/ticket-01.webp',
    url: 'https://www.figma.com/api/mcp/asset/83fbf49d-3900-402c-8218-f319760ac647',
  },
  {
    file: 'apps/ubax-web/public/archivages/commercial/people/ticket-02.webp',
    url: 'https://www.figma.com/api/mcp/asset/a61342ff-2c1c-467d-b3cc-1cbb917fad10',
  },
  {
    file: 'apps/ubax-web/public/archivages/commercial/people/ticket-03.webp',
    url: 'https://www.figma.com/api/mcp/asset/19b6bac7-6314-46c4-be4a-3c45228ad376',
  },
  {
    file: 'apps/ubax-web/public/archivages/commercial/people/ticket-04.webp',
    url: 'https://www.figma.com/api/mcp/asset/877bc211-dd62-4387-9594-9d13874ab868',
  },
  {
    file: 'apps/ubax-web/public/archivages/commercial/people/ticket-06.webp',
    url: 'https://www.figma.com/api/mcp/asset/95f6cd3a-ee1f-4a46-b8fa-997de0ddbef0',
  },
  {
    file: 'apps/ubax-web/public/archivages/commercial/people/document-01.webp',
    url: 'https://www.figma.com/api/mcp/asset/fbb042fe-8f6c-4f43-8175-502a8fd8d1ab',
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

  console.log(`\nFinished: ${ASSETS.length - failures.length}/${ASSETS.length} assets generated.`);

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main();