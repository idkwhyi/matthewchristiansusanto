import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { readFile } from 'node:fs/promises';
import Papa from 'papaparse';
import { loadEnv } from 'vite';

/**
 * Data project diambil dari Google Sheets (di-publish sebagai CSV).
 * Satu baris = satu project. Kolom dijelaskan di README.md.
 *
 * - PROJECTS_CSV_URL terisi  -> ambil dari Google Sheets. Kalau gagal, build berhenti
 *   (supaya website tidak pernah tayang dengan daftar project kosong).
 * - PROJECTS_CSV_URL kosong  -> pakai src/data/projects.sample.csv (untuk development).
 */

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
const CSV_URL = (process.env.PROJECTS_CSV_URL ?? env.PROJECTS_CSV_URL ?? '').trim();
const SAMPLE_CSV = new URL('./data/projects.sample.csv', import.meta.url);

const emptyToUndefined = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? undefined : v;

const list = (v: string | undefined) =>
  (v ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const required = (label: string) =>
  z.string({ error: `kolom "${label}" wajib diisi` }).trim().min(1, `kolom "${label}" wajib diisi`);

const RowSchema = z.object({
  order: z.preprocess(
    emptyToUndefined,
    z.coerce.number({ error: 'kolom "order" harus berupa angka' }).int('kolom "order" harus bilangan bulat'),
  ),
  slug: required('slug').regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'kolom "slug" hanya boleh huruf kecil, angka dan tanda hubung (mis. toko-online-umkm)',
  ),
  title: required('title'),
  type: required('type'),
  year: required('year').regex(/^\d{4}$/, 'kolom "year" harus 4 digit (mis. 2026)'),
  role: required('role'),
  summary: required('summary'),
  stack: required('stack').transform(list),
  source_url: z.preprocess(
    emptyToUndefined,
    z.url({ error: 'kolom "source_url" harus link yang valid (diawali https://) atau dikosongkan' }).optional(),
  ),
  demo_url: z.preprocess(
    emptyToUndefined,
    z.url({ error: 'kolom "demo_url" harus link yang valid (diawali https://) atau dikosongkan' }).optional(),
  ),
  cover: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  screenshots: z.string().optional().transform(list),
  published: z.preprocess(
    (v) => (typeof v === 'string' ? v.trim().toUpperCase() : v),
    z.enum(['TRUE', 'FALSE', '1', '0'], { error: 'kolom "published" harus TRUE atau FALSE' }),
  ).transform((v) => v === 'TRUE' || v === '1'),
});

export type ProjectRow = z.infer<typeof RowSchema>;

async function readCsv(): Promise<{ text: string; source: string }> {
  if (!CSV_URL) {
    return { text: await readFile(SAMPLE_CSV, 'utf8'), source: 'src/data/projects.sample.csv' };
  }
  let res: Response;
  try {
    res = await fetch(CSV_URL, { headers: { accept: 'text/csv' } });
  } catch (err) {
    throw new Error(`Tidak bisa mengambil data dari Google Sheets (${CSV_URL}): ${(err as Error).message}`);
  }
  const text = await res.text();
  if (!res.ok || /^\s*<(!doctype|html)/i.test(text)) {
    throw new Error(
      `Google Sheets tidak mengembalikan CSV (status ${res.status}). ` +
        'Pastikan sheet sudah di-publish: File > Share > Publish to web > pilih tab > Comma-separated values (.csv).',
    );
  }
  return { text, source: 'Google Sheets' };
}

async function loadProjects() {
  const { text, source } = await readCsv();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const problems: string[] = [];
  const rows: ProjectRow[] = [];

  parsed.data.forEach((raw, i) => {
    const rowNumber = i + 2; // baris 1 = header
    // Draft (published FALSE / 0) dilewati tanpa validasi, jadi boleh belum lengkap.
    const published = (raw.published ?? '').trim().toUpperCase();
    if (published === 'FALSE' || published === '0') return;
    const result = RowSchema.safeParse(raw);
    if (!result.success) {
      for (const issue of result.error.issues) problems.push(`  • Baris ${rowNumber}: ${issue.message}`);
      return;
    }
    rows.push(result.data);
  });

  const seen = new Map<string, number>();
  rows.forEach((r, i) => {
    if (seen.has(r.slug)) problems.push(`  • Slug "${r.slug}" dipakai lebih dari sekali.`);
    seen.set(r.slug, i);
  });

  if (problems.length) {
    throw new Error(`Data project dari ${source} belum valid:\n${problems.join('\n')}\n`);
  }

  return rows
    .filter((r) => r.published)
    .sort((a, b) => a.order - b.order)
    .map((r) => ({ id: r.slug, ...r }));
}

// Bentuk data setelah divalidasi (dipakai untuk tipe TypeScript di komponen)
const ProjectSchema = z.object({
  order: z.number(),
  slug: z.string(),
  title: z.string(),
  type: z.string(),
  year: z.string(),
  role: z.string(),
  summary: z.string(),
  stack: z.array(z.string()),
  source_url: z.string().optional(),
  demo_url: z.string().optional(),
  cover: z.string().optional(),
  screenshots: z.array(z.string()),
  published: z.boolean(),
});

const projects = defineCollection({
  loader: loadProjects,
  schema: ProjectSchema,
});

export const collections = { projects };
