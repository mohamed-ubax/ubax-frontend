import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '..');

const ASSETS = [
  {
    file: 'apps/ubax-web/public/finances/shared/chart-grid.webp',
    url: 'https://www.figma.com/api/mcp/asset/c49e6325-c257-4e8d-af74-878a3738efee',
  },
  {
    file: 'apps/ubax-web/public/finances/shared/chart-gradient.webp',
    url: 'https://www.figma.com/api/mcp/asset/84af2197-76d5-45c6-800e-9d81c87f609f',
  },
  {
    file: 'apps/ubax-web/public/finances/shared/chart-line.webp',
    url: 'https://www.figma.com/api/mcp/asset/b5ac9617-f9f4-4015-8494-c75c09cefc01',
  },
  {
    file: 'apps/ubax-web/public/finances/shared/chart-indicator.webp',
    url: 'https://www.figma.com/api/mcp/asset/053ee233-55ab-4b6a-9209-37539e0bcba9',
  },
  {
    file: 'apps/ubax-web/public/finances/shared/chart-tooltip.webp',
    url: 'https://www.figma.com/api/mcp/asset/4c1f8651-17b5-4d3a-9e58-71bf864843e9',
  },
  {
    file: 'apps/ubax-web/public/finances/shared/expense-pie.webp',
    url: 'https://www.figma.com/api/mcp/asset/df8113da-0eea-49c1-b8e5-4ec643397369',
  },
  {
    file: 'apps/ubax-web/public/finances/shared/kpi-money.webp',
    url: 'https://www.figma.com/api/mcp/asset/b53dd500-da12-4b9f-bac1-9170a3dda4fb',
  },
  {
    file: 'apps/ubax-web/public/finances/shared/kpi-expenses.webp',
    url: 'https://www.figma.com/api/mcp/asset/2188041d-3afa-4e20-af9e-c999d0716a2c',
  },
  {
    file: 'apps/ubax-web/public/finances/shared/kpi-pending.webp',
    url: 'https://www.figma.com/api/mcp/asset/7e4c0643-d8d4-471b-a4b4-ccd3cde69901',
  },
  {
    file: 'apps/ubax-web/public/finances/shared/balance-eye-off.webp',
    url: 'https://www.figma.com/api/mcp/asset/5c3e6e3f-211e-4a4b-a201-b73130ed1a17',
  },
  {
    file: 'apps/ubax-web/public/finances/shared/search-icon.webp',
    url: 'https://www.figma.com/api/mcp/asset/4c7b21dc-1736-490d-b9a7-1e063f605e54',
  },
  {
    file: 'apps/ubax-web/public/finances/shared/calendar-icon.webp',
    url: 'https://www.figma.com/api/mcp/asset/885895a4-671c-43a8-8417-bb9962ed34a9',
  },
  {
    file: 'apps/ubax-web/public/finances/shared/export-icon.webp',
    url: 'https://www.figma.com/api/mcp/asset/0de942cb-6ffb-424d-9d9b-2fe30d1de17a',
  },
  {
    file: 'apps/ubax-web/public/finances/shared/add-icon.webp',
    url: 'https://www.figma.com/api/mcp/asset/f060b793-8f47-4405-b867-bc8bee62bb70',
  },
  {
    file: 'apps/ubax-web/public/finances/shared/chevron-down.webp',
    url: 'https://www.figma.com/api/mcp/asset/a7fe2398-3ef7-4094-88da-b2dd6c9f3143',
  },
  {
    file: 'apps/ubax-web/public/finances/shared/table-search-icon.webp',
    url: 'https://www.figma.com/api/mcp/asset/02083c05-bfda-4516-b413-12eedad36777',
  },
  {
    file: 'apps/ubax-web/public/finances/shared/action-edit.webp',
    url: 'https://www.figma.com/api/mcp/asset/8f2987f1-6117-4694-837a-a0969e12af2a',
  },
  {
    file: 'apps/ubax-web/public/finances/shared/action-more.webp',
    url: 'https://www.figma.com/api/mcp/asset/1dcc6772-378c-4f57-8b22-7acc7a1c1acb',
  },
  {
    file: 'apps/ubax-web/public/finances/shared/sort-arrow.webp',
    url: 'https://www.figma.com/api/mcp/asset/08153566-a48b-4062-97b3-8d261c86c5c6',
  },
  {
    file: 'apps/ubax-web/public/finances/overdue/avatar-01.webp',
    url: 'https://www.figma.com/api/mcp/asset/519a256d-fa54-400b-85a4-a53b5224ca15',
  },
  {
    file: 'apps/ubax-web/public/finances/overdue/avatar-02.webp',
    url: 'https://www.figma.com/api/mcp/asset/3ee08e7f-dd7f-4f46-914c-54852135c03a',
  },
  {
    file: 'apps/ubax-web/public/finances/overdue/avatar-03.webp',
    url: 'https://www.figma.com/api/mcp/asset/7b3c0210-0856-4d19-88cc-d486df23b661',
  },
  {
    file: 'apps/ubax-web/public/finances/overdue/avatar-04.webp',
    url: 'https://www.figma.com/api/mcp/asset/2c50f0f5-b6b7-445e-9256-3830b90eee3e',
  },
  {
    file: 'apps/ubax-web/public/finances/overdue/avatar-05.webp',
    url: 'https://www.figma.com/api/mcp/asset/399ebd08-58a7-4e6e-870c-5f11d49ebbbe',
  },
  {
    file: 'apps/ubax-web/public/finances/overdue/avatar-06.webp',
    url: 'https://www.figma.com/api/mcp/asset/8cd35a06-2ce5-4a2e-81f5-043307d53ae7',
  },
  {
    file: 'apps/ubax-web/public/finances/overdue/avatar-07.webp',
    url: 'https://www.figma.com/api/mcp/asset/bb904564-b94c-498e-aefc-e8a08a26e2ac',
  },
  {
    file: 'apps/ubax-web/public/finances/overdue/row-eye.webp',
    url: 'https://www.figma.com/api/mcp/asset/11a7ecfa-f442-4dac-b5f3-68767028a56c',
  },
  {
    file: 'apps/ubax-web/public/finances/overdue/row-more.webp',
    url: 'https://www.figma.com/api/mcp/asset/9a63cf1a-004b-4369-b5e5-50779208f66e',
  },
  {
    file: 'apps/ubax-web/public/finances/overdue/dropdown-icon.webp',
    url: 'https://www.figma.com/api/mcp/asset/8e145595-94d2-4691-8461-8f301518784f',
  },
  {
    file: 'apps/ubax-web/public/finances/overdue/back-icon.webp',
    url: 'https://www.figma.com/api/mcp/asset/00459335-9089-4206-a437-7f8624e81e24',
  },
  {
    file: 'apps/ubax-web/public/finances/overdue/header-calendar-icon.webp',
    url: 'https://www.figma.com/api/mcp/asset/627aadda-ad88-4ded-8f20-31fb9b2f3e6f',
  },
  {
    file: 'apps/ubax-web/public/finances/overdue/header-export-icon.webp',
    url: 'https://www.figma.com/api/mcp/asset/24fb7772-12f2-40c4-a25e-592ca3f91151',
  },
  {
    file: 'apps/ubax-web/public/finances/overdue/period-calendar-icon.webp',
    url: 'https://www.figma.com/api/mcp/asset/a745803f-e7c7-4115-825f-2a352e7bfaf4',
  },
  {
    file: 'apps/ubax-web/public/finances/overdue/period-dropdown-icon.webp',
    url: 'https://www.figma.com/api/mcp/asset/3c9448dd-ae73-4b3e-83ee-28849ff5ca30',
  },
  {
    file: 'apps/ubax-web/public/finances/overdue/search-icon.webp',
    url: 'https://www.figma.com/api/mcp/asset/03b0e39d-0531-4fe9-8b80-3a552ba5b4a7',
  },
  {
    file: 'apps/ubax-web/public/finances/overdue/paginator-prev-icon.webp',
    url: 'https://www.figma.com/api/mcp/asset/c567a072-20d4-42dc-9711-f2788ec162ac',
  },
  {
    file: 'apps/ubax-web/public/finances/overdue/paginator-next-icon.webp',
    url: 'https://www.figma.com/api/mcp/asset/00244439-6365-457e-9b61-57a989ebb7e5',
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
      // File does not exist.
    }
  }

  const response = await fetch(asset.url, {
    headers: { Accept: 'image/*' },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await ensureParentDirectory(targetPath);
  await sharp(buffer, { density: 144 })
    .webp({ quality: 88, alphaQuality: 100 })
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
