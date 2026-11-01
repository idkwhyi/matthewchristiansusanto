import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';

/**
 * Gambar project disimpan di src/assets/projects/.
 * Di Google Sheets cukup tulis nama filenya (mis. toko-umkm-cover.webp).
 */
const files = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/projects/*.{png,jpg,jpeg,webp,avif}',
  { eager: true },
);

const byName = new Map(
  Object.entries(files).map(([path, mod]) => [path.split('/').pop()!.toLowerCase(), mod.default]),
);

const warned = new Set<string>();

export function projectImage(fileName: string | undefined): ImageMetadata | undefined {
  if (!fileName) return undefined;
  const img = byName.get(fileName.trim().toLowerCase());
  if (!img && !warned.has(fileName)) {
    warned.add(fileName);
    console.warn(
      `[portfolio] Gambar "${fileName}" tidak ditemukan di src/assets/projects/. Placeholder ditampilkan.`,
    );
  }
  return img;
}

/** URL gambar yang sudah dioptimasi (WebP), untuk panel detail yang diisi lewat JavaScript. */
export async function optimizedUrl(fileName: string | undefined, width: number) {
  const img = projectImage(fileName);
  if (!img) return null;
  const out = await getImage({ src: img, width: Math.min(width, img.width), format: 'webp' });
  return { src: out.src, width: out.attributes.width as number, height: out.attributes.height as number };
}
