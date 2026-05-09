const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('node:path');
const ubaxPreset = require('../../libs/shared/design-system/src/lib/tailwind/tailwind-preset');

/** @type {import('tailwindcss').Config} */
module.exports = {
 presets: [ubaxPreset],
 content: [
  join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'),
  ...createGlobPatternsForDependencies(__dirname),
 ],
 theme: {
  extend: {},
 },
 plugins: [],
};
