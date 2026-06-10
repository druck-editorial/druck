// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildFrontPage, escapeHtml, renderArticle, renderFrontPage } from '@druck-editorial/engine';
import { WIDGET_CDN_URL } from './constants.mjs';

async function readFixture(dir, name) {
  const raw = await readFile(join(dir, name), 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`fixture ${name} is not valid JSON: ${error.message}`);
  }
}

function embedFooter(articleTag, articleSrcAttr, feedTag, feedSrcAttr) {
  const scriptTag = escapeHtml(`<script type="module" src="${WIDGET_CDN_URL}"></script>`);
  const feedLine = feedTag ? escapeHtml(`<${feedTag} ${feedSrcAttr}></${feedTag}>`) : null;
  const articleLine = escapeHtml(`<${articleTag} ${articleSrcAttr}></${articleTag}>`);
  const codeLines = [scriptTag, feedLine, articleLine].filter(Boolean).join('\n');
  const label = feedTag
    ? 'Embeds that produce this page at runtime'
    : 'Embed that produces this page at runtime';
  return (
    '<footer class="demo-embed-footer">' +
    `<p class="demo-embed-label">${label}</p>` +
    `<pre class="demo-embed-code"><code>${codeLines}</code></pre>` +
    '</footer>'
  );
}

function demoShell({ slug, title, description, css, bodyHtml, includeArticleCss = false, includeFeedCss = false }) {
  const extra = [
    includeFeedCss ? '<link rel="stylesheet" href="/feed.css">' : '',
    includeArticleCss ? '<link rel="stylesheet" href="/article.css">' : '',
  ].filter(Boolean).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
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
<a class="druck-attribution" href="/">A druck demo &mdash; this publication does not exist. &larr; druck</a>
${bodyHtml}
</body>
</html>`;
}

function sectionDivider(text) {
  return `<div class="demo-section-divider" aria-hidden="true"><span>${escapeHtml(text)}</span></div>`;
}

function embedFooterFeed(elementTag, srcAttr) {
  const scriptTag = escapeHtml(`<script type="module" src="${WIDGET_CDN_URL}"></script>`);
  const elementLine = escapeHtml(`<${elementTag} ${srcAttr}></${elementTag}>`);
  return (
    '<footer class="demo-embed-footer">' +
    '<p class="demo-embed-label">Embed that produces this front page at runtime</p>' +
    `<pre class="demo-embed-code"><code>${scriptTag}\n${elementLine}</code></pre>` +
    '</footer>'
  );
}

export async function musicReview(fixturesDir) {
  const [data, feedItems] = await Promise.all([
    readFixture(fixturesDir, 'frame-music.json'),
    readFixture(fixturesDir, 'tuning-fork-feed.json'),
  ]);
  const articleHtml = renderArticle(data);
  const frontPageHtml = renderFrontPage(buildFrontPage(feedItems));

  const scoreMatch = /<aside data-stat="([^"]+)">/.exec(data.chapters?.[0]?.bodyHtml ?? '');
  const score = scoreMatch ? scoreMatch[1] : '8.4';

  const body =
    '<header class="ph-header">' +
    '<a class="ph-logo" href="/">PITCH &amp; REVERB</a>' +
    '<nav class="ph-nav" aria-label="Site navigation"><a href="#">Reviews</a><a href="#">Lists</a><a href="#">Features</a><a href="#">Live</a></nav>' +
    '</header>' +
    '<main class="ph-main">' +
    frontPageHtml +
    '</main>' +
    sectionDivider('Now playing') +
    '<div class="ph-score-bar">' +
    `<span class="ph-score-number">${escapeHtml(score)}</span>` +
    '<span class="ph-score-label">Best New Music</span>' +
    '</div>' +
    '<main class="ph-main ph-main--article">' +
    articleHtml +
    '</main>' +
    embedFooter('druck-article', 'src="story.json"', 'druck-feed', 'layout="front-page" src="feed.json"') +
    '<footer class="ph-footer"><p>PITCH &amp; REVERB &mdash; independent music criticism since 2019. This publication does not exist.</p></footer>';

  return {
    slug: 'music-review',
    html: demoShell({
      slug: 'music-review',
      title: `${data.title} — PITCH & REVERB`,
      description: data.metaDescription,
      css: 'music-review',
      bodyHtml: body,
      includeArticleCss: true,
      includeFeedCss: true,
    }),
  };
}

export async function fashionMagazine(fixturesDir) {
  const [data, feedItems] = await Promise.all([
    readFixture(fixturesDir, 'frame-fashion.json'),
    readFixture(fixturesDir, 'atelier-feed.json'),
  ]);
  const articleHtml = renderArticle(data);
  const frontPageHtml = renderFrontPage(buildFrontPage(feedItems));

  const body =
    '<header class="at-header">' +
    '<div class="at-header-inner">' +
    '<p class="at-issue">Vol. XII &mdash; Jun 2026</p>' +
    '<a class="at-logo" href="/">A T E L I E R</a>' +
    '<nav class="at-nav" aria-label="Site navigation"><a href="#">Collections</a><a href="#">Essays</a><a href="#">Archive</a></nav>' +
    '</div>' +
    '</header>' +
    '<main class="at-main">' +
    frontPageHtml +
    '</main>' +
    sectionDivider('From the current issue') +
    '<main class="at-main at-main--article">' +
    articleHtml +
    '</main>' +
    embedFooter('druck-article', 'src="story.json"', 'druck-feed', 'layout="front-page" src="feed.json"') +
    '<footer class="at-footer"><p>ATELIER Journal &mdash; fashion, culture, criticism. This publication does not exist.</p></footer>';

  return {
    slug: 'fashion-magazine',
    html: demoShell({
      slug: 'fashion-magazine',
      title: `${data.title} — ATELIER`,
      description: data.metaDescription,
      css: 'fashion-magazine',
      bodyHtml: body,
      includeArticleCss: true,
      includeFeedCss: true,
    }),
  };
}

export async function devBlog(fixturesDir) {
  const [data, feedItems] = await Promise.all([
    readFixture(fixturesDir, 'wire.json'),
    readFixture(fixturesDir, 'deploy-log-feed.json'),
  ]);
  const articleHtml = renderArticle(data);
  const frontPageHtml = renderFrontPage(buildFrontPage(feedItems));

  const body =
    '<header class="dl-header">' +
    '<a class="dl-logo" href="/">deploy.log</a>' +
    '<nav class="dl-nav" aria-label="Site navigation"><a href="#">posts</a><a href="#">rss</a><a href="#">about</a></nav>' +
    '</header>' +
    '<main class="dl-main">' +
    frontPageHtml +
    '</main>' +
    sectionDivider('Latest post') +
    '<main class="dl-main dl-main--article">' +
    articleHtml +
    '<aside class="dl-subscribe">' +
    '<p class="dl-subscribe-heading">Get posts by email</p>' +
    '<p class="dl-subscribe-body">New entries roughly twice a month. No tracking, no digest bundles. Unsubscribe any time.</p>' +
    '<form class="dl-subscribe-form" action="#" method="post">' +
    '<label class="dl-subscribe-label" for="dl-email">Email address</label>' +
    '<div class="dl-subscribe-row">' +
    '<input class="dl-subscribe-input" id="dl-email" name="email" type="email" placeholder="you@example.com" required>' +
    '<button class="dl-subscribe-btn" type="button">Subscribe</button>' +
    '</div>' +
    '</form>' +
    '</aside>' +
    '</main>' +
    embedFooter('druck-article', 'src="story.json"', 'druck-feed', 'layout="front-page" src="feed.json"') +
    '<footer class="dl-footer"><p>deploy.log &mdash; a personal technical blog. This publication does not exist.</p></footer>';

  return {
    slug: 'dev-blog',
    html: demoShell({
      slug: 'dev-blog',
      title: `${data.title} — deploy.log`,
      description: data.metaDescription,
      css: 'dev-blog',
      bodyHtml: body,
      includeArticleCss: true,
      includeFeedCss: true,
    }),
  };
}

export async function newsroom(fixturesDir) {
  const [data, feedItems] = await Promise.all([
    readFixture(fixturesDir, 'demo-newsroom.json'),
    readFixture(fixturesDir, 'northwind-feed.json'),
  ]);
  const articleHtml = renderArticle(data);
  const frontPageHtml = renderFrontPage(buildFrontPage(feedItems));

  const body =
    '<header class="nw-header">' +
    '<div class="nw-header-inner">' +
    '<a class="nw-logo" href="/">NORTHWIND</a>' +
    '<nav class="nw-nav" aria-label="Site navigation"><a href="#">Product</a><a href="#">Newsroom</a><a href="#">Docs</a><a href="#">Company</a></nav>' +
    '</div>' +
    '</header>' +
    '<section class="nw-feed-section" aria-label="Latest from newsroom">' +
    '<div class="nw-feed-inner">' +
    frontPageHtml +
    '</div>' +
    '</section>' +
    sectionDivider('Full release') +
    '<div class="nw-breadcrumbs" aria-label="Breadcrumb">' +
    '<a href="/">Home</a><span aria-hidden="true">/</span><a href="#">Newsroom</a><span aria-hidden="true">/</span><span aria-current="page">Press Release</span>' +
    '</div>' +
    '<div class="nw-layout">' +
    '<main class="nw-main">' +
    articleHtml +
    '</main>' +
    '<aside class="nw-sidebar">' +
    '<div class="nw-press-contact">' +
    '<p class="nw-sidebar-heading">Press contact</p>' +
    '<p class="nw-sidebar-name">Sarah Vance</p>' +
    '<p class="nw-sidebar-role">Head of Communications</p>' +
    '<a class="nw-sidebar-link" href="mailto:press@northwind.example">press@northwind.example</a>' +
    '</div>' +
    '<div class="nw-press-assets">' +
    '<p class="nw-sidebar-heading">Press assets</p>' +
    '<ul class="nw-sidebar-list">' +
    '<li><a href="#">Brand kit (ZIP)</a></li>' +
    '<li><a href="#">Product screenshots</a></li>' +
    '<li><a href="#">Executive headshots</a></li>' +
    '</ul>' +
    '</div>' +
    '</aside>' +
    '</div>' +
    embedFooter('druck-article', 'src="story.json"', 'druck-feed', 'layout="front-page" src="feed.json"') +
    '<footer class="nw-footer"><p>&copy; 2026 Northwind Inc. &mdash; This company does not exist.</p></footer>';

  return {
    slug: 'newsroom',
    html: demoShell({
      slug: 'newsroom',
      title: `${data.title} — NORTHWIND Newsroom`,
      description: data.metaDescription,
      css: 'newsroom',
      bodyHtml: body,
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

function renderMappingExample() {
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
    '<p class="tg-mapping-label">Your bot maps each post to ArticleData fields:</p>' +
    `<pre class="tg-mapping-code"><code>${escapeHtml(code)}</code></pre>` +
    '<p class="tg-mapping-note">druck does not import Telegram. Your bot does. druck renders what you give it.</p>' +
    '</div>'
  );
}

export async function telegramBrief(fixturesDir) {
  const [feedItems, posts] = await Promise.all([
    readFixture(fixturesDir, 'demo-feed-markets.json'),
    readFixture(fixturesDir, 'tg-posts.json'),
  ]);

  const frontPageHtml = renderFrontPage(buildFrontPage(feedItems));

  const postBubbles = posts.map(renderTgPost).join('');

  const body =
    '<header class="ll-header">' +
    '<a class="ll-logo" href="/">LEDGERLINE</a>' +
    '<nav class="ll-nav" aria-label="Site navigation"><a href="#">Briefs</a><a href="#">Data</a><a href="#">Archive</a></nav>' +
    '</header>' +
    '<div class="ll-layout">' +
    '<aside class="ll-rail">' +
    '<div class="ll-channel-header">' +
    '<span class="ll-channel-name">t.me/ledgerline</span>' +
    '<span class="ll-channel-sub">4,812 subscribers</span>' +
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
    '<h2 class="ll-how-title">How the posts became JSON</h2>' +
    '<div class="ll-how-steps">' +
    '<div class="ll-how-step">' +
    '<p class="ll-step-label">1. The post</p>' +
    renderTgPost(posts[1]) +
    '</div>' +
    '<div class="ll-how-step">' +
    '<p class="ll-step-label">2. Your bot maps it</p>' +
    renderMappingExample() +
    '</div>' +
    '<div class="ll-how-step">' +
    '<p class="ll-step-label">3. druck renders it</p>' +
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
    embedFooter('druck-feed', 'layout="front-page" src="feed.json"') +
    '<footer class="ll-footer"><p>LEDGERLINE &mdash; daily markets intelligence. This publication does not exist.</p></footer>';

  return {
    slug: 'telegram-brief',
    html: demoShell({
      slug: 'telegram-brief',
      title: 'LEDGERLINE — Markets from Telegram to Magazine',
      description: 'Daily markets intelligence published from a Telegram channel via druck.',
      css: 'telegram-brief',
      bodyHtml: body,
      includeFeedCss: true,
    }),
  };
}
