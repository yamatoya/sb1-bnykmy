// 差分比較のためのユーティリティ関数
import { diffChars } from 'diff'

export function formatValue(value) {
  if (value === undefined) return 'undefined'
  if (value === null) return 'null'
  if (typeof value === 'string') return `"${value}"`
  return JSON.stringify(value, null, 2)
}

export function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export function compareValues(value1, value2) {
  if (value1 === value2) return true
  if (value1 === null || value2 === null) return value1 === value2
  if (typeof value1 !== typeof value2) return false
  if (typeof value1 === 'object') {
    const keys1 = Object.keys(value1)
    const keys2 = Object.keys(value2)
    if (keys1.length !== keys2.length) return false
    return keys1.every(key => compareValues(value1[key], value2[key]))
  }
  return false
}

export function findDifferences(bundled, local, path = '') {
  const differences = []
  const allKeys = new Set([...Object.keys(bundled || {}), ...Object.keys(local || {})])

  for (const key of allKeys) {
    const currentPath = path ? `${path}.${key}` : key
    const bundledValue = bundled?.[key]
    const localValue = local?.[key]

    if (!compareValues(bundledValue, localValue)) {
      if (typeof bundledValue === 'object' && bundledValue !== null &&
          typeof localValue === 'object' && localValue !== null) {
        differences.push(...findDifferences(bundledValue, localValue, currentPath))
      } else {
        differences.push({
          path: currentPath,
          bundled: bundledValue,
          local: localValue
        })
      }
    }
  }

  return differences
}

export function formatBundledDiff(bundled, local) {
  if (bundled === undefined || bundled === null) {
    return '<span class="diff-removed">null</span>'
  }

  const bundledStr = formatValue(bundled)
  const localStr = local !== undefined && local !== null ? formatValue(local) : ''
  
  if (!localStr) {
    return `<span class="diff-removed">${escapeHtml(bundledStr)}</span>`
  }

  let result = ''
  const diff = diffChars(bundledStr, localStr)
  
  diff.forEach(part => {
    const text = escapeHtml(part.value)
    if (part.removed) {
      result += `<span class="diff-removed">${text}</span>`
    } else if (!part.added) {
      result += text
    }
  })

  return result
}

export function formatLocalDiff(local, bundled) {
  if (local === undefined || local === null) {
    return '<span class="diff-removed">null</span>'
  }

  const localStr = formatValue(local)
  const bundledStr = bundled !== undefined && bundled !== null ? formatValue(bundled) : ''
  
  if (!bundledStr) {
    return `<span class="diff-added">${escapeHtml(localStr)}</span>`
  }

  let result = ''
  const diff = diffChars(bundledStr, localStr)
  
  diff.forEach(part => {
    const text = escapeHtml(part.value)
    if (part.added) {
      result += `<span class="diff-added">${text}</span>`
    } else if (!part.removed) {
      result += text
    }
  })

  return result
}