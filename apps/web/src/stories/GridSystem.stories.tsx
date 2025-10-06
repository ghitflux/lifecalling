import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Grid, Card, CardContent } from "@lifecalling/ui";

const meta = {
  title: "Layout/GridSystem",
  component: Grid,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    cols: {
      control: { type: "select" },
      options: [1, 2, 3, 4, 5, 6],
    },
    gap: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
    },
  },
} satisfies Meta<typeof Grid>;

export default meta;
type Story = StoryObj<typeof meta>;

const GridItem = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <Card className={className}>
    <CardContent className="p-4 text-center">
      {children}
    </CardContent>
  </Card>
);

export const Default: Story = {
  args: {
    cols: 3,
    gap: "md",
    children: (
      <>
        <GridItem>Item 1</GridItem>
        <GridItem>Item 2</GridItem>
        <GridItem>Item 3</GridItem>
        <GridItem>Item 4</GridItem>
        <GridItem>Item 5</GridItem>
        <GridItem>Item 6</GridItem>
      </>
    ),
  },
};

export const TwoColumns: Story = {
  args: {
    cols: 2,
    gap: "md",
    children: (
      <>
        <GridItem>Column 1</GridItem>
        <GridItem>Column 2</GridItem>
        <GridItem>Column 3</GridItem>
        <GridItem>Column 4</GridItem>
      </>
    ),
  },
};

export const FourColumns: Story = {
  args: {
    cols: 4,
    gap: "md",
    children: (
      <>
        <GridItem>Item 1</GridItem>
        <GridItem>Item 2</GridItem>
        <GridItem>Item 3</GridItem>
        <GridItem>Item 4</GridItem>
        <GridItem>Item 5</GridItem>
        <GridItem>Item 6</GridItem>
        <GridItem>Item 7</GridItem>
        <GridItem>Item 8</GridItem>
      </>
    ),
  },
};

export const SmallGap: Story = {
  args: {
    cols: 3,
    gap: "sm",
    children: (
      <>
        <GridItem>Small Gap 1</GridItem>
        <GridItem>Small Gap 2</GridItem>
        <GridItem>Small Gap 3</GridItem>
        <GridItem>Small Gap 4</GridItem>
        <GridItem>Small Gap 5</GridItem>
        <GridItem>Small Gap 6</GridItem>
      </>
    ),
  },
};

export const LargeGap: Story = {
  args: {
    cols: 3,
    gap: "lg",
    children: (
      <>
        <GridItem>Large Gap 1</GridItem>
        <GridItem>Large Gap 2</GridItem>
        <GridItem>Large Gap 3</GridItem>
        <GridItem>Large Gap 4</GridItem>
        <GridItem>Large Gap 5</GridItem>
        <GridItem>Large Gap 6</GridItem>
      </>
    ),
  },
};

export const SingleColumn: Story = {
  args: {
    cols: 1,
    gap: "md",
    children: (
      <>
        <GridItem>Full Width Item 1</GridItem>
        <GridItem>Full Width Item 2</GridItem>
        <GridItem>Full Width Item 3</GridItem>
      </>
    ),
  },
};

export const SixColumns: Story = {
  args: {
    cols: 6,
    gap: "sm",
    children: (
      <>
        <GridItem>1</GridItem>
        <GridItem>2</GridItem>
        <GridItem>3</GridItem>
        <GridItem>4</GridItem>
        <GridItem>5</GridItem>
        <GridItem>6</GridItem>
        <GridItem>7</GridItem>
        <GridItem>8</GridItem>
        <GridItem>9</GridItem>
        <GridItem>10</GridItem>
        <GridItem>11</GridItem>
        <GridItem>12</GridItem>
      </>
    ),
  },
};
