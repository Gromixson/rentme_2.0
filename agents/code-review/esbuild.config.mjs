import * as esbuild from 'esbuild';

const shared = {
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  packages: 'external',
  sourcemap: true,
};

await esbuild.build({
  ...shared,
  entryPoints: ['src/review.ts'],
  outfile: 'dist/review.js',
});

await esbuild.build({
  ...shared,
  entryPoints: ['src/review-with-tools.ts'],
  outfile: 'dist/review-with-tools.js',
});

console.log('Built dist/review.js and dist/review-with-tools.js');
