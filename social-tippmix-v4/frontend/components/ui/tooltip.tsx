'use client'

import * as React from 'react'

// DaisyUI v5-style tooltip without external library

const TooltipProvider = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
)

const Tooltip = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
)

interface TooltipTriggerProps {
  children: React.ReactNode
  tooltip: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const TooltipTrigger = ({ children, tooltip, position = 'top' }: TooltipTriggerProps) => (
  <div className={`tooltip tooltip-${position}`} data-tip={tooltip}>
    {children}
  </div>
)

// DaisyUI handles content via `data-tip`, so no need to render content separately
const TooltipContent = () => null

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }


