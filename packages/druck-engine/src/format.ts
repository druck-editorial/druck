// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
const INLINE_ALLOWED_TAGS = new Set(['strong', 'em', 'b', 'i', 'span', 'a']);
const INLINE_ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href']),
  span: new Set(['class']),
  strong: new Set(['class']),
  em: new Set(['class']),
};
const SAFE_HREF_RE = /^(?:https?:|mailto:|\/|#)/i;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function sanitizeInline(html: string): string {
  let out = '';
  let i = 0;

  while (i < html.length) {
    if (html[i] === '<') {
      const closeMatch = html.slice(i).match(/^<\/(\w+)\s*>/);
      if (closeMatch) {
        const tag = closeMatch[1].toLowerCase();
        if (INLINE_ALLOWED_TAGS.has(tag)) out += `</${tag}>`;
        i += closeMatch[0].length;
        continue;
      }

      const openMatch = html.slice(i).match(/^<(\w+)([^>]*?)>/);
      if (openMatch) {
        const tag = openMatch[1].toLowerCase();
        if (INLINE_ALLOWED_TAGS.has(tag)) {
          const attrs = openMatch[2];
          const allowed = INLINE_ALLOWED_ATTRS[tag] ?? new Set();
          const kept: string[] = [];
          const attrRe = /(\w+)(?:="([^"]*)")?/g;
          let m: RegExpExecArray | null;
          while ((m = attrRe.exec(attrs)) !== null) {
            const name = m[1].toLowerCase();
            if (name.startsWith('on')) continue;
            if (!allowed.has(name)) continue;
            if (name === 'href') {
              const val = m[2] ?? '';
              if (!val || !SAFE_HREF_RE.test(val)) continue;
            }
            kept.push(` ${name}="${escapeHtml(m[2] ?? '')}"`);
          }
          out += `<${tag}${kept.join('')}>`;
        }
        i += openMatch[0].length;
        continue;
      }

      i += 1;
    } else if (html[i] === '&') {
      const entityMatch = html.slice(i).match(/^&(#?\w+);/);
      if (entityMatch) {
        out += entityMatch[0];
        i += entityMatch[0].length;
      } else {
        out += '&amp;';
        i += 1;
      }
    } else {
      out += html[i];
      i += 1;
    }
  }

  return out;
}

const STAT_RE = /<aside\s+data-stat="(?<value>[^"]+)">(?<label>.*?)<\/aside>/gis;
const QUOTE_RE = /<blockquote\s+(?:data-source="(?<src>[^"]*)"\s*)?(?:data-source-url="(?<url>[^"]*)"\s*)?(?:data-attr="(?<attr>[^"]*)"\s*)?>(?<text>.*?)<\/blockquote>/gis;
const TAG_STRIP_RE = /<[^>]+>/g;
const SCRIPT_RE = /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi;
const SCRIPT_OPEN_RE = /<script\b[^>]*>/gi;
const ON_ATTR_RE = /[\s/]+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const URL_ATTR_RE = /[\s/]+(?:href|src|xlink:href|formaction|poster)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
const DANGEROUS_SCHEME_RE = /^(?:javascript|vbscript|data)\s*:/i;
const DANGEROUS_TAG_RE = /<\/?(?:script|style|iframe|object|embed|form|input|button|textarea|select|meta|link|base|svg|math)\b[^>]*>/gi;

function fromCodePoint(code: number): string {
  return code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
}

function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_m, hex) => fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_m, dec) => fromCodePoint(parseInt(dec, 10)));
}

function stripDangerousUrlAttrs(html: string): string {
  return html.replace(URL_ATTR_RE, (match, doubleQuoted, singleQuoted) => {
    const raw = doubleQuoted ?? singleQuoted ?? '';
    const normalized = decodeEntities(raw).replace(/[\s\u0000-\u001f]+/g, '');
    return DANGEROUS_SCHEME_RE.test(normalized) ? '' : match;
  });
}

function sanitizeBody(html: string): string {
  return stripDangerousUrlAttrs(
    html
      .replace(SCRIPT_RE, '')
      .replace(SCRIPT_OPEN_RE, '')
      .replace(DANGEROUS_TAG_RE, '')
      .replace(ON_ATTR_RE, '')
  ).replace(/javascript\s*:/gi, '');
}

function plainStatValue(raw: string): string {
  return raw.replace(TAG_STRIP_RE, '').trim();
}

function transformInlineBlocks(bodyHtml: string): string {
  const safe = sanitizeBody(bodyHtml);
  return safe
    .replace(STAT_RE, (_match, _value, _label, offset, str, groups) => {
      const value = plainStatValue(groups?.value ?? _value);
      const label = (groups?.label ?? _label ?? '').trim();
      return (
        '<div class="article-stat">' +
        `<div class="big">${escapeHtml(value)}</div>` +
        `<div class="lbl">${sanitizeInline(label)}</div>` +
        '</div>'
      );
    })
    .replace(QUOTE_RE, (_match, _src, _url, _attr, _text, offset, str, groups) => {
      const text = (groups?.text ?? _text ?? '').trim();
      const attr = groups?.attr ?? _attr ?? '';
      const url = groups?.url ?? _url ?? '';
      const src = groups?.src ?? _src ?? '';

      let attrHtml = '';
      if (attr || src) {
        const linkLabel = src || 'Source';
        const safeUrl = url && SAFE_HREF_RE.test(url) ? url : '';
        const link = safeUrl
          ? ` &middot; <a href="${escapeHtml(safeUrl)}">${escapeHtml(linkLabel)}</a>`
          : '';
        attrHtml = `<div class="attr">${escapeHtml(attr)}${link}</div>`;
      }

      return (
        '<figure class="source-quote">' +
        `<p class="q">${sanitizeInline(text)}</p>` +
        attrHtml +
        '</figure>'
      );
    });
}

function safeUrl(url: string | undefined): string {
  return url && SAFE_HREF_RE.test(url) ? url : '';
}

export { escapeHtml, sanitizeInline, transformInlineBlocks, safeUrl };