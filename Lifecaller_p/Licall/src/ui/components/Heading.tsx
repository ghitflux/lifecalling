import React from 'react'

export interface HeadingProps {
  children: React.ReactNode
  level?: 1 | 2 | 3 | 4 | 5 | 6
  className?: string
}

export function Heading({ children, level = 1, className = '' }: HeadingProps) {
  const Component = `h${level}` as keyof JSX.IntrinsicElements

  const levelClasses = {
    1: 'text-4xl font-bold text-gray-900',
    2: 'text-3xl font-bold text-gray-900',
    3: 'text-2xl font-semibold text-gray-900',
    4: 'text-xl font-semibold text-gray-900',
    5: 'text-lg font-medium text-gray-900',
    6: 'text-base font-medium text-gray-900',
  }

  const classes = [levelClasses[level], className].filter(Boolean).join(' ')

  return <Component className={classes}>{children}</Component>
}