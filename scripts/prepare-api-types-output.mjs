import { rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const generatedPaths = [
  'libs/shared/api-types/src/lib',
  'libs/shared/api-types/src/lib$',
];

export async function prepareApiTypesOutput() {
  for (const generatedPath of generatedPaths) {
    await rm(generatedPath, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 200,
    });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await prepareApiTypesOutput();
}

