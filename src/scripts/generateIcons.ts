import fs from "fs";
import path from "path";
import sharp from "sharp";

const outputDir = path.resolve(process.cwd(), "public", "icons");
const icon512Path = path.join(outputDir, "icon-512.png");
const icon192Path = path.join(outputDir, "icon-192.png");
const appleTouchPath = path.join(outputDir, "apple-touch-icon.png");

const iconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="96" fill="#6366f1" />
  <g transform="translate(256 256) rotate(-15)">
    <path d="M-80 0 L80 -72 L44 0 L80 72 L-80 0 Z" fill="white" />
    <circle cx="0" cy="0" r="22" fill="white" opacity="0.18" />
  </g>
</svg>`;

async function generate() {
  await fs.promises.mkdir(outputDir, { recursive: true });

  const baseBuffer = Buffer.from(iconSvg, "utf8");
  await sharp(baseBuffer)
    .resize(512, 512)
    .png()
    .toFile(icon512Path);

  await sharp(baseBuffer)
    .resize(192, 192)
    .png()
    .toFile(icon192Path);

  await sharp(baseBuffer)
    .resize(180, 180)
    .png()
    .toFile(appleTouchPath);

  console.log("Generated PWA icons:");
  console.log(`- ${icon512Path}`);
  console.log(`- ${icon192Path}`);
  console.log(`- ${appleTouchPath}`);
}

generate().catch((error) => {
  console.error("Icon generation failed:", error);
  process.exit(1);
});
