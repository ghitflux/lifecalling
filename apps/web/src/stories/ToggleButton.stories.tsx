import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { ToggleButton } from '@lifecalling/ui';
import { useState } from 'react';

const meta: Meta<typeof ToggleButton> = {
  title: 'Components/ToggleButton',
  component: ToggleButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'outline', 'ghost', 'slide'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const ToggleButtonWithState = (args: any) => {
  const [pressed, setPressed] = useState(args.pressed || false);

  return (
    <ToggleButton
      {...args}
      pressed={pressed}
      onPressedChange={setPressed}
    >
      {args.children}
    </ToggleButton>
  );
};

export const Default: Story = {
  render: ToggleButtonWithState,
  args: {
    children: 'Toggle Me',
    pressed: false,
  },
};

export const Pressed: Story = {
  render: ToggleButtonWithState,
  args: {
    children: 'Pressed State',
    pressed: true,
  },
};

export const Small: Story = {
  render: ToggleButtonWithState,
  args: {
    children: 'Small',
    size: 'sm',
    pressed: false,
  },
};

export const Large: Story = {
  render: ToggleButtonWithState,
  args: {
    children: 'Large Button',
    size: 'lg',
    pressed: false,
  },
};

export const Outline: Story = {
  render: ToggleButtonWithState,
  args: {
    children: 'Outline Style',
    variant: 'outline',
    pressed: false,
  },
};

export const Ghost: Story = {
  render: ToggleButtonWithState,
  args: {
    children: 'Ghost Style',
    variant: 'ghost',
    pressed: false,
  },
};

export const Slide: Story = {
  render: ToggleButtonWithState,
  args: {
    variant: 'slide',
    pressed: false,
  },
};

export const SlidePressed: Story = {
  render: ToggleButtonWithState,
  args: {
    variant: 'slide',
    pressed: true,
  },
};

export const SlideSmall: Story = {
  render: ToggleButtonWithState,
  args: {
    variant: 'slide',
    size: 'sm',
    pressed: false,
  },
};

export const SlideLarge: Story = {
  render: ToggleButtonWithState,
  args: {
    variant: 'slide',
    size: 'lg',
    pressed: false,
  },
};

export const Disabled: Story = {
  render: ToggleButtonWithState,
  args: {
    children: 'Disabled',
    disabled: true,
    pressed: false,
  },
};

export const WithIcon: Story = {
  render: ToggleButtonWithState,
  args: {
    children: (
      <div className="flex items-center gap-2">
        <span>🔍</span>
        <span>Search Mode</span>
      </div>
    ),
    pressed: false,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <span className="w-20 text-sm">Default:</span>
        <ToggleButtonWithState variant="default">Default</ToggleButtonWithState>
      </div>
      <div className="flex gap-2 items-center">
        <span className="w-20 text-sm">Outline:</span>
        <ToggleButtonWithState variant="outline">Outline</ToggleButtonWithState>
      </div>
      <div className="flex gap-2 items-center">
        <span className="w-20 text-sm">Ghost:</span>
        <ToggleButtonWithState variant="ghost">Ghost</ToggleButtonWithState>
      </div>
      <div className="flex gap-2 items-center">
        <span className="w-20 text-sm">Slide:</span>
        <ToggleButtonWithState variant="slide" />
      </div>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <span className="w-16 text-sm">Small:</span>
        <ToggleButtonWithState size="sm">Small</ToggleButtonWithState>
      </div>
      <div className="flex gap-2 items-center">
        <span className="w-16 text-sm">Medium:</span>
        <ToggleButtonWithState size="md">Medium</ToggleButtonWithState>
      </div>
      <div className="flex gap-2 items-center">
        <span className="w-16 text-sm">Large:</span>
        <ToggleButtonWithState size="lg">Large</ToggleButtonWithState>
      </div>
    </div>
  ),
};

export const Interactive: Story = {
  render: () => {
    const [options, setOptions] = useState({
      darkMode: false,
      notifications: true,
      autoSave: false,
      sounds: true,
      slideMode: false,
      compactView: true,
    });

    return (
      <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
        <h3 className="font-semibold">Settings Panel</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Dark Mode</span>
            <ToggleButton
              pressed={options.darkMode}
              onPressedChange={(pressed) => setOptions(prev => ({ ...prev, darkMode: pressed }))}
            >
              {options.darkMode ? '🌙' : '☀️'}
            </ToggleButton>
          </div>
          <div className="flex items-center justify-between">
            <span>Notifications</span>
            <ToggleButton
              variant="outline"
              pressed={options.notifications}
              onPressedChange={(pressed) => setOptions(prev => ({ ...prev, notifications: pressed }))}
            >
              {options.notifications ? '🔔' : '🔕'}
            </ToggleButton>
          </div>
          <div className="flex items-center justify-between">
            <span>Auto Save</span>
            <ToggleButton
              variant="ghost"
              pressed={options.autoSave}
              onPressedChange={(pressed) => setOptions(prev => ({ ...prev, autoSave: pressed }))}
            >
              {options.autoSave ? 'ON' : 'OFF'}
            </ToggleButton>
          </div>
          <div className="flex items-center justify-between">
            <span>Sounds</span>
            <ToggleButton
              size="sm"
              pressed={options.sounds}
              onPressedChange={(pressed) => setOptions(prev => ({ ...prev, sounds: pressed }))}
            >
              {options.sounds ? '🔊' : '🔇'}
            </ToggleButton>
          </div>
          <div className="flex items-center justify-between">
            <span>Slide Mode</span>
            <ToggleButton
              variant="slide"
              pressed={options.slideMode}
              onPressedChange={(pressed) => setOptions(prev => ({ ...prev, slideMode: pressed }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <span>Compact View</span>
            <ToggleButton
              variant="slide"
              size="sm"
              pressed={options.compactView}
              onPressedChange={(pressed) => setOptions(prev => ({ ...prev, compactView: pressed }))}
            />
          </div>
        </div>
        <div className="mt-4 p-2 bg-background rounded text-sm">
          <pre>{JSON.stringify(options, null, 2)}</pre>
        </div>
      </div>
    );
  },
};
