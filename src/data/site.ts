/**
 * Profil dan kontak. Ini jarang berubah, jadi cukup diedit di sini.
 * Data project ada di Google Sheets (lihat README.md).
 */
export const site = {
  // Bahasa teks di website: 'en' atau 'id'
  lang: 'en',
  name: 'Matthew Christian Susanto',
  role: 'Developer',
  // Kosongkan ('') untuk menyembunyikan tagline.
  tagline: '',
  // Ganti dengan 'Open to work' kalau sedang mencari kerja, atau kosongkan ('') untuk menyembunyikannya.
  status: 'Full-stack Developer at Radsoft & Bestmark',
  // Quote di bagian About. Kosongkan aboutAuthor ('') kalau teksnya bukan quote.
  about:
    'We are simply never going to realize a state of software nirvana where everything is supremely satisfying. That’s an important emotional realization. The fundamental reward of an improvement process is the experience of betterment, not some mythical destination.',
  aboutAuthor: 'Mark Slee',
  // Riwayat kerja, terbaru di atas. end: '' berarti masih berjalan (tampil sebagai "Present").
  experience: [
    {
      role: 'Full-stack Web Developer',
      company: 'PT Radsoft',
      type: 'Full-time',
      start: 'Mar 2026',
      end: '',
      summary: 'Building web applications for investment management.',
    },
    {
      role: 'Full-stack Developer',
      company: 'PT Bestmark Indonesia',
      type: 'Project',
      start: 'Mar 2026',
      end: '',
      summary: 'Building a B2B marketplace platform.',
    },
    {
      role: 'Web Developer Intern',
      company: 'PT Nusantara Compnet Integrator',
      type: 'Internship',
      start: 'Feb 2025',
      end: 'Aug 2025',
      summary: 'Built internal web apps for sales, meeting room booking and a company event game.',
    },
  ],
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
  description: 'Portfolio of Matthew Christian Susanto, Developer.',
} as const;
