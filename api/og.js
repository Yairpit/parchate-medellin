// Genera la imagen (1200x630) que sale en WhatsApp: una miniatura de la tarjeta del parche.
// Se llama desde api/share.js con los datos en la URL: /api/og?t=Titulo&z=Zona&w=Fecha&g=Tag&e=🔥&n=12&i=https://foto&o=1
import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

const PIN = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path fill="#f9a8d4" fill-opacity=".35" d="M32 4C21 4 12 13 12 24c0 15 20 36 20 36s20-21 20-36C52 13 43 4 32 4z"/><circle cx="32" cy="24" r="8" fill="#1a1230"/></svg>');
const h = (type, style, children, extra) => ({ type, props: Object.assign({ style: Object.assign({ display: 'flex' }, style), children }, extra || {}) });
const cut = (s, n) => { s = String(s || '').trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };

function card(d) {
  const promo = /DESTACADO|PROMO/i.test(d.tag);
  const chip = (txt, bg, color, border) => h('div', { background: bg, color, border: '2px solid ' + border, borderRadius: 14, padding: '4px 14px', fontSize: 22, fontWeight: 700, marginRight: 10 }, txt);

  const chips = [];
  if (d.official) chips.push(chip('✅ PÁRCHATE', 'rgba(16,185,129,.2)', '#6ee7b7', 'rgba(16,185,129,.5)'));
  chips.push(promo ? chip(cut(d.tag, 22).toUpperCase(), 'rgba(251,191,36,.2)', '#fcd34d', 'rgba(251,191,36,.6)')
                   : chip(cut(d.tag || 'PARCHE', 22).toUpperCase(), 'rgba(168,85,247,.2)', '#d8b4fe', 'rgba(168,85,247,.5)'));
  if (d.n > 0) chips.push(h('div', { background: '#2d234a', color: '#fb923c', border: '2px solid #4c3a7a', borderRadius: 14, padding: '4px 14px', fontSize: 22, fontWeight: 700 }, '🔥 ' + d.n));

  const info = [
    h('div', { marginBottom: 18 }, chips),
    h('div', { fontSize: 50, fontWeight: 800, color: '#fff', lineHeight: 1.12, marginBottom: 16 }, cut(d.t, 70)),
    h('div', { fontSize: 27, color: '#9ca3af', marginBottom: 10 }, '📍 ' + cut(d.z || 'Medellín', 42))
  ];
  if (d.w) info.push(h('div', { fontSize: 27, fontWeight: 700, color: '#7dd3fc', marginBottom: 10 }, '🗓 ' + cut(d.w, 44)));

  const buttons = h('div', { marginTop: 'auto', background: 'linear-gradient(90deg,#16a34a,#059669)', borderRadius: 16, padding: '14px 0', alignItems: 'center', justifyContent: 'center', marginRight: 10 }, [
    h('div', { fontSize: 28, fontWeight: 700, color: '#fff' }, '▶ Descárgala en Google Play')
  ]);

  const photo = d.i
    ? h('div', { width: 440, height: 480, borderRadius: 24, overflow: 'hidden', border: '2px solid #3b2d63' }, [
        { type: 'img', props: { src: d.i, width: 440, height: 480, style: { objectFit: 'cover', width: 440, height: 480 } } }])
    : h('div', { width: 440, height: 480, borderRadius: 24, border: '2px solid #3b2d63', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#3b2d63,#1a1230)' }, [
        { type: 'img', props: { src: PIN, width: 170, height: 170 } }]);

  return h('div', { width: 1200, height: 630, background: '#120c22', padding: 26 }, [
    h('div', { flex: 1, background: '#1f1635', border: promo ? '4px solid #fbbf24' : '3px solid #3b2d63', borderRadius: 32, padding: 28 }, [
      h('div', { flexDirection: 'column', flex: 1, paddingRight: 28 }, info.concat([buttons])),
      photo
    ])
  ]);
}

const b64 = buf => { let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };

// Descarga la foto y solo la usa si es JPEG/PNG/GIF y pesa menos de 2 MB (WebP u otros fallan en el generador)
async function loadPhoto(url) {
  if (!/^https:\/\//.test(url || '')) return '';
  try {
    const r = await fetch(url);
    if (!r.ok) return '';
    const buf = await r.arrayBuffer();
    if (buf.byteLength > 2e6) return '';
    const u = new Uint8Array(buf.slice(0, 4));
    const mime = u[0] === 0xFF && u[1] === 0xD8 ? 'image/jpeg' : u[0] === 0x89 && u[1] === 0x50 ? 'image/png' : u[0] === 0x47 && u[1] === 0x49 ? 'image/gif' : '';
    return mime ? 'data:' + mime + ';base64,' + b64(buf) : '';
  } catch (e) { return ''; }
}

export default async function handler(req) {
  const q = new URL(req.url).searchParams;
  const d = {
    t: q.get('t') || 'Párchate Medellín', z: q.get('z') || '', w: q.get('w') || '', tag: q.get('g') || '',
    e: (q.get('e') || '').slice(0, 8), n: Math.max(0, parseInt(q.get('n')) || 0),
    i: await loadPhoto(q.get('i')), official: q.get('o') === '1'
  };
  return new ImageResponse(card(d), { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
}
