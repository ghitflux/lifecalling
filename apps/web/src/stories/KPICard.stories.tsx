import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { KPICard } from "@lifecalling/ui";
import { Users, DollarSign, Activity, Target, TrendingUp } from "lucide-react";

const meta = {
  title: "Components/KPICard",
  component: KPICard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    color: {
      control: { type: "select" },
      options: ["primary", "success", "warning", "danger", "info"],
    },
    trend: {
      control: { type: "number" },
    },
  },
} satisfies Meta<typeof KPICard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Total Users",
    value: "2,543",
    subtitle: "Active users this month",
  },
};

export const WithIcon: Story = {
  args: {
    title: "Total Revenue",
    value: "$45,231",
    subtitle: "Revenue this quarter",
    icon: DollarSign,
    color: "success",
  },
};

export const WithPositiveTrend: Story = {
  args: {
    title: "Active Sessions",
    value: "1,234",
    subtitle: "Current active sessions",
    icon: Activity,
    trend: 12.5,
    color: "info",
  },
};

export const WithNegativeTrend: Story = {
  args: {
    title: "Bounce Rate",
    value: "23.4%",
    subtitle: "Visitors who left immediately",
    icon: TrendingUp,
    trend: -5.2,
    color: "warning",
  },
};

export const DangerVariant: Story = {
  args: {
    title: "Critical Issues",
    value: "7",
    subtitle: "Requires immediate attention",
    icon: Target,
    trend: 15.8,
    color: "danger",
  },
};

export const LargeNumber: Story = {
  args: {
    title: "Total Customers",
    value: "1,234,567",
    subtitle: "Registered customers worldwide",
    icon: Users,
    trend: 8.3,
    color: "primary",
  },
};

export const NoTrend: Story = {
  args: {
    title: "Server Status",
    value: "Online",
    subtitle: "All systems operational",
    icon: Activity,
    color: "success",
  },
};

export const ZeroTrend: Story = {
  args: {
    title: "Maintenance Mode",
    value: "Stable",
    subtitle: "No changes detected",
    icon: Target,
    trend: 0,
    color: "info",
  },
};
