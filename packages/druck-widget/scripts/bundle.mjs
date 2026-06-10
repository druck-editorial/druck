// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

await build({
  entryPoints: [join(root, 'src/druck-widget.ts')],
  bundle: true,
  format: 'esm',
  target: 'es2022',
  minify: true,
  outfile: join(root, 'dist/druck-widget.js'),
  allowOverwrite: true,
  banner: {
    js: '/*! SPDX-License-Identifier: MIT | Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com> */',
  },
});
console.log('bundled dist/druck-widget.js');
