'use strict';
/* BentoStudio — vanilla JS. Layout / export / spring math ported from the design prototype. */

const A = '#F0531C';
const mesh = (a, b, c, base) =>
  `radial-gradient(circle at 18% 20%, ${a} 0%, transparent 55%), radial-gradient(circle at 88% 30%, ${b} 0%, transparent 50%), radial-gradient(circle at 55% 110%, ${c} 0%, transparent 62%), ${base}`;
const K = {
  SURFACES: [
    { key: null, label: 'None', light: true, css: 'repeating-linear-gradient(135deg, #F0F0F3 0 6px, #E8E8EC 6px 12px)' },
    { key: 's:#1C1C21', label: 'Graphite', css: '#1C1C21' },
    { key: 's:#F2F0EA', label: 'Bone', css: '#F2F0EA', light: true },
    { key: 's:#6E6BFF', label: 'Indigo', css: '#6E6BFF' },
    { key: 's:#FF6A3D', label: 'Ember', css: '#FF6A3D' },
    { key: 's:#1E3B30', label: 'Moss', css: '#1E3B30' },
    { key: 'g:indigo', label: 'Indigo mesh', css: mesh('#6E6BFF', '#B14DFF', '#2B2F8F', '#0E0E1C') },
    { key: 'g:ember', label: 'Ember mesh', css: mesh('#FF6A3D', '#FFB23D', '#7A1E0E', '#160A07') },
    { key: 'g:mint', label: 'Mint mesh', css: mesh('#2FE3A0', '#1B8F9A', '#0C3B33', '#07120F') },
    { key: 'g:dusk', label: 'Dusk mesh', css: mesh('#FF7AB6', '#7A5CFF', '#2A1240', '#0D0A14') },
  ],
  ALGOS: [
    ['balanced', 'Balanced'],
    ['hero', 'Hero left'],
    ['editorial', 'Editorial'],
    ['asym', 'Asymmetric'],
  ],
  MINI: {
    balanced: [
      [0, 0, 50, 50],
      [50, 0, 50, 50],
      [0, 50, 50, 50],
      [50, 50, 50, 50],
    ],
    hero: [
      [0, 0, 56, 100],
      [56, 0, 44, 50],
      [56, 50, 44, 50],
    ],
    editorial: [
      [0, 0, 62, 58],
      [62, 0, 38, 58],
      [0, 58, 33.3, 42],
      [33.3, 58, 33.4, 42],
      [66.7, 58, 33.3, 42],
    ],
    asym: [
      [0, 0, 38, 64],
      [38, 0, 62, 36],
      [38, 36, 30, 64],
      [68, 36, 32, 64],
      [0, 64, 38, 36],
    ],
  },
  SOCIAL: {
    instagram: {
      label: 'Instagram',
      formats: [
        ['post', 'Post', 1080, 1350, '4:5'],
        ['square', 'Square', 1080, 1080, '1:1'],
        ['story', 'Story', 1080, 1920, '9:16', 250, 340],
      ],
    },
    linkedin: {
      label: 'LinkedIn',
      formats: [
        ['landscape', 'Landscape', 1200, 627, '1.91:1'],
        ['square', 'Square', 1080, 1080, '1:1'],
        ['portrait', 'Portrait', 1080, 1350, '4:5'],
      ],
    },
    x: {
      label: 'X (Twitter)',
      formats: [
        ['landscape', 'Landscape', 1600, 900, '16:9'],
        ['square', 'Square', 1080, 1080, '1:1'],
        ['portrait', 'Portrait', 1080, 1350, '4:5'],
      ],
    },
  },
  DEVICES: {
    desktop: { label: 'Desktop', W: 1200, H: 760 },
    tablet: { label: 'iPad', W: 820, H: 1180, safeT: 24, safeB: 20, r: 36 },
    mobile: { label: 'iPhone 16', W: 393, H: 852, safeT: 59, safeB: 34, r: 55 },
  },
};

const $ = (s, r = document) => r.querySelector(s);
const makeCells = () =>
  Array.from({ length: 12 }, (_, i) => ({
    id: 'c' + i,
    media: null,
    fit: 'cover',
    playing: true,
    speed: 1,
    hoverZoom: false,
    still: null,
    bg: i === 0 ? 'g:indigo' : i === 3 ? 's:#F2F0EA' : null,
    title: i === 0 ? 'Drop a hero loop' : i === 3 ? 'Any cell, any format' : '',
    subtitle: i === 0 ? 'Video, GIF or Lottie plays inline, muted and looping.' : '',
    badge: i === 0 ? 'Motion' : '',
    showTitle: i === 0 || i === 3,
    showSubtitle: i === 0,
    showBadge: i === 0,
    align: 'bl',
  }));
const controls = () => ({
  count: 7,
  gap: 12,
  padX: 16,
  padY: 16,
  padLinked: true,
  radius: 18,
  algo: 'hero',
  seed: 0,
  ratios: {},
});

const S = {
  project: 'Untitled bento',
  viewport: 'desktop',
  aspect: 'auto',
  platform: 'instagram',
  format: 'post',
  safeArea: true,
  ...controls(),
  cells: makeCells(),
  selected: null,
  lastSel: null,
  hovered: null,
  stageHover: false,
  dragId: null,
  dropId: null,
  guides: false,
  pinGuides: false,
  exportOpen: false,
  exportTab: 'tailwind',
  copied: false,
  resizing: null,
  activeSlider: null,
  stagger: false,
  settle: null,
  exRes: '1080',
  exFmt: 'jpeg',
  exDur: 5,
  exBusy: '',
};
let reduced = false;
try {
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  reduced = mq.matches;
  mq.addEventListener('change', (e) => {
    reduced = e.matches;
    render();
  });
} catch (e) {}

/* ---------- spring math ---------- */
const springCache = {};
function spring(z, resp) {
  const key = z + '_' + resp;
  if (springCache[key]) return springCache[key];
  const w = (2 * Math.PI) / resp;
  const f = (t) => {
    if (z >= 1) return 1 - (1 + w * t) * Math.exp(-w * t);
    const wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
  };
  let T = 0.1;
  for (; T < 3; T += 0.01) {
    let ok = true;
    for (let t = T; t < T + 0.25; t += 0.025)
      if (Math.abs(1 - f(t)) > 0.002) {
        ok = false;
        break;
      }
    if (ok) break;
  }
  const N = 40,
    pts = [];
  for (let i = 0; i <= N; i++) pts.push(+f((T * i) / N).toFixed(4));
  pts[N] = 1;
  return (springCache[key] = { e: `linear(${pts.join(', ')})`, d: T.toFixed(3) + 's' });
}
const TR = (props, sp) => (reduced ? 'opacity .2s' : props.map((p) => `${p} ${sp.d} ${sp.e}`).join(', '));
const OUT = 'cubic-bezier(.23,1,.32,1)';

