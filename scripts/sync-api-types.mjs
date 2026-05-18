import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { access, readFile, rename, writeFile } from 'node:fs/promises';

import { prepareApiTypesOutput } from './prepare-api-types-output.mjs';
import { sanitizeOpenApiDocument } from './sanitize-openapi-spec.mjs';

const swaggerUrl = new URL('http://173.249.7.89/api/api-docs');

async function generatedOutputExists() {
 try {
  await access('libs/shared/api-types/src/lib/index.ts');
  await access('libs/shared/api-types/src/lib/functions.ts');
  return true;
 } catch {
  return false;
 }
}

async function runGenerator() {
 execSync('npx ng-openapi-gen --config ng-openapi-gen.json', {
  stdio: 'inherit',
 });
}

async function syncSwaggerFile({
 outputPath = 'swagger.json',
 bustCache = true,
} = {}) {
 const requestUrl = new URL(swaggerUrl);

 if (bustCache) {
  requestUrl.searchParams.set('_ts', Date.now().toString());
 }

 const tempOutputPath = `${outputPath}.tmp`;

 const response = await fetch(requestUrl, {
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

 const remoteDocument = sanitizeOpenApiDocument(await response.json());
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
  return { changed: false };
 }

 await writeFile(tempOutputPath, nextContent, 'utf8');
 await rename(tempOutputPath, outputPath);

 const hash = createHash('sha256').update(nextContent).digest('hex').slice(0, 12);

 return {
  changed: true,
  hash,
 };
}

async function main() {
 const swaggerResult = await syncSwaggerFile();

 if (swaggerResult.changed) {
  console.log(`Swagger spec updated (${swaggerResult.hash}).`);
 } else {
  console.log('Swagger spec unchanged.');
 }

 const shouldGenerate = swaggerResult.changed || !(await generatedOutputExists());

 if (!shouldGenerate) {
  console.log('API types unchanged, skipping generation.');
  return;
 }

 await prepareApiTypesOutput();
 await runGenerator();
}

await main();
