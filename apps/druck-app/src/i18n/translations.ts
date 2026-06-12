// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>

export type Lang = 'en' | 'de';

export const translations: Record<Lang, Record<string, string>> = {
  en: {
    'skip-link': 'Skip to content',
    'fact-header': 'Production numbers',
    'connector-feed': 'one structured feed',
    'connector-rendered': 'rendered front page',
    'chapter-surfaces': '02 / SURFACES',
    'hero-heading': 'Paste JSON. Get a magazine.',
    'hero-body': '<strong class="brand">Druck</strong> is an open-source editorial renderer. Feed it structured article JSON, and it outputs front pages, cards, and full articles as static HTML. It already powers thousands of production articles inside <a href="https://sonto.tech" target="_blank" rel="noopener noreferrer">Sonto</a>.',
    'hero-position': 'Bring the data. <em>Druck</em> handles the magazine layer.',
    'hero-proof': 'Already running in production on Sonto: live data in, static HTML out, zero JavaScript required to read.',
    'cta-install': 'Install ↓',
    'cta-github': 'GitHub',
    'copy-btn': 'Copy',
    'fact-widget': 'the entire widget, gzipped',
    'fact-cookies': 'cookies · trackers · consent banners',
    'fact-lighthouse': 'Lighthouse, all four categories',
    'fact-license': 'use it, fork it, ship it',
    'chapter-engine': '01 / ENGINE',
    'surfaces-heading': 'One story, many <em>surfaces</em>',
    'surfaces-lede': 'The same article adapts to cards, briefs, features, and full pages. Hover a sheet to see which keys drive it.',
    'bridge': 'Not a template. A rendering system.',
    'chapter-wild': '03 / IN THE WILD',
    'wild-heading': 'In the <em>wild</em>',
    'wild-lede': 'Three publications that do not exist. One renderer that does. Host styles clash on purpose; the article inside never flinches. Click any of them for the full site &mdash; or visit the <a href="/demos/newsroom/">corporate newsroom</a> or the <a href="/demos/dev-blog/">dev blog</a>.',
    'wild-pull': 'Turn a channel into a <em>publication</em>.',
    'wild-cap-music': 'Archivo Black mastheads &middot; hot red &middot; quick_take &middot; <a href="/demos/music-review/">Open the full site &rarr;</a>',
    'wild-cap-fashion': 'Bodoni Moda display &middot; near-black &middot; quick_take &middot; <a href="/demos/fashion-magazine/">Open the full site &rarr;</a>',
    'pane-frontpage': 'front page',
    'pane-render-note': 'static html &middot; set in',
    'tg-label-channel': 'Telegram channel',
    'tg-subscribers': '12 480 subscribers',
    'tg-today': 'Today',
    'tg-label-frontpage': 'Druck front page',
    'tg-caption': 'They post in Telegram. Your bot maps it. Druck renders it. &middot; <a href="/demos/telegram-brief/">Open the full site &rarr;</a>',
    'chapter-frontpage': '04 / FRONT PAGE',
    'frontpage-heading': 'The <em>front page</em>, live',
    'frontpage-lede': 'This is sonto.tech &mdash; live, right now &mdash; rendered by one widget. Druck was extracted from its pipeline; now it renders its parent.',
    'frontpage-caption': '<span class="caption-live">Live</span><code class="caption-code">&lt;druck-feed layout="front-page" src="https://sonto.tech/data/druck-feed.json"&gt;</code><span class="caption-note">A magazine front page from one JSON file. Every card links to a real article.</span>',
    'chapter-range': '05 / RANGE',
    'range-heading': 'One JSON, <em>60</em> magazines',
    'range-lede': 'One structured story, typeset across three formats, five languages, and four accents. The specimen text is demo content.',
    'range-pull': 'Create <em>articles</em> for your magazines &mdash; the typesetting is already done.',
    'range-caption': 'Read a full issue &mdash; <a href="/articles/quiet-revolution-grid-scale-batteries/">the feature this specimen is cut from</a>, rendered by the engine at build time.',
    'chapter-analytics': '06 / ANALYTICS',
    'analytics-heading': 'Static pages. Live reading <em>memory</em>.',
    'analytics-lede': 'It measures reading, not readers.',
    'analytics-depth': 'Depth',
    'analytics-time': 'Active time',
    'analytics-sections': 'Sections read',
    'analytics-pull': 'Pipe it into <em>your</em> stack &mdash; GA4, GTM, Plausible &mdash; with one callback.',
    'analytics-where-heading': 'Where the reading signal can go',
    'analytics-path-default-title': 'Default',
    'analytics-path-default-text': 'Nowhere. No endpoint configured; the numbers die with the tab.',
    'analytics-path-stack-title': 'Your stack',
    'analytics-path-stack-text': 'Callbacks forward into GA4 / GTM / Plausible already on the host page.',
    'analytics-path-endpoint-title': 'Your endpoint',
    'analytics-path-endpoint-text': 'Sessions POST via <code>sendBeacon</code> on pagehide.',
    'privacy-title': 'What the analytics see',
    'privacy-p1': 'It measures reading, not readers: scroll depth, active time, chapters read. The numbers live in page memory.',
    'privacy-p2': 'No cookies, no fingerprinting, no third-party scripts, no IP logging. Nothing is transmitted unless the site owner sets an endpoint. This page sets none, so the numbers above stay in your tab and die with it.',
    'privacy-p3': 'No personal data is processed, which is why there is no consent banner to click.',
    'privacy-p4': 'Your own analytics keep working: druck output is plain HTML, so GA4, GTM, or Plausible on the host page see it like any other content. The reading tracker can forward its events into them through callbacks.',
    'pricing-heading': 'Free. MIT. Forever.',
    'pricing-free-text': 'Everything on this page: the engine, the stylesheet, the widgets, the reading tracker. Self-hosted, no tiers, no locked features. Fork it, ship it, sell with it.',
    'chapter-colophon': '07 / COLOPHON',
    'colophon-heading': 'Colophon',
    'colophon-claim': 'Lighthouse 100 in all four categories. The whole page ships under 250 KB. The article itself needs zero client JavaScript.',
    'colophon-method': 'Rendered articles require zero JavaScript. This page\'s interactivity ships as small islands; the article you read above arrived as static HTML. View source.',
    'colophon-install': 'The widget is __DRUCK_WIDGET_KB__ kB gzipped, served by jsDelivr. Prefer npm: <code>__DRUCK_INSTALL_CMD__</code>.',
    'signature': 'Druck is extracted from <a href="https://sonto.tech" target="_blank" rel="noopener noreferrer">Sonto</a>, where this engine rendered thousands of production articles in five languages.',
    'title': 'Druck — Structure in, magazine out',
    'description': 'Druck is an editorial rendering engine: structured article JSON in, magazine-quality pages out. Formats, multilingual typography, reading analytics, embeddable widgets. MIT.',
  },
  de: {
    'title': 'Druck — Struktur rein, Magazin raus',
    'description': 'Druck ist eine Engine für redaktionelles Rendering: strukturiertes Article-JSON rein, Seiten in Magazinqualität raus. Formate, mehrsprachige Typografie, Reading-Analytics, einbettbare Widgets. MIT.',
    'skip-link': 'Zum Inhalt',
    'fact-header': 'Produktionszahlen',
    'connector-feed': 'ein strukturierter Feed',
    'connector-rendered': 'gerenderte Frontpage',
    'chapter-surfaces': '02 / SURFACES',
    'hero-heading': 'JSON rein. Magazin raus.',
    'hero-body': '<strong class="brand">Druck</strong> ist ein Open-Source-Renderer. Strukturierte Artikeldaten als JSON rein, Frontpages, Cards und vollst&auml;ndige Artikelseiten als statisches HTML raus. L&auml;uft bereits mit Tausenden Produktionsartikeln auf <a href="https://sonto.tech" target="_blank" rel="noopener noreferrer">Sonto</a>.',
    'hero-position': 'Du bringst die Daten. <em>Druck</em> macht das Magazin.',
    'hero-proof': 'L&auml;uft produktiv auf Sonto: Live-Daten rein, statisches HTML raus, kein JavaScript beim Lesen.',
    'cta-install': 'Installieren ↓',
    'cta-github': 'GitHub',
    'copy-btn': 'Code kopieren',
    'fact-widget': 'das ganze Widget, gzipped',
    'fact-cookies': 'Cookies · Tracker · Consent-Banner',
    'fact-lighthouse': 'Lighthouse, alle vier Kategorien',
    'fact-license': 'nutzen, forken, shippen',
    'chapter-engine': '01 / ENGINE',
    'surfaces-heading': 'Eine Story, viele <em>Surfaces</em>',
    'surfaces-lede': 'Derselbe Artikel &mdash; als Card, als Brief, als Feature, als ganze Seite. Hover &uuml;ber ein Sheet, um zu sehen, welche Keys es steuern.',
    'bridge': 'Kein Template. Ein Rendering-System.',
    'chapter-wild': '03 / IN THE WILD',
    'wild-heading': 'In the <em>wild</em>',
    'wild-lede': 'Drei Publikationen, die nicht existieren. Ein Renderer, den es gibt. Die Host-Styles kollidieren absichtlich, der Artikel darin bleibt stabil. Klick auf eine, um die volle Site zu &ouml;ffnen &mdash; oder schau dir den <a href="/demos/newsroom/">Corporate-Newsroom</a> oder den <a href="/demos/dev-blog/">Dev-Blog</a> an.',
    'wild-pull': 'Aus einem Kanal wird eine <em>Publikation</em>.',
    'wild-cap-music': 'Archivo-Black-Titel &middot; Hot Red &middot; quick_take &middot; <a href="/demos/music-review/">Volle Site &ouml;ffnen &rarr;</a>',
    'wild-cap-fashion': 'Bodoni-Moda-Display &middot; Near-Black &middot; quick_take &middot; <a href="/demos/fashion-magazine/">Volle Site &ouml;ffnen &rarr;</a>',
    'pane-frontpage': 'Frontpage',
    'pane-render-note': 'statisches HTML &middot; gerendert in',
    'tg-label-channel': 'Telegram-Kanal',
    'tg-subscribers': '12 480 Abonnenten',
    'tg-today': 'Heute',
    'tg-label-frontpage': 'Druck-Frontpage',
    'tg-caption': 'Sie posten im Telegram-Kanal. Dein Bot mappt es. Druck rendert es. &middot; <a href="/demos/telegram-brief/">Volle Site &ouml;ffnen &rarr;</a>',
    'chapter-frontpage': '04 / FRONTPAGE',
    'frontpage-heading': 'Die <em>Frontpage</em>, live',
    'frontpage-lede': 'Das ist sonto.tech &mdash; live, jetzt &mdash; gerendert von einem Widget. Druck wurde aus dessen Pipeline extrahiert, jetzt rendert es auch die Sonto-Frontpage.',
    'frontpage-caption': '<span class="caption-live">Live</span><code class="caption-code">&lt;druck-feed layout="front-page" src="https://sonto.tech/data/druck-feed.de.json"&gt;</code><span class="caption-note">Eine Magazin-Frontpage aus einer JSON-Datei. Jede Card linkt zu einem echten Artikel.</span>',
    'chapter-range': '05 / RANGE',
    'range-heading': 'Ein JSON, <em>60</em> Magazinvarianten',
    'range-lede': 'Eine strukturierte Story, gesetzt in drei Formaten, f&uuml;nf Sprachen und vier Akzenten. Der Specimen-Text ist Demo-Inhalt.',
    'range-pull': 'Erstelle <em>Artikel</em> f&uuml;r deine Magazine &mdash; das Typesetting ist schon erledigt.',
    'range-caption': 'Ein ganzes Heft lesen &mdash; <a href="/articles/quiet-revolution-grid-scale-batteries/">das Feature, aus dem dieses Specimen geschnitten ist</a>, gerendert von der Engine zur Build-Zeit.',
    'chapter-analytics': '06 / ANALYTICS',
    'analytics-heading': 'Statische Seiten. Lebendiges Lese-<em>Ged&auml;chtnis</em>.',
    'analytics-lede': 'Misst das Lesen, nicht die Leser.',
    'analytics-depth': 'Tiefe',
    'analytics-time': 'Aktive Zeit',
    'analytics-sections': 'Gelesene Abschnitte',
    'analytics-pull': 'Pipe es in <em>deinen</em> Stack &mdash; GA4, GTM, Plausible &mdash; mit einem Callback.',
    'analytics-where-heading': 'Wohin das Reading-Signal gehen kann',
    'analytics-path-default-title': 'Default',
    'analytics-path-default-text': 'Nirgendwohin. Kein Endpoint konfiguriert; die Zahlen sterben mit dem Tab.',
    'analytics-path-stack-title': 'Dein Stack',
    'analytics-path-stack-text': 'Callbacks leiten in GA4 / GTM / Plausible weiter, die ohnehin auf der Host-Seite laufen.',
    'analytics-path-endpoint-title': 'Dein Endpoint',
    'analytics-path-endpoint-text': 'Sessions per <code>sendBeacon</code> bei <code>pagehide</code>.',
    'privacy-title': 'Was die Analytics messen',
    'privacy-p1': 'Druck misst Lesen, nicht Leser: Scroll-Tiefe, aktive Zeit, gelesene Kapitel. Die Zahlen bleiben im Speicher der Seite.',
    'privacy-p2': 'Keine Cookies, kein Fingerprinting, keine Third-Party-Scripts, kein IP-Logging. Nichts wird &uuml;bertragen, au&szlig;er der Seitenbetreiber setzt einen eigenen Endpoint. Diese Seite tut das nicht. Die Zahlen oben bleiben in deinem Tab und verschwinden, sobald du ihn schlie&szlig;t.',
    'privacy-p3': 'Druck verarbeitet keine pers&ouml;nlichen Daten. Deshalb gibt es auch kein Consent-Banner zum Wegklicken.',
    'privacy-p4': 'Deine eigenen Analytics laufen weiter: Druck-Output ist schlichtes HTML, also sehen GA4, GTM oder Plausible auf der Host-Seite ihn wie jeden anderen Content. Der Reading-Tracker kann seine Events per Callback dorthin weiterleiten.',
    'pricing-heading': 'Kostenlos. MIT. F&uuml;r immer.',
    'pricing-free-text': 'Alles auf dieser Seite: die Engine, das Stylesheet, die Widgets, der Reading-Tracker. Self-hosted, keine Tiers, keine Features hinter Paywalls. Forken, shippen, damit Geld verdienen.',
    'chapter-colophon': '07 / COLOPHON',
    'colophon-heading': 'Colophon',
    'colophon-claim': 'Lighthouse 100 in allen vier Kategorien. Die ganze Seite l&auml;dt unter 250 KB. Der Artikel selbst braucht null Client-JavaScript.',
    'colophon-method': 'Gerenderte Artikel brauchen null JavaScript. Die Interaktivit&auml;t dieser Seite kommt als kleine Islands; der Artikel oben kam als statisches HTML. Quelltext ansehen.',
    'colophon-install': 'Das Widget ist __DRUCK_WIDGET_KB__ kB gzipped, via jsDelivr. Lieber npm: <code>__DRUCK_INSTALL_CMD__</code>.',
    'signature': 'Druck wurde aus <a href="https://sonto.tech" target="_blank" rel="noopener noreferrer">Sonto</a> extrahiert, wo diese Engine tausende Produktions-Artikel in f&uuml;nf Sprachen gerendert hat.',
  },
};

