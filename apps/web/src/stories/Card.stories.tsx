import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@lifecalling/ui";

const meta = {
  title: "Components/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content goes here.</p>
      </CardContent>
      <CardFooter>
        <p>Card footer</p>
      </CardFooter>
    </Card>
  ),
};

export const WithoutFooter: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Simple Card</CardTitle>
        <CardDescription>A card without footer</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This card doesn&apos;t have a footer section.</p>
      </CardContent>
    </Card>
  ),
};

export const OnlyContent: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardContent className="pt-6">
        <p>A minimal card with only content.</p>
      </CardContent>
    </Card>
  ),
};
