'use client'

import React from 'react'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  className?: string
}

export function Select({ options, value, onChange, className = '', ...props }: SelectProps) {
  return (
    <select
      className={`select select-bordered w-full ${className}`}
      value={value}
      onChange={onChange}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

// DaisyUI select replacement for Radix UI. Usage:
// <Select options={[{value: '', label: 'All'}, ...]} value={roleFilter} onChange={...} />
