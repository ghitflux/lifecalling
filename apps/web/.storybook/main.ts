import type { StorybookConfig } from '@storybook/nextjs';
const fromUrl = (relativePath: string) => {
  const url = new URL(relativePath, import.meta.url);
  const pathname = decodeURIComponent(url.pathname);

  return process.platform === 'win32' && pathname.startsWith('/')
    ? pathname.slice(1)
    : pathname;
};

const nextConfigPath = fromUrl('../next.config.ts');
const nextRuntimeConfigModule = fromUrl('../node_modules/next/dist/server/config-shared.js');

const moduleRequire = eval('require') as NodeJS.Require;
const NodeModule = moduleRequire('module') as typeof import('module');
const originalResolveFilename = NodeModule._resolveFilename;

NodeModule._resolveFilename = function (request: string, parent: unknown, isMain: boolean, options: unknown) {
  if (request === 'next/config') {
    return nextRuntimeConfigModule;
  }

  // @ts-expect-error - relying on internal Node API for module resolution patching
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

let webpackModule: typeof import('webpack') | undefined;
try {
  webpackModule = moduleRequire('webpack') as typeof import('webpack');
} catch {
  // webpack will be available later in the lifecycle; shim happens in webpackFinal
}

if (
  webpackModule?.Compiler?.prototype?.hooks &&
  !('initialize' in webpackModule.Compiler.prototype.hooks) &&
  webpackModule?.SyncHook
) {
  // eslint-disable-next-line no-console
  console.log('[storybook] adding initialize hook on webpack Compiler prototype');
  // @ts-expect-error - extending internal webpack compiler definition
  webpackModule.Compiler.prototype.hooks.initialize = new webpackModule.SyncHook([]);
} else {
  // eslint-disable-next-line no-console
  console.log('[storybook] webpack module not available for initialize shim');
}

const config: StorybookConfig = {
  framework: {
    name: '@storybook/nextjs',
    options: {
      nextConfigPath,
    },
  },
  stories: [
    '../src/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-essentials',
  ],
  typescript: {
    check: false,
    reactDocgen: false,
  },
  core: {
    disableTelemetry: true,
  },
  features: {
    experimentalRSC: false,
  },
  env: (config) => ({
    ...config,
    NODE_ENV: 'development',
  }),
  webpackFinal: async (storybookConfig) => {
    // eslint-disable-next-line no-console
    console.log('[storybook] running webpackFinal adjustments');

    try {
      const localWebpack = moduleRequire('webpack') as typeof import('webpack');
      if (
        localWebpack?.Compiler?.prototype?.hooks &&
        !('initialize' in localWebpack.Compiler.prototype.hooks) &&
        localWebpack?.SyncHook
      ) {
        // eslint-disable-next-line no-console
        console.log('[storybook] adding initialize hook on webpack Compiler prototype (webpackFinal)');
        // @ts-expect-error - extending internal webpack compiler definition
        localWebpack.Compiler.prototype.hooks.initialize = new localWebpack.SyncHook([]);
      }
    } catch {
      // ignore if webpack still not resolvable (builder will fail differently)
    }
    storybookConfig.resolve = storybookConfig.resolve ?? {};
    storybookConfig.resolve.alias = {
      ...(storybookConfig.resolve.alias ?? {}),
      'next/config': nextRuntimeConfigModule,
    };
    storybookConfig.plugins = storybookConfig.plugins ?? [];
    storybookConfig.plugins.push({
      apply: (compiler: { hooks: Record<string, unknown> }) => {
        // eslint-disable-next-line no-console
        console.log('[storybook] compiler hooks keys', Object.keys(compiler.hooks ?? {}));
        if (!('initialize' in compiler.hooks) || !compiler.hooks.initialize) {
          // eslint-disable-next-line no-console
          console.log('[storybook] injecting webpack initialize hook shim');
          const createHook = () => {
            const taps: Array<(...args: unknown[]) => void> = [];
            return {
              taps,
              tap: (_name: string, fn: (...args: unknown[]) => void) => {
                taps.push(fn);
              },
              call: (...args: unknown[]) => {
                taps.forEach((fn) => fn(...args));
              },
              tapAsync: (_name: string, fn: (...args: unknown[]) => void) => {
                taps.push((...tapArgs) => fn(...tapArgs, () => undefined));
              },
              tapPromise: (_name: string, fn: (...args: unknown[]) => Promise<void>) => {
                taps.push((...tapArgs) => {
                  void fn(...tapArgs);
                });
              },
            };
          };

          // @ts-expect-error - assigning shim hook for missing initialize hook
          compiler.hooks.initialize = createHook();
        }
      },
    });

    return storybookConfig;
  },
};

export default config;
