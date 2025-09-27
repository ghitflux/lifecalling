import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChartContainer, Button } from "@lifecalling/ui";

const meta = {
  title: "Charts/ChartContainer",
  component: ChartContainer,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

const MockChart = () => (
  <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center border-2 border-dashed border-primary/20">
    <p className="text-muted-foreground">Chart Content Goes Here</p>
  </div>
);

export const Default: Story = {
  args: {
    title: "Sales Overview",
    subtitle: "Monthly sales performance",
    children: <MockChart />,
  },
};

export const WithActions: Story = {
  args: {
    title: "Revenue Analytics",
    subtitle: "Quarterly revenue breakdown",
    actions: (
      <>
        <Button variant="outline" size="sm">Export</Button>
        <Button size="sm">Refresh</Button>
      </>
    ),
    children: <MockChart />,
  },
};

export const NoSubtitle: Story = {
  args: {
    title: "Simple Chart",
    children: <MockChart />,
  },
};

export const WithMultipleActions: Story = {
  args: {
    title: "Advanced Analytics",
    subtitle: "Comprehensive data visualization",
    actions: (
      <>
        <Button variant="ghost" size="sm">Settings</Button>
        <Button variant="outline" size="sm">Download</Button>
        <Button variant="outline" size="sm">Share</Button>
        <Button size="sm">Update</Button>
      </>
    ),
    children: <MockChart />,
  },
};

export const CustomContent: Story = {
  args: {
    title: "Custom Dashboard",
    subtitle: "Multiple metrics in one view",
    children: (
      <div className="grid grid-cols-2 gap-4 h-full">
        <div className="bg-success/10 rounded-lg flex items-center justify-center border border-success/20">
          <div className="text-center">
            <p className="text-2xl font-bold text-success">$45,231</p>
            <p className="text-sm text-muted-foreground">Revenue</p>
          </div>
        </div>
        <div className="bg-warning/10 rounded-lg flex items-center justify-center border border-warning/20">
          <div className="text-center">
            <p className="text-2xl font-bold text-warning">1,234</p>
            <p className="text-sm text-muted-foreground">Users</p>
          </div>
        </div>
        <div className="bg-info/10 rounded-lg flex items-center justify-center border border-info/20 col-span-2">
          <div className="text-center">
            <p className="text-lg font-semibold">Performance Metrics</p>
            <p className="text-sm text-muted-foreground">All systems operational</p>
          </div>
        </div>
      </div>
    ),
  },
};
