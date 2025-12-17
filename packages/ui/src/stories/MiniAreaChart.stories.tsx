import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { MiniAreaChart } from "../MiniAreaChart";

const sample = Array.from({ length: 8 }).map((_, idx) => ({
  day: `D${idx + 1}`,
  value: Math.round(40 + Math.random() * 80),
}));

const meta: Meta<typeof MiniAreaChart> = {
  title: "Analytics/MiniAreaChart",
  component: MiniAreaChart,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    data: sample,
    dataKey: "value",
    xKey: "day",
    height: 120,
  },
};

export default meta;
type Story = StoryObj<typeof MiniAreaChart>;

export const Default: Story = {};

export const CustomColor: Story = {
  args: {
    stroke: "#a855f7",
  },
};
