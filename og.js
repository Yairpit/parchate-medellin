// Genera la imagen (1200x630) que sale en WhatsApp: una miniatura de la tarjeta del parche.
// Se llama desde api/share.js con los datos en la URL: /api/og?t=Titulo&z=Zona&w=Fecha&g=Tag&e=🔥&n=12&i=https://foto&o=1
import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

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

  const btn = (txt, bg, flex) => h('div', { background: bg, color: '#fff', fontSize: 24, fontWeight: 700, borderRadius: 14, padding: '12px 0', justifyContent: 'center', flex: flex || 1, marginRight: 10 }, txt);
  const buttons = h('div', { marginTop: 'auto' }, [
    btn('🔥 A fuego', '#ea7a0c', 1.35), btn('💬 Opino', '#2d234a'), btn('🔄 x2', '#2d234a')
  ]);

  const photo = d.i
    ? h('div', { width: 440, height: 480, borderRadius: 24, overflow: 'hidden', border: '2px solid #3b2d63' }, [
        { type: 'img', props: { src: d.i, width: 440, height: 480, style: { objectFit: 'cover', width: 440, height: 480 } } }])
    : h('div', { width: 440, height: 480, borderRadius: 24, border: '2px solid #3b2d63', alignItems: 'center', justifyContent: 'center', fontSize: 190,
        background: 'linear-gradient(135deg,#581c87,#86198f,#9d174d)' }, d.e || '🎉');

  return h('div', { width: 1200, height: 630, background: '#120c22', padding: 26 }, [
    h('div', { flex: 1, background: '#1f1635', border: promo ? '4px solid #fbbf24' : '3px solid #3b2d63', borderRadius: 32, padding: 28 }, [
      h('div', { flexDirection: 'column', flex: 1, paddingRight: 28 }, info.concat([buttons])),
      photo
    ])
  ]);
}

export default function handler(req) {
  const q = new URL(req.url).searchParams;
  const d = {
    t: q.get('t') || 'Párchate Medellín', z: q.get('z') || '', w: q.get('w') || '', tag: q.get('g') || '',
    e: (q.get('e') || '').slice(0, 8), n: Math.max(0, parseInt(q.get('n')) || 0),
    i: /^https:\/\//.test(q.get('i') || '') ? q.get('i') : '', official: q.get('o') === '1'
  };
  return new ImageResponse(card(d), { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
}