const STORAGE_KEY = 'druck-lang';

function pageLang(): Lang {
  return document.documentElement.dataset.lang === 'de' ? 'de' : 'en';
}

function storedLang(): Lang | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'de') return stored;
  } catch {}
  return null;
}

function landingUrlFor(lang: Lang): string {
  const enPath = location.pathname.replace(/de\/$/, '');
  const base = enPath.endsWith('/') ? enPath : `${enPath}/`;
  return lang === 'de' ? `${base}de/` : base;
}

function updateLangButtons(lang: Lang): void {
  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-island="lang"]')) {
    const pressed = btn.dataset.lang === lang;
    btn.setAttribute('aria-pressed', String(pressed));
  }
}

export function initLang(): void {
  const lang = pageLang();
  const stored = storedLang();
  if (stored && stored !== lang) {
    const target = landingUrlFor(stored);
    if (target !== location.pathname) {
      location.replace(target + location.search + location.hash);
      return;
    }
  }

  applyLang(lang);
  updateLangButtons(lang);
  document.documentElement.lang = lang;
  document.documentElement.removeAttribute('data-i18n-pending');

  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-island="lang"]')) {
    btn.addEventListener('click', () => {
      const target = (btn.dataset.lang === 'de' ? 'de' : 'en') as Lang;
      try { localStorage.setItem(STORAGE_KEY, target); } catch {}
      if (target === pageLang()) return;
      location.assign(landingUrlFor(target) + location.search + location.hash);
    });
  }
}

