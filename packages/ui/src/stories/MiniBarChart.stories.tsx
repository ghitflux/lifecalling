import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { MiniBarChart } from "../MiniBarChart";

const sample = [
  { label: 'A', value: 12 },
  { label: 'B', value: 28 },
  { label: 'C', value: 18 },
  { label: 'D', value: 36 },
  { label: 'E', value: 24 },
];

const meta: Meta<typeof MiniBarChart> = {
  title: "Analytics/MiniBarChart",
  component: MiniBarChart,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    data: sample,
    dataKey: "value",
    xKey: "label",
    height: 120,
  },
};

export default meta;
type Story = StoryObj<typeof MiniBarChart>;

export const Default: Story = {};

export const CustomFill: Story = {
  args: {
    fill: "#22c55e",
  },
};
