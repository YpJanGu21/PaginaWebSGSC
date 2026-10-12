import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const origen = path.join(root, "src/imports/cetchileCla.png");
const destinoClaro = path.join(root, "src/imports/cetchileCla-claro.png");

const NAVY = { r: 26, g: 39, b: 68 };

const { data, info } = await sharp(origen).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const salida = Buffer.from(data);

for (let i = 0; i < salida.length; i += info.channels) {
  if (salida[i + 3] === 0) continue;
  const [r, g, b] = [salida[i], salida[i + 1], salida[i + 2]];
  if (r > 220 && g > 220 && b > 220) {
    salida[i] = NAVY.r;
    salida[i + 1] = NAVY.g;
    salida[i + 2] = NAVY.b;
  }
}

await sharp(salida, { raw: { width: info.width, height: info.height, channels: info.channels } })
  .png()
  .toFile(destinoClaro);

console.log(`Logo para modo claro generado: ${destinoClaro}`);
console.log(`Logo para modo oscuro (original, texto blanco): ${origen}`);