/* ---------- layout (ported) ---------- */
function rnd(seed, s) {
  let h = 2166136261 ^ (seed * 977);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function device() {
  const s = S;
  if (s.viewport === 'social') {
    const pl = K.SOCIAL[s.platform],
      f = pl.formats.find((x) => x[0] === s.format) || pl.formats[0];
    const safe = s.safeArea && !!f[5],
      safeT = safe ? f[5] : 0,
      safeB = safe ? f[6] : 0;
    return {
      label: (s.platform === 'x' ? 'X' : pl.label) + ' ' + f[1].toLowerCase(),
      W: f[2],
      H: f[3],
      social: true,
      unit: 'px',
      safe,
      safeT,
      safeB,
      r: 0,
      padL: s.padX,
      padR: s.padX,
      padT: s.padY + safeT,
      padB: s.padY + safeB,
    };
  }
  const d = K.DEVICES[s.viewport];
  let W = d.W,
    H = d.H;
  if (s.aspect !== 'auto') {
    let [a, b] = { '16:9': [16, 9], '4:3': [4, 3], '1:1': [1, 1] }[s.aspect];
    if (s.viewport !== 'desktop') [a, b] = [b, a];
    H = Math.round((W * b) / a);
  }
  const safe = s.safeArea && s.viewport !== 'desktop';
  const safeT = safe ? d.safeT : 0,
    safeB = safe ? d.safeB : 0;
  return { ...d, unit: 'pt', W, H, safe, safeT, safeB, padL: s.padX, padR: s.padX, padT: s.padY + safeT, padB: s.padY + safeB };
}
function layout(D) {
  const s = S,
    U = 24,
    g = s.gap,
    n = s.count,
    seed = s.seed;
  const iw = D.W - D.padL - D.padR,
    ih = D.H - D.padT - D.padB,
    uw = (iw + g) / U,
    uh = (ih + g) / U;
  const leaves = [],
    splits = [];
  const longer = (r) => (r.w * uw >= r.h * uh ? 'v' : 'h');
  const J = (p) => (seed ? (rnd(seed, p + 'j') - 0.5) * 0.26 : 0);
  const plan = (r, n, p, mode) => {
    switch (mode) {
      case 'hero':
        return { dir: longer(r), n1: 1, ratio: (n <= 2 ? 0.5 : 0.48) + J(p) * 0.6, m: ['bal', 'bal'] };
      case 'edit': {
        const n1 = n >= 6 ? 2 : 1;
        return { dir: 'h', n1, ratio: 0.56 + J(p) * 0.6, m: [n1 === 2 ? 'pair' : 'bal', n - n1 <= 4 ? 'row' : 'rows2'] };
      }
      case 'pair':
        return { dir: longer(r), n1: 1, ratio: 0.62 + J(p) * 0.5, m: ['bal', 'bal'] };
      case 'rows2': {
        const n1 = Math.ceil(n / 2);
        return { dir: longer(r) === 'v' ? 'h' : 'v', n1, ratio: n1 / n, m: ['row', 'row'] };
      }
      case 'row':
        return { dir: longer(r), n1: 1, ratio: 1 / n + J(p) * 0.4, m: ['bal', 'row'] };
      case 'asym': {
        const sd = seed + 7,
          d = longer(r),
          n1 = 1 + Math.floor(rnd(sd, p + 'n') * (n - 1));
        return {
          dir: rnd(sd, p + 'd') < 0.78 ? d : d === 'v' ? 'h' : 'v',
          n1,
          ratio: n1 / n + (rnd(sd, p + 'r') - 0.5) * 0.32,
          m: ['asym', 'asym'],
        };
      }
      default: {
        let n1 = Math.ceil(n / 2);
        if (seed && n % 2 && rnd(seed, p + 'o') < 0.5) n1 = Math.floor(n / 2);
        return { dir: longer(r), n1, ratio: n1 / n + J(p), m: ['bal', 'bal'] };
      }
    }
  };
  const rec = (r, n, p, mode) => {
    if (n <= 1) {
      leaves.push(r);
      return;
    }
    let { dir, n1, ratio, m } = plan(r, n, p, mode);
    if ((dir === 'v' ? r.w : r.h) < 2) dir = dir === 'v' ? 'h' : 'v';
    const size = dir === 'v' ? r.w : r.h;
    const rt = s.ratios[p] ?? Math.min(0.85, Math.max(0.15, ratio));
    const cut = Math.max(1, Math.min(size - 1, Math.round(rt * size)));
    const a = dir === 'v' ? { x: r.x, y: r.y, w: cut, h: r.h } : { x: r.x, y: r.y, w: r.w, h: cut };
    const b = dir === 'v' ? { x: r.x + cut, y: r.y, w: r.w - cut, h: r.h } : { x: r.x, y: r.y + cut, w: r.w, h: r.h - cut };
    splits.push({ p, dir, r, cut, size });
    rec(a, n1, p + '0', m[0]);
    rec(b, n - n1, p + '1', m[1]);
  };
  rec({ x: 0, y: 0, w: U, h: U }, n, 'r', { balanced: 'bal', hero: 'hero', editorial: 'edit', asym: 'asym' }[s.algo]);
  const px = (r) => ({ left: r.x * uw, top: r.y * uh, width: Math.max(0, r.w * uw - g), height: Math.max(0, r.h * uh - g) });
  return { leaves, splits, uw, uh, g, px };
}

/* ---------- export (ported) ---------- */
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const surf = (key) => K.SURFACES.find((s) => s.key === key) || K.SURFACES[0];
function exportCode(tab, L, D) {
  const s = S,
    R = s.radius,
    g = s.gap,
    e = esc,
    W = D.W,
    H = D.H;
  const padCss = D.safe
    ? D.social
      ? `${D.padT}px ${s.padX}px ${D.padB}px`
      : `calc(${s.padY}px + env(safe-area-inset-top)) ${s.padX}px calc(${s.padY}px + env(safe-area-inset-bottom))`
    : `${s.padY}px ${s.padX}px`;
  const padTw = D.safe
    ? D.social
      ? `px-[${s.padX}px] pt-[${D.padT}px] pb-[${D.padB}px]`
      : `px-[${s.padX}px] pt-[calc(${s.padY}px+env(safe-area-inset-top))] pb-[calc(${s.padY}px+env(safe-area-inset-bottom))]`
    : `px-[${s.padX}px] py-[${s.padY}px]`;
  const items = s.cells.slice(0, s.count).map((c, i) => {
    const r = L.leaves[i],
      m = c.media;
    return {
      c,
      m,
      r,
      i: i + 1,
      bg: c.bg ? surf(c.bg).css : m ? '#EDEDF0' : '#FFFFFF',
      light: !!surf(c.bg).light && !m,
      src: m ? 'media/' + m.name.replace(/\s+/g, '-') : null,
      title: c.showTitle && c.title,
      sub: c.showSubtitle && c.subtitle,
      badge: c.showBadge && c.badge,
    };
  });
  const hasLottie = items.some((it) => it.m && it.m.kind === 'lottie');
  const hasRate = items.some((it) => it.m && it.m.kind === 'video' && it.c.speed !== 1);
  const out = [];
  if (tab === 'tailwind') {
    const al = {
      tl: 'justify-start items-start text-left',
      bl: 'justify-end items-start text-left',
      c: 'justify-center items-center text-center',
    };
    const scrim = {
      tl: ' bg-gradient-to-b from-black/55 to-transparent',
      bl: ' bg-gradient-to-t from-black/60 to-transparent',
      c: ' bg-black/30',
    };
    out.push(`<!-- ${e(s.project)}, ${W}×${H}, BentoStudio -->`);
    out.push(
      `<div class="grid w-full grid-cols-[repeat(24,minmax(0,1fr))] grid-rows-[repeat(24,minmax(0,1fr))] gap-[${g}px] ${padTw} aspect-[${W}/${H}]">`
    );
    items.forEach((it) => {
      const { r, m, c } = it,
        grad = it.bg.includes('gradient');
      out.push(
        `  <div class="relative overflow-hidden rounded-[${R}px] col-start-[${r.x + 1}] col-end-[${r.x + r.w + 1}] row-start-[${r.y + 1}] row-end-[${r.y + r.h + 1}]${grad ? '' : ` bg-[${it.bg}]`}"${grad ? ` style="background: ${it.bg}"` : ''}>`
      );
      const fill = `absolute inset-0 h-full w-full object-${c.fit}`;
      if (m && m.kind === 'video')
        out.push(
          `    <video class="${fill}" src="${it.src}" autoplay loop muted playsinline${c.speed !== 1 ? ` data-rate="${c.speed}"` : ''}></video>`
        );
      if (m && (m.kind === 'image' || m.kind === 'gif'))
        out.push(
          `    <img class="${fill}${m.kind === 'image' && c.hoverZoom ? ' transition-transform duration-700 hover:scale-105' : ''}" src="${it.src}" alt="" loading="lazy">`
        );
      if (m && m.kind === 'lottie')
        out.push(`    <div class="absolute inset-0" data-lottie="${it.src}" data-fit="${c.fit}" data-speed="${c.speed}"></div>`);
      if (it.title || it.sub || it.badge) {
        out.push(
          `    <div class="absolute inset-0 flex flex-col gap-2 p-5 ${al[c.align]} ${it.light ? 'text-[#141417]' : 'text-white'}${m ? scrim[c.align] : ''}">`
        );
        if (it.badge)
          out.push(
            `      <span class="rounded-full ${it.light ? 'bg-black/10' : 'bg-white/15'} px-2.5 py-1 text-[11px] font-medium">${e(it.badge)}</span>`
          );
        if (it.title) out.push(`      <h3 class="text-2xl font-semibold leading-none tracking-tight">${e(it.title)}</h3>`);
        if (it.sub) out.push(`      <p class="max-w-[34ch] text-sm opacity-80">${e(it.sub)}</p>`);
        out.push('    </div>');
      }
      out.push('  </div>');
    });
    out.push('</div>');
  } else if (tab === 'css') {
    const al = {
      tl: 'flex-start; align-items: flex-start',
      bl: 'flex-end; align-items: flex-start',
      c: 'center; align-items: center; text-align: center',
    };
    out.push('<div class="bento">');
    items.forEach((it) => {
      const { m, c } = it,
        mod = c.fit === 'contain' ? ' bento__media--contain' : '';
      out.push(`  <div class="bento__cell bento__cell--${it.i}">`);
      if (m && m.kind === 'video')
        out.push(
          `    <video class="bento__media${mod}" src="${it.src}" autoplay loop muted playsinline${c.speed !== 1 ? ` data-rate="${c.speed}"` : ''}></video>`
        );
      if (m && (m.kind === 'image' || m.kind === 'gif'))
        out.push(`    <img class="bento__media${mod}" src="${it.src}" alt="" loading="lazy">`);
      if (m && m.kind === 'lottie')
        out.push(`    <div class="bento__media" data-lottie="${it.src}" data-fit="${c.fit}" data-speed="${c.speed}"></div>`);
      if (it.title || it.sub || it.badge) {
        out.push(`    <div class="bento__overlay bento__overlay--${c.align}">`);
        if (it.badge) out.push(`      <span class="bento__badge">${e(it.badge)}</span>`);
        if (it.title) out.push(`      <h3 class="bento__title">${e(it.title)}</h3>`);
        if (it.sub) out.push(`      <p class="bento__subtitle">${e(it.sub)}</p>`);
        out.push('    </div>');
      }
      out.push('  </div>');
    });
    out.push('</div>', '', '<style>');
    out.push(
      `  .bento { display: grid; grid-template-columns: repeat(24, minmax(0, 1fr)); grid-template-rows: repeat(24, minmax(0, 1fr)); gap: ${g}px; padding: ${padCss}; aspect-ratio: ${W} / ${H}; }`
    );
    out.push(`  .bento__cell { position: relative; overflow: hidden; border-radius: ${R}px; background: #FFFFFF; color: #fff; }`);
    out.push('  .bento__media { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }');
    out.push('  .bento__media--contain { object-fit: contain; }');
    out.push(
      '  .bento__overlay { position: absolute; inset: 0; display: flex; flex-direction: column; gap: 8px; padding: 20px; }'
    );
    Object.entries(al).forEach(([k, v]) => out.push(`  .bento__overlay--${k} { justify-content: ${v}; }`));
    out.push(
      '  .bento__badge { padding: 4px 10px; border-radius: 999px; background: rgba(255,255,255,.15); font-size: 11px; font-weight: 500; }'
    );
    out.push('  .bento__title { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.03em; line-height: 1.02; }');
    out.push('  .bento__subtitle { margin: 0; max-width: 34ch; font-size: 14px; opacity: .8; }');
    items.forEach((it) => {
      const { r } = it;
      out.push(
        `  .bento__cell--${it.i} { grid-area: ${r.y + 1} / ${r.x + 1} / ${r.y + r.h + 1} / ${r.x + r.w + 1}; background: ${it.bg};${it.light ? ' color: #141417;' : ''} }`
      );
    });
    out.push('</style>');
  } else {
    if (hasLottie) out.push("import { useEffect, useRef } from 'react';", "import lottie from 'lottie-web';", '');
    out.push('const cells = [');
    items.forEach((it) => {
      const { r, m, c } = it,
        f = [`area: '${r.y + 1} / ${r.x + 1} / ${r.y + r.h + 1} / ${r.x + r.w + 1}'`, `bg: ${JSON.stringify(it.bg)}`];
      if (m) f.push(`type: '${m.kind === 'gif' ? 'image' : m.kind}'`, `src: '${it.src}'`, `fit: '${c.fit}'`);
      if (m && m.kind !== 'image' && c.speed !== 1) f.push(`speed: ${c.speed}`);
      if (it.title) f.push(`title: ${JSON.stringify(it.title)}`);
      if (it.sub) f.push(`subtitle: ${JSON.stringify(it.sub)}`);
      if (it.badge) f.push(`badge: ${JSON.stringify(it.badge)}`);
      if (it.title || it.sub || it.badge) f.push(`align: '${c.align}'`);
      if (it.light) f.push("ink: '#141417'");
      out.push(`  { ${f.join(', ')} },`);
    });
    out.push('];', '');
    out.push(
      "const fill = (fit = 'cover') => ({ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: fit });"
    );
    out.push("const align = { tl: ['flex-start', 'flex-start'], bl: ['flex-end', 'flex-start'], c: ['center', 'center'] };", '');
    if (hasLottie) {
      out.push('function LottieCell({ src, fit, speed = 1 }) {', '  const ref = useRef(null);', '  useEffect(() => {');
      out.push(
        "    const anim = lottie.loadAnimation({ container: ref.current, path: src, loop: true, autoplay: true, renderer: 'svg',"
      );
      out.push("      rendererSettings: { preserveAspectRatio: fit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice' } });");
      out.push(
        '    anim.setSpeed(speed);',
        '    return () => anim.destroy();',
        '  }, [src, fit, speed]);',
        '  return <div ref={ref} style={fill()} />;',
        '}',
        ''
      );
    }
    out.push('export default function BentoGrid() {', '  return (');
    out.push(
      `    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, minmax(0, 1fr))', gridTemplateRows: 'repeat(24, minmax(0, 1fr))', gap: ${g}, padding: '${padCss}', aspectRatio: '${W} / ${H}' }}>`
    );
    out.push('      {cells.map((c, i) => (');
    out.push(
      `        <div key={i} style={{ gridArea: c.area, position: 'relative', overflow: 'hidden', borderRadius: ${R}, background: c.bg, color: c.ink || '#fff' }}>`
    );
    out.push(
      "          {c.type === 'video' && <video src={c.src} autoPlay loop muted playsInline style={fill(c.fit)} ref={el => el && (el.playbackRate = c.speed || 1)} />}"
    );
    out.push('          {c.type === \'image\' && <img src={c.src} alt="" loading="lazy" style={fill(c.fit)} />}');
    if (hasLottie) out.push("          {c.type === 'lottie' && <LottieCell src={c.src} fit={c.fit} speed={c.speed} />}");
    out.push('          {(c.title || c.subtitle || c.badge) && (');
    out.push(
      "            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: 8, padding: 20, justifyContent: align[c.align][0], alignItems: align[c.align][1] }}>"
    );
    out.push(
      "              {c.badge && <span style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,.15)', fontSize: 11, fontWeight: 500 }}>{c.badge}</span>}"
    );
    out.push(
      "              {c.title && <h3 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.02 }}>{c.title}</h3>}"
    );
    out.push('              {c.subtitle && <p style={{ margin: 0, fontSize: 14, opacity: 0.8 }}>{c.subtitle}</p>}');
    out.push('            </div>', '          )}', '        </div>', '      ))}', '    </div>', '  );', '}');
  }
  if (tab !== 'react' && (hasRate || hasLottie)) {
    out.push('');
    if (hasLottie)
      out.push('<script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></' + 'script>');
    out.push('<script>');
    if (hasRate) out.push("  document.querySelectorAll('video[data-rate]').forEach(v => v.playbackRate = +v.dataset.rate);");
    if (hasLottie) {
      out.push("  document.querySelectorAll('[data-lottie]').forEach(el => {");
      out.push(
        "    const a = lottie.loadAnimation({ container: el, path: el.dataset.lottie, loop: true, autoplay: true, renderer: 'svg',"
      );
      out.push(
        "      rendererSettings: { preserveAspectRatio: el.dataset.fit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice' } });"
      );
      out.push('    a.setSpeed(+el.dataset.speed || 1);', '  });');
    }
    out.push('</' + 'script>');
  }
  return out.join('\n');
}

/* ---------- helpers ---------- */
const stage = $('#stage'),
  inner = $('#inner'),
  deco = $('#frameDeco');
let curL = null,
  curScale = 1,
  curDims = null;
const cellEls = new Map(),
  handleEls = new Map();
const fileEl = $('#file');
let uploadTarget = null;

const segInner = (opts, active, act) =>
  opts
    .map(
      ([k, l]) =>
        `<button class="${k === active ? 'on' : ''}" data-act="${act}" data-arg="${k}" aria-pressed="${k === active}">${l}</button>`
    )
    .join('');
const seg = (opts, active, act, cls = '', label = '') =>
  `<div class="seg ${cls}" role="group"${label ? ` aria-label="${label}"` : ''}>${segInner(opts, active, act)}</div>`;
const tog = (on, act, arg = '', label = '') =>
  `<button class="tog ${on ? 'on' : ''}" data-act="${act}" data-arg="${arg}" role="switch" aria-checked="${on}" aria-label="${label}"></button>`;
const SLIDER_LABELS = {
  count: 'Cell count',
  gap: 'Gap',
  pad: 'Padding, all sides',
  padX: 'Horizontal padding',
  padY: 'Vertical padding',
  radius: 'Corner radius',
  speed: 'Playback speed',
};
const slider = (key, min, max, step, value) =>
  `<div class="sl ${S.activeSlider === key ? 'act' : ''}" data-slider="${key}" data-min="${min}" data-max="${max}" data-step="${step}" role="slider" tabindex="0" aria-label="${SLIDER_LABELS[key]}" aria-valuemin="${min}" aria-valuemax="${max}" aria-valuenow="${value}"><div class="tr"></div><div class="fl" style="width:${((value - min) / (max - min)) * 100}%"></div><div class="th" style="left:${((value - min) / (max - min)) * 100}%"></div></div>`;
const liveRegion = $('#live');
let liveT = null;
function announce(msg) {
  clearTimeout(liveT);
  liveRegion.textContent = '';
  liveT = setTimeout(() => {
    liveRegion.textContent = msg;
  }, 40);
}
// keep keyboard focus when a panel is rebuilt
function focusSig(el) {
  if (!el || el === document.body) return null;
  const root = el.closest('#leftBody,#insp,#vpSeg,#aspSeg,#exTabs,#exMedia,#toolbar');
  if (!root) return null;
  let sel = null;
  if (el.dataset.slider) sel = `[data-slider="${el.dataset.slider}"]`;
  else if (el.dataset.field) sel = `[data-field="${el.dataset.field}"]`;
  else if (el.dataset.act) sel = `[data-act="${el.dataset.act}"][data-arg="${el.dataset.arg ?? ''}"]`;
  return sel ? { root: '#' + root.id, sel } : null;
}

const sliderDefs = {
  count: {
    guide: false,
    set: (v) => {
      if (v !== S.count) {
        S.count = v;
        S.ratios = {};
      }
    },
  },
  gap: {
    guide: true,
    set: (v) => {
      S.gap = v;
    },
  },
  pad: {
    guide: true,
    set: (v) => {
      S.padX = v;
      S.padY = v;
    },
  },
  padX: {
    guide: true,
    set: (v) => {
      S.padX = v;
    },
  },
  padY: {
    guide: true,
    set: (v) => {
      S.padY = v;
    },
  },
  radius: {
    guide: false,
    set: (v) => {
      S.radius = v;
    },
  },
  speed: {
    guide: false,
    set: (v) => {
      const c = S.cells.find((x) => x.id === S.selected || x.id === S.lastSel);
      if (c) c.speed = v;
    },
  },
};
let gt = null;
function showGuides(on) {
  clearTimeout(gt);
  if (on) {
    S.guides = true;
  } else
    gt = setTimeout(() => {
      S.guides = false;
      renderStage();
    }, 650);
}
function kick() {
  clearTimeout(kick.t);
  S.stagger = true;
  kick.t = setTimeout(() => {
    S.stagger = false;
  }, 700);
}

/* ---------- left panel ---------- */
function renderLeft() {
  const s = S,
    D = device(),
    n = s.count;
  let h = '';
  if (s.viewport === 'social') {
    const pl = K.SOCIAL[s.platform];
    h += `<div class="sec"><div class="sec-h"><span class="sec-t">Social frame</span><span class="val">${D.W}×${D.H}</span></div>`;
    h += seg(
      Object.entries(K.SOCIAL).map(([k, p]) => [k, p.label]),
      s.platform,
      'platform',
      'sm',
      'Platform'
    );
    h += pl.formats
      .map(([k, label, fw, fh, ratio]) => {
        const m = 24 / Math.max(fw, fh);
        return `<button class="fmt ${s.format === k ? 'on' : ''}" data-act="format" data-arg="${k}" aria-pressed="${s.format === k}"><span class="th"><i style="width:${Math.round(fw * m)}px;height:${Math.round(fh * m)}px"></i></span>${label}<span class="r">${ratio}</span></button>`;
      })
      .join('');
    h += '</div>';
  }
  h += `<div class="sec"><div class="sec-h"><span class="sec-t">Cells</span><div class="stepper"><button data-act="dec" aria-label="Fewer">−</button><span>${n}</span><button data-act="inc" aria-label="More">+</button></div></div>${slider('count', 2, 12, 1, n)}<div class="ticks">${Array.from({ length: 11 }, (_, i) => `<i style="left:${i * 10}%;background:${i + 2 <= n ? 'transparent' : '#C8C8D0'}"></i>`).join('')}</div></div>`;

  h += `<div class="sec"><div class="sec-h"><span class="sec-t">Spacing</span></div>`;
  h += `<div class="row"><span class="lbl">Gap</span><span class="val">${s.gap}px</span></div>${slider('gap', 0, 48, 1, s.gap)}`;
  h += `<div class="chips">${[0, 8, 16, 24, 32].map((v) => `<button class="chip ${s.gap === v ? 'on' : ''}" data-act="gapPreset" data-arg="${v}" aria-pressed="${s.gap === v}" aria-label="Gap ${v}px">${v}</button>`).join('')}</div>`;
  h += `<div class="row" style="margin-top:20px"><span class="lbl">Padding</span><button class="pill-btn ${s.padLinked ? '' : 'off'}" data-act="link" aria-pressed="${s.padLinked}" aria-label="Link padding sides">${s.padLinked ? 'Linked' : 'Separate'}</button></div>`;
  if (s.padLinked)
    h += `<div class="row" style="margin-top:6px"><span class="lbl">All sides</span><span class="val">${s.padX}px</span></div>${slider('pad', 0, 64, 1, s.padX)}`;
  else
    h += `<div class="row" style="margin-top:6px"><span class="lbl">Horizontal</span><span class="val">${s.padX}px</span></div>${slider('padX', 0, 64, 1, s.padX)}<div class="row" style="margin-top:6px"><span class="lbl">Vertical</span><span class="val">${s.padY}px</span></div>${slider('padY', 0, 64, 1, s.padY)}`;
  const showSafe =
    s.viewport === 'tablet' ||
    s.viewport === 'mobile' ||
    (s.viewport === 'social' && s.format === 'story' && s.platform === 'instagram');
  if (showSafe) {
    const dv = K.DEVICES[s.viewport] || {};
    h += `<div class="tog-row"><div><div class="lbl" style="color:var(--ink)">Safe areas</div><div class="sub">${s.viewport === 'social' ? 'Keeps clear of story UI: 250 px top, 340 px bottom' : `Adds ${dv.safeT || 0} pt top and ${dv.safeB || 0} pt bottom`}</div></div>${tog(s.safeArea, 'safe', '', 'Safe areas')}</div>`;
  }
  h += `<div class="row" style="margin-top:20px"><span class="lbl">Corner radius</span><span class="val">${s.radius}px</span></div>${slider('radius', 0, 40, 1, s.radius)}</div>`;

  h += `<div class="sec"><div class="sec-h"><span class="sec-t">Layout</span></div>`;
  if (innerWidth < 1080 && s.viewport !== 'social')
    h += `<div style="margin-bottom:12px">${seg(
      [
        ['auto', 'Auto'],
        ['16:9', '16:9'],
        ['4:3', '4:3'],
        ['1:1', '1:1'],
      ],
      s.aspect,
      'aspect',
      'sm mono',
      'Aspect ratio'
    )}</div>`;
  h += `<div class="cards2">${K.ALGOS.map(([k, label]) => {
    const on = s.algo === k;
    return `<button class="card ${on ? 'on' : ''}" data-act="algo" data-arg="${k}" aria-pressed="${on}"><span class="mini">${K.MINI[k].map(([l, t, w, hh], j) => `<i style="left:calc(${l}% + 1px);top:calc(${t}% + 1px);width:calc(${w}% - 2px);height:calc(${hh}% - 2px);background:${on ? (j === 0 ? A : 'rgba(240,83,28,.42)') : j === 0 ? '#B9B9C2' : '#DCDCE2'}"></i>`).join('')}</span>${label}</button>`;
  }).join('')}</div>`;
  const manual = Object.keys(s.ratios).length;
  if (manual)
    h += `<div class="spans">${manual === 1 ? '1 seam moved by hand' : manual + ' seams moved by hand'} · <button class="link-btn" style="margin:0" data-act="even">Even out</button></div>`;
  h += '</div>';
  $('#leftBody').innerHTML = h;
}

/* ---------- top bar / toolbar ---------- */
function renderTop() {
  $('#vpSeg').innerHTML = segInner(
    [
      ['desktop', 'Desktop'],
      ['tablet', 'Tablet'],
      ['mobile', 'Mobile'],
      ['social', 'Social'],
    ],
    S.viewport,
    'viewport'
  );
  const asp = $('#aspSeg');
  asp.style.display = S.viewport !== 'social' && innerWidth >= 1080 ? '' : 'none';
  asp.innerHTML = segInner(
    [
      ['auto', 'Auto'],
      ['16:9', '16:9'],
      ['4:3', '4:3'],
      ['1:1', '1:1'],
    ],
    S.aspect,
    'aspect'
  );
}
function mixText() {
  const vis = S.cells.slice(0, S.count);
  const mo = vis.filter((c) => c.media && c.media.kind !== 'image').length,
    st = vis.filter((c) => c.media && c.media.kind === 'image').length;
  return mo + st ? `${S.count} cells, ${mo} motion, ${st} still` : `${S.count} cells`;
}
function renderToolbar(cx) {
  const tb = $('#toolbar'),
    D = curDims;
  if (cx != null) {
    tb.style.left = cx + 'px';
    tb.style.transition = TR(['left'], spring(1, 0.42));
  }
  tb.innerHTML = `<span><b style="font-weight:600;color:var(--ink)">${D.label}</b> <span class="m">${D.W}×${D.H}</span></span><span class="sep"></span><span class="m">${Math.round(curScale * 100)}%</span><span class="sep"></span><span>${mixText()}</span><span class="sep"></span><button data-act="pin" aria-pressed="${S.pinGuides}" style="background:${S.pinGuides ? 'rgba(240,83,28,.22)' : 'rgba(17,17,27,.045)'};color:${S.pinGuides ? '#17171B' : '#55555F'}"><i style="background:${S.pinGuides ? A : '#A0A0AA'}"></i>Guides</button>`;
}

/* ---------- stage ---------- */
let introDone = false;
function makeCellEl(id) {
  const el = document.createElement('div');
  el.className = 'cell';
  el.dataset.id = id;
  el.draggable = true;
  el.tabIndex = 0;
  el.setAttribute('role', 'group');
  el.addEventListener('keydown', (e) => {
    if (e.target !== el) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      S.selected = S.lastSel = id;
      render();
    }
  });
  el.innerHTML = `<div class="media"></div><div class="scrim"></div><div class="ov"><span class="badge"></span><h3></h3><p></p></div>
  <div class="hint"><button class="pill" data-cact="upload">Add media</button><span class="hint-sub">Drop images, video, GIF or Lottie</span></div>
  <div class="dropbox"><span></span></div><div class="num"></div>
  <div class="tools"><button data-cact="upload"></button><button data-cact="fit"></button><button data-cact="play"></button><button data-cact="clear" aria-label="Remove media">✕</button></div>`;
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    const a = e.target.closest('[data-cact]');
    const c = S.cells.find((x) => x.id === id);
    if (a) {
      const k = a.dataset.cact;
      S.selected = S.lastSel = id;
      if (k === 'upload') pick(id);
      else if (k === 'fit') c.fit = c.fit === 'cover' ? 'contain' : 'cover';
      else if (k === 'play') togglePlay(id);
      else if (k === 'clear') clearMedia(id);
    } else {
      S.selected = S.lastSel = id;
    }
    render();
  });
  el.addEventListener('mouseenter', () => {
    S.hovered = id;
    updateHover();
  });
  el.addEventListener('mouseleave', () => {
    if (S.hovered === id) S.hovered = null;
    updateHover();
  });
  el.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    S.dragId = id;
    S.hovered = null;
    setTimeout(renderStage, 0);
  });
  el.addEventListener('dragend', () => {
    S.dragId = null;
    S.dropId = null;
    renderStage();
  });
  el.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const d = S.dragId === id ? null : id;
    if (S.dropId !== d) {
      S.dropId = d;
      renderStage();
    }
  });
  el.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) loadFiles(id, files);
    else {
      const from = S.dragId || e.dataTransfer.getData('text/plain');
      if (from && from !== id) swap(from, id);
    }
    S.dropId = null;
    S.dragId = null;
    render();
  });
  return el;
}

