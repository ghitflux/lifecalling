import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AdvancedCard, Badge, Button } from "@lifecalling/ui";

const meta = {
  title: "Components/AdvancedCard",
  component: AdvancedCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    highlight: {
      control: { type: "boolean" },
    },
  },
} satisfies Meta<typeof AdvancedCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Advanced Card",
    subtitle: "This is a subtitle",
    children: (
      <div>
        <p>This is the main content of the advanced card.</p>
        <p className="text-sm text-muted-foreground mt-2">
          You can add any content here.
        </p>
      </div>
    ),
  },
};

export const WithBadge: Story = {
  args: {
    title: "Card with Badge",
    subtitle: "Status indicator included",
    badge: <Badge variant="secondary">Active</Badge>,
    children: (
      <div>
        <p>This card includes a badge in the header.</p>
      </div>
    ),
  },
};

export const WithActions: Story = {
  args: {
    title: "Card with Actions",
    subtitle: "Custom action buttons",
    actions: (
      <div className="flex gap-2">
        <Button variant="outline" size="sm">Edit</Button>
        <Button variant="destructive" size="sm">Delete</Button>
      </div>
    ),
    children: (
      <div>
        <p>This card has custom action buttons instead of the default menu.</p>
      </div>
    ),
  },
};

export const WithFooter: Story = {
  args: {
    title: "Card with Footer",
    subtitle: "Additional footer content",
    children: (
      <div>
        <p>This card includes footer content at the bottom.</p>
      </div>
    ),
    footer: (
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Last updated: 2 hours ago</span>
        <Button variant="ghost" size="sm">View Details</Button>
      </div>
    ),
  },
};

export const Highlighted: Story = {
  args: {
    title: "Highlighted Card",
    subtitle: "This card is highlighted",
    highlight: true,
    badge: <Badge variant="destructive">Important</Badge>,
    children: (
      <div>
        <p>This card is highlighted with a special ring effect.</p>
      </div>
    ),
    footer: (
      <div className="text-sm text-muted-foreground">
        Requires immediate attention
      </div>
    ),
  },
};

export const Complete: Story = {
  args: {
    title: "Complete Example",
    subtitle: "All features combined",
    badge: <Badge>Premium</Badge>,
    actions: (
      <Button variant="outline" size="sm">Configure</Button>
    ),
    highlight: true,
    children: (
      <div className="space-y-3">
        <p>This example shows all features of the AdvancedCard component.</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Feature A:</span>
            <span className="text-muted-foreground ml-1">Enabled</span>
          </div>
          <div>
            <span className="font-medium">Feature B:</span>
            <span className="text-muted-foreground ml-1">Disabled</span>
          </div>
        </div>
      </div>
    ),
    footer: (
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Updated 5 minutes ago</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">Cancel</Button>
          <Button size="sm">Save Changes</Button>
        </div>
      </div>
    ),
  },
};
