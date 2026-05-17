import { readFile, rename, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

function sanitizeOperationTags(tags) {
 if (!Array.isArray(tags) || tags.length === 0) {
  return tags;
 }

 const normalizedTags = tags
  .filter((tag) => typeof tag === 'string')
  .map((tag) => tag.trim())
  .filter(Boolean);

 if (normalizedTags.length === 0) {
  return tags;
 }

 return [normalizedTags[0]];
}

export function sanitizeOpenApiDocument(document) {
 const nextDocument = structuredClone(document);
 const pathItems = nextDocument?.paths;

 if (!pathItems || typeof pathItems !== 'object') {
  return nextDocument;
 }

 for (const pathItem of Object.values(pathItems)) {
  if (!pathItem || typeof pathItem !== 'object' || Array.isArray(pathItem)) {
   continue;
  }

  for (const operation of Object.values(pathItem)) {
   if (!operation || typeof operation !== 'object' || Array.isArray(operation)) {
    continue;
   }

   if (Array.isArray(operation.tags)) {
    operation.tags = sanitizeOperationTags(operation.tags);
   }
  }
 }

 return nextDocument;
}

export async function sanitizeOpenApiSpecFile(filePath = 'swagger.json') {
 const currentContent = await readFile(filePath, 'utf8');
 const document = JSON.parse(currentContent);
 const nextDocument = sanitizeOpenApiDocument(document);
 const nextContent = `${JSON.stringify(nextDocument, null, 2)}\n`;

 if (nextContent === currentContent) {
  return { changed: false };
 }

 const tempPath = `${filePath}.tmp`;
 await writeFile(tempPath, nextContent, 'utf8');
 await rename(tempPath, filePath);

 return { changed: true };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
 const result = await sanitizeOpenApiSpecFile(process.argv[2]);
 console.log(
  result.changed
   ? 'OpenAPI spec sanitized before generation.'
   : 'OpenAPI spec already sanitized.',
 );
}