function syncMedia(el, c) {
  const holder = $('.media', el),
    m = c.media;
  if (!m) {
    if (holder.__m) {
      if (holder.__anim) holder.__anim.destroy();
      holder.__anim = null;
      holder.innerHTML = '';
      holder.__m = null;
    }
    return;
  }
  const rebuild = holder.__m !== m || (m.kind === 'lottie' && holder.__fit !== c.fit);
  if (rebuild) {
    if (holder.__anim) holder.__anim.destroy();
    holder.__anim = null;
    holder.innerHTML = '';
    let node;
    if (m.kind === 'video') {
      node = document.createElement('video');
      node.muted = true;
      node.loop = true;
      node.playsInline = true;
      node.autoplay = true;
      node.src = m.url;
    } else if (m.kind === 'lottie') {
      node = document.createElement('div');
    } else {
      node = document.createElement('img');
      node.draggable = false;
    }
    if (m.kind !== 'lottie') {
      node.style.opacity = '0';
      node.style.transition = 'opacity 360ms ' + OUT + ', transform .7s cubic-bezier(.2,.8,.2,1)';
      node.addEventListener(m.kind === 'video' ? 'loadeddata' : 'load', () => {
        node.style.opacity = '1';
      });
    }
    holder.appendChild(node);
    holder.__m = m;
    holder.__fit = c.fit;
    if (m.kind === 'lottie' && window.lottie) {
      holder.__anim = lottie.loadAnimation({
        container: node,
        renderer: 'svg',
        loop: true,
        autoplay: c.playing,
        animationData: m.data,
        rendererSettings: { preserveAspectRatio: c.fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet' },
      });
    }
  }
  const node = holder.firstChild;
  if (m.kind === 'gif' || m.kind === 'image') {
    const want = m.kind === 'gif' && !c.playing && c.still ? c.still : m.url;
    if (node.__src !== want) {
      node.src = want;
      node.__src = want;
    }
    node.style.objectFit = c.fit;
    node.style.transform = m.kind === 'image' && c.hoverZoom && S.hovered === c.id ? 'scale(1.06)' : 'scale(1)';
  } else if (m.kind === 'video') {
    node.style.objectFit = c.fit;
    node.playbackRate = c.speed;
    if (c.playing && node.paused) node.play().catch(() => {});
    if (!c.playing && !node.paused) node.pause();
  } else if (m.kind === 'lottie' && holder.__anim) {
    holder.__anim.setSpeed(c.speed);
    if (c.playing && holder.__anim.isPaused) holder.__anim.play();
    if (!c.playing && !holder.__anim.isPaused) holder.__anim.pause();
  }
}

function updateHover() {
  cellEls.forEach((el, id) => {
    const hov = S.hovered === id && !S.dragId && !S.resizing;
    const t = $('.tools', el),
      n = $('.num', el);
    t.style.opacity = hov ? 1 : 0;
    t.style.transform = hov ? 'none' : 'translateY(-4px) scale(.96)';
    t.style.pointerEvents = hov ? 'auto' : 'none';
    n.style.opacity = hov ? 1 : 0;
    n.style.transform = hov ? 'none' : 'translateY(-4px) scale(.96)';
    const c = S.cells.find((x) => x.id === id);
    if (c && c.media && c.media.kind === 'image') syncMedia(el, c);
  });
}

function renderStage() {
  const s = S,
    D = device(),
    W = D.W,
    H = D.H,
    n = s.count;
  curDims = D;
  const visible = s.cells.slice(0, n);
  const selVisible = visible.some((c) => c.id === s.selected);
  const vw = innerWidth,
    vh = innerHeight;
  const leftEdge = 296,
    rightEdge = vw - (selVisible ? 324 : 12),
    top = 64,
    bottom = vh - 64;
  const scale = Math.max(0.1, Math.min(1, (rightEdge - leftEdge - 56) / W, (bottom - top - 40) / H));
  const cx = (leftEdge + rightEdge) / 2,
    cy = (top + bottom) / 2;
  const L = layout(D);
  curL = L;
  curScale = scale;
  L.scale = scale;
  const sp = spring(1, 0.42);
  const dragging = s.resizing || s.activeSlider;

  // stage box
  const outerR = D.social ? 2 : D.r ? D.r : s.radius ? s.radius + Math.min(s.padX, s.padY) : 0;
  stage.style.cssText = `left:${cx - W / 2}px;top:${cy - H / 2}px;width:${W}px;height:${H}px;transform:scale(${scale});border-radius:${outerR}px;background:${s.viewport === 'desktop' || D.social ? '#FFFFFF' : '#F6F6F8'};box-shadow:${s.viewport === 'desktop' || D.social ? '0 0 0 1px #E4E4E9, 0 40px 120px rgba(17,17,27,.154)' : '0 0 0 1px #3A3A42, 0 0 0 10px #1C1C21, 0 0 0 11px #EDEDF0, 0 40px 90px rgba(17,17,27,.22)'};transition:${dragging ? 'none' : TR(['left', 'top', 'width', 'height', 'transform', 'border-radius'], sp)}`;
  inner.style.cssText = `left:${D.padL}px;right:${D.padR}px;top:${D.padT}px;bottom:${D.padB}px;transition:${s.resizing ? 'none' : TR(['left', 'top', 'right', 'bottom'], sp)}`;

  // glow
  const g = $('#glow');
  g.style.cssText = `left:${cx}px;top:${cy}px;width:${W * scale * 1.6 + 200}px;height:${H * scale * 1.6 + 200}px;transition:${TR(['left', 'top', 'width', 'height'], sp)}`;

  // cells
  const ids = new Set(visible.map((c) => c.id));
  cellEls.forEach((el, id) => {
    if (!ids.has(id)) {
      const a = $('.media', el).__anim;
      if (a) a.destroy();
      el.remove();
      cellEls.delete(id);
    }
  });
  let fresh = 0;
  visible.forEach((c, i) => {
    let el = cellEls.get(c.id),
      isNew = false;
    if (!el) {
      el = makeCellEl(c.id);
      cellEls.set(c.id, el);
      inner.appendChild(el);
      isNew = true;
      el.__fresh = true;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          el.__fresh = false;
          renderStage();
        })
      );
    }
    const p = L.px(L.leaves[i]),
      m = c.media,
      sf = surf(c.bg),
      ov = !!((c.showTitle && c.title) || (c.showSubtitle && c.subtitle) || (c.showBadge && c.badge));
    const light = sf.light && !m;
    const dly = el.__fresh ? (introDone ? fresh++ * 40 : i * 45) + 'ms' : s.stagger ? Math.min(i * 22, 220) + 'ms' : '0ms';
    const tail = `transform 420ms ${OUT} ${dly}, opacity 260ms ease-out ${dly}, outline-color .2s ease, outline-offset 280ms ${OUT}`;
    el.style.transition = reduced
      ? 'opacity .2s, outline-color .2s'
      : dragging
        ? tail + ', ' + ['left', 'top', 'width', 'height'].map((q) => `${q} 90ms ${OUT}`).join(', ')
        : ['left', 'top', 'width', 'height', 'border-radius'].map((q) => `${q} ${sp.d} ${sp.e} ${dly}`).join(', ') + ', ' + tail;
    el.style.left = p.left + 'px';
    el.style.top = p.top + 'px';
    el.style.width = p.width + 'px';
    el.style.height = p.height + 'px';
    el.style.borderRadius = s.radius + 'px';
    el.style.opacity = el.__fresh ? 0 : s.dragId === c.id ? 0.4 : 1;
    el.style.transform = reduced
      ? 'none'
      : el.__fresh
        ? 'scale(.94) translateY(6px)'
        : s.settle && s.settle.includes(c.id)
          ? 'scale(.965)'
          : 'none';
    el.style.background = !c.bg && m ? '#EDEDF0' : sf.css;
    el.style.outline = s.selected === c.id ? `2px solid ${A}` : '2px solid rgba(240,83,28,0)';
    el.style.outlineOffset = (s.selected === c.id ? 2 : 7) + 'px';
    syncMedia(el, c);
    const al = c.align;
    $('.scrim', el).style.background =
      !m || !ov
        ? 'transparent'
        : al === 'tl'
          ? 'linear-gradient(to bottom, rgba(0,0,0,.55), rgba(0,0,0,0) 55%)'
          : al === 'c'
            ? 'rgba(0,0,0,.3)'
            : 'linear-gradient(to top, rgba(0,0,0,.62), rgba(0,0,0,0) 58%)';
    const ovEl = $('.ov', el);
    ovEl.style.display = ov ? 'flex' : 'none';
    ovEl.style.padding = (p.width < 220 ? 14 : 22) + 'px';
    ovEl.style.justifyContent = al === 'tl' ? 'flex-start' : al === 'c' ? 'center' : 'flex-end';
    ovEl.style.alignItems = al === 'c' ? 'center' : 'flex-start';
    ovEl.style.textAlign = al === 'c' ? 'center' : 'left';
    ovEl.style.color = light ? '#141417' : '#FFFFFF';
    const b = $('.badge', ovEl),
      t = $('h3', ovEl),
      sub = $('p', ovEl);
    const showB = c.showBadge && c.badge,
      showT = c.showTitle && c.title,
      showS = c.showSubtitle && c.subtitle;
    b.style.display = showB ? '' : 'none';
    b.textContent = c.badge;
    b.style.background = light ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.16)';
    t.style.display = showT ? '' : 'none';
    t.textContent = c.title;
    t.style.fontSize = Math.round(Math.max(17, Math.min(40, p.width / 12.5))) + 'px';
    sub.style.display = showS ? '' : 'none';
    sub.textContent = c.subtitle;
    const hint = $('.hint', el);
    hint.style.display = !m && !ov ? 'flex' : 'none';
    $('.hint-sub', el).style.display = p.width > 170 && p.height > 130 ? '' : 'none';
    const db = $('.dropbox', el);
    db.style.opacity = s.dropId === c.id ? 1 : 0;
    db.firstChild.textContent = s.dragId ? 'Swap cells' : m ? 'Drop to replace' : 'Drop to place';
    $('.num', el).textContent = `${i + 1} · ${Math.round(p.width)}×${Math.round(p.height)}`;
    el.setAttribute(
      'aria-label',
      `Cell ${i + 1}, ${m ? m.name : 'empty'}${s.selected === c.id ? ', selected' : ''}. Enter to select, Delete to remove media.`
    );
    const tools = $('.tools', el).children;
    tools[0].textContent = m ? 'Replace' : 'Add';
    tools[1].style.display = m ? '' : 'none';
    tools[1].textContent = c.fit === 'cover' ? 'Cover' : 'Contain';
    tools[2].style.display = m && m.kind !== 'image' ? '' : 'none';
    tools[2].textContent = c.playing ? 'Pause' : 'Play';
    tools[3].style.display = m ? '' : 'none';
  });
  updateHover();

  // handles
  const hitW = Math.max(14, L.g),
    seen = new Set();
  L.splits.forEach((spl) => {
    seen.add(spl.p);
    let he = handleEls.get(spl.p);
    if (!he) {
      he = document.createElement('div');
      he.className = 'handle';
      he.innerHTML = '<i></i>';
      he.dataset.p = spl.p;
      he.tabIndex = 0;
      he.setAttribute('role', 'separator');
      he.addEventListener('pointerdown', (e) =>
        startSplit(
          curL.splits.find((q) => q.p === spl.p),
          e
        )
      );
      inner.appendChild(he);
      handleEls.set(spl.p, he);
    }
    const r = spl.r,
      active = s.resizing === spl.p,
      v = spl.dir === 'v';
    const pos = v ? (r.x + spl.cut) * L.uw - L.g / 2 : (r.y + spl.cut) * L.uh - L.g / 2;
    const a0 = v ? r.y * L.uh : r.x * L.uw,
      len = (v ? r.h * L.uh : r.w * L.uw) - L.g;
    he.style.cssText = `left:${v ? pos - hitW / 2 : a0}px;top:${v ? a0 : pos - hitW / 2}px;width:${v ? hitW : len}px;height:${v ? len : hitW}px;cursor:${v ? 'col-resize' : 'row-resize'};opacity:${active ? 1 : s.stageHover && !s.dragId ? 0.8 : 0};transition:${(s.resizing ? '' : TR(['left', 'top', 'width', 'height'], sp) + ', ') + 'opacity .2s'}`;
    he.setAttribute('aria-orientation', v ? 'vertical' : 'horizontal');
    he.setAttribute('aria-label', 'Resize seam. Arrow keys move it one track.');
    he.setAttribute('aria-valuemin', 1);
    he.setAttribute('aria-valuemax', spl.size - 1);
    he.setAttribute('aria-valuenow', spl.cut);
    const gi = he.firstChild;
    gi.style.width = (v ? (active ? 5 : 4) : active ? 40 : 28) + 'px';
    gi.style.height = (v ? (active ? 40 : 28) : active ? 5 : 4) + 'px';
    gi.style.background = active ? A : '#fff';
  });
  handleEls.forEach((he, p) => {
    if (!seen.has(p)) {
      he.remove();
      handleEls.delete(p);
    }
  });

  // decorations: bezel, safe zones, guides
  let d = '';
  if (s.viewport === 'mobile')
    d += `<div style="position:absolute;top:11px;left:50%;transform:translateX(-50%);width:124px;height:36px;border-radius:20px;background:#0B0B0D"></div><div style="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:134px;height:5px;border-radius:3px;background:rgba(17,17,27,.85)"></div>`;
  if (D.safe && D.safeT) d += `<div class="safe" style="top:0;height:${D.safeT}px">Safe area ${D.safeT}${D.unit}</div>`;
  if (D.safe && D.safeB) d += `<div class="safe" style="bottom:0;height:${D.safeB}px">Safe area ${D.safeB}${D.unit}</div>`;
  const showG = s.guides || s.pinGuides;
  if (showG) {
    const st1 = 'repeating-linear-gradient(135deg,rgba(240,83,28,.26) 0 5px,rgba(240,83,28,.08) 5px 10px)';
    d += `<div class="guide" style="left:0;right:0;top:${D.safeT}px;height:${s.padY}px;background:${st1}"></div><div class="guide" style="left:0;right:0;bottom:${D.safeB}px;height:${s.padY}px;background:${st1}"></div><div class="guide" style="left:0;width:${s.padX}px;top:${D.padT}px;bottom:${D.padB}px;background:${st1}"></div><div class="guide" style="right:0;width:${s.padX}px;top:${D.padT}px;bottom:${D.padB}px;background:${st1}"></div>`;
    d += `<div class="glabel" style="left:50%;top:${D.safeT + Math.max(10, s.padY / 2)}px">Padding ${s.padLinked ? s.padX + 'px' : s.padY + '/' + s.padX + 'px'}</div>`;
    L.splits.forEach((spl) => {
      const r = spl.r,
        v = spl.dir === 'v',
        pos = v ? (r.x + spl.cut) * L.uw - L.g / 2 : (r.y + spl.cut) * L.uh - L.g / 2;
      const a0 = v ? r.y * L.uh : r.x * L.uw,
        len = (v ? r.h * L.uh : r.w * L.uw) - L.g;
      d += v
        ? `<div class="guide" style="left:${D.padL + pos}px;top:${D.padT + a0}px;width:${L.g}px;height:${len}px;background:rgba(240,83,28,.42)"></div>`
        : `<div class="guide" style="left:${D.padL + a0}px;top:${D.padT + pos}px;width:${len}px;height:${L.g}px;background:rgba(240,83,28,.42)"></div>`;
    });
    const f = L.splits[0];
    if (f) {
      const v = f.dir === 'v',
        r = f.r,
        pos = v ? (r.x + f.cut) * L.uw - L.g / 2 : (r.y + f.cut) * L.uh - L.g / 2;
      const gx = v ? pos : r.x * L.uw + (r.w * L.uw - L.g) / 2,
        gy = v ? r.y * L.uh + (r.h * L.uh - L.g) / 2 : pos;
      d += `<div class="glabel" style="left:${D.padL + gx + (v ? L.g / 2 : 0)}px;top:${D.padT + gy + (v ? 0 : L.g / 2)}px">Gap ${s.gap}px</div>`;
    }
  }
  deco.innerHTML = d;

  // inspector offset + toolbar
  const insp = $('#insp'),
    sp2 = spring(1, 0.36);
  insp.style.transform = selVisible ? 'none' : 'translateX(calc(100% + 24px))';
  insp.style.opacity = selVisible ? 1 : 0;
  insp.style.pointerEvents = selVisible ? 'auto' : 'none';
  insp.style.transition = reduced ? 'opacity .2s' : `transform ${sp2.d} ${sp2.e}, opacity .25s ease`;
  renderToolbar(cx);
  if (!introDone) introDone = true;
}

