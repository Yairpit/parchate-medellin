// Vista previa al compartir: WhatsApp/Facebook/Telegram no ejecutan JavaScript,
// así que aquí se arman las etiquetas Open Graph de cada parche o evento
// y se devuelve la misma app (index.html) con esas etiquetas puestas.
const SB_URL = 'https://ofqdizboaexkjjhwtmgs.supabase.co';
const SB_KEY = 'sb_publishable_pfLexW8EDmF9-_SRjaiKWQ_y16Yar5f';

const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const STR = `'((?:[^'\\\\]|\\\\.)*)'|"((?:[^"\\\\]|\\\\.)*)"`;
const unq = (single, double) => {
  if (double !== undefined) { try { return JSON.parse('"' + double + '"'); } catch (e) { return double; } }
  return single.replace(/\\u([0-9a-fA-F]{4})/g, (m, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\'/g, "'").replace(/\\\\/g, '\\');
};

// Busca un evento oficial dentro del propio index.html (líneas E('...') y PL('...'))
function findEvent(html, id) {
  const short = id.replace(/^ev-/, '');
  for (const line of html.split('\n')) {
    const m = line.match(/^\s*\[?\s*(E|PL)\(/);
    if (!m) continue;
    const args = [...line.matchAll(new RegExp(STR, 'g'))].map(x => unq(x[1], x[2]));
    if (args.length < 6) continue;
    const lid = args[0];
    if (lid !== short && lid !== id) continue;
    const when = args[args.length - 1];
    return { title: args[1], zone: args[2], when, tag: args[3], emoji: args[4], official: true, local: true };
  }
  return null;
}

async function findParche(id) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/parches?id=eq.${id}&select=title,zone,img,tag,fuegos&limit=1`, {
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }
    });
    const j = await r.json();
    return j && j[0] ? { title: j[0].title, zone: j[0].zone, img: j[0].img || '', tag: j[0].tag || '', fuegos: j[0].fuegos || 0 } : null;
  } catch (e) { return null; }
}

module.exports = async (req, res) => {
  const origin = 'https://' + (req.headers['x-forwarded-host'] || req.headers.host);
  const id = String((req.query && req.query.parche) || '');
  const valid = /^[0-9a-f-]{36}$/i.test(id) || /^ev-[a-z0-9-]{3,40}$/i.test(id);

  let html = '';
  try { html = await (await fetch(origin + '/index.html')).text(); } catch (e) {}
  if (!html) { res.statusCode = 302; res.setHeader('Location', '/index.html' + (id ? '?parche=' + encodeURIComponent(id) : '')); return res.end(); }

  let info = null;
  if (valid) info = /^ev-/i.test(id) ? findEvent(html, id) : await findParche(id);

  const title = info ? info.title : 'Párchate - MDE (Radar & Parches)';
  const desc = info
    ? [info.when, info.zone].filter(Boolean).join(' · ') + ' · Mira el plan en Párchate 🔥'
    : 'Descubre eventos, planes y grupos en Medellín.';
  let image = origin + '/img/share-banner.png';
  if (info) {
    let photo = info.img && /^https:\/\//.test(info.img) ? info.img : '';
    if (!photo && /^ev-/i.test(id)) { // foto local del evento: img/ev-xxx.jpg (si existe)
      try { const f = await fetch(origin + '/img/' + id + '.jpg', { method: 'HEAD' }); if (f.ok) photo = origin + '/img/' + id + '.jpg'; } catch (e) {}
    }
    const q = new URLSearchParams({ t: info.title || '', z: info.zone || '', w: info.when || '', g: info.tag || '', e: info.emoji || '', n: String(info.fuegos || 0), o: info.official ? '1' : '0', v: '1' });
    if (photo) q.set('i', photo);
    image = origin + '/api/og?' + q.toString();
  }
  const url = origin + '/?parche=' + encodeURIComponent(id);

  const tags = [
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Párchate Medellín">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:image" content="${esc(image)}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(desc)}">`,
    `<meta name="twitter:image" content="${esc(image)}">`
  ].join('\n');

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>\n${tags}`);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
  res.status(200).send(html);
};
