import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '..');

const ASSETS = [
  {
    file: 'apps/ubax-web/public/demandes/commercial/request-arrow.webp',
    url: 'https://www.figma.com/api/mcp/asset/a344c08d-2c75-460a-8d56-0fafd9b0166e',
  },
  {
    file: 'apps/ubax-web/public/demandes/commercial/request-icon.webp',
    url: 'https://www.figma.com/api/mcp/asset/df34c836-1ede-4413-9b3d-b62a0d1199fd',
  },
  {
    file: 'apps/ubax-web/public/demandes/commercial/visit-icon.webp',
    url: 'https://www.figma.com/api/mcp/asset/0fb1b1c3-dbdc-4318-a7f9-22ae1cc0c6fd',
  },
  {
    file: 'apps/ubax-web/public/demandes/commercial/calendar-chevron-left.webp',
    url: 'https://www.figma.com/api/mcp/asset/34d7aab7-d0d1-4360-bdf5-b04ca2d69760',
  },
  {
    file: 'apps/ubax-web/public/demandes/commercial/calendar-chevron-right.webp',
    url: 'https://www.figma.com/api/mcp/asset/04a648b0-1702-470b-822b-b98a3ba984b4',
  },
  {
    file: 'apps/ubax-web/public/demandes/commercial/visit-home.webp',
    url: 'https://www.figma.com/api/mcp/asset/66b803cc-d9ea-45af-ab66-a2320ebeb347',
  },
  {
    file: 'apps/ubax-web/public/demandes/commercial/visit-clock.webp',
    url: 'https://www.figma.com/api/mcp/asset/1ab7055c-37f0-4919-8445-e3102d4c9eef',
  },
  {
    file: 'apps/ubax-web/public/demandes/commercial/visit-avatar-01.webp',
    url: 'https://www.figma.com/api/mcp/asset/31e26a17-860e-4d37-834f-10de84adde9e',
  },
  {
    file: 'apps/ubax-web/public/demandes/commercial/visit-avatar-02.webp',
    url: 'https://www.figma.com/api/mcp/asset/c597bc26-d3f4-4ed6-822f-dfab4d5ce8dc',
  },
  {
    file: 'apps/ubax-web/public/demandes/commercial/visit-avatar-03.webp',
    url: 'https://www.figma.com/api/mcp/asset/654ff43c-ac90-4109-aa44-71fe1e607a4e',
  },
  {
    file: 'apps/ubax-web/public/demandes/commercial/visit-avatar-04.webp',
    url: 'https://www.figma.com/api/mcp/asset/48c809be-59a9-49c0-9965-1b0c0105df46',
  },
  {
    file: 'apps/ubax-web/public/demandes/commercial/visit-avatar-05.webp',
    url: 'https://www.figma.com/api/mcp/asset/501f085c-1e63-4951-8eb0-1a607f05de70',
  },
  {
    file: 'apps/ubax-web/public/demandes/commercial/visit-avatar-06.webp',
    url: 'https://www.figma.com/api/mcp/asset/f5d61b8c-8a63-472b-a78d-38f778ee55c5',
  },
  {
    file: 'apps/ubax-web/public/demandes/commercial/visit-avatar-07.webp',
    url: 'https://www.figma.com/api/mcp/asset/c1c0e991-2336-464a-9efe-0e5de06827b7',
  },
  {
    file: 'apps/ubax-web/public/demandes/commercial/overlay-close.webp',
    url: 'https://www.figma.com/api/mcp/asset/6d96fee9-cf5d-4f8c-8025-33fb374f1934',
  },
  {
    file: 'apps/ubax-web/public/shared/demandes/filter-search.webp',
    url: 'https://www.figma.com/api/mcp/asset/8cb80f67-85e0-4f4d-bd55-6a11e10b966f',
  },
  {
    file: 'apps/ubax-web/public/shared/demandes/filter-date.webp',
    url: 'https://www.figma.com/api/mcp/asset/42b630b2-a096-4f34-8b48-014bb38e8f8e',
  },
  {
    file: 'apps/ubax-web/public/shared/demandes/filter-export.webp',
    url: 'https://www.figma.com/api/mcp/asset/4cf67ff4-855e-4ff5-a310-c51edc0a1504',
  },
  {
    file: 'apps/ubax-web/public/shared/demandes/select-chevron.webp',
    url: 'https://www.figma.com/api/mcp/asset/03281d83-1596-4531-87b0-3f8833a2974a',
  },
  {
    file: 'apps/ubax-web/public/shared/demandes/summary-open.webp',
    url: 'https://www.figma.com/api/mcp/asset/6fcf1d43-8d06-453a-b577-344ba26e0514',
  },
  {
    file: 'apps/ubax-web/public/shared/demandes/summary-progress.webp',
    url: 'https://www.figma.com/api/mcp/asset/0e18a337-598a-4f63-8325-3cf1773d24b7',
  },
  {
    file: 'apps/ubax-web/public/shared/demandes/summary-done.webp',
    url: 'https://www.figma.com/api/mcp/asset/e8f96b70-ce6c-4bac-9928-63f916749f23',
  },
  {
    file: 'apps/ubax-web/public/shared/demandes/action-eye.webp',
    url: 'https://www.figma.com/api/mcp/asset/c055a1a2-992f-48c2-b39e-21b2f0ac8cac',
  },
  {
    file: 'apps/ubax-web/public/shared/demandes/ticket-avatar-01.webp',
    url: 'https://www.figma.com/api/mcp/asset/b0f0d9a8-00d7-4ac3-aac9-913c1a418288',
  },
  {
    file: 'apps/ubax-web/public/shared/demandes/ticket-avatar-02.webp',
    url: 'https://www.figma.com/api/mcp/asset/ac244162-87b8-4288-9693-33a160e0416b',
  },
  {
    file: 'apps/ubax-web/public/shared/demandes/ticket-avatar-03.webp',
    url: 'https://www.figma.com/api/mcp/asset/8899feb3-add2-4d0d-8ca6-d13f75ac213f',
  },
  {
    file: 'apps/ubax-web/public/shared/demandes/ticket-avatar-04.webp',
    url: 'https://www.figma.com/api/mcp/asset/f9961bbd-bf44-4f83-a6e1-399a9e1cffad',
  },
  {
    file: 'apps/ubax-web/public/demandes/sav/issue-property-01.webp',
    url: 'https://www.figma.com/api/mcp/asset/105b1580-ced6-404e-a758-4fa68df77d83',
  },
  {
    file: 'apps/ubax-web/public/demandes/sav/issue-property-02.webp',
    url: 'https://www.figma.com/api/mcp/asset/6feaf001-6e08-4dec-bd3b-63a03d532a92',
  },
  {
    file: 'apps/ubax-web/public/demandes/sav/issue-property-03.webp',
    url: 'https://www.figma.com/api/mcp/asset/8e49e34e-28e5-41e3-a5af-3d1d1e67e13d',
  },
  {
    file: 'apps/ubax-web/public/demandes/sav/issue-property-04.webp',
    url: 'https://www.figma.com/api/mcp/asset/6301045b-bef7-4ac3-8a01-691017c906d0',
  },
  {
    file: 'apps/ubax-web/public/demandes/comptable/request-thumb-01.webp',
    url: 'https://www.figma.com/api/mcp/asset/e9a2e604-d1e3-42d7-9e0d-3f87cd8df60d',
  },
  {
    file: 'apps/ubax-web/public/demandes/comptable/request-thumb-02.webp',
    url: 'https://www.figma.com/api/mcp/asset/daf379af-9b6a-4c67-a576-2315aec7f352',
  },
  {
    file: 'apps/ubax-web/public/demandes/comptable/request-thumb-03.webp',
    url: 'https://www.figma.com/api/mcp/asset/c671835f-4492-4d5c-960f-6349956a4205',
  },
  {
    file: 'apps/ubax-web/public/demandes/comptable/request-thumb-04.webp',
    url: 'https://www.figma.com/api/mcp/asset/af153eb6-db25-4610-8991-374912e17c66',
  },
  {
    file: 'apps/ubax-web/public/demandes/comptable/request-thumb-05.webp',
    url: 'https://www.figma.com/api/mcp/asset/fa88758e-c86d-4405-af61-e1a08d189fc2',
  },
  {
    file: 'apps/ubax-web/public/demandes/comptable/request-thumb-06.webp',
    url: 'https://www.figma.com/api/mcp/asset/e71b1a05-6138-483a-a807-a346249f20d5',
  },
  {
    file: 'apps/ubax-web/public/demandes/comptable/request-thumb-07.webp',
    url: 'https://www.figma.com/api/mcp/asset/a92ccaad-d860-461b-8fb5-b6f7092dc3e5',
  },
  {
    file: 'apps/ubax-web/public/demandes/comptable/request-thumb-08.webp',
    url: 'https://www.figma.com/api/mcp/asset/c7879950-0d1a-4532-8f44-4e4174e76572',
  },
];

