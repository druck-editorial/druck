// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildFrontPage, escapeHtml, renderArticle, renderFrontPage } from '@druck-editorial/engine';
import { WIDGET_CDN_URL } from './constants.mjs';

const STRINGS = {
  en: {
    attribution: 'A druck demo &mdash; this publication does not exist. &larr; druck',
    embedMulti: 'Embeds that produce this page at runtime',
    embedSingle: 'Embed that produces this page at runtime',
    music: {
      nav: ['Reviews', 'Lists', 'Features', 'Live'],
      nowPlaying: 'Now playing',
      bestNew: 'Best New Music',
      ratedAria: (s) => `Rated ${s} out of 10`,
      ratingCaption: (s) => `PITCH &amp; REVERB rating &middot; ${s} / 10`,
      footer: 'PITCH &amp; REVERB &mdash; independent music criticism since 2019. This publication does not exist.',
    },
    fashion: {
      issue: 'Vol. XII &mdash; Jun 2026',
      nav: ['Collections', 'Essays', 'Archive'],
      divider: 'From the current issue',
      footer: 'ATELIER Journal &mdash; fashion, culture, criticism. This publication does not exist.',
    },
    dev: {
      nav: ['posts', 'rss', 'about'],
      divider: 'Latest post',
      subscribeHeading: 'Get posts by email',
      subscribeBody: 'New entries roughly twice a month. No tracking, no digest bundles. Unsubscribe any time.',
      emailLabel: 'Email address',
      subscribeBtn: 'Subscribe',
      footer: 'deploy.log &mdash; a personal technical blog. This publication does not exist.',
    },
    news: {
      nav: ['Product', 'Newsroom', 'Docs', 'Company'],
      feedAria: 'Latest from newsroom',
      divider: 'Full release',
      crumbHome: 'Home',
      crumbNewsroom: 'Newsroom',
      crumbRelease: 'Press Release',
      pressContact: 'Press contact',
      contactRole: 'Head of Communications',
      pressAssets: 'Press assets',
      assets: ['Brand kit (ZIP)', 'Product screenshots', 'Executive headshots'],
      footer: '&copy; 2026 Northwind Inc. &mdash; This company does not exist.',
    },
    tg: {
      nav: ['Briefs', 'Data', 'Archive'],
      subscribers: '4,812 subscribers',
      howTitle: 'How the posts became JSON',
      step1: '1. The post',
      step2: '2. Your bot maps it',
      step3: '3. druck renders it',
      mappingLabel: 'Your bot maps each post to ArticleData fields:',
      mappingNote: 'druck does not import Telegram. Your bot does. druck renders what you give it.',
      footer: 'LEDGERLINE &mdash; daily markets intelligence. This publication does not exist.',
      title: 'LEDGERLINE — Markets from Telegram to Magazine',
      description: 'Daily markets intelligence published from a Telegram channel via druck.',
    },
  },
  de: {
    attribution: 'Eine druck-Demo &mdash; diese Publikation existiert nicht. &larr; druck',
    embedMulti: 'Einbettungen, die diese Seite zur Laufzeit erzeugen',
    embedSingle: 'Einbettung, die diese Seite zur Laufzeit erzeugt',
    music: {
      nav: ['Reviews', 'Listen', 'Features', 'Live'],
      nowPlaying: 'Läuft gerade',
      bestNew: 'Beste neue Musik',
      ratedAria: (s) => `Bewertet mit ${s} von 10`,
      ratingCaption: (s) => `PITCH &amp; REVERB Wertung &middot; ${s} / 10`,
      footer: 'PITCH &amp; REVERB &mdash; unabhängige Musikkritik seit 2019. Diese Publikation existiert nicht.',
    },
    fashion: {
      issue: 'Vol. XII &mdash; Juni 2026',
      nav: ['Kollektionen', 'Essays', 'Archiv'],
      divider: 'Aus der aktuellen Ausgabe',
      footer: 'ATELIER Journal &mdash; Mode, Kultur, Kritik. Diese Publikation existiert nicht.',
    },
    dev: {
      nav: ['beiträge', 'rss', 'über'],
      divider: 'Neuester Beitrag',
      subscribeHeading: 'Beiträge per E-Mail',
      subscribeBody: 'Neue Einträge etwa zweimal im Monat. Kein Tracking, keine Sammel-Newsletter. Jederzeit abbestellbar.',
      emailLabel: 'E-Mail-Adresse',
      subscribeBtn: 'Abonnieren',
      footer: 'deploy.log &mdash; ein persönliches Technik-Blog. Diese Publikation existiert nicht.',
    },
    news: {
      nav: ['Produkt', 'Newsroom', 'Docs', 'Unternehmen'],
      feedAria: 'Neuestes aus dem Newsroom',
      divider: 'Vollständige Mitteilung',
      crumbHome: 'Start',
      crumbNewsroom: 'Newsroom',
      crumbRelease: 'Pressemitteilung',
      pressContact: 'Pressekontakt',
      contactRole: 'Leiterin Kommunikation',
      pressAssets: 'Pressematerial',
      assets: ['Marken-Kit (ZIP)', 'Produkt-Screenshots', 'Vorstands-Porträts'],
      footer: '&copy; 2026 Northwind Inc. &mdash; Dieses Unternehmen existiert nicht.',
    },
    tg: {
      nav: ['Briefings', 'Daten', 'Archiv'],
      subscribers: '4.812 Abonnenten',
      howTitle: 'Wie aus den Posts JSON wurde',
      step1: '1. Der Post',
      step2: '2. Dein Bot mappt ihn',
      step3: '3. druck rendert ihn',
      mappingLabel: 'Dein Bot mappt jeden Post auf ArticleData-Felder:',
      mappingNote: 'druck importiert kein Telegram. Dein Bot tut das. druck rendert, was du ihm gibst.',
      footer: 'LEDGERLINE &mdash; tägliche Markt-Intelligence. Diese Publikation existiert nicht.',
      title: 'LEDGERLINE — Märkte von Telegram zum Magazin',
      description: 'Tägliche Markt-Intelligence, aus einem Telegram-Kanal via druck veröffentlicht.',
    },
  },
};

