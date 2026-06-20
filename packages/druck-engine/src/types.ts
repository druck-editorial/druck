// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
export type ArticleFormat = 'feature' | 'quick_take' | 'wire';

export type Category =
  | 'ai'
  | 'dev'
  | 'dev-tools'
  | 'security'
  | 'infrastructure'
  | 'policy'
  | 'startup'
  | 'business'
  | 'science'
  | 'general'
  | 'weekly';

export interface Chapter {
  title: string;
  titleAccentWord?: string;
  bodyHtml: string;
}

export interface KeyPoint {
  text: string;
}

export interface StatAside {
  value: string;
  label: string;
}

export interface SourceQuote {
  text: string;
  attribution?: string;
  source?: string;
  sourceUrl?: string;
}

export interface Figure {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface KnowCard {
  items: string[];
}

export interface ArticleData {
  title: string;
  titleAccentWord?: string;
  subtitle: string;
  metaDescription: string;
  slug: string;
  format: ArticleFormat;
  hot?: boolean;
  category: Category;
  publishedAt: string;
  readingTime?: string;
  heroImage?: string;
  heroImageAlt?: string;
  heroImageWidth?: number;
  heroImageHeight?: number;
  heroCaption?: string;

  byline?: {
    author: string;
    date: string;
  };

  lens?: string;
  lensRationale?: string;

  chapters?: Chapter[];
  keyPoints?: KeyPoint[];
  known?: KnowCard;
  unknown?: KnowCard;
  editorsNote?: string;
  sourceCount?: number;

  stats?: StatAside[];
  quotes?: SourceQuote[];
  figures?: Figure[];

  bodyHtml?: string;

  pullQuote?: string;
  whyItMatters?: string;

  shareUrl?: string;

  related?: RelatedArticle[];
}

export interface RelatedArticle {
  title: string;
  url: string;
  category?: Category;
  image?: string;
}

export interface WeeklyData {
  title: string;
  subtitle: string;
  metaDescription: string;
  slug: string;
  date: string;
  heroImage: string;
  thesis: string;
  sections: WeeklySection[];
  keyPoints?: KeyPoint[];
  known?: KnowCard;
  unknown?: KnowCard;
  shareUrl?: string;
  related?: RelatedArticle[];
}

export interface WeeklySection {
  title: string;
  narrative: string;
  keyPoints?: KeyPoint[];
  articles?: WeeklySectionArticle[];
}

export interface WeeklySectionArticle {
  title: string;
  url: string;
  category?: Category;
  image?: string;
  summary?: string;
}

export type FrontPageLook =
  | 'classic'
  | 'swiss'
  | 'broadsheet'
  | 'brutalist'
  | 'luxury'
  | 'noir'
  | 'bento';

export interface RenderOptions {
  lang?: string;
  theme?: 'light' | 'dark';
  accentColor?: string;
  siteName?: string;
  siteUrl?: string;
  canonicalUrl?: string;
  ogImageUrl?: string;
  look?: FrontPageLook;
}