/* ---------- inspector ---------- */
function renderInsp() {
  const vis = S.cells.slice(0, S.count);
  const id = vis.some((c) => c.id === S.selected) ? S.selected : vis.some((c) => c.id === S.lastSel) ? S.lastSel : null;
  const idx = vis.findIndex((c) => c.id === id),
    el = $('#insp');
  if (idx < 0) {
    el.innerHTML = '';
    return;
  }
  const c = vis[idx],
    m = c.media,
    r = curL.leaves[idx],
    p = curL.px(r),
    motion = !!m && m.kind !== 'image';
  const kind = !m ? 'Empty' : (motion ? 'Motion' : 'Still') + ', ' + (m.kind === 'lottie' ? 'Lottie' : m.ext.toUpperCase());
  let h = `<div class="i-head"><div class="i-top"><div class="i-title">Cell ${idx + 1}<span class="kind" style="background:${motion ? 'rgba(240,83,28,.18)' : 'rgba(17,17,27,.063)'};color:${motion ? '#B8380B' : '#55555F'}">${kind}</span></div><button class="x" data-act="deselect" aria-label="Close">✕</button></div><div class="geo"><span>${Math.round(p.width)}×${Math.round(p.height)}</span><span>col ${r.x + 1}–${r.x + r.w + 1}  row ${r.y + 1}–${r.y + r.h + 1}</span></div></div>`;
  h += `<div class="sec"><div class="sec-h"><span class="sec-t">Media</span></div>`;
  if (!m) h += `<button class="drop-card" data-act="upload">Add media</button>`;
  else {
    h += `<div class="file-row"><span class="nm">${esc(m.name)}</span><button class="sm-btn" data-act="upload">Replace</button><button class="sm-btn" data-act="clearSel">✕</button></div>`;
    h += seg(
      [
        ['cover', 'Cover'],
        ['contain', 'Contain'],
      ],
      c.fit,
      'selFit',
      'sm',
      'Fit'
    );
    if (motion)
      h += `<div class="tog-row"><span class="lbl" style="color:var(--ink)">Loop playback</span>${tog(c.playing, 'selPlay', '', 'Loop playback')}</div>`;
    if (m.kind === 'video' || m.kind === 'lottie') {
      h += `<div class="row" style="margin-top:16px"><span class="lbl">Speed</span><span class="val">${c.speed.toFixed(2)}×</span></div>${slider('speed', 0.5, 2, 0.05, c.speed)}<div class="chips">${[0.5, 1, 1.5, 2].map((v) => `<button class="chip ${Math.abs(c.speed - v) < 0.001 ? 'on' : ''}" data-act="speed" data-arg="${v}" aria-pressed="${Math.abs(c.speed - v) < 0.001}">${v}×</button>`).join('')}</div>`;
    }
    if (m.kind === 'gif')
      h += `<div class="note">A GIF's timing is fixed in the file. You can pause it, but not change its speed.</div>`;
    if (m.kind === 'image')
      h += `<div class="tog-row"><span class="lbl" style="color:var(--ink)">Zoom on hover</span>${tog(c.hoverZoom, 'selZoom', '', 'Zoom on hover')}</div>`;
  }
  h += '</div>';
  h += `<div class="sec"><div class="sec-h"><span class="sec-t">Surface</span><span class="val">${surf(c.bg).label}</span></div><div class="swatches">${K.SURFACES.map((o, i) => `<button data-act="surface" data-arg="${i}" title="${o.label}" aria-label="${o.label} surface" aria-pressed="${c.bg === o.key}" style="background:${o.css};box-shadow:${c.bg === o.key ? `0 0 0 2px #FFFFFF, 0 0 0 4px ${A}` : 'inset 0 0 0 1px rgba(17,17,27,.072)'}"></button>`).join('')}</div></div>`;
  h += `<div class="sec"><div class="sec-h"><span class="sec-t">Text overlay</span></div>`;
  h += [
    ['showTitle', 'title', 'Title', 'Headline'],
    ['showSubtitle', 'subtitle', 'Subtitle', 'Supporting line'],
    ['showBadge', 'badge', 'Badge', 'New'],
  ]
    .map(
      ([f, k, label, ph]) =>
        `<div class="field"><span class="lbl">${label}</span><input type="text" data-field="${k}" aria-label="${label} text" value="${esc(c[k])}" placeholder="${ph}" ${c[f] ? '' : 'disabled'}>${tog(c[f], 'toggleField', f, 'Show ' + label.toLowerCase())}</div>`
    )
    .join('');
  h += `<div style="margin-top:14px">${seg(
    [
      ['tl', 'Top'],
      ['c', 'Center'],
      ['bl', 'Bottom'],
    ],
    c.align,
    'align',
    'sm',
    'Text position'
  )}</div></div>`;
  el.innerHTML = h;
}

