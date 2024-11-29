const scrollPositions = new Map()

export function saveScrollPosition(route) {
  scrollPositions.set(route.fullPath, window.scrollY)
}

export function getScrollPosition(route) {
  return scrollPositions.get(route.fullPath) || 0
}

export function clearScrollPosition(route) {
  scrollPositions.delete(route.fullPath)
}

export function scrollToTop() {
  window.scrollTo(0, 0)
}

export function restoreScrollPosition(route) {
  const position = getScrollPosition(route)
  window.scrollTo(0, position)
  clearScrollPosition(route)
}