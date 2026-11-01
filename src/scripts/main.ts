export {};

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* mode private / storage diblokir: abaikan */
  }
}

/** Jalankan perubahan DOM dengan View Transitions kalau browser mendukung. */
function withTransition(update: () => void) {
  if (!document.startViewTransition || reduceMotion.matches) return update();
  document.startViewTransition(update);
}

/* ---------------- Tema dark / light ---------------- */
function setThemeColor() {
  const bg = getComputedStyle(document.body).backgroundColor;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
}

document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  store('theme', next);
  setTimeout(setThemeColor, 260);
});

/* ---------------- Grid / List ---------------- */
const viewButtons = document.querySelectorAll<HTMLButtonElement>('[data-view-btn]');

function syncViewButtons() {
  viewButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.viewBtn === root.dataset.view)));
}

viewButtons.forEach((btn) =>
  btn.addEventListener('click', () => {
    const view = btn.dataset.viewBtn!;
    if (view === root.dataset.view) return;
    withTransition(() => {
      root.dataset.view = view;
      syncViewButtons();
    });
    store('project-view', view);
  }),
);
syncViewButtons();

/* ---------------- Muncul saat di-scroll ---------------- */
const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  },
  { rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
);
document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));

/* ---------------- Navigasi aktif sesuai section ---------------- */
const navLinks = new Map(
  [...document.querySelectorAll<HTMLAnchorElement>('[data-nav]')].map((a) => [a.dataset.nav!, a]),
);
const visible = new Map<string, number>();

const sectionObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) visible.set(entry.target.id, entry.intersectionRatio);
    let active = '';
    let best = 0;
    for (const [id, ratio] of visible) {
      if (ratio > best) {
        best = ratio;
        active = id;
      }
    }
    navLinks.forEach((a, id) => a.setAttribute('aria-current', String(id === active)));
  },
  { threshold: [0, 0.15, 0.3, 0.5, 0.75, 1] },
);
navLinks.forEach((_, id) => {
  const section = document.getElementById(id);
  if (section) sectionObserver.observe(section);
});

/* ---------------- Panel detail project ---------------- */
const dialog = document.querySelector<HTMLDialogElement>('[data-project-dialog]');
const body = dialog?.querySelector<HTMLElement>('[data-panel-body]');
const position = dialog?.querySelector<HTMLElement>('[data-panel-position]');
const templates = [...document.querySelectorAll<HTMLTemplateElement>('template[data-project-template]')];
const slugs = templates.map((t) => t.dataset.projectTemplate!);
let current = -1;
let opener: HTMLElement | null = null;

function render(index: number) {
  if (!dialog || !body || !position) return;
  const tpl = templates[index];
  current = index;
  body.replaceChildren(tpl.content.cloneNode(true));
  position.textContent = tpl.dataset.position ?? '';
  dialog.querySelector('.panel-inner')?.scrollTo({ top: 0 });
  history.replaceState(null, '', `#project-${slugs[index]}`);
}

function openProject(slug: string, trigger?: HTMLElement | null) {
  const index = slugs.indexOf(slug);
  if (!dialog || index < 0) return;
  opener = trigger ?? null;
  render(index);
  if (!dialog.open) dialog.showModal();
}

function closeProject() {
  if (!dialog?.open || dialog.classList.contains('is-closing')) return;
  const finish = () => {
    dialog.classList.remove('is-closing');
    dialog.close();
  };
  if (reduceMotion.matches) return finish();
  dialog.classList.add('is-closing');
  dialog.addEventListener('animationend', finish, { once: true });
}

if (dialog) {
  document.querySelectorAll<HTMLElement>('[data-open-project]').forEach((btn) =>
    btn.addEventListener('click', () => openProject(btn.dataset.openProject!, btn)),
  );

  dialog.querySelectorAll('[data-close-project]').forEach((b) => b.addEventListener('click', closeProject));

  dialog.querySelectorAll<HTMLButtonElement>('[data-step]').forEach((b) =>
    b.addEventListener('click', () => {
      const step = Number(b.dataset.step);
      render((current + step + slugs.length) % slugs.length);
    }),
  );

  // Klik area gelap di luar panel
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeProject();
  });

  // Esc: tutup dengan animasi
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeProject();
  });

  // Panah kiri / kanan untuk pindah project
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') render((current + 1) % slugs.length);
    if (e.key === 'ArrowLeft') render((current - 1 + slugs.length) % slugs.length);
  });

  dialog.addEventListener('close', () => {
    history.replaceState(null, '', location.pathname + location.search);
    const target = document.querySelector<HTMLElement>(`[data-open-project="${slugs[current]}"]`) ?? opener;
    target?.focus({ preventScroll: true });
  });

  // Link langsung ke project, mis. namaanda.dev/#project-toko-online-umkm
  const fromHash = location.hash.match(/^#project-(.+)$/);
  if (fromHash) openProject(decodeURIComponent(fromHash[1]));
}
