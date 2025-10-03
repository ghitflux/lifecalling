import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { DonutChart } from "../DonutChart";

const meta: Meta<typeof DonutChart> = {
  title: "Analytics/DonutChart",
  component: DonutChart,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    data: [
      { name: 'Banco A', value: 34 },
      { name: 'Banco B', value: 22 },
      { name: 'Banco C', value: 18 },
      { name: 'Banco D', value: 12 },
    ],
    height: 180,
  },
};

export default meta;
type Story = StoryObj<typeof DonutChart>;

export const Default: Story = {};

export const WithFormatter: Story = {
  args: {
    tooltipFormatter: (entry) => `${entry.name}: ${entry.value}%`,
  },
};