async function readFixture(dir, name, lang = 'en') {
  const file = lang === 'de' ? name.replace(/\.json$/, '.de.json') : name;
  const raw = await readFile(join(dir, file), 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`fixture ${file} is not valid JSON: ${error.message}`);
  }
}

function navLinks(items) {
  return items.map((label) => `<a href="#">${escapeHtml(label)}</a>`).join('');
}

function embedFooter(s, articleTag, articleSrcAttr, feedTag, feedSrcAttr) {
  const scriptTag = escapeHtml(`<script type="module" src="${WIDGET_CDN_URL}"></script>`);
  const feedLine = feedTag ? escapeHtml(`<${feedTag} ${feedSrcAttr}></${feedTag}>`) : null;
  const articleLine = escapeHtml(`<${articleTag} ${articleSrcAttr}></${articleTag}>`);
  const codeLines = [scriptTag, feedLine, articleLine].filter(Boolean).join('\n');
  const label = feedTag ? s.embedMulti : s.embedSingle;
  return (
    '<footer class="demo-embed-footer">' +
    `<p class="demo-embed-label">${label}</p>` +
    `<pre class="demo-embed-code"><code>${codeLines}</code></pre>` +
    '</footer>'
  );
}

function demoShell({ slug, title, description, bodyHtml, lang, attribution, includeArticleCss = false, includeFeedCss = false }) {
  const extra = [
    includeFeedCss ? '<link rel="stylesheet" href="/feed.css">' : '',
    includeArticleCss ? '<link rel="stylesheet" href="/article.css">' : '',
  ].filter(Boolean).join('\n');
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="noindex">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/fonts.css">
<link rel="stylesheet" href="/demos/${escapeHtml(slug)}.css">
${extra}
</head>
<body>
<a class="druck-attribution" href="/">${attribution}</a>
${bodyHtml}
</body>
</html>`;
}

function sectionDivider(text) {
  return `<div class="demo-section-divider" aria-hidden="true"><span>${escapeHtml(text)}</span></div>`;
}

export async function musicReview(fixturesDir, lang = 'en') {
  const s = STRINGS[lang];
  const m = s.music;
  const [data, feedItems] = await Promise.all([
    readFixture(fixturesDir, 'frame-music.json', lang),
    readFixture(fixturesDir, 'tuning-fork-feed.json', lang),
  ]);
  const articleHtml = renderArticle(data);
  const frontPageHtml = renderFrontPage(buildFrontPage(feedItems));

  const scoreMatch = /<aside data-stat="([^"]+)">/.exec(data.chapters?.[0]?.bodyHtml ?? '');
  const score = scoreMatch ? scoreMatch[1] : '8.4';

  const body =
    '<header class="ph-header">' +
    '<a class="ph-logo" href="/">PITCH &amp; REVERB</a>' +
    `<nav class="ph-nav" aria-label="Site navigation">${navLinks(m.nav)}</nav>` +
    '</header>' +
    '<main class="ph-main">' +
    frontPageHtml +
    '</main>' +
    sectionDivider(m.nowPlaying) +
    '<div class="ph-score-bar">' +
    `<span class="ph-score-number" aria-label="${escapeHtml(m.ratedAria(score))}">${escapeHtml(score)}</span>` +
    '<span class="ph-score-meta">' +
    `<span class="ph-score-label">${m.bestNew}</span>` +
    `<span class="ph-score-caption">${m.ratingCaption(escapeHtml(score))}</span>` +
    '</span>' +
    '</div>' +
    '<main class="ph-main ph-main--article">' +
    articleHtml +
    '</main>' +
    embedFooter(s, 'druck-article', 'src="story.json"', 'druck-feed', 'layout="front-page" src="feed.json"') +
    `<footer class="ph-footer"><p>${m.footer}</p></footer>`;

  return {
    slug: 'music-review',
    html: demoShell({
      slug: 'music-review',
      title: `${data.title} — PITCH & REVERB`,
      description: data.metaDescription,
      bodyHtml: body,
      lang,
      attribution: s.attribution,
      includeArticleCss: true,
      includeFeedCss: true,
    }),
  };
}

export async function fashionMagazine(fixturesDir, lang = 'en') {
  const s = STRINGS[lang];
  const f = s.fashion;
  const [data, feedItems] = await Promise.all([
    readFixture(fixturesDir, 'frame-fashion.json', lang),
    readFixture(fixturesDir, 'atelier-feed.json', lang),
  ]);
  const articleHtml = renderArticle(data);
  const frontPageHtml = renderFrontPage(buildFrontPage(feedItems));

  const body =
    '<header class="at-header">' +
    '<div class="at-header-inner">' +
    `<p class="at-issue">${f.issue}</p>` +
    '<a class="at-logo" href="/">A T E L I E R</a>' +
    `<nav class="at-nav" aria-label="Site navigation">${navLinks(f.nav)}</nav>` +
    '</div>' +
    '</header>' +
    '<main class="at-main">' +
    frontPageHtml +
    '</main>' +
    sectionDivider(f.divider) +
    '<main class="at-main at-main--article">' +
    articleHtml +
    '</main>' +
    embedFooter(s, 'druck-article', 'src="story.json"', 'druck-feed', 'layout="front-page" src="feed.json"') +
    `<footer class="at-footer"><p>${f.footer}</p></footer>`;

  return {
    slug: 'fashion-magazine',
    html: demoShell({
      slug: 'fashion-magazine',
      title: `${data.title} — ATELIER`,
      description: data.metaDescription,
      bodyHtml: body,
      lang,
      attribution: s.attribution,
      includeArticleCss: true,
      includeFeedCss: true,
    }),
  };
}

export async function devBlog(fixturesDir, lang = 'en') {
  const s = STRINGS[lang];
  const d = s.dev;
  const [data, feedItems] = await Promise.all([
    readFixture(fixturesDir, 'wire.json', lang),
    readFixture(fixturesDir, 'deploy-log-feed.json', lang),
  ]);
  const articleHtml = renderArticle(data);
  const frontPageHtml = renderFrontPage(buildFrontPage(feedItems));

  const body =
    '<header class="dl-header">' +
    '<a class="dl-logo" href="/">deploy.log</a>' +
    `<nav class="dl-nav" aria-label="Site navigation">${navLinks(d.nav)}</nav>` +
    '</header>' +
    '<main class="dl-main">' +
    frontPageHtml +
    '</main>' +
    sectionDivider(d.divider) +
    '<main class="dl-main dl-main--article">' +
    articleHtml +
    '<aside class="dl-subscribe">' +
    `<p class="dl-subscribe-heading">${d.subscribeHeading}</p>` +
    `<p class="dl-subscribe-body">${d.subscribeBody}</p>` +
    '<form class="dl-subscribe-form" action="#" method="post">' +
    `<label class="dl-subscribe-label" for="dl-email">${d.emailLabel}</label>` +
    '<div class="dl-subscribe-row">' +
    '<input class="dl-subscribe-input" id="dl-email" name="email" type="email" placeholder="you@example.com" required>' +
    `<button class="dl-subscribe-btn" type="button">${d.subscribeBtn}</button>` +
    '</div>' +
    '</form>' +
    '</aside>' +
    '</main>' +
    embedFooter(s, 'druck-article', 'src="story.json"', 'druck-feed', 'layout="front-page" src="feed.json"') +
    `<footer class="dl-footer"><p>${d.footer}</p></footer>`;

  return {
    slug: 'dev-blog',
    html: demoShell({
      slug: 'dev-blog',
      title: `${data.title} — deploy.log`,
      description: data.metaDescription,
      bodyHtml: body,
      lang,
      attribution: s.attribution,
      includeArticleCss: true,
      includeFeedCss: true,
    }),
  };
}

export async function newsroom(fixturesDir, lang = 'en') {
  const s = STRINGS[lang];
  const n = s.news;
  const [data, feedItems] = await Promise.all([
    readFixture(fixturesDir, 'demo-newsroom.json', lang),
    readFixture(fixturesDir, 'northwind-feed.json', lang),
  ]);
  const articleHtml = renderArticle(data);
  const frontPageHtml = renderFrontPage(buildFrontPage(feedItems));

  const body =
    '<header class="nw-header">' +
    '<div class="nw-header-inner">' +
    '<a class="nw-logo" href="/">NORTHWIND</a>' +
    `<nav class="nw-nav" aria-label="Site navigation">${navLinks(n.nav)}</nav>` +
    '</div>' +
    '</header>' +
    `<section class="nw-feed-section" aria-label="${escapeHtml(n.feedAria)}">` +
    '<div class="nw-feed-inner">' +
    frontPageHtml +
    '</div>' +
    '</section>' +
    sectionDivider(n.divider) +
    '<div class="nw-breadcrumbs" aria-label="Breadcrumb">' +
    `<a href="/">${escapeHtml(n.crumbHome)}</a><span aria-hidden="true">/</span><a href="#">${escapeHtml(n.crumbNewsroom)}</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(n.crumbRelease)}</span>` +
    '</div>' +
    '<div class="nw-layout">' +
    '<main class="nw-main">' +
    articleHtml +
    '</main>' +
    '<aside class="nw-sidebar">' +
    '<div class="nw-press-contact">' +
    `<p class="nw-sidebar-heading">${escapeHtml(n.pressContact)}</p>` +
    '<p class="nw-sidebar-name">Sarah Vance</p>' +
    `<p class="nw-sidebar-role">${escapeHtml(n.contactRole)}</p>` +
    '<a class="nw-sidebar-link" href="mailto:press@northwind.example">press@northwind.example</a>' +
    '</div>' +
    '<div class="nw-press-assets">' +
    `<p class="nw-sidebar-heading">${escapeHtml(n.pressAssets)}</p>` +
    '<ul class="nw-sidebar-list">' +
    n.assets.map((a) => `<li><a href="#">${escapeHtml(a)}</a></li>`).join('') +
    '</ul>' +
    '</div>' +
    '</aside>' +
    '</div>' +
    embedFooter(s, 'druck-article', 'src="story.json"', 'druck-feed', 'layout="front-page" src="feed.json"') +
    `<footer class="nw-footer"><p>${n.footer}</p></footer>`;

  return {
    slug: 'newsroom',
    html: demoShell({
      slug: 'newsroom',
      title: `${data.title} — NORTHWIND Newsroom`,
      description: data.metaDescription,
      bodyHtml: body,
      lang,
      attribution: s.attribution,
      includeArticleCss: true,
      includeFeedCss: true,
    }),
  };
}

function renderTgPost(post) {
  return (
    '<div class="tg-bubble">' +
    `<p class="tg-bubble-text">${escapeHtml(post.text)}</p>` +
    `<span class="tg-bubble-time">${escapeHtml(post.time)}</span>` +
    '</div>'
  );
}

function renderMappingExample(s) {
  const code = `async function onMessage(ctx) {
  const msg = ctx.message;
  await db.insert({
    title:       msg.text.split("\\n")[0].slice(0, 80),
    subtitle:    msg.text.split("\\n")[1] ?? "",
    slug:        slugify(msg.text, msg.message_id),
    format:      "wire",
    category:    "business",
    publishedAt: new Date(msg.date * 1000)
                   .toLocaleDateString("en-US", {
                     month: "short", day: "numeric", year: "numeric"
                   }),
    heroImage:   msg.photo?.[0]?.file_id ?? PLACEHOLDER,
    shareUrl:    \`https://ledgerline.site/briefs/\${slugify(msg.text)}\`,
    bodyHtml:    \`<p>\${msg.text}</p>\`,
  });
}`;
  return (
    '<div class="tg-mapping">' +
    `<p class="tg-mapping-label">${s.tg.mappingLabel}</p>` +
    `<pre class="tg-mapping-code"><code>${escapeHtml(code)}</code></pre>` +
    `<p class="tg-mapping-note">${s.tg.mappingNote}</p>` +
    '</div>'
  );
}

export async function telegramBrief(fixturesDir, lang = 'en') {
  const s = STRINGS[lang];
  const t = s.tg;
  const [feedItems, posts] = await Promise.all([
    readFixture(fixturesDir, 'demo-feed-markets.json', lang),
    readFixture(fixturesDir, 'tg-posts.json', lang),
  ]);

  const frontPageHtml = renderFrontPage(buildFrontPage(feedItems));

  const postBubbles = posts.map(renderTgPost).join('');

  const body =
    '<header class="ll-header">' +
    '<a class="ll-logo" href="/">LEDGERLINE</a>' +
    `<nav class="ll-nav" aria-label="Site navigation">${navLinks(t.nav)}</nav>` +
    '</header>' +
    '<div class="ll-layout">' +
    '<aside class="ll-rail">' +
    '<div class="ll-channel-header">' +
    '<span class="ll-channel-avatar" aria-hidden="true">L</span>' +
    '<span class="ll-channel-text">' +
    '<span class="ll-channel-name">t.me/ledgerline</span>' +
    `<span class="ll-channel-sub">${escapeHtml(t.subscribers)}</span>` +
    '</span>' +
    '</div>' +
    '<div class="ll-posts">' +
    postBubbles +
    '</div>' +
    '</aside>' +
    '<main class="ll-main">' +
    frontPageHtml +
    '</main>' +
    '</div>' +
    '<section class="ll-how">' +
    `<h2 class="ll-how-title">${escapeHtml(t.howTitle)}</h2>` +
    '<div class="ll-how-steps">' +
    '<div class="ll-how-step">' +
    `<p class="ll-step-label">${escapeHtml(t.step1)}</p>` +
    renderTgPost(posts[1]) +
    '</div>' +
    '<div class="ll-how-step">' +
    `<p class="ll-step-label">${escapeHtml(t.step2)}</p>` +
    renderMappingExample(s) +
    '</div>' +
    '<div class="ll-how-step">' +
    `<p class="ll-step-label">${escapeHtml(t.step3)}</p>` +
    '<pre class="ll-json-fragment"><code>' +
    escapeHtml(
      JSON.stringify(
        {
          title: feedItems[0].title,
          format: 'wire',
          category: 'business',
          publishedAt: feedItems[0].publishedAt,
          heroImage: feedItems[0].heroImage,
          bodyHtml: '<p>...</p>',
        },
        null,
        2,
      ),
    ) +
    '</code></pre>' +
    '</div>' +
    '</div>' +
    '</section>' +
    embedFooter(s, 'druck-feed', 'layout="front-page" src="feed.json"') +
    `<footer class="ll-footer"><p>${t.footer}</p></footer>`;

  return {
    slug: 'telegram-brief',
    html: demoShell({
      slug: 'telegram-brief',
      title: t.title,
      description: t.description,
      bodyHtml: body,
      lang,
      attribution: s.attribution,
      includeFeedCss: true,
    }),
  };
}
