import { formatTextDiff } from './textDiffUtils'

export function formatDisplayName(name) {
  return name?.replace(/<br>/gi, '') || ''
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export function formatText(text) {
  if (!text) return ''
  return text.replace(/\n/g, '<br>')
}