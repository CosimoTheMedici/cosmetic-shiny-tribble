import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// shadcn/ui utility — merges Tailwind classes safely
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Format Kenyan Shillings
export function formatKES(amount) {
  const num = parseFloat(amount || 0)
  return `KES ${num.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

// Format percentage with direction arrow
export function formatPercent(value, showArrow = true) {
  const num = parseFloat(value || 0)
  const arrow = num > 0 ? '▲' : num < 0 ? '▼' : '—'
  return showArrow
    ? `${arrow} ${Math.abs(num).toFixed(1)}%`
    : `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`
}

// Format date to readable string
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

// Format datetime
export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// Get today's date as YYYY-MM-DD
export function today() {
  return new Date().toISOString().split('T')[0]
}
