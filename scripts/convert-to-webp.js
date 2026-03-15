const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '../apps/ubax-portal/public/assets');
const EXTENSIONS = ['.png', '.jpg', '.jpeg', '.jfif'];

async function findImages(dir) {
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

async function main() {
  const images = await findImages(ASSETS_DIR);
  console.log(`Found ${images.length} images to convert.`);

  for (const imgPath of images) {
    const webpPath = imgPath.replace(/\.(png|jpg|jpeg|jfif)$/i, '.webp');
    try {
      await sharp(imgPath).webp({ quality: 82 }).toFile(webpPath);
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
