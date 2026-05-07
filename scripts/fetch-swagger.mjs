import { readFile, rename, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const swaggerUrl = new URL('http://173.249.7.89/api/api-docs');
swaggerUrl.searchParams.set('_ts', Date.now().toString());

const outputPath = '.swagger.json';
const tempOutputPath = `${outputPath}.tmp`;

const response = await fetch(swaggerUrl, {
  headers: {
    Accept: 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  },
  cache: 'no-store',
  redirect: 'follow',
});

if (!response.ok) {
  throw new Error(
    `Swagger fetch failed with status ${response.status} ${response.statusText}`,
  );
}

const remoteDocument = await response.json();
const nextContent = `${JSON.stringify(remoteDocument, null, 2)}\n`;

let previousContent = null;

try {
  previousContent = await readFile(outputPath, 'utf8');
} catch (error) {
  if (error?.code !== 'ENOENT') {
    throw error;
  }
}

if (previousContent === nextContent) {
  console.log('Swagger spec unchanged.');
} else {
  await writeFile(tempOutputPath, nextContent, 'utf8');
  await rename(tempOutputPath, outputPath);

  const hash = createHash('sha256')
    .update(nextContent)
    .digest('hex')
    .slice(0, 12);
  console.log(`Swagger spec updated (${hash}).`);
}
