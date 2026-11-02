import type { CSSProperties } from 'react'
import type { Pattern } from '../types'

interface Props {
  hex: string
  pattern?: Pattern
  size?: number
  round?: boolean
  className?: string
  title?: string
}

export function patternStyle(hex: string, pattern: Pattern = 'solid'): CSSProperties {
  const base: CSSProperties = { backgroundColor: hex }
  switch (pattern) {
    case 'stripes':
      return { ...base, backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.35) 0 4px, transparent 4px 10px)' }
    case 'checks':
      return {
        ...base,
        backgroundImage:
          'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 12px), repeating-linear-gradient(90deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 12px)',
      }
    case 'print':
      return { ...base, backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 2px, transparent 2.5px)', backgroundSize: '12px 12px' }
    case 'texture':
      return { ...base, backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.12) 0 2px, transparent 2px 5px)' }
    default:
      return base
  }
}

export function Swatch({ hex, pattern = 'solid', size = 40, round = true, className = '', title }: Props) {
  return (
    <span
      className={`swatch ${round ? 'round' : ''} ${className}`}
      title={title}
      style={{ ...patternStyle(hex, pattern), width: size, height: size }}
      aria-hidden="true"
    />
  )
}
