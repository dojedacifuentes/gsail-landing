#!/usr/bin/env node
/*
 * Genera las páginas estáticas del sitio desde content.json. Sin dependencias (Node 16+).
 *
 *   node tools/embed-content.js
 *
 * Escribe:
 *   index.html      → versión en español (raíz «/»)
 *   en/index.html   → versión en inglés («/en/»)
 *   robots.txt, sitemap.xml
 * Cada página lleva su <head> completo (title, description, canonical, hreflang, Open Graph, JSON-LD),
 * el HTML pre-renderizado y solo el contenido de su idioma incrustado para main.js.
 * No es un paso de build para Vercel: los archivos generados se publican tal cual.
 *
 * DOMINIO: cambiar SITE (abajo) cuando se fije el dominio definitivo y volver a ejecutar este script.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const SITE = 'https://gsail.vercel.app/'; // dominio canónico (marcador, con / final)

const root = path.resolve(__dirname, '..');
const C = JSON.parse(fs.readFileSync(path.join(root, 'content.json'), 'utf8'));
const R = require(path.join(root, 'main.js'));
const esc = R.esc;
const safe = (s) => s.replace(/<\//g, '<\\/').replace(/<!--/g, '<\\!--');
const FONTS = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Serif:ital,wght@0,400;0,500;1,400&display=swap';

const PAGES = [
  { lang: 'es', dir: '', base: '', url: SITE, locale: 'es_CL' },
  { lang: 'en', dir: 'en', base: '../', url: SITE + 'en/', locale: 'en_US' }
];

function page(p) {
  const L = C[p.lang];
  const other = PAGES.find((x) => x.lang !== p.lang);
  const runtime = { links: C.links, assets: C.assets };
  runtime[p.lang] = L;
  const og = SITE + C.assets.og;
  const b = p.base;
  return `<!doctype html>
<html lang="${p.lang}" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(L.meta.title)}</title>
  <meta name="description" content="${esc(L.meta.description)}">
  <meta name="theme-color" content="#0B1B34">
  <meta name="color-scheme" content="light">

  <!-- Archivo generado por tools/embed-content.js desde content.json: no editar a mano. -->
  <link rel="canonical" href="${p.url}">
  <link rel="alternate" hreflang="es" href="${SITE}">
  <link rel="alternate" hreflang="en" href="${SITE}en/">
  <link rel="alternate" hreflang="x-default" href="${SITE}">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="GSAIL · Global South Alliance on AI and Law">
  <meta property="og:title" content="${esc(L.meta.title)}">
  <meta property="og:description" content="${esc(L.meta.description)}">
  <meta property="og:url" content="${p.url}">
  <meta property="og:image" content="${og}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(L.meta.ogAlt)}">
  <meta property="og:locale" content="${p.locale}">
  <meta property="og:locale:alternate" content="${other.locale}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(L.meta.title)}">
  <meta name="twitter:description" content="${esc(L.meta.description)}">
  <meta name="twitter:image" content="${og}">
  <meta name="twitter:image:alt" content="${esc(L.meta.ogAlt)}">

  <link rel="icon" href="${b}assets/icons/favicon.ico" sizes="16x16 32x32 48x48">
  <link rel="icon" type="image/png" href="${b}assets/icons/icon-512.png" sizes="512x512">
  <link rel="apple-touch-icon" href="${b}assets/icons/apple-touch-icon.png">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="${FONTS}">
  <link rel="stylesheet" href="${b}styles.css">
  <script>document.documentElement.className += ' js';</script>

  <script type="application/ld+json">
${safe(R.jsonLd(C, SITE, p.lang))}
  </script>
</head>
<body>
  <div id="app" data-lang="${p.lang}" data-base="${b}">${R.renderApp(C, p.lang, b)}</div>
  <script type="application/json" id="gsail-content">${safe(JSON.stringify(runtime))}</script>
  <script src="${b}main.js" defer></script>
</body>
</html>
`;
}

for (const p of PAGES) {
  const dir = path.join(root, p.dir);
  fs.mkdirSync(dir, { recursive: true });
  const html = page(p);
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log((p.dir ? p.dir + '/' : '') + 'index.html (' + Math.round(Buffer.byteLength(html) / 1024) + ' KB)');
}

fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`);
const alt = `    <xhtml:link rel="alternate" hreflang="es" href="${SITE}"/>\n    <xhtml:link rel="alternate" hreflang="en" href="${SITE}en/"/>\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}"/>\n`;
fs.writeFileSync(path.join(root, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
  PAGES.map((p) => `  <url>\n    <loc>${p.url}</loc>\n${alt}  </url>\n`).join('') + `</urlset>\n`);
console.log('robots.txt, sitemap.xml (' + SITE + ')');
