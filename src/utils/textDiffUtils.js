import { diffChars } from 'diff'

export function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export function formatTextDiff(before, after) {
  if (!before && !after) return ''
  if (!before) return `<span class="diff-added">${escapeHtml(after)}</span>`
  if (!after) return `<span class="diff-removed">${escapeHtml(before)}</span>`

  let result = ''
  const diff = diffChars(before, after)
  
  diff.forEach(part => {
    const text = escapeHtml(part.value)
    if (part.added) {
      result += `<span class="diff-added">${text}</span>`
    } else if (part.removed) {
      result += `<span class="diff-removed">${text}</span>`
    } else {
      result += text
    }
  })

  return result
}