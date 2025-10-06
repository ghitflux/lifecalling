import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  framework: '@storybook/nextjs',
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
};

export default config;
