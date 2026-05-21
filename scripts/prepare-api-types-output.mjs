import { rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const generatedPaths = [
  'libs/shared/api-types/src/lib',
  'libs/shared/api-types/src/lib$',
];

// ng-openapi-gen uses lib$ as an internal staging directory for atomic writes.
// On Windows, this directory may still be locked when the generator tries to clean it up,
// causing an EBUSY error after an otherwise successful generation.
export const generatorStagingPath = 'libs/shared/api-types/src/lib$';

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

export async function cleanupGeneratorStaging() {
  await rm(generatorStagingPath, {
    recursive: true,
    force: true,
    maxRetries: 20,
    retryDelay: 300,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await prepareApiTypesOutput();
}

