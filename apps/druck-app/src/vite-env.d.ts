// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
/// <reference types="vite/client" />

declare module '*.svg?raw' {
  const content: string;
  export default content;
}

declare module '@druck-editorial/widget' {
  export {};
}