export function applyLang(lang: Lang): void {
  const strings = translations[lang];
  const kbEl = document.querySelector('[data-i18n="colophon-install"]');
  const kbValue = kbEl?.textContent?.match(/(\d+\.?\d*)\s*kB/)?.[1] ?? '';
  const cmdEl = kbEl?.querySelector('code');
  const cmdValue = cmdEl?.textContent ?? '';

  for (const [key, value] of Object.entries(strings)) {
    if (key === 'title') { document.title = value; continue; }
    if (key === 'description') {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', value);
      continue;
    }
    const el = document.querySelector<HTMLElement>(`[data-i18n="${key}"]`);
    if (el) {
      let html = value;
      if (key === 'colophon-install') {
        html = html.replace('__DRUCK_WIDGET_KB__', kbValue).replace('__DRUCK_INSTALL_CMD__', cmdValue);
      }
      el.innerHTML = html;
    }
  }

  for (const widget of document.querySelectorAll('druck-feed, druck-article')) {
    widget.setAttribute('lang', lang);
    const deSrc = widget.getAttribute('data-src-de');
    const enSrc = widget.getAttribute('data-src');
    if (deSrc && enSrc && widget.hasAttribute('src')) {
      widget.setAttribute('src', lang === 'de' ? deSrc : enSrc);
    }
  }

  for (const link of document.querySelectorAll<HTMLAnchorElement>('a[href*="/demos/"]')) {
    const base = link.getAttribute('href')?.match(/^(.*\/demos\/[\w-]+)\/(?:de\/)?$/)?.[1];
    if (base) link.setAttribute('href', `${base}/${lang === 'de' ? 'de/' : ''}`);
  }
}
