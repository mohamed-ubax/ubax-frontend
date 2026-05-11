const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('node:path');
const ubaxPreset = require('../../libs/shared/design-system/src/lib/tailwind/tailwind-preset');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [ubaxPreset],
  content: [
    join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'),
    // Design system components — scanned explicitement car Nx ne détecte pas encore la lib dans le graphe
    join(__dirname, '../../libs/shared/design-system/src/**/*.{ts,html}'),
    join(__dirname, '../../libs/ubax-admin/**/*.{ts,html}'),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
