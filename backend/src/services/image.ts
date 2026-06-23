import fs from 'fs';
import path from 'path';

// ── Jimp types (loaded dynamically — Jimp v1 is ESM, project uses CommonJS)
interface JimpImage {
  bitmap: { width: number; height: number };
  resize(options: { w: number; h: number }): JimpImage;
  getBuffer(mime: string, options?: { quality?: number }): Promise<Buffer>;
}
interface JimpStatic { read(buffer: Buffer): Promise<JimpImage> }
interface JimpMimeEnum { jpeg: string; png: string }

let Jimp: JimpStatic | null = null;
let JimpMime: JimpMimeEnum | null = null;

async function loadJimp(): Promise<void> {
  if (!Jimp) { const mod = await import('jimp'); Jimp = mod.Jimp as JimpStatic; JimpMime = mod.JimpMime as JimpMimeEnum; }
}

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'portfolio');
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIM = 1200;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

// Magic bytes for real MIME validation (doesn't trust extensions)
function validateMagic(buffer: Buffer): string | null {
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png';
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 && buffer.length >= 12 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return 'image/webp';
  return null;
}

async function resizeImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
  await loadJimp();
  const j = Jimp!, m = JimpMime!;
  const img = await j.read(buffer);
  const w = img.bitmap.width, h = img.bitmap.height;
  if (w <= MAX_DIM && h <= MAX_DIM) return buffer;
  let nw: number, nh: number;
  if (w >= h) { nw = MAX_DIM; nh = Math.round((h / w) * MAX_DIM); }
  else { nh = MAX_DIM; nw = Math.round((w / h) * MAX_DIM); }
  img.resize({ w: nw, h: nh });
  const outMime = mimeType === 'image/jpeg' ? m.jpeg : m.png;
  return img.getBuffer(outMime, mimeType === 'image/jpeg' ? { quality: 85 } : {});
}

export async function processAndSaveImage(buffer: Buffer, originalName: string, providerId: string) {
  if (buffer.length > MAX_SIZE) throw new Error(`Arquivo excede 5MB. Tamanho: ${(buffer.length / 1024 / 1024).toFixed(1)}MB`);
  const realMime = validateMagic(buffer);
  if (!realMime || !ALLOWED.includes(realMime)) throw new Error('Tipo inválido. Aceitos: JPG, PNG, WebP.');
  const processed = await resizeImage(buffer, realMime);
  fs.mkdirSync(path.join(UPLOAD_DIR, providerId), { recursive: true });
  const ext = realMime === 'image/png' || realMime === 'image/webp' ? '.png' : '.jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, providerId, filename), processed);
  // WebP converted to PNG → reflect real output MIME
  const outputMime = realMime === 'image/webp' ? 'image/png' : realMime;
  return { filename: `${providerId}/${filename}`, originalName, mimeType: outputMime, sizeBytes: processed.length };
}

export function deleteImageFile(filename: string): void {
  const fp = path.join(UPLOAD_DIR, filename);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
}
