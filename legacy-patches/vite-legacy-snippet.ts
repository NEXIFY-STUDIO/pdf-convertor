// Snippet applied to legacy vite.config.ts by scripts/legacy-dev.sh
export const legacyOptimizeDeps = {
  include: [
    '@react-pdf/renderer',
    'base64-js',
    'linebreak',
    'unicode-properties',
  ],
  needsInterop: ['base64-js'] as const,
};

export const legacyAliasBase64 = './src/shims/base64-js.ts';