/**
 * Profil dan kontak. Ini jarang berubah, jadi cukup diedit di sini.
 * Data project ada di Google Sheets (lihat README.md).
 */
export const site = {
  // Bahasa teks di website: 'en' atau 'id'
  lang: 'en',
  name: 'Matthew Christian Susanto',
  role: 'Frontend Developer',
  tagline: 'One sentence on what you build and for whom.',
  // Kosongkan ('') untuk menyembunyikan indikator status.
  status: 'Open to work',
  about:
    'Two sentences about you: what you do, what you care about, and where you are based.',
  skills: ['TypeScript', 'React', 'Astro', 'Node.js', 'Figma'],
  location: 'Jakarta, Indonesia',
  email: 'matthewchristiansusanto@gmail.com',
  links: [
    // { label: 'GitHub', href: 'https://github.com/username' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/matthewcs/' },
    // Taruh file CV di folder public/ dengan nama resume.pdf
    { label: 'Resume (PDF)', href: `${import.meta.env.BASE_URL}resume.pdf` },
  ],
  // Untuk SEO dan preview saat link dibagikan
  description: 'Portfolio of Matthew Christian Susanto, Frontend Developer.',
} as const;
