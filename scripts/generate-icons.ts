// PLACEHOLDER ICONS — replace with a real Otis icon before sharing with family
// Go to pwabuilder.com, upload a 512x512 image, download all sizes, drop into /public/icons/

import sharp from "sharp";
import path from "path";
import fs from "fs";

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(process.cwd(), "public/icons");

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

async function generateIcon(size: number) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#1E2D4A"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="serif" 
        font-size="${size * 0.55}" 
        fill="#FDF6E3" 
        text-anchor="middle" 
        dominant-baseline="central"
        font-weight="bold"
      >O</text>
    </svg>
  `;
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
  console.log(`✅ Generated icon-${size}x${size}.png`);
}

Promise.all(sizes.map(generateIcon))
  .then(() => console.log("All icons generated! Replace with real Otis icon later."))
  .catch(console.error);
