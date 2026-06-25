export const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80'

export function isBrokenProductText(value: string | null | undefined) {
  if (!value) {
    return true
  }

  const text = value.trim()
  return text.length === 0 || /^[?？\s]+$/.test(text) || /[?？]{3,}/.test(text)
}

export function normalizeProductText(value: string | null | undefined, fallback: string) {
  return isBrokenProductText(value) ? fallback : value!.trim()
}

export function handleProductImageError(event: Event) {
  const target = event.target

  if (!(target instanceof HTMLImageElement)) {
    return
  }

  if (target.dataset.fallbackApplied === 'true') {
    target.style.visibility = 'hidden'
    return
  }

  target.dataset.fallbackApplied = 'true'
  target.src = FALLBACK_PRODUCT_IMAGE
}
