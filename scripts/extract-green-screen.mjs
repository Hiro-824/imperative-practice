import sharp from "sharp";

const allArguments = process.argv.slice(2);
const removeAllGreen = allArguments.includes("--all");
const [input, output, x = "0", y = "0", width, height] = allArguments.filter((argument) => argument !== "--all");

if (!input || !output) {
  throw new Error("Usage: node scripts/extract-green-screen.mjs input output [x y width height]");
}

let pipeline = sharp(input).ensureAlpha();
if (width && height) {
  pipeline = pipeline.extract({
    left: Number(x),
    top: Number(y),
    width: Number(width),
    height: Number(height),
  });
}

const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
const { width: imageWidth, height: imageHeight, channels } = info;
const removed = new Uint8Array(imageWidth * imageHeight);
const queue = new Int32Array(imageWidth * imageHeight);
let head = 0;
let tail = 0;

function isGreenScreen(pixel) {
  const offset = pixel * channels;
  const red = data[offset];
  const green = data[offset + 1];
  const blue = data[offset + 2];
  const alpha = data[offset + 3];
  if (alpha < 8) return true;
  return green > red * 1.38 && green > blue * 1.28 && green - red > 18 && green - blue > 16;
}

function enqueue(pixel) {
  if (removed[pixel] || !isGreenScreen(pixel)) return;
  removed[pixel] = 1;
  queue[tail++] = pixel;
}

for (let xIndex = 0; xIndex < imageWidth; xIndex += 1) {
  enqueue(xIndex);
  enqueue((imageHeight - 1) * imageWidth + xIndex);
}
for (let yIndex = 0; yIndex < imageHeight; yIndex += 1) {
  enqueue(yIndex * imageWidth);
  enqueue(yIndex * imageWidth + imageWidth - 1);
}

while (head < tail) {
  const pixel = queue[head++];
  const xIndex = pixel % imageWidth;
  const yIndex = Math.floor(pixel / imageWidth);
  if (xIndex > 0) enqueue(pixel - 1);
  if (xIndex + 1 < imageWidth) enqueue(pixel + 1);
  if (yIndex > 0) enqueue(pixel - imageWidth);
  if (yIndex + 1 < imageHeight) enqueue(pixel + imageWidth);
}

if (removeAllGreen) {
  for (let pixel = 0; pixel < removed.length; pixel += 1) {
    if (isGreenScreen(pixel)) removed[pixel] = 1;
  }
}

for (let pixel = 0; pixel < removed.length; pixel += 1) {
  const offset = pixel * channels;
  if (removed[pixel]) {
    data[offset + 3] = 0;
    continue;
  }

  const xIndex = pixel % imageWidth;
  const yIndex = Math.floor(pixel / imageWidth);
  const touchesBackground =
    (xIndex > 0 && removed[pixel - 1]) ||
    (xIndex + 1 < imageWidth && removed[pixel + 1]) ||
    (yIndex > 0 && removed[pixel - imageWidth]) ||
    (yIndex + 1 < imageHeight && removed[pixel + imageWidth]);

  if (touchesBackground) {
    const red = data[offset];
    const blue = data[offset + 2];
    data[offset + 1] = Math.min(data[offset + 1], Math.max(red, blue) + 6);
  }
}

await sharp(data, { raw: info }).png({ compressionLevel: 9 }).toFile(output);
