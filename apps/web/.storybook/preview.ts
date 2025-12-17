import '../src/app/globals.css';

// Polyfill leve para Recharts (evita erro do ResponsiveContainer no Storybook)
if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
  // @ts-ignore
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' }, // liga actions automaticamente em props on*
  controls: { expanded: true },
  layout: 'centered',
  backgrounds: {
    default: "dark",
    values: [
      {
        name: "dark",
        value: "hsl(222.2, 84%, 4.9%)",
      },
      {
        name: "light",
        value: "#ffffff",
      },
    ],
  },
};

export const globalTypes = {
  theme: {
    description: "Global theme for components",
    defaultValue: "dark",
    toolbar: {
      title: "Theme",
      icon: "paintbrush",
      items: ["light", "dark"],
      dynamicTitle: true,
    },
  },
};
