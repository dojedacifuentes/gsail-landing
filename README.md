# GSAIL · Global South Alliance on AI and Law — sitio web

Sitio institucional bilingüe (español en `/`, inglés en `/en/`). Es estático: HTML, CSS y JavaScript sin dependencias ni paso de build.

## Estructura

| Archivo | Qué es |
| --- | --- |
| `index.html` | Página en español (generada) |
| `en/index.html` | Página en inglés (generada) |
| `content.json` | Todo el texto ES/EN, rutas de imágenes y enlaces. **Se edita aquí.** |
| `main.js` | Render (también lo usa Node) y comportamiento: menú, fichas de miembros |
| `styles.css` | Estilos |
| `assets/` | Logos, retratos aprobados (400/240/160 px), banderas, iconos, `og.jpg` |
| `robots.txt`, `sitemap.xml` | Generados |
| `vercel.json` | Caché de assets, cabeceras de seguridad y redirección de `/?lang=en` a `/en/` |
| `tools/embed-content.js` | Genera las dos páginas, `robots.txt` y `sitemap.xml` desde `content.json` |

El material de trabajo (fuentes, notas de redacción, investigación de los miembros) está fuera de esta carpeta, en `../landing-docs/research.json`. `.vercelignore` deja fuera del despliegue `_qa/`, `tools/`, `content.json` y este README.

## Editar el contenido

1. Cambiar `content.json`.
2. Ejecutar `node tools/embed-content.js`.
3. Revisar `index.html` y `en/index.html` en un servidor local (por ejemplo `npx serve .`) y publicar.

Para sumar una institución asociada, añadir un objeto `{ "name": "…", "logo": "assets/logos/…png", "url": "…" }` (la `url` es opcional) en `es.organizers.associated.items` y en `en.organizers.associated.items`. Los logos blancos (`*-blanco`) van sobre el fondo marino de la sección.

## Dominio canónico (antes del primer despliegue)

El dominio es un marcador: `https://gsail.vercel.app/`. Cuando se fije el definitivo:

1. Cambiar la constante `SITE` en `tools/embed-content.js`.
2. Ejecutar `node tools/embed-content.js`. Así se actualizan canonical, hreflang, `og:url`, `og:image`, el JSON-LD, `robots.txt` y `sitemap.xml`.

## Imagen para compartir

`assets/og.jpg` (1200×630) es la vista previa en LinkedIn, WhatsApp y X. Presenta la alianza, no el evento.