/* ---------- export ---------- */
function renderExport() {
  const tabs = [
    ['tailwind', 'Tailwind', 'index.html'],
    ['css', 'CSS Grid', 'bento.html'],
    ['react', 'React', 'BentoGrid.jsx'],
    ['image', 'Image'],
    ['video', 'Video'],
  ];
  if (!S.exportOpen) return;
  const D = device(),
    media = S.exportTab === 'image' || S.exportTab === 'video';
  $('#exTabs').innerHTML = segInner(
    tabs.map((t) => [t[0], t[1]]),
    S.exportTab,
    'exTab'
  );
  $('#exMeta').textContent = `${D.label}, ${D.W}×${D.H}, ${mixText()}`;
  $('#exCode').hidden = media;
  $('#exMedia').hidden = !media;
  $('.ex-btns').style.display = media ? 'none' : '';
  $('#exNote').innerHTML = media
    ? 'Renders the grid exactly as it appears on the canvas, without the device bezel.'
    : 'Media paths point to <code>media/</code>. Canvas and export share the same 24×24 grid.';
  if (media) {
    renderExMedia();
    return;
  }
  const file = tabs.find((t) => t[0] === S.exportTab)[2];
  $('#exCode').textContent = exportCode(S.exportTab, curL, D);
  $('#exDl').textContent = 'Download ' + file;
  $('#exCopy').textContent = S.copied ? 'Copied' : 'Copy code';
}

