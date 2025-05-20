'use client'

import React from 'react'

type BadgeVariant =
  | 'default'
  | 'neutral'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'ghost'
  | 'outline'
  | 'dash'
  | 'soft'

type BadgeDSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  dSize?: BadgeDSize
  children: React.ReactNode
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = 'default', dSize, className, ...props }, ref) => {
    const classes = ['badge']

    if (variant !== 'default') {
      classes.push(`badge-${variant}`)
    }
    if (dSize) {
      classes.push(`badge-${dSize}`)
    }

    return (
      <span ref={ref} className={`${classes.join(' ')} ${className || ''}`} {...props}>
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'
