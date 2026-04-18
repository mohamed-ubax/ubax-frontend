const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const DEFAULT_DIRECTORIES = [
  path.join(__dirname, '../apps/ubax-portal/public/assets'),
];
const EXTENSIONS = ['.png', '.jpg', '.jpeg', '.jfif'];

async function findImages(dir) {
  if (!fs.existsSync(dir)) {
    console.warn(`Skipping missing directory: ${dir}`);
    return [];
  }

  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await findImages(fullPath)));
    } else if (EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
      results.push(fullPath);
    }
  }
  return results;
}

function getTargetDirectories() {
  const directories = process.argv.slice(2);

  if (directories.length === 0) {
    return DEFAULT_DIRECTORIES;
  }

  return directories.map((directory) => path.resolve(process.cwd(), directory));
}

async function main() {
  const directories = [...new Set(getTargetDirectories())];
  const imageGroups = await Promise.all(directories.map((directory) => findImages(directory)));
  const images = imageGroups.flat();

  console.log(
    `Found ${images.length} images to convert across ${directories.length} director${directories.length > 1 ? 'ies' : 'y'}.`,
  );

  for (const imgPath of images) {
    const webpPath = imgPath.replace(/\.(png|jpg|jpeg|jfif)$/i, '.webp');
    try {
      await sharp(imgPath, { failOn: 'none' }).webp({ quality: 82 }).toFile(webpPath);
      const origSize = fs.statSync(imgPath).size;
      const webpSize = fs.statSync(webpPath).size;
      const saving = Math.round((1 - webpSize / origSize) * 100);
      console.log(`✓ ${path.basename(imgPath)} → ${path.basename(webpPath)} (${saving}% smaller)`);
    } catch (err) {
      console.error(`✗ Failed: ${imgPath} — ${err.message}`);
    }
  }
  console.log('\nDone.');
}

main();