/* ---------- image / video export ---------- */
const MESH = {
  'g:indigo': ['#6E6BFF', '#B14DFF', '#2B2F8F', '#0E0E1C'],
  'g:ember': ['#FF6A3D', '#FFB23D', '#7A1E0E', '#160A07'],
  'g:mint': ['#2FE3A0', '#1B8F9A', '#0C3B33', '#07120F'],
  'g:dusk': ['#FF7AB6', '#7A5CFF', '#2A1240', '#0D0A14'],
};
const rgba = (h, a) => {
  const n = parseInt(h.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function mediaDims() {
  const D = device(),
    short = S.exRes === '4k' ? 2160 : 1080,
    k = short / Math.min(D.W, D.H),
    ev = (n) => Math.max(2, Math.round(n / 2) * 2);
  return { D, k, w: ev(D.W * k), h: ev(D.H * k) };
}
function pickMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  const list = [
    ['video/mp4;codecs=avc1.640033', 'mp4'],
    ['video/mp4;codecs=avc1.42E01E', 'mp4'],
    ['video/mp4', 'mp4'],
    ['video/webm;codecs=vp9', 'webm'],
    ['video/webm', 'webm'],
  ];
  const f = list.find(([t]) => MediaRecorder.isTypeSupported(t));
  return f ? { type: f[0], ext: f[1] } : null;
}
function rrect(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function paintSurface(ctx, key, x, y, w, h, hasMedia) {
  if (key && key.startsWith('g:')) {
    const m = MESH[key];
    ctx.fillStyle = m[3];
    ctx.fillRect(x, y, w, h);
    [
      [0.18, 0.2, m[0], 0.55],
      [0.88, 0.3, m[1], 0.5],
      [0.55, 1.1, m[2], 0.62],
    ].forEach(([fx, fy, col, stop]) => {
      const cx = x + fx * w,
        cy = y + fy * h;
      const r = Math.max(
        Math.hypot(cx - x, cy - y),
        Math.hypot(cx - x - w, cy - y),
        Math.hypot(cx - x, cy - y - h),
        Math.hypot(cx - x - w, cy - y - h)
      );
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, col);
      g.addColorStop(stop, rgba(col, 0));
      g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
    });
  } else {
    ctx.fillStyle = key ? key.slice(2) : hasMedia ? '#EDEDF0' : '#F0F0F3';
    ctx.fillRect(x, y, w, h);
  }
}
function drawFit(ctx, src, sw, sh, x, y, w, h, fit) {
  if (!sw || !sh) return;
  const s = fit === 'contain' ? Math.min(w / sw, h / sh) : Math.max(w / sw, h / sh),
    dw = sw * s,
    dh = sh * s;
  ctx.drawImage(src, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}
function wrapText(ctx, text, maxW) {
  const lines = [];
  let cur = '';
  String(text)
    .split(/\s+/)
    .forEach((wd) => {
      const t = cur ? cur + ' ' + wd : wd;
      if (ctx.measureText(t).width > maxW && cur) {
        lines.push(cur);
        cur = wd;
      } else cur = t;
    });
  if (cur) lines.push(cur);
  return lines;
}
function drawOverlay(ctx, c, x, y, w, h, light, hasMedia) {
  const sB = c.showBadge && c.badge,
    sT = c.showTitle && c.title,
    sS = c.showSubtitle && c.subtitle;
  if (!(sB || sT || sS)) return;
  if (hasMedia) {
    let g;
    if (c.align === 'tl') {
      g = ctx.createLinearGradient(0, y, 0, y + h * 0.55);
      g.addColorStop(0, 'rgba(0,0,0,.55)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h * 0.55);
    } else if (c.align === 'c') {
      ctx.fillStyle = 'rgba(0,0,0,.3)';
      ctx.fillRect(x, y, w, h);
    } else {
      g = ctx.createLinearGradient(0, y + h, 0, y + h * 0.42);
      g.addColorStop(0, 'rgba(0,0,0,.62)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y + h * 0.42, w, h * 0.58);
    }
  }
  const pad = w < 220 ? 14 : 22,
    ts = Math.round(Math.max(17, Math.min(40, w / 12.5))),
    maxW = w - pad * 2,
    ctr = c.align === 'c';
  const F = 'Geist, system-ui, sans-serif',
    gap = 8,
    ink = light ? '#141417' : '#FFFFFF';
  ctx.textBaseline = 'top';
  const blocks = [];
  if (sB) {
    ctx.font = `500 11px ${F}`;
    blocks.push({ t: 'badge', text: c.badge, w: ctx.measureText(c.badge).width + 20, h: 22 });
  }
  if (sT) {
    ctx.font = `600 ${ts}px ${F}`;
    const lines = wrapText(ctx, c.title, maxW);
    blocks.push({ t: 'title', lines, lh: ts * 1.02, h: lines.length * ts * 1.02 });
  }
  if (sS) {
    ctx.font = `400 13.5px ${F}`;
    const lines = wrapText(ctx, c.subtitle, Math.min(maxW, ctx.measureText('0').width * 34));
    blocks.push({ t: 'sub', lines, lh: 13.5 * 1.35, h: lines.length * 13.5 * 1.35 });
  }
  const total = blocks.reduce((a, b) => a + b.h, 0) + gap * (blocks.length - 1);
  let cy = c.align === 'tl' ? y + pad : ctr ? y + (h - total) / 2 : y + h - pad - total;
  blocks.forEach((b) => {
    if (b.t === 'badge') {
      const bx = ctr ? x + (w - b.w) / 2 : x + pad;
      ctx.fillStyle = light ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.16)';
      rrect(ctx, bx, cy, b.w, b.h, 11);
      ctx.fill();
      ctx.fillStyle = ink;
      ctx.font = `500 11px ${F}`;
      ctx.textAlign = 'left';
      ctx.fillText(b.text, bx + 10, cy + 5);
    } else {
      ctx.fillStyle = ink;
      ctx.globalAlpha = b.t === 'sub' ? 0.8 : 1;
      ctx.font = b.t === 'title' ? `600 ${ts}px ${F}` : `400 13.5px ${F}`;
      ctx.textAlign = ctr ? 'center' : 'left';
      b.lines.forEach((ln, i) => ctx.fillText(ln, ctr ? x + w / 2 : x + pad, cy + i * b.lh));
      ctx.globalAlpha = 1;
    }
    cy += b.h + gap;
  });
  ctx.textAlign = 'left';
}
function makeLotties(k, L) {
  const out = {};
  if (!window.lottie) return out;
  S.cells.slice(0, S.count).forEach((c, i) => {
    if (!c.media || c.media.kind !== 'lottie') return;
    const p = L.px(L.leaves[i]),
      div = document.createElement('div');
    div.style.cssText = `position:fixed;left:-99999px;top:0;width:${Math.ceil(p.width * k)}px;height:${Math.ceil(p.height * k)}px`;
    document.body.appendChild(div);
    const a = lottie.loadAnimation({
      container: div,
      renderer: 'canvas',
      loop: true,
      autoplay: c.playing,
      animationData: c.media.data,
      rendererSettings: { preserveAspectRatio: c.fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet', clearCanvas: true },
    });
    a.setSpeed(c.speed);
    out[c.id] = { a, div };
  });
  return out;
}
const dropLotties = (lot) =>
  Object.values(lot).forEach((o) => {
    o.a.destroy();
    o.div.remove();
  });
function paintFrame(ctx, k, D, L, lot) {
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = S.viewport === 'desktop' || D.social ? '#FFFFFF' : '#F6F6F8';
  ctx.fillRect(0, 0, D.W, D.H);
  S.cells.slice(0, S.count).forEach((c, i) => {
    const p = L.px(L.leaves[i]),
      x = D.padL + p.left,
      y = D.padT + p.top,
      w = p.width,
      h = p.height,
      m = c.media;
    ctx.save();
    rrect(ctx, x, y, w, h, S.radius);
    ctx.clip();
    paintSurface(ctx, c.bg ? c.bg : null, x, y, w, h, !!m);
    const node = cellEls.get(c.id) && $('.media', cellEls.get(c.id)).firstChild;
    try {
      if (m && node && (m.kind === 'image' || m.kind === 'gif'))
        drawFit(ctx, node, node.naturalWidth, node.naturalHeight, x, y, w, h, c.fit);
      else if (m && node && m.kind === 'video') drawFit(ctx, node, node.videoWidth, node.videoHeight, x, y, w, h, c.fit);
      else if (m && m.kind === 'lottie' && lot[c.id]) {
        const cv = lot[c.id].div.querySelector('canvas');
        if (cv) ctx.drawImage(cv, x, y, w, h);
      }
    } catch (e) {}
    drawOverlay(ctx, c, x, y, w, h, !!surf(c.bg).light && !m, !!m);
    ctx.restore();
  });
}
function saveBlob(blob, ext, tag) {
  const slug =
    (S.project || 'bento')
      .trim()
      .replace(/[^\w-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'bento';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${slug}-${tag}.${ext}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function setBusy(txt) {
  S.exBusy = txt;
  const st = $('#exStatus'),
    go = $('#mxGo');
  if (st) st.textContent = txt || '';
  if (go) go.disabled = !!txt;
}
async function exportImage() {
  const { D, k, w, h } = mediaDims();
  setBusy('Rendering…');
  try {
    await (document.fonts && document.fonts.ready);
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const L = layout(D),
      lot = makeLotties(k, L);
    if (Object.keys(lot).length) {
      await sleep(300);
      Object.values(lot).forEach((o) => o.a.goToAndStop(0, true));
      await sleep(60);
    }
    paintFrame(cv.getContext('2d'), k, D, L, lot);
    dropLotties(lot);
    const png = S.exFmt === 'png';
    await new Promise((res) =>
      cv.toBlob(
        (b) => {
          if (b) saveBlob(b, png ? 'png' : 'jpg', S.exRes === '4k' ? '4k' : '1080');
          res();
        },
        png ? 'image/png' : 'image/jpeg',
        0.93
      )
    );
    announce('Image exported');
  } catch (e) {
    setBusy('Could not render this image.');
    return;
  }
  setBusy('');
}
async function exportVideo() {
  const mime = pickMime();
  if (!mime) {
    setBusy('This browser can’t record video.');
    return;
  }
  const { D, k, w, h } = mediaDims(),
    dur = S.exDur * 1000;
  setBusy('Preparing…');
  try {
    await (document.fonts && document.fonts.ready);
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext('2d'),
      L = layout(D),
      lot = makeLotties(k, L);
    paintFrame(ctx, k, D, L, lot);
    const rec = new MediaRecorder(cv.captureStream(30), {
        mimeType: mime.type,
        videoBitsPerSecond: S.exRes === '4k' ? 40e6 : 12e6,
      }),
      chunks = [];
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size) chunks.push(e.data);
    };
    const done = new Promise((res) => {
      rec.onstop = res;
    });
    rec.start(250);
    const t0 = performance.now();
    await new Promise((res) => {
      const tick = () => {
        const t = performance.now() - t0;
        paintFrame(ctx, k, D, L, lot);
        setBusy(`Recording ${Math.min(100, Math.round((t / dur) * 100))}%. Keep this tab visible.`);
        if (t < dur) requestAnimationFrame(tick);
        else res();
      };
      tick();
    });
    rec.stop();
    await done;
    dropLotties(lot);
    saveBlob(new Blob(chunks, { type: mime.type.split(';')[0] }), mime.ext, S.exRes === '4k' ? '4k' : '1080');
    announce('Video exported');
  } catch (e) {
    setBusy('Could not record this video.');
    return;
  }
  setBusy('');
}
function renderExMedia() {
  const { w, h } = mediaDims(),
    vid = S.exportTab === 'video',
    mime = vid ? pickMime() : null;
  const row = (label, body) => `<div class="mx-row"><span class="lbl">${label}</span>${body}</div>`;
  let hh = row(
    'Resolution',
    seg(
      [
        ['1080', '1080'],
        ['4k', '4K'],
      ],
      S.exRes,
      'exRes',
      'sm',
      'Resolution'
    )
  );
  hh += vid
    ? row(
        'Length',
        seg(
          [
            ['5', '5 s'],
            ['10', '10 s'],
            ['15', '15 s'],
          ],
          String(S.exDur),
          'exDur',
          'sm',
          'Length'
        )
      )
    : row(
        'Format',
        seg(
          [
            ['jpeg', 'JPEG'],
            ['png', 'PNG'],
          ],
          S.exFmt,
          'exFmt',
          'sm',
          'Format'
        )
      );
  const fmt = vid
    ? mime
      ? mime.ext === 'mp4'
        ? 'MP4 (H.264), 30 fps'
        : 'WebM, 30 fps (this browser can’t record MP4)'
      : 'Video recording isn’t supported here'
    : S.exFmt === 'png'
      ? 'PNG'
      : 'JPEG';
  hh += `<div class="mx-info"><b>${w}×${h}</b> px · ${fmt}</div>`;
  if (vid)
    hh += `<p class="note">Records the live canvas in real time, so a ${S.exDur} s clip takes ${S.exDur} s${S.exRes === '4k' ? ' and needs a fast machine at 4K' : ''}. Videos and Lottie files loop; GIFs play as they do on the canvas.</p>`;
  hh += `<div class="mx-go"><button class="btn primary" data-act="renderMedia" id="mxGo" ${S.exBusy || (vid && !mime) ? 'disabled' : ''}>${vid ? 'Record ' + (mime ? mime.ext.toUpperCase() : 'video') : 'Export ' + (S.exFmt === 'png' ? 'PNG' : 'JPEG')}</button><span id="exStatus" role="status">${S.exBusy || ''}</span></div>`;
  $('#exMedia').innerHTML = hh;
}
let exT = null,
  exReturn = null;
function openExport() {
  clearTimeout(exT);
  S.exportOpen = true;
  S.copied = false;
  renderExport();
  const ov = $('#exportOverlay'),
    panel = $('#exportPanel'),
    sp = spring(1, 0.34);
  exReturn = document.activeElement;
  $('#canvas').inert = true;
  ov.classList.add('open');
  ov.style.opacity = 0;
  panel.focus({ preventScroll: true });
  panel.style.transition = 'none';
  panel.style.transform = 'scale(.94) translateY(-6px)';
  panel.style.filter = 'blur(6px)';
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      ov.style.opacity = 1;
      panel.style.transition = reduced ? 'opacity .2s' : `transform ${sp.d} ${sp.e}, filter .24s ease`;
      panel.style.transform = 'none';
      panel.style.filter = 'blur(0px)';
    })
  );
}
function closeExport(instant) {
  const ov = $('#exportOverlay'),
    panel = $('#exportPanel');
  clearTimeout(exT);
  ov.style.opacity = 0;
  if (!instant) {
    panel.style.transition = 'transform .28s ease, filter .24s ease';
    panel.style.transform = 'scale(.94) translateY(-6px)';
    panel.style.filter = 'blur(6px)';
  }
  const done = () => {
    S.exportOpen = false;
    ov.classList.remove('open');
    $('#canvas').inert = false;
    if (exReturn && document.contains(exReturn)) exReturn.focus({ preventScroll: true });
    else $('[data-act="export"]').focus();
  };
  if (instant) {
    ov.style.transition = 'none';
    done();
    requestAnimationFrame(() => {
      ov.style.transition = '';
    });
  } else exT = setTimeout(done, 280);
}

/* ---------- actions ---------- */
function clearMedia(id) {
  const c = S.cells.find((x) => x.id === id);
  if (c) {
    c.media = null;
    c.still = null;
    c.playing = true;
  }
}
function pick(id) {
  uploadTarget = id;
  fileEl.value = '';
  fileEl.click();
}
function swap(a, b) {
  S.settle = [a, b];
  clearTimeout(swap.t);
  swap.t = setTimeout(() => {
    S.settle = null;
    renderStage();
  }, 120);
  const cells = S.cells,
    i = cells.findIndex((c) => c.id === a),
    j = cells.findIndex((c) => c.id === b);
  [cells[i], cells[j]] = [cells[j], cells[i]];
}
async function readMedia(file) {
  const name = file.name || 'file',
    ext = (name.split('.').pop() || '').toLowerCase(),
    t = file.type || '';
  if (ext === 'json' || t === 'application/json') {
    try {
      return { kind: 'lottie', data: JSON.parse(await file.text()), name, ext: 'json' };
    } catch (e) {
      return null;
    }
  }
  const url = () => URL.createObjectURL(file);
  if (t.startsWith('video/') || ['mp4', 'webm', 'mov', 'm4v'].includes(ext)) return { kind: 'video', url: url(), name, ext };
  if (t === 'image/gif' || ext === 'gif') return { kind: 'gif', url: url(), name, ext };
  if (t.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'svg', 'avif'].includes(ext))
    return { kind: 'image', url: url(), name, ext };
  return null;
}
async function loadFiles(startId, files) {
  const medias = (await Promise.all(files.map(readMedia))).filter(Boolean);
  if (!medias.length) return;
  const n = S.count,
    cells = S.cells;
  const start = Math.max(
    0,
    cells.findIndex((c) => c.id === startId)
  );
  const targets = [start];
  for (let k = 1; k < n && targets.length < medias.length; k++) {
    const i = (start + k) % n;
    if (!cells[i].media) targets.push(i);
  }
  targets.forEach((i, k) => {
    cells[i] = { ...cells[i], media: medias[k], still: null, playing: true, speed: 1 };
  });
  S.selected = S.lastSel = cells[start].id;
  announce(medias.length === 1 ? 'Media added' : medias.length + ' media files added');
  render();
}
function togglePlay(id) {
  const c = S.cells.find((x) => x.id === id);
  if (!c || !c.media) return;
  let still = c.still;
  if (c.media.kind === 'gif' && c.playing) {
    const img = $('.media img', cellEls.get(id));
    try {
      const cv = document.createElement('canvas');
      cv.width = img.naturalWidth;
      cv.height = img.naturalHeight;
      cv.getContext('2d').drawImage(img, 0, 0);
      still = cv.toDataURL();
    } catch (e) {}
  }
  c.playing = !c.playing;
  c.still = still;
}
function startSplit(sp, e) {
  e.preventDefault();
  e.stopPropagation();
  S.resizing = sp.p;
  renderStage();
  const move = (ev) => {
    const rect = inner.getBoundingClientRect(),
      L = curL;
    const u =
      sp.dir === 'v'
        ? ((ev.clientX - rect.left) / L.scale + L.g / 2) / L.uw - sp.r.x
        : ((ev.clientY - rect.top) / L.scale + L.g / 2) / L.uh - sp.r.y;
    const ratio = Math.max(1, Math.min(sp.size - 1, Math.round(u))) / sp.size;
    if (S.ratios[sp.p] !== ratio) {
      S.ratios[sp.p] = ratio;
      render();
    }
  };
  const up = () => {
    removeEventListener('pointermove', move);
    removeEventListener('pointerup', up);
    S.resizing = null;
    render();
  };
  addEventListener('pointermove', move);
  addEventListener('pointerup', up);
}

const selCell = () => S.cells.find((c) => c.id === S.selected) || S.cells.find((c) => c.id === S.lastSel);
const A_ = {
  shuffle: () => {
    S.seed = 1 + Math.floor(Math.random() * 9998);
    S.ratios = {};
    kick();
    announce('Layout shuffled');
  },
  reset: () => {
    Object.assign(S, controls());
  },
  export: () => openExport(),
  closeExport: () => closeExport(),
  viewport: (a) => {
    S.viewport = a;
    kick();
  },
  aspect: (a) => {
    S.aspect = a;
    kick();
  },
  platform: (a) => {
    S.platform = a;
    if (!K.SOCIAL[a].formats.some((f) => f[0] === S.format)) S.format = K.SOCIAL[a].formats[0][0];
    kick();
  },
  format: (a) => {
    S.format = a;
    kick();
  },
  dec: () => {
    S.count = Math.max(2, S.count - 1);
    S.ratios = {};
    kick();
    announce(S.count + ' cells');
  },
  inc: () => {
    S.count = Math.min(12, S.count + 1);
    S.ratios = {};
    kick();
    announce(S.count + ' cells');
  },
  gapPreset: (a) => {
    S.gap = +a;
    showGuides(true);
    showGuides(false);
  },
  link: () => {
    if (S.padLinked) S.padLinked = false;
    else {
      S.padLinked = true;
      S.padY = S.padX;
    }
  },
  safe: () => {
    S.safeArea = !S.safeArea;
    showGuides(true);
    showGuides(false);
  },
  algo: (a) => {
    S.algo = a;
    S.ratios = {};
    kick();
  },
  even: () => {
    S.ratios = {};
  },
  pin: () => {
    S.pinGuides = !S.pinGuides;
  },
  deselect: () => {
    S.selected = null;
  },
  upload: () => {
    const c = selCell();
    if (c) pick(c.id);
  },
  clearSel: () => {
    const c = selCell();
    if (c) clearMedia(c.id);
  },
  selFit: (a) => {
    selCell().fit = a;
  },
  selPlay: () => togglePlay(selCell().id),
  selZoom: () => {
    const c = selCell();
    c.hoverZoom = !c.hoverZoom;
  },
  speed: (a) => {
    selCell().speed = +a;
  },
  surface: (a) => {
    selCell().bg = K.SURFACES[+a].key;
  },
  toggleField: (a) => {
    const c = selCell();
    c[a] = !c[a];
  },
  align: (a) => {
    selCell().align = a;
  },
  exTab: (a) => {
    S.exportTab = a;
    S.copied = false;
  },
  exRes: (a) => {
    S.exRes = a;
  },
  exFmt: (a) => {
    S.exFmt = a;
  },
  exDur: (a) => {
    S.exDur = +a;
  },
  renderMedia: () => {
    if (S.exBusy) return;
    if (S.exportTab === 'video') exportVideo();
    else exportImage();
  },
  copy: () => {
    const code = $('#exCode').textContent;
    (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject())
      .catch(() => {
        const t = document.createElement('textarea');
        t.value = code;
        document.body.appendChild(t);
        t.select();
        try {
          document.execCommand('copy');
        } catch (e) {}
        t.remove();
      })
      .finally(() => {
        S.copied = true;
        announce('Code copied');
        renderExport();
        setTimeout(() => {
          S.copied = false;
          renderExport();
        }, 1600);
      });
  },
  download: () => {
    const file = { tailwind: 'index.html', css: 'bento.html', react: 'BentoGrid.jsx' }[S.exportTab];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([$('#exCode').textContent], { type: 'text/plain' }));
    a.download = file;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
};

function render() {
  const sig = focusSig(document.activeElement);
  renderStage();
  renderTop();
  renderLeft();
  renderInsp();
  renderExport();
  if (sig) {
    const t = $(sig.root + ' ' + sig.sel);
    if (t && t !== document.activeElement) t.focus({ preventScroll: true });
  }
}

/* ---------- events ---------- */
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b || b.closest('.cell')) return;
  const fn = A_[b.dataset.act];
  if (fn) {
    fn(b.dataset.arg);
    render();
  }
});
$('#canvas').addEventListener('click', (e) => {
  if (e.target.closest('.cell,.panel,#topbar,#toolbar')) return;
  if (S.selected) {
    S.selected = null;
    render();
  }
});
$('#project').addEventListener('input', (e) => {
  S.project = e.target.value;
  if (S.exportOpen) renderExport();
});
$('#exportOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'exportOverlay') closeExport();
});
$('#insp').addEventListener('input', (e) => {
  const k = e.target.dataset.field;
  if (!k) return;
  const c = selCell();
  c[k] = e.target.value;
  renderStage();
  renderExport();
});
fileEl.addEventListener('change', (e) => {
  const f = Array.from(e.target.files || []);
  if (f.length && uploadTarget) loadFiles(uploadTarget, f);
});
$('#canvas').addEventListener('dragover', (e) => {
  e.preventDefault();
  if (S.dropId) {
    S.dropId = null;
    renderStage();
  }
});
$('#canvas').addEventListener('drop', (e) => {
  e.preventDefault();
  S.dropId = null;
  S.dragId = null;
  const files = Array.from(e.dataTransfer.files || []);
  if (files.length) {
    const t = S.cells.slice(0, S.count).find((c) => !c.media) || S.cells[0];
    loadFiles(t.id, files);
  } else render();
});
stage.addEventListener('mouseenter', () => {
  S.stageHover = true;
  renderStage();
});
stage.addEventListener('mouseleave', () => {
  S.stageHover = false;
  S.hovered = null;
  renderStage();
});
addEventListener('resize', render);
addEventListener('keydown', (e) => {
  const tag = (e.target.tagName || '').toLowerCase();
  if (e.key === 'Escape') {
    if (S.exportOpen) closeExport(true);
    else {
      S.selected = null;
      render();
    }
    return;
  }
  if (S.exportOpen && e.key === 'Tab') {
    const f = [...$('#exportPanel').querySelectorAll('button,[tabindex]:not([tabindex="-1"])')].filter((x) => !x.disabled);
    if (!f.length) return;
    const first = f[0],
      last = f[f.length - 1],
      a = document.activeElement;
    if (e.shiftKey && (a === first || a === $('#exportPanel'))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && a === last) {
      e.preventDefault();
      first.focus();
    }
    return;
  }
  const t = e.target;
  // slider keys
  const sl = t.closest && t.closest('[data-slider]');
  if (sl && sliderDefs[sl.dataset.slider]) {
    const min = +sl.dataset.min,
      max = +sl.dataset.max,
      step = +sl.dataset.step,
      v = +sl.getAttribute('aria-valuenow');
    const big = Math.max(step, (max - min) / 10);
    const next = {
      ArrowRight: v + step,
      ArrowUp: v + step,
      ArrowLeft: v - step,
      ArrowDown: v - step,
      PageUp: v + big,
      PageDown: v - big,
      Home: min,
      End: max,
    }[e.key];
    if (next != null) {
      e.preventDefault();
      sliderDefs[sl.dataset.slider].set(+Math.max(min, Math.min(max, next)).toFixed(2));
      if (sl.dataset.slider === 'count') announce(S.count + ' cells');
      render();
      return;
    }
  }
  // seam keys
  if (t.classList && t.classList.contains('handle')) {
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    const sp = curL.splits.find((q) => q.p === t.dataset.p);
    if (d && sp) {
      e.preventDefault();
      S.ratios[sp.p] = Math.max(1, Math.min(sp.size - 1, sp.cut + d)) / sp.size;
      render();
      return;
    }
  }
  const onCell = t.classList && t.classList.contains('cell');
  if ((e.key === 'Delete' || (e.key === 'Backspace' && (onCell || t === document.body))) && tag !== 'input' && S.selected) {
    clearMedia(S.selected);
    announce('Media removed');
    render();
  }
});

// sliders: window-level drag so panel re-renders never break the gesture
addEventListener('pointerdown', (e) => {
  const sl = e.target.closest('[data-slider]');
  if (!sl) return;
  const key = sl.dataset.slider,
    def = sliderDefs[key];
  if (!def) return;
  e.preventDefault();
  S.activeSlider = key;
  if (def.guide) showGuides(true);
  const apply = (ev) => {
    const el = $(`[data-slider="${key}"]`);
    if (!el) return;
    const min = +el.dataset.min,
      max = +el.dataset.max,
      step = +el.dataset.step,
      r = el.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
    def.set(+(Math.round((min + t * (max - min)) / step) * step).toFixed(2));
    render();
  };
  const up = () => {
    removeEventListener('pointermove', apply);
    removeEventListener('pointerup', up);
    S.activeSlider = null;
    if (def.guide) showGuides(false);
    render();
  };
  addEventListener('pointermove', apply);
  addEventListener('pointerup', up);
  apply(e);
});

$('#project').value = S.project;
render();
