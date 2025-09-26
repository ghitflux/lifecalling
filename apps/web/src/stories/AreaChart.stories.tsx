import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { AreaChart } from "@lifecalling/ui";

const meta = {
  title: "Charts/AreaChart",
  component: AreaChart,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    color: {
      control: { type: "color" },
    },
  },
} satisfies Meta<typeof AreaChart>;

export default meta;
type Story = StoryObj<typeof meta>;

const monthlyData = [
  { month: "Jan", value: 400 },
  { month: "Feb", value: 300 },
  { month: "Mar", value: 600 },
  { month: "Apr", value: 800 },
  { month: "May", value: 500 },
  { month: "Jun", value: 700 },
  { month: "Jul", value: 900 },
  { month: "Aug", value: 1100 },
  { month: "Sep", value: 800 },
  { month: "Oct", value: 1000 },
  { month: "Nov", value: 1200 },
  { month: "Dec", value: 1400 },
];

const revenueData = [
  { quarter: "Q1", revenue: 45000 },
  { quarter: "Q2", revenue: 52000 },
  { quarter: "Q3", revenue: 48000 },
  { quarter: "Q4", revenue: 61000 },
];

const userGrowthData = [
  { week: "Week 1", users: 1200 },
  { week: "Week 2", users: 1350 },
  { week: "Week 3", users: 1100 },
  { week: "Week 4", users: 1800 },
  { week: "Week 5", users: 2100 },
  { week: "Week 6", users: 1900 },
  { week: "Week 7", users: 2400 },
  { week: "Week 8", users: 2800 },
];

export const Default: Story = {
  args: {
    title: "Monthly Sales",
    subtitle: "Sales performance over the year",
    data: monthlyData,
    dataKey: "value",
    xAxisKey: "month",
  },
};

export const Revenue: Story = {
  args: {
    title: "Quarterly Revenue",
    subtitle: "Revenue growth by quarter",
    data: revenueData,
    dataKey: "revenue",
    xAxisKey: "quarter",
    color: "#10b981",
  },
};

export const UserGrowth: Story = {
  args: {
    title: "User Growth",
    subtitle: "Weekly active users",
    data: userGrowthData,
    dataKey: "users",
    xAxisKey: "week",
    color: "#f59e0b",
  },
};

export const CustomColor: Story = {
  args: {
    title: "Custom Colored Chart",
    subtitle: "Chart with custom pink color",
    data: monthlyData,
    dataKey: "value",
    xAxisKey: "month",
    color: "#ec4899",
  },
};

export const NoSubtitle: Story = {
  args: {
    title: "Simple Chart",
    data: monthlyData,
    dataKey: "value",
    xAxisKey: "month",
    color: "#3b82f6",
  },
};
