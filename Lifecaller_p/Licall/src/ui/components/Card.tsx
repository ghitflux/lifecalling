import React from 'react'

export interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  border?: boolean
  hoverable?: boolean
}

export function Card({
  children,
  className = '',
  padding = 'md',
  shadow = 'md',
  border = true,
  hoverable = false,
}: CardProps) {
  const baseClasses = [
    'bg-white rounded-lg transition-shadow duration-200',
  ]

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  }

  const borderClass = border ? 'border border-gray-200' : ''
  const hoverClass = hoverable ? 'hover:shadow-lg cursor-pointer' : ''

  const classes = [
    ...baseClasses,
    paddingClasses[padding],
    shadowClasses[shadow],
    borderClass,
    hoverClass,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <div className={classes}>{children}</div>
}