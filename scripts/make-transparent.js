import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const inputPath = join(__dirname, '../src/citybuilder.png');
const outputPath = join(__dirname, '../public/citybuilder.png');

// Blue background color from the icon (approx #4186B2)
const TARGET_R = 65, TARGET_G = 134, TARGET_B = 178;
const TOLERANCE = 45; // Allow slight color variation

function colorMatch(r, g, b) {
  return Math.abs(r - TARGET_R) <= TOLERANCE &&
         Math.abs(g - TARGET_G) <= TOLERANCE &&
         Math.abs(b - TARGET_B) <= TOLERANCE;
}

async function main() {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (colorMatch(r, g, b)) {
      data[i + 3] = 0; // Set alpha to transparent
    }
  }

  await sharp(data, { raw: { width, height, channels } })
    .png()
    .toFile(outputPath);

  console.log('Created transparent citybuilder.png in public/');
}

main().catch(console.error);
