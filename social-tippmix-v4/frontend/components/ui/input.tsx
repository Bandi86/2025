'use client'

import React from 'react'

type InputDSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type InputColor =
  | 'neutral'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  dSize?: InputDSize
  color?: InputColor
  isGhost?: boolean
  isBordered?: boolean // daisyUI uses `input-bordered` implicitly, this could be for explicit control if needed or removed
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      dSize,
      color,
      isGhost,
      isBordered, // Not directly used as daisyUI default input is bordered
      ...props
    },
    ref
  ) => {
    const classes = ['input']

    if (dSize) {
      classes.push(`input-${dSize}`)
    }
    if (color) {
      classes.push(`input-${color}`)
    }
    if (isGhost) {
      classes.push('input-ghost')
    }
    // daisyUI input is bordered by default. If you want a non-bordered one,
    // you might need a different approach or to remove default browser styles.
    // For now, we assume the default bordered style is desired.
    // If an explicit `input-bordered` class is needed for some reason, it can be added.

    return (
      <input
        type={type}
        ref={ref}
        className={`${classes.join(' ')} ${className || ''}`}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'
