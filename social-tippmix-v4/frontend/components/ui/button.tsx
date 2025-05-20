'use client'

import React from 'react'

type ButtonVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'ghost'
  | 'link'
  | 'outline'
  | 'dash'
  | 'soft'

type ButtonDSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  dSize?: ButtonDSize
  isSquare?: boolean
  isCircle?: boolean
  isBlock?: boolean
  isWide?: boolean
  isLoading?: boolean
  loadingText?: string
  children: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'default',
      dSize,
      isSquare,
      isCircle,
      isBlock,
      isWide,
      isLoading,
      loadingText = 'Loading...',
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const classes = ['btn']

    if (variant !== 'default') {
      classes.push(`btn-${variant}`)
    }
    if (dSize) {
      classes.push(`btn-${dSize}`)
    }
    if (isSquare) {
      classes.push('btn-square')
    }
    if (isCircle) {
      classes.push('btn-circle')
    }
    if (isBlock) {
      classes.push('btn-block')
    }
    if (isWide) {
      classes.push('btn-wide')
    }
    if (isLoading) {
      classes.push('btn-disabled') // Or a specific loading style if daisyUI provides one for buttons
    }

    return (
      <button
        ref={ref}
        className={`${classes.join(' ')} ${className || ''}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="loading loading-spinner"></span>
            {loadingText && <span className="ml-2">{loadingText}</span>}
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
