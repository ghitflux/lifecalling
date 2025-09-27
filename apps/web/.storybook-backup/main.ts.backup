import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    "../src/**/*.stories.@(js|jsx|ts|tsx|mdx)"
  ],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-themes",
    "@storybook/addon-a11y",
    "@storybook/addon-actions",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {}
  },
  docs: {
    defaultName: "Documentation"
  },
  typescript: {
    check: false,
    reactDocgen: "react-docgen-typescript",
  },
};
export default config;
