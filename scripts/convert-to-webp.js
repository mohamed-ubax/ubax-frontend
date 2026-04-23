const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const DEFAULT_DIRECTORIES = [
  path.join(__dirname, '../apps/ubax-portal/public/assets'),
];
const EXTENSIONS = ['.png', '.jpg', '.jpeg', '.jfif'];

function parseOptions(argv) {
  const options = {
    width: undefined,
    height: undefined,
    fit: 'inside',
    quality: 82,
  };
  const inputs = [];

  for (const arg of argv) {
    if (!arg.startsWith('--')) {
      inputs.push(arg);
      continue;
    }

    if (arg.startsWith('--width=')) {
      options.width = Number(arg.split('=')[1]) || undefined;
      continue;
    }

    if (arg.startsWith('--height=')) {
      options.height = Number(arg.split('=')[1]) || undefined;
      continue;
    }

    if (arg.startsWith('--fit=')) {
      options.fit = arg.split('=')[1] || options.fit;
      continue;
    }

    if (arg.startsWith('--quality=')) {
      options.quality = Number(arg.split('=')[1]) || options.quality;
    }
  }

  return { options, inputs };
}

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
  const { options, inputs } = parseOptions(process.argv.slice(2));

  if (inputs.length === 0) {
    return { inputs: DEFAULT_DIRECTORIES, options };
  }

  return {
    inputs: inputs.map((inputPath) => path.resolve(process.cwd(), inputPath)),
    options,
  };
}

async function collectImages(inputPath) {
  if (!fs.existsSync(inputPath)) {
    console.warn(`Skipping missing path: ${inputPath}`);
    return [];
  }

  const stat = fs.statSync(inputPath);
  if (stat.isDirectory()) {
    return findImages(inputPath);
  }

  return EXTENSIONS.includes(path.extname(inputPath).toLowerCase())
    ? [inputPath]
    : [];
}

async function main() {
  const { inputs, options } = getTargetDirectories();
  const uniqueInputs = [...new Set(inputs)];
  const imageGroups = await Promise.all(
    uniqueInputs.map((inputPath) => collectImages(inputPath)),
  );
  const images = imageGroups.flat();

  console.log(
    `Found ${images.length} images to convert across ${uniqueInputs.length} target${uniqueInputs.length > 1 ? 's' : ''}.`,
  );

  for (const imgPath of images) {
    const webpPath = imgPath.replace(/\.(png|jpg|jpeg|jfif)$/i, '.webp');
    try {
      let pipeline = sharp(imgPath, { failOn: 'none' });

      if (options.width || options.height) {
        pipeline = pipeline.resize({
          width: options.width,
          height: options.height,
          fit: options.fit,
          position: 'centre',
          withoutEnlargement: true,
        });
      }

      await pipeline.webp({ quality: options.quality }).toFile(webpPath);
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