const COMPOSITES = [
  {
    file: 'apps/ubax-web/public/demandes/commercial/notification-bell.webp',
    urls: [
      'https://www.figma.com/api/mcp/asset/02409a02-9c5a-4fba-803a-905fa84ae696',
      'https://www.figma.com/api/mcp/asset/50311051-41b6-4e06-8f07-25e336081fa3',
    ],
  },
  {
    file: 'apps/ubax-web/public/shared/demandes/notification-bell.webp',
    urls: [
      'https://www.figma.com/api/mcp/asset/95c46a18-a941-4229-8657-18356414e229',
      'https://www.figma.com/api/mcp/asset/b9c2a46e-7cb1-4f37-b8e3-3ffd7e83b7e6',
      'https://www.figma.com/api/mcp/asset/3476c72b-04fb-452b-b901-816cf2b79612',
    ],
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

async function createCompositeAsset(asset, force) {
  const targetPath = getTargetPath(asset.file);

  if (!force && (await assetExists(targetPath))) {
    console.log(`Skipping existing file: ${asset.file}`);
    return;
  }

  const layers = await Promise.all(asset.urls.map((url) => fetchBuffer(url)));
  const normalizedLayers = await Promise.all(
    layers.map(async (buffer) => sharp(buffer, { density: 300 }).png().toBuffer()),
  );
  const metadata = await sharp(normalizedLayers[0]).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to resolve composite dimensions');
  }

  await ensureParentDirectory(targetPath);

  await sharp({
    create: {
      width: metadata.width,
      height: metadata.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(normalizedLayers.map((input) => ({ input })))
    .webp({ lossless: true })
    .toFile(targetPath);

  console.log(`Built ${asset.file}`);
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

for (const asset of COMPOSITES) {
  try {
    await createCompositeAsset(asset, force);
  } catch (error) {
    failures.push({ asset: asset.file, error });
    console.error(`Failed ${asset.file}: ${error.message}`);
  }
}

const total = ASSETS.length + COMPOSITES.length;
console.log(`\nFinished: ${total - failures.length}/${total} assets generated.`);

if (failures.length > 0) {
  process.exitCode = 1;
}