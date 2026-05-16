import { rm } from 'node:fs/promises';

const generatedPaths = [
  'libs/shared/api-types/src/lib',
  'libs/shared/api-types/src/lib$',
];

for (const generatedPath of generatedPaths) {
  await rm(generatedPath, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 200,
  });
}
