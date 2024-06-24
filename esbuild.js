const esbuild = require("esbuild");
const path = require("path");

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: 'esbuild-problem-matcher',
  setup(build) {
    build.onStart(() => {
      console.log('msg: [watch] build started');
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        console.error(`    ${location.file}:${location.line}:${location.column}:`);
      });
      console.log('nsg: [watch] build finished');
    });
  },
};

/**
 * @type {import('esbuild').Plugin}
 */
const nodeBuiltinsPlugin = {
  name: 'node-builtins',
  setup(build) {
    build.onResolve({ filter: /^node:/ }, (args) => {
      return { external: true };
    });
  },
};

async function main() {
  const ctx = await esbuild.context({
    entryPoints: [
      'src/extension.ts'
    ],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    target: ['node14'],
    outfile: 'dist/extension.js',
    external: ['vscode'],
    logLevel: 'info',
    plugins: [
      nodeBuiltinsPlugin,
      esbuildProblemMatcherPlugin,
    ],
    define: {
      'process.env.NODE_ENV': production ? '"production"' : '"development"',
    },
    mainFields: ['module', 'main'],
  });

  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});