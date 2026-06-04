import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = `${__dirname}/../dist`;

mkdirSync(dist, { recursive: true });

const js = readFileSync(`${dist}/druck-widget.js`, 'utf-8');
const wrapped = `// @druck/widget — editorial article renderer\n${js}`;
writeFileSync(`${dist}/druck-widget.js`, wrapped);
console.log('bundled');