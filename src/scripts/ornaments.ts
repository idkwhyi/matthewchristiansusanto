/**
 * Hiasan kecil berbasis canvas (tanpa library):
 * - <canvas data-ornament="lorenz">: Lorenz attractor di atas sidebar
 * - <canvas data-ornament="globe">: bola titik dengan penanda Jakarta di bagian Contact
 *
 * Animasi berhenti saat canvas tidak terlihat, dan hanya digambar sekali (diam)
 * kalau pengunjung mengaktifkan "reduce motion". Warna diambil dari token CSS.
 */
export {};

type Vec = [number, number, number];
type Colors = { muted: string; accent: string };
type Draw = (ctx: CanvasRenderingContext2D, size: number, t: number, tilt: [number, number], step: boolean) => void;

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let colors: Colors = { muted: '#9b9b97', accent: '#ff6a1f' };
function readColors() {
  const s = getComputedStyle(root);
  colors = { muted: s.getPropertyValue('--muted').trim(), accent: s.getPropertyValue('--accent').trim() };
}

function rgba(hex: string, a: number) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

const rotY = (p: Vec, a: number): Vec => {
  const c = Math.cos(a), s = Math.sin(a);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
};
const rotX = (p: Vec, a: number): Vec => {
  const c = Math.cos(a), s = Math.sin(a);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
};

/* ---------------- Lorenz attractor ---------------- */
function createLorenz(): Draw {
  let p: Vec = [0.1, 0, 0];
  const trail: Vec[] = [];
  const step = () => {
    const [x, y, z] = p;
    const dt = 0.006;
    p = [x + 10 * (y - x) * dt, y + (x * (28 - z) - y) * dt, z + (x * y - (8 / 3) * z) * dt];
    trail.push(p);
    if (trail.length > 1100) trail.shift();
  };
  for (let i = 0; i < 1500; i++) step();

  return (ctx, S, t, [tx, ty], moving) => {
    if (moving) for (let i = 0; i < 3; i++) step();
    const n = trail.length;
    const sc = S / 58;
    ctx.lineWidth = Math.max(0.8, S / 110);
    ctx.lineCap = 'round';
    let prev: [number, number] | null = null;
    for (let i = 0; i < n; i++) {
      let q: Vec = [trail[i][0], trail[i][2] - 25, trail[i][1]];
      q = rotX(rotY(q, t * 0.25 + tx), -0.25 + ty);
      const pt: [number, number] = [S / 2 + q[0] * sc, S / 2 - q[1] * sc];
      if (prev) {
        const age = i / n;
        ctx.strokeStyle = rgba(colors.accent, 0.05 + age * age * 0.9);
        ctx.beginPath();
        ctx.moveTo(prev[0], prev[1]);
        ctx.lineTo(pt[0], pt[1]);
        ctx.stroke();
      }
      prev = pt;
    }
    if (prev) {
      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.arc(prev[0], prev[1], Math.max(1.5, S / 50), 0, Math.PI * 2);
      ctx.fill();
    }
  };
}

/* ---------------- Bola titik + Jakarta ---------------- */
function createGlobe(): Draw {
  const N = 360;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const dots: Vec[] = Array.from({ length: N }, (_, i) => {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    return [Math.cos(i * golden) * r, y, Math.sin(i * golden) * r];
  });
  const lat = (-6.2 * Math.PI) / 180;
  const lon = (106.8 * Math.PI) / 180;
  const jakarta: Vec = [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];

  return (ctx, S, t, [tx, ty]) => {
    const R = S * 0.42;
    // Mulai dengan Jakarta menghadap ke depan
    const spin = t * 0.3 + tx - lon;
    const proj = (p: Vec) => rotX(rotY(p, spin), 0.35 + ty);
    const ds = Math.max(0.7, S / 110);
    for (const d of dots) {
      const q = proj(d);
      const front = q[2] > 0;
      ctx.fillStyle = rgba(colors.muted, front ? 0.35 + q[2] * 0.6 : 0.12);
      ctx.beginPath();
      ctx.arc(S / 2 + q[0] * R, S / 2 - q[1] * R, front ? ds : ds * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    const j = proj(jakarta);
    const jx = S / 2 + j[0] * R;
    const jy = S / 2 - j[1] * R;
    const vis = j[2] > -0.1 ? 1 : 0.25;
    const pulse = (t * 0.8) % 1;
    ctx.strokeStyle = rgba(colors.accent, (1 - pulse) * 0.8 * vis);
    ctx.lineWidth = Math.max(0.8, S / 140);
    ctx.beginPath();
    ctx.arc(jx, jy, ds * 2 + pulse * S * 0.09, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = rgba(colors.accent, vis);
    ctx.beginPath();
    ctx.arc(jx, jy, ds * 2, 0, Math.PI * 2);
    ctx.fill();
  };
}

/* ---------------- Loop ---------------- */
const factories: Record<string, () => Draw> = { lorenz: createLorenz, globe: createGlobe };

type Item = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  draw: Draw;
  size: number;
  visible: boolean;
  tilt: [number, number];
};

const items: Item[] = [];
for (const canvas of document.querySelectorAll<HTMLCanvasElement>('canvas[data-ornament]')) {
  const make = factories[canvas.dataset.ornament ?? ''];
  const ctx = canvas.getContext('2d');
  if (make && ctx) items.push({ canvas, ctx, draw: make(), size: 0, visible: true, tilt: [0, 0] });
}

if (items.length) {
  readColors();
  new MutationObserver(() => {
    readColors();
    if (!running) renderAll(false);
  }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const it of items) {
      const size = it.canvas.clientWidth;
      it.size = size;
      it.canvas.width = it.canvas.height = Math.round(size * dpr);
      it.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  };

  let pointer: [number, number] = [0, 0];
  window.addEventListener(
    'pointermove',
    (e) => (pointer = [(e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1]),
    { passive: true },
  );

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const it = items.find((i) => i.canvas === e.target);
      if (it) it.visible = e.isIntersecting;
    }
  });
  items.forEach((it) => io.observe(it.canvas));

  let t = 1.2;
  let last = performance.now();
  let running = false;
  let rafId = 0;

  function renderAll(step: boolean) {
    for (const it of items) {
      if (step && !it.visible) continue;
      if (step) {
        const r = it.canvas.getBoundingClientRect();
        const cx = ((r.left + r.width / 2) / innerWidth) * 2 - 1;
        const cy = ((r.top + r.height / 2) / innerHeight) * 2 - 1;
        it.tilt[0] += ((pointer[0] - cx) * 0.35 - it.tilt[0]) * 0.06;
        it.tilt[1] += ((pointer[1] - cy) * 0.25 - it.tilt[1]) * 0.06;
      }
      it.ctx.clearRect(0, 0, it.size, it.size);
      it.draw(it.ctx, it.size, t, it.tilt, step);
    }
  }

  function frame(now: number) {
    if (!running) return;
    t += Math.min(0.05, (now - last) / 1000);
    last = now;
    renderAll(true);
    rafId = requestAnimationFrame(frame);
  }

  const start = () => {
    cancelAnimationFrame(rafId);
    resize();
    running = !reduceMotion.matches;
    if (running) {
      last = performance.now();
      rafId = requestAnimationFrame(frame);
    } else {
      renderAll(false);
    }
  };

  reduceMotion.addEventListener('change', start);
  window.addEventListener('resize', () => {
    resize();
    if (!running) renderAll(false);
  });

  // Mulai setelah halaman selesai dimuat supaya tidak memperlambat tampilan awal
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}
