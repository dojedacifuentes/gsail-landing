/*!
 * GSAIL · Global South Alliance on AI and Law
 * Renderizador + comportamiento del sitio. JavaScript vanilla, sin dependencias.
 *
 * - Todo el texto sale de content.json; cada página (index.html, en/index.html) lleva incrustado su idioma en
 *   <script type="application/json" id="gsail-content"> (funciona también con file://).
 * - Las mismas funciones de render se usan en Node (tools/embed-content.js) para
 *   pre-renderizar index.html (ES) y en/index.html (EN): SEO, vista previa al compartir y sin-JS.
 */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------------ utils */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function sub(tpl, id) { return tpl.replace('{id}', id).replace('{iso}', id); }

  var ICONS = {
    linkedin: '<svg class="icon icon--li" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" fill-rule="evenodd" d="M5 2h14a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3zM6.1 9.8h2.6V18H6.1zM9 6.9a1.6 1.6 0 1 1-3.2 0 1.6 1.6 0 0 1 3.2 0zM10.7 9.8h2.5v1.15c.5-.8 1.5-1.35 2.8-1.35 2.2 0 3.15 1.4 3.15 3.65V18h-2.6v-4.2c0-1.15-.4-1.85-1.45-1.85-1.05 0-1.8.75-1.8 1.95V18h-2.6z"/></svg>',
    arrow: '<svg class="icon" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false"><path d="M4 10h11M11 5.5 15.5 10 11 14.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    down: '<svg class="icon" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false"><path d="M10 4v11M5.5 11 10 15.5 14.5 11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    external: '<svg class="icon" viewBox="0 0 20 20" width="14" height="14" aria-hidden="true" focusable="false"><path d="M8 4H4.5A.5.5 0 0 0 4 4.5v11a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V12M11 4h5v5M16 4l-7 7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    play: '<svg class="icon" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false"><rect x="1.5" y="4" width="17" height="12" rx="3.2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8.3 7.4v5.2l4.4-2.6z" fill="currentColor"/></svg>',
    pin: '<svg class="icon" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false"><path d="M10 18s5.5-5.2 5.5-9.4a5.5 5.5 0 1 0-11 0C4.5 12.8 10 18 10 18z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="8.6" r="2" fill="currentColor"/></svg>',
    close: '<svg class="icon" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false"><path d="M5 5l10 10M15 5 5 15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    prev: '<svg class="icon" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false"><path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    next: '<svg class="icon" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false"><path d="M7.5 4.5 13 10l-5.5 5.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    menu: '<svg class="icon" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false"><path d="M3 6h14M3 10h14M3 14h14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'
  };

  /* Prefijo de rutas de assets: '' en la portada, '../' en /en/ */
  var BASE = '';
  function u(p) { return /^(https?:)?\/\//.test(p) ? p : BASE + p; }

  /* Retrato: <picture> webp con jpg de respaldo, en 160/240/400 px (originales aprobados de 400 px) */
  function variant(path, w) { return w === 400 ? path : path.replace(/(\.\w+)$/, '-' + w + '$1'); }
  function srcset(path, sizes) {
    return sizes.map(function (w) { return esc(u(variant(path, w))) + ' ' + w + 'w'; }).join(', ');
  }
  function portrait(C, id, sizesAttr, alt, opts) {
    opts = opts || {};
    var webp = sub(C.assets.portraitWebp, id), jpg = sub(C.assets.portrait, id);
    var ws = C.assets.portraitSizes || [400];
    return '<picture class="portrait' + (opts.cls ? ' ' + opts.cls : '') + '">' +
      '<source type="image/webp" srcset="' + srcset(webp, ws) + '" sizes="' + sizesAttr + '">' +
      '<img src="' + esc(u(variant(jpg, 240))) + '" srcset="' + srcset(jpg, ws) + '" sizes="' + sizesAttr + '" width="400" height="400" alt="' + esc(alt) + '"' +
      (opts.eager ? '' : ' loading="lazy"') + ' decoding="async">' +
      '</picture>';
  }

  function flag(C, iso) {
    return '<img class="flag" src="' + esc(u(sub(C.assets.flag, iso))) + '" width="24" height="16" alt="" loading="lazy" decoding="async">';
  }

  /* Logo: <picture> webp si existe (todos menos lmilab) */
  var LOGO_SIZE = {
    'gsail-blanco': [311, 240], 'gsail-color': [311, 240], 'diat-blanco': [496, 180],
    'derecho-pucv-blanco': [552, 240], 'dgai-blanco': [804, 240], 'centenario-blanco': [554, 240],
    'lmilab-blanco': [194, 70], 'lmilab-color': [194, 70]
  };
  var LOGO_NO_WEBP = { 'lmilab-blanco': 1, 'lmilab-color': 1 };
  function logo(src, alt, cls, eager) {
    var key = src.replace(/^.*\//, '').replace(/\.\w+$/, '');
    var wh = LOGO_SIZE[key] || [300, 120];
    var img = '<img src="' + esc(u(src)) + '" width="' + wh[0] + '" height="' + wh[1] + '" alt="' + esc(alt) + '"' +
      (eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async">';
    if (LOGO_NO_WEBP[key]) return '<span class="logo ' + (cls || '') + ' logo--' + key + '">' + img + '</span>';
    return '<picture class="logo ' + (cls || '') + ' logo--' + key + '"><source type="image/webp" srcset="' +
      esc(u(src.replace(/\.png$/, '.webp'))) + '">' + img + '</picture>';
  }

  /* Encabezado de sección: kicker sobre la «línea del ecuador» */
  function sectionHead(n, kicker, title, id, light) {
    return '<header class="shead' + (light ? ' shead--light' : '') + '">' +
      '<p class="eq"><span class="eq__n">' + esc(n) + '</span>' +
      '<span class="eq__label">' + esc(kicker) + '</span><span class="eq__line" aria-hidden="true"></span>' +
      '<span class="eq__node" aria-hidden="true"></span></p>' +
      '<h2 class="shead__title" id="' + id + '-title">' + esc(title) + '</h2></header>';
  }

  /* Globo: meridianos/paralelos, hemisferio sur resaltado */
  function globe() {
    var cx = 260, cy = 260, r = 220, i, s = [];
    var deg = Math.PI / 180;
    s.push('<svg class="globe" viewBox="0 0 520 520" width="520" height="520" role="img" aria-hidden="true" focusable="false">');
    s.push('<defs>' +
      '<radialGradient id="g-shade" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="#16305a"/><stop offset=".65" stop-color="#0d2142"/><stop offset="1" stop-color="#091833"/></radialGradient>' +
      '<linearGradient id="g-south" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2F78D0" stop-opacity=".55"/><stop offset="1" stop-color="#1E5BA8" stop-opacity=".9"/></linearGradient>' +
      '<clipPath id="g-clip"><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '"/></clipPath>' +
      '<clipPath id="g-clip-s"><rect x="0" y="' + cy + '" width="520" height="260"/></clipPath>' +
      '</defs>');
    s.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="url(#g-shade)"/>');
    // hemisferio sur
    s.push('<g clip-path="url(#g-clip-s)"><circle class="globe__south" cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="url(#g-south)"/></g>');
    // retícula
    var north = [], south = [];
    for (i = 15; i < 90; i += 15) {
      var y = r * Math.sin(i * deg), w = r * Math.cos(i * deg);
      north.push('<line x1="' + (cx - w).toFixed(1) + '" y1="' + (cy - y).toFixed(1) + '" x2="' + (cx + w).toFixed(1) + '" y2="' + (cy - y).toFixed(1) + '"/>');
      south.push('<line x1="' + (cx - w).toFixed(1) + '" y1="' + (cy + y).toFixed(1) + '" x2="' + (cx + w).toFixed(1) + '" y2="' + (cy + y).toFixed(1) + '"/>');
    }
    var mer = ['<line x1="' + cx + '" y1="' + (cy - r) + '" x2="' + cx + '" y2="' + (cy + r) + '"/>'];
    for (i = 20; i < 90; i += 20) {
      var rx = (r * Math.sin(i * deg)).toFixed(1);
      mer.push('<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + r + '"/>');
    }
    s.push('<g class="globe__grid" clip-path="url(#g-clip)" fill="none">' +
      '<g class="globe__grid-n">' + north.join('') + mer.join('') + '</g>' +
      '<g class="globe__grid-s" clip-path="url(#g-clip-s)">' + south.join('') + mer.join('') + '</g></g>');
    // red de nodos en el hemisferio sur (eco del cuenco del logo)
    var pts = [[150, 300], [210, 352], [282, 318], [352, 366], [404, 302], [238, 420], [322, 440], [120, 360], [186, 456]];
    var links = [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [5, 6], [6, 3], [0, 7], [7, 5], [5, 8], [2, 6]];
    s.push('<g class="globe__net">' + links.map(function (l) {
      return '<line x1="' + pts[l[0]][0] + '" y1="' + pts[l[0]][1] + '" x2="' + pts[l[1]][0] + '" y2="' + pts[l[1]][1] + '"/>';
    }).join('') + pts.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.2"/>'; }).join('') + '</g>');
    s.push('<circle class="globe__rim" cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none"/>');
    s.push('<line class="globe__equator" x1="' + (cx - r) + '" y1="' + cy + '" x2="' + (cx + r) + '" y2="' + cy + '"/>');
    s.push('</svg>');
    return s.join('');
  }

  /* ------------------------------------------------------------- secciones */
  function renderHeader(C, L) {
    var ui = L.ui;
    var nav = L.nav.map(function (n) {
      return '<li><a href="#' + esc(n.id) + '" data-nav="' + esc(n.id) + '">' + esc(n.label) + '</a></li>';
    }).join('');
    return '<header class="site-header" id="top">' +
      '<div class="wrap site-header__inner">' +
      '<a class="brand" href="#inicio" aria-label="' + esc(ui.home) + '">' + logo(C.assets.logoWhite, 'GSAIL', 'brand__logo', true) +
      '<span class="brand__text" aria-hidden="true">Global South Alliance<br>on AI and Law</span></a>' +
      '<nav class="site-nav" id="site-nav" aria-label="' + esc(ui.mainNav) + '"><ul>' + nav + '</ul></nav>' +
      '<div class="site-header__tools">' +
      '<div class="lang" role="group" aria-label="' + esc(ui.langGroup) + '">' +
      ['es', 'en'].map(function (code) {
        var on = code === L.lang.code;
        var name = on ? L.lang.name : L.lang.otherName;
        var href = on ? '#inicio' : (code === 'en' ? BASE + 'en/' : (BASE || './'));
        return '<a class="lang__btn" href="' + href + '" hreflang="' + code + '"' + (on ? ' aria-current="true"' : ' data-lang-link') + '>' +
          '<span aria-hidden="true">' + code.toUpperCase() + '</span><span class="sr-only" lang="' + code + '">' + esc(name) + '</span></a>';
      }).join('') +
      '</div>' +
      '<button type="button" class="menu-btn" aria-expanded="false" aria-controls="site-nav" data-open="' + esc(ui.menuOpen) + '" data-close="' + esc(ui.menuClose) + '">' +
      ICONS.menu + '<span class="menu-btn__label">' + esc(ui.menu) + '</span></button>' +
      '</div></div>' +
      '</header>';
  }

  function renderHero(C, L) {
    var h = L.hero;
    var sub = esc(h.subtitle);
    if (h.subtitleEmphasis) sub = sub.replace(esc(h.subtitleEmphasis), '<em>' + esc(h.subtitleEmphasis) + '</em>');
    return '<section class="hero" id="inicio" aria-labelledby="hero-title">' +
      '<div class="wrap hero__north">' +
      logo(C.assets.logoWhite, 'GSAIL', 'hero__logo', true) +
      '<p class="hero__kicker">' + esc(h.kicker) + '</p>' +
      '<h1 class="hero__title" id="hero-title">' + esc(h.title) + '</h1>' +
      '</div>' +
      '<div class="hero__equator" aria-hidden="true"><span class="hero__deg">0°&thinsp;00′</span><div class="hero__globe">' + globe() + '</div></div>' +
      '<div class="wrap hero__south">' +
      '<p class="hero__subtitle">' + sub + '</p>' +
      '<p class="hero__lead">' + esc(h.lead) + '</p>' +
      '<div class="hero__ctas">' +
      '<a class="btn btn--primary" href="' + esc(h.ctaPrimaryHref) + '">' + esc(h.ctaPrimary) + ICONS.down + '</a>' +
      '<a class="btn btn--ghost" href="' + esc(h.ctaSecondaryHref) + '">' + esc(h.ctaSecondary) + ICONS.arrow + '</a>' +
      '</div></div></section>';
  }

  function renderAbout(C, L) {
    var a = L.about;
    return '<section class="section section--ivory" id="alianza" aria-labelledby="alianza-title">' +
      '<div class="wrap">' + sectionHead('01', a.kicker, a.title, 'alianza') +
      '<div class="about">' +
      '<p class="about__lead" data-reveal>' + esc(a.lead) + '</p>' +
      '<div class="about__body" data-reveal>' + a.body.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>' +
      '</div>' +
      '<figure class="quote" data-reveal><blockquote><p>' + esc(a.quote.text) + '</p></blockquote>' +
      '<figcaption>' + esc(a.quote.attribution) + '</figcaption></figure>' +
      '</div></section>';
  }

  function renderMembers(C, L) {
    var m = L.members;
    var cards = m.items.map(function (p, i) {
      var mid = 'm-' + esc(p.id);
      return '<li class="members__item" data-reveal style="--i:' + (i % 3) + '">' +
        '<a class="member" id="miembro-' + esc(p.id) + '" href="#miembro-' + esc(p.id) + '" data-member="' + esc(p.id) + '" aria-haspopup="dialog"' +
        ' aria-labelledby="' + mid + '-name" aria-describedby="' + mid + '-desc">' +
        '<span class="member__photo">' + portrait(C, p.id, '(max-width: 479px) 72px, 104px', '') + '</span>' +
        '<div class="member__body">' +
        '<h3 class="member__name" id="' + mid + '-name">' + esc(p.name) + '</h3>' +
        '<div id="' + mid + '-desc" class="member__desc">' +
        '<span class="member__role">' + esc(p.role) + '</span>' +
        '<span class="member__inst">' + esc(p.institution) + '</span>' +
        '<span class="member__country">' + flag(C, p.iso) + esc(p.country) + '</span>' +
        (p.linkedin ? '<span class="sr-only">' + esc(m.linkedinAvailable) + '</span>' : '') +
        '</div></div>' +
        '<span class="member__foot" aria-hidden="true"><span class="member__more">' + esc(m.openLabel) + ICONS.arrow + '</span>' +
        (p.linkedin ? '<span class="member__li" title="' + esc(m.linkedinAvailable) + '">' + ICONS.linkedin + '</span>' : '') +
        '</span></a></li>';
    }).join('');
    return '<section class="section section--paper" id="miembros" aria-labelledby="miembros-title">' +
      '<div class="wrap">' + sectionHead('02', m.kicker, m.title, 'miembros') +
      '<p class="section__lead" data-reveal>' + esc(m.lead) + '</p>' +
      '<ul class="members" role="list">' + cards + '</ul>' +
      '</div></section>';
  }

  function renderPillars(C, L) {
    var p = L.pillars;
    var items = p.items.map(function (it, i) {
      var parts = it.title.split(' · ');
      var title = esc(parts[0]) + (parts[1] ? '<span class="sr-only">: </span><span class="pillar__journal">' + esc(parts.slice(1).join(' · ')) + '</span>' : '');
      return '<li class="pillar' + (parts[1] ? ' pillar--journal' : '') + '" data-reveal style="--i:' + i + '">' +
        '<span class="pillar__n" aria-hidden="true">' + esc(it.n) + '</span>' +
        '<h3 class="pillar__title">' + title + '</h3>' +
        '<p class="pillar__text">' + esc(it.text) + '</p></li>';
    }).join('');
    return '<section class="section section--ivory" id="lineas" aria-labelledby="lineas-title">' +
      '<div class="wrap">' + sectionHead('03', p.kicker, p.title, 'lineas') +
      '<ol class="pillars" role="list">' + items + '</ol></div></section>';
  }

  function renderNetwork(C, L) {
    var n = L.network;
    var groups = [], byCont = {};
    n.countries.forEach(function (c) {
      if (!byCont[c.continent]) { byCont[c.continent] = []; groups.push(c.continent); }
      byCont[c.continent].push(c);
    });
    var stats = (n.stats || []).map(function (s) {
      return '<div class="stat"><dt class="stat__label">' + esc(s.label) + '</dt><dd class="stat__value">' + esc(s.value) + '</dd></div>';
    }).join('');
    var cont = groups.map(function (g) {
      return '<div class="continent"><h3 class="continent__name">' + esc(g) + '</h3><ul role="list">' +
        byCont[g].map(function (c) { return '<li>' + flag(C, c.iso) + '<span>' + esc(c.name) + '</span></li>'; }).join('') +
        '</ul></div>';
    }).join('');
    return '<section class="section section--ink" id="red" aria-labelledby="red-title">' +
      '<div class="wrap">' + sectionHead('04', n.kicker, n.title, 'red', true) +
      '<div class="network">' +
      '<div class="network__intro" data-reveal><p class="section__lead section__lead--light">' + esc(n.lead) + '</p>' +
      (stats ? '<dl class="stats">' + stats + '</dl>' : '') + '<p class="network__note">' + esc(n.note) + '</p></div>' +
      '<div class="network__map" data-reveal><p class="network__map-title">' + esc(n.continentsTitle) + '</p><div class="continents">' + cont + '</div></div>' +
      '</div></div></section>';
  }

  function memberById(L, id) {
    for (var i = 0; i < L.members.items.length; i++) if (L.members.items[i].id === id) return L.members.items[i];
    return null;
  }

  function renderMilestones(C, L) {
    var ms = L.milestones, ui = L.ui;
    var items = ms.items.map(function (it) {
      var d = (it.isoDate || '').split('-');
      var links = (it.links || []).map(function (l) {
        var yt = /youtube\.com|youtu\.be/.test(l.url);
        return '<li><a class="ext" href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer">' +
          (yt ? ICONS.play : ICONS.external) + '<span>' + esc(l.label) + '</span><span class="sr-only"> ' + esc(ui.newTab) + '</span></a></li>';
      }).join('');
      var voices = (it.speakers || []).map(function (id) {
        var p = memberById(L, id);
        if (!p) return '';
        return '<li><a class="voice" href="#miembro-' + esc(id) + '" data-member="' + esc(id) + '" aria-haspopup="dialog" data-name="' + esc(p.name) + '">' +
          portrait(C, id, '64px', ms.speakerAria + ' ' + p.name) + '</a></li>';
      }).join('');
      return '<li class="milestone" data-reveal>' +
        '<div class="milestone__date"><span class="milestone__n">' + esc(it.n) + '</span>' +
        '<time datetime="' + esc(it.isoDate) + '"><span class="sr-only">' + esc(it.date) + '</span>' +
        '<span class="milestone__day" aria-hidden="true">' + esc(d[0] || '') + '</span>' +
        '<span class="milestone__rest" aria-hidden="true">' + esc(it.dayMonth || it.date) + '</span></time></div>' +
        '<div class="milestone__node" aria-hidden="true"></div>' +
        '<article class="milestone__body" aria-labelledby="hito-' + esc(it.n) + '">' +
        (it.tag ? '<p class="tag">' + esc(it.tag) + '</p>' : '') +
        '<h3 class="milestone__title" id="hito-' + esc(it.n) + '">' + esc(it.title) + '</h3>' +
        (it.place ? '<p class="milestone__place">' + ICONS.pin + '<span><span class="sr-only">' + esc(ui.placeLabel) + ': </span>' + esc(it.place) + '</span></p>' : '') +
        '<p class="milestone__text">' + esc(it.text) + '</p>' +
        (links ? '<ul class="milestone__links" role="list">' + links + '</ul>' : '') +
        (voices ? '<div class="voices"><p class="voices__title">' + esc(it.speakersTitle) + '</p><ul class="voices__list" role="list">' + voices + '</ul>' +
          (it.speakersHint ? '<p class="voices__hint">' + esc(it.speakersHint) + '</p>' : '') + '</div>' : '') +
        '</article></li>';
    }).join('');
    return '<section class="section section--paper" id="hitos" aria-labelledby="hitos-title">' +
      '<div class="wrap">' + sectionHead('05', ms.kicker, ms.title, 'hitos') +
      '<ol class="timeline" role="list">' + items + '</ol></div></section>';
  }

  function renderOrganizers(C, L) {
    var o = L.organizers, ui = L.ui;
    var groups = ['organizedBy', 'associated', 'support'].filter(function (k) { return o[k] && o[k].items && o[k].items.length; });
    var html = groups.map(function (k) {
      var g = o[k];
      return '<div class="orgs__group orgs__group--' + k + '" data-reveal><h3 class="orgs__label">' + esc(g.label) + '</h3><ul class="orgs__logos" role="list">' +
        g.items.map(function (it) {
          var inner = '<span class="orgs__box">' + logo(it.logo, '', 'orgs__logo') + '</span>' +
            '<span class="orgs__name"' + (it.nameLang ? ' lang="' + esc(it.nameLang) + '"' : '') + '>' + esc(it.name) + '</span>';
          return '<li>' + (it.url
            ? '<a class="orgs__link" href="' + esc(it.url) + '" target="_blank" rel="noopener noreferrer">' + inner + '<span class="sr-only"> ' + esc(ui.newTab) + '</span></a>'
            : '<div class="orgs__link">' + inner + '</div>') + '</li>';
        }).join('') + '</ul></div>';
    }).join('');
    return '<section class="section section--navy" id="instituciones" aria-labelledby="instituciones-title">' +
      '<div class="wrap">' + sectionHead('06', o.kicker, o.title, 'instituciones', true) +
      '<div class="orgs">' + html + '</div></div></section>';
  }

  function renderFooter(C, L) {
    var f = L.footer, ui = L.ui;
    var nav = L.nav.map(function (n) { return '<li><a href="#' + esc(n.id) + '">' + esc(n.label) + '</a></li>'; }).join('');
    return '<footer class="site-footer">' +
      '<div class="site-footer__eq" aria-hidden="true"></div>' +
      '<div class="wrap site-footer__grid">' +
      '<div class="site-footer__brand">' + logo(C.assets.logoWhite, '', 'site-footer__logo') +
      '<p class="site-footer__name">' + esc(f.brand) + '</p><p class="site-footer__tagline">' + esc(f.tagline) + '</p></div>' +
      '<div class="site-footer__about"><p>' + esc(f.about) + '</p></div>' +
      '<nav class="site-footer__nav" aria-label="' + esc(f.linksLabel) + '"><p class="site-footer__h">' + esc(f.linksLabel) + '</p><ul role="list">' + nav +
      '<li><a href="' + esc(C.links.youtube) + '" target="_blank" rel="noopener noreferrer">' + esc(f.youtubeLabel) + '<span class="sr-only"> ' + esc(ui.newTab) + '</span></a></li></ul></nav>' +
      '</div>' +
      '<div class="wrap site-footer__bottom"><p>' + esc(f.copyright) + '</p>' +
      '<a class="site-footer__top" href="#inicio">' + esc(f.backToTop) + '<span aria-hidden="true"> ↑</span></a></div>' +
      '</footer>';
  }

  function renderDialog(C, L) {
    var m = L.members;
    return '<dialog class="mdialog" id="member-dialog" aria-labelledby="mdialog-name">' +
      '<div class="mdialog__frame">' +
      '<button type="button" class="mdialog__close" data-close aria-label="' + esc(m.closeLabel) + '">' + ICONS.close + '</button>' +
      '<div class="mdialog__media"><div class="mdialog__photo" data-slot="photo"></div></div>' +
      '<div class="mdialog__content">' +
      '<p class="mdialog__kicker">' + esc(m.dialogKicker) + '</p>' +
      '<h2 class="mdialog__name" id="mdialog-name" data-slot="name" tabindex="-1"></h2>' +
      '<p class="mdialog__role" data-slot="role"></p>' +
      '<p class="mdialog__inst" data-slot="inst"></p>' +
      '<p class="mdialog__country" data-slot="country"></p>' +
      '<div class="mdialog__bio" data-slot="bio"></div>' +
      '<div class="mdialog__actions" data-slot="actions"></div>' +
      '<p class="sr-only" id="mdialog-keys">' + esc(L.ui.dialogKeys) + '</p>' +
      '<div class="mdialog__pager">' +
      '<button type="button" class="pager-btn" data-step="-1" aria-label="' + esc(L.ui.prev) + '" aria-describedby="mdialog-keys">' + ICONS.prev + '<span data-slot="prev"></span></button>' +
      '<button type="button" class="pager-btn" data-step="1" aria-label="' + esc(L.ui.next) + '" aria-describedby="mdialog-keys"><span data-slot="next"></span>' + ICONS.next + '</button>' +
      '</div></div></div></dialog>';
  }

  function renderApp(C, lang, base) {
    if (typeof base === 'string') BASE = base;
    var L = C[lang];
    return '<a class="skip-link" href="#contenido">' + esc(L.skipLink) + '</a>' +
      renderHeader(C, L) +
      '<main id="contenido" tabindex="-1">' +
      renderHero(C, L) + renderAbout(C, L) + renderMembers(C, L) + renderPillars(C, L) +
      renderNetwork(C, L) + renderMilestones(C, L) + renderOrganizers(C, L) +
      '</main>' + renderFooter(C, L) + renderDialog(C, L);
  }

  /* JSON-LD (Organization + Event pasado), generado desde el contenido */
  /* site = raíz canónica (con / final); lang = idioma de la página que lo lleva */
  function jsonLd(C, site, lang) {
    var L = C[lang], ms = L.milestones.items[0];
    var page = lang === 'es' ? site : site + lang + '/';
    var persons = L.members.items.map(function (p) {
      var o = { '@type': 'Person', '@id': site + '#miembro-' + p.id, name: p.name, jobTitle: p.role,
        affiliation: { '@type': 'Organization', name: p.institution },
        image: site + sub(C.assets.portrait, p.id) };
      if (p.linkedin) o.sameAs = [p.linkedin];
      return o;
    });
    var org = {
      '@type': 'Organization', '@id': site + '#organization',
      name: 'Global South Alliance on AI and Law', alternateName: 'GSAIL', url: page,
      logo: site + C.assets.logoColor, description: L.meta.description,
      areaServed: { '@type': 'Place', name: lang === 'es' ? 'Sur Global' : 'Global South' },
      member: persons.map(function (p) { return { '@type': 'OrganizationRole', roleName: lang === 'es' ? 'Miembro' : 'Member', member: { '@id': p['@id'] } }; })
    };
    var ev = {
      '@type': 'Event', '@id': site + '#hito-01',
      name: ms.title + ' · Global South Alliance on AI and Law',
      startDate: '2026-10-16T09:30:00-03:00',
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/MixedEventAttendanceMode',
      description: ms.text,
      image: site + C.assets.og,
      location: [
        { '@type': 'Place', name: 'Edificio PUCV Santiago', address: { '@type': 'PostalAddress', streetAddress: 'Antonio Bellet 314', addressLocality: 'Providencia', addressRegion: 'Región Metropolitana de Santiago', addressCountry: 'CL' } },
        { '@type': 'VirtualLocation', name: 'YouTube · Facultad y Escuela de Derecho PUCV', url: C.links.youtube }
      ],
      organizer: [{ '@type': 'Organization', name: 'Programa DIAT · PUCV', url: C.links.diat }, { '@type': 'Organization', name: 'Facultad de Derecho PUCV', url: C.links.derechoPucv }],
      performer: persons.map(function (p) { return { '@id': p['@id'] }; }),
      about: { '@id': site + '#organization' },
      inLanguage: lang
    };
    return JSON.stringify({ '@context': 'https://schema.org', '@graph': [org].concat(persons, [ev]) }, null, 2);
  }

  var api = { renderApp: renderApp, jsonLd: jsonLd, esc: esc, memberById: memberById, portrait: portrait, flag: flag, ICONS: ICONS };

  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  root.GSAIL = api;

  /* =================================================== comportamiento (browser) */
  /* Cada idioma es una página estática (/ y /en/) ya pre-renderizada: aquí solo se añade comportamiento. */
  var doc = document, html = doc.documentElement;
  var C;
  try { C = JSON.parse(doc.getElementById('gsail-content').textContent); } catch (e) { return; }
  var app = doc.getElementById('app');
  var current = (app && app.getAttribute('data-lang')) || html.lang || 'es';
  if (!C[current]) return;
  BASE = (app && app.getAttribute('data-base')) || '';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lastOpener = null;

  /* Enlaces antiguos «?lang=en» en la portada: llevan a /en/ */
  try {
    var qp = new URLSearchParams(window.location.search).get('lang');
    if (qp === 'en' && current === 'es' && /^https?:/.test(window.location.protocol)) { window.location.replace('en/' + window.location.hash); return; }
  } catch (e) { /* noop */ }

  /* --------- header: estado al hacer scroll, menú móvil, sección activa */
  function bind() {
    var header = doc.querySelector('.site-header');
    var hero = doc.querySelector('.hero');
    var onScroll = function () {
      var limit = hero ? hero.offsetHeight * 0.45 : 200;
      header.classList.toggle('is-scrolled', window.scrollY > limit);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Cambio de idioma: conserva la sección (#ancla) al pasar a la otra página
    doc.querySelectorAll('[data-lang-link]').forEach(function (a) {
      a.addEventListener('click', function () {
        var h = window.location.hash;
        if (h && !/^#miembro-/.test(h)) a.setAttribute('href', a.getAttribute('href').split('#')[0] + h);
      });
    });

    var menuBtn = doc.querySelector('.menu-btn'), nav = doc.getElementById('site-nav');
    var mq = window.matchMedia ? window.matchMedia('(max-width: 979px)') : { matches: false };
    function isOpen() { return menuBtn.getAttribute('aria-expanded') === 'true'; }
    function setMenu(open, focusFirst) {
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', menuBtn.getAttribute(open ? 'data-close' : 'data-open'));
      header.classList.toggle('menu-open', open);
      if (open && focusFirst) { var first = nav.querySelector('a'); if (first) first.focus(); }
    }
    menuBtn.setAttribute('aria-label', menuBtn.getAttribute('data-open'));
    menuBtn.addEventListener('click', function () { setMenu(!isOpen(), true); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    header.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) { setMenu(false); menuBtn.focus(); }
    });
    // Se cierra si el foco sale de la cabecera o si se hace clic fuera
    header.addEventListener('focusout', function (e) {
      if (isOpen() && mq.matches && e.relatedTarget && !header.contains(e.relatedTarget)) setMenu(false);
    });
    doc.addEventListener('click', function (e) {
      if (isOpen() && !header.contains(e.target)) setMenu(false);
    });

    // Sección activa en el menú
    if ('IntersectionObserver' in window) {
      var links = {};
      doc.querySelectorAll('[data-nav]').forEach(function (a) { links[a.getAttribute('data-nav')] = a; });
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var a = links[en.target.id];
          if (!a) return;
          if (en.isIntersecting) {
            Object.keys(links).forEach(function (k) { links[k].removeAttribute('aria-current'); });
            a.setAttribute('aria-current', 'location');
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(links).forEach(function (id) { var s = doc.getElementById(id); if (s) spy.observe(s); });
    }

    // Fichas de miembros
    doc.querySelectorAll('[data-member]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        openMember(a.getAttribute('data-member'), a);
      });
    });
    var dlg = doc.getElementById('member-dialog');
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.closest('[data-close]')) dlg.close();
      var step = e.target.closest('[data-step]');
      if (step) stepMember(parseInt(step.getAttribute('data-step'), 10));
    });
    dlg.addEventListener('close', onDialogClose);
  }

  /* ----------------------------------------------------------- reveal */
  function setupReveal() {
    var els = doc.querySelectorAll('[data-reveal]');
    if (reduceMotion || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    html.classList.add('can-reveal');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
    // Al imprimir, todo visible
    window.addEventListener('beforeprint', function () { els.forEach(function (el) { el.classList.add('is-in'); }); });
  }

  /* ------------------------------------------------------ ficha de miembro */
  function fill(dlg, p) {
    var L = C[current], m = L.members, ui = L.ui;
    var slot = function (n) { return dlg.querySelector('[data-slot="' + n + '"]'); };
    dlg.setAttribute('data-id', p.id);
    slot('photo').innerHTML = portrait(C, p.id, '(min-width: 820px) 240px, 140px', ui.portraitOf + ' ' + p.name, { eager: true });
    slot('name').textContent = p.name;
    slot('role').textContent = p.role;
    slot('inst').textContent = p.institution;
    slot('country').innerHTML = flag(C, p.iso) + '<span><span class="sr-only">' + esc(m.countryLabel) + ': </span>' + esc(p.country) + '</span>';
    slot('bio').innerHTML = '<p>' + esc(p.bio) + '</p>';
    slot('actions').innerHTML = p.linkedin
      ? '<a class="btn btn--li" href="' + esc(p.linkedin) + '" target="_blank" rel="noopener noreferrer">' + ICONS.linkedin +
        '<span>' + esc(m.linkedinLabel) + '</span><span class="sr-only"> ' + esc(ui.newTab) + '</span></a>'
      : '';
    var items = m.items, i = items.indexOf(p);
    var prev = items[(i - 1 + items.length) % items.length], next = items[(i + 1) % items.length];
    slot('prev').textContent = prev.name;
    slot('next').textContent = next.name;
    dlg.querySelector('[data-step="-1"]').setAttribute('aria-label', ui.prev + ': ' + prev.name);
    dlg.querySelector('[data-step="1"]').setAttribute('aria-label', ui.next + ': ' + next.name);
  }

  function setHash(h) {
    try { history.replaceState(null, '', window.location.pathname + window.location.search + h); } catch (e) { /* noop */ }
  }

  function openMember(id, opener) {
    var L = C[current], p = memberById(L, id), dlg = doc.getElementById('member-dialog');
    if (!p || !dlg) return;
    fill(dlg, p);
    if (!dlg.open) {
      lastOpener = opener || doc.getElementById('miembro-' + id);
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
      html.classList.add('dialog-open');
    }
    setHash('#miembro-' + id);
    var name = dlg.querySelector('[data-slot="name"]');
    if (name) name.focus({ preventScroll: true });
    dlg.scrollTop = 0;
  }

  function stepMember(d) {
    var dlg = doc.getElementById('member-dialog');
    var items = C[current].members.items;
    var id = dlg.getAttribute('data-id');
    var i = 0;
    for (var k = 0; k < items.length; k++) if (items[k].id === id) i = k;
    openMember(items[(i + d + items.length) % items.length].id, null);
  }

  function onDialogClose() {
    html.classList.remove('dialog-open');
    if (/^#miembro-/.test(window.location.hash)) setHash('#miembros');
    var dlg = doc.getElementById('member-dialog');
    var id = dlg.getAttribute('data-id');
    var target = (lastOpener && doc.body.contains(lastOpener)) ? lastOpener : doc.getElementById('miembro-' + id);
    if (target) target.focus({ preventScroll: !!(lastOpener && doc.body.contains(lastOpener)) });
    lastOpener = null;
  }

  function fromHash() {
    var m = /^#miembro-([a-z]+)$/.exec(window.location.hash);
    if (m && memberById(C[current], m[1])) openMember(m[1], doc.getElementById('miembro-' + m[1]));
  }

  /* Teclado con la ficha abierta: foco atrapado (Tab / Mayús+Tab).
     Flechas ← → para pasar de miembro solo con el foco en el nombre o en el paginador (anunciado en #mdialog-keys). */
  doc.addEventListener('keydown', function (e) {
    var dlg = doc.getElementById('member-dialog');
    if (!dlg || !dlg.open) return;
    if (e.key === 'Tab') {
      var f = Array.prototype.filter.call(
        dlg.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
        function (el) { return el.offsetWidth || el.offsetHeight || el.getClientRects().length; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1], a = doc.activeElement;
      var inside = dlg.contains(a);
      if (e.shiftKey && (!inside || a === first || a === dlg.querySelector('#mdialog-name'))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (!inside || a === last)) { e.preventDefault(); first.focus(); }
      return;
    }
    if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      var t = doc.activeElement;
      if (!t || !(t.id === 'mdialog-name' || (t.classList && t.classList.contains('pager-btn')))) return;
      e.preventDefault();
      var wasPager = t.classList.contains('pager-btn') ? t.getAttribute('data-step') : null;
      stepMember(e.key === 'ArrowRight' ? 1 : -1);
      if (wasPager) { var b = dlg.querySelector('[data-step="' + wasPager + '"]'); if (b) b.focus(); }
    }
  });

  /* --------------------------------------------------------------- arranque */
  html.classList.add('js');
  bind();
  setupReveal();
  window.addEventListener('hashchange', fromHash);
  if (/^#miembro-/.test(window.location.hash)) {
    // Enlace directo a una ficha: se abre cuando la página terminó de cargar
    // (así el desplazamiento al fragmento del navegador no le quita el foco).
    var deep = function () {
      var card = doc.getElementById(window.location.hash.slice(1));
      if (card) card.scrollIntoView({ block: 'center' });
      fromHash();
    };
    if (doc.readyState === 'complete') setTimeout(deep, 0);
    else window.addEventListener('load', function () { setTimeout(deep, 0); });
  }
})(this);